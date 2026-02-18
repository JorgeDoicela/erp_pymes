import { attendanceRepository } from '../../repositories/attendance/attendanceRepository.js';
import prisma from '../../database/db.js';
import employeeRepository from '../../repositories/employees/employeeRepository.js';

const resolveEmployeeId = async (input) => {
    // Verificar si es un UUID válido (v4) o un CUID (Prisma)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // CUIDs empiezan con 'c', son alfanuméricos y usualmente de 25 caracteres.
    const cuidRegex = /^c[a-z0-9]{20,}$/i;

    if (uuidRegex.test(input) || cuidRegex.test(input)) {
        // Even if it looks like an ID, verify it exists to prevent FK errors
        const exists = await employeeRepository.findById(input);
        if (!exists) {
            throw new Error(`Empleado no encontrado con ID: ${input}`);
        }
        return input;
    }

    // Si no es ID interno, buscamos por cédula
    const employee = await employeeRepository.findByIdentityCard(input);
    if (!employee) {
        throw new Error(`No se encontró empleado con la cédula: ${input}`);
    }
    return employee.id;
};

export const attendanceService = {
    async registerAttendance(inputIdentifier, type, location = null) {
        // Resolve Employee ID directly to avoid decryption errors
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const cuidRegex = /^c[a-z0-9]{20,}$/i;

        let employeeId = inputIdentifier;
        let employee = null;

        if (uuidRegex.test(inputIdentifier) || cuidRegex.test(inputIdentifier)) {
            employee = await prisma.employee.findUnique({
                where: { id: inputIdentifier },
                select: { id: true }
            });
            if (!employee) throw new Error(`Empleado no encontrado con ID: ${inputIdentifier}`);
            employeeId = employee.id;
        } else {
            employee = await prisma.employee.findUnique({
                where: { identityCard: inputIdentifier },
                select: { id: true }
            });
            if (!employee) throw new Error(`No se encontró empleado con la cédula: ${inputIdentifier}`);
            employeeId = employee.id;
        }

        // Normalizar la fecha a medianoche para buscar el registro del día
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Buscar si ya existe registro hoy
        const existingRecord = await attendanceRepository.findByEmployeeAndDate(employeeId, today);

        if (type === 'ENTRY') {
            if (existingRecord) {
                throw new Error('Ya se ha registrado una entrada para este día.');
            }

            const checkInDate = now; // Use the 'now' date object defined above
            const entryData = {
                employeeId,
                date: today,
                checkIn: now,
                status: 'Present',
            };

            if (location && location.latitude && location.longitude) {
                entryData.entryLatitude = location.latitude;
                entryData.entryLongitude = location.longitude;
            }

            // Determine Lateness at Entry
            // Fetch Active Schedule for lateness check (Copied logic or refactor helper? For speed, inline logic)
            // Ideally we use a helper. But let's keep it simple here.
            // We need to fetch schedule to know if late.
            const activeSchedule = await prisma.employeeSchedule.findFirst({
                where: {
                    employeeId: employeeId,
                    isActive: true,
                    startDate: { lte: today },
                    OR: [{ endDate: null }, { endDate: { gte: today } }]
                },
                include: { shift: true }
            });

            const shiftStartTime = activeSchedule?.shift?.startTime || "08:00";
            const tolerance = activeSchedule?.shift?.toleranceMinutes || 15;

            const limitParams = new Date(checkInDate); // checkInDate is 'now' from line 48
            const [sh, sm] = shiftStartTime.split(':').map(Number);
            limitParams.setHours(sh, sm + tolerance, 0, 0);

            if (checkInDate > limitParams) {
                entryData.status = 'LATE'; // We map status string
                entryData.isLate = true;   // And boolean flag
            } else {
                entryData.isLate = false;
            }

            // Crear registro de entrada
            const newRecord = await attendanceRepository.createEntry(entryData);

            return { message: 'Entrada registrada exitosamente', record: newRecord };
        } else if (type === 'EXIT') {
            if (!existingRecord) {
                throw new Error('No se encontró registro de entrada para hoy. Debe registrar entrada primero.');
            }

            if (existingRecord.checkOut) {
                throw new Error('Ya se ha registrado una salida para este día.');
            }

            // Calcular horas trabajadas
            const checkInTime = new Date(existingRecord.checkIn);
            let diffMs = now - checkInTime;

            // Subtract Break Time if exists
            if (existingRecord.breakStart) {
                const breakEnd = existingRecord.breakEnd || now; // If not ended, assume ended now
                const breakDuration = breakEnd - new Date(existingRecord.breakStart);
                if (breakDuration > 0) {
                    diffMs -= breakDuration;
                }
            }

            const workedHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

            const exitData = {
                checkOut: now,
                workedHours,
            };

            if (location && location.latitude && location.longitude) {
                exitData.exitLatitude = location.latitude;
                exitData.exitLongitude = location.longitude;
            }

            // Calculate Overtime
            // 1. Fetch active schedule
            const activeSchedule = await prisma.employeeSchedule.findFirst({
                where: {
                    employeeId: employeeId,
                    isActive: true,
                    startDate: { lte: today },
                    OR: [
                        { endDate: null },
                        { endDate: { gte: today } }
                    ]
                },
                include: { shift: true }
            });

            if (activeSchedule && activeSchedule.shift) {
                // Parse shift End Time
                const [eh, em] = activeSchedule.shift.endTime.split(':').map(Number);
                const shiftEndTime = new Date(now);
                shiftEndTime.setHours(eh, em, 0, 0);

                // If CheckOut > ShiftEndTime
                if (now > shiftEndTime) {
                    const extraMs = now - shiftEndTime;
                    const extraHours = parseFloat((extraMs / (1000 * 60 * 60)).toFixed(2));
                    // Optional: Minimum threshold for overtime? e.g., 30 mins. For now, strict.
                    if (extraHours > 0) {
                        exitData.overtimeHours = extraHours;
                    }
                }

                // NEW: Early Departure Detection
                // If CheckOut < ShiftEndTime - tolerance (or just strict ShiftEndTime)
                // Let's use a small tolerance like 5 mins before flagging "Early" purely to avoid micro-seconds diffs, 
                // but user said "Turn ends 18:00 and leaves 17:30".
                // We'll compare with strict end time.
                if (now < shiftEndTime) {
                    // Check difference
                    const diffMs = shiftEndTime - now;
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));

                    // If leaves more than 1 minute early (to avoid seconds precision issues)
                    if (diffMinutes >= 1) {
                        exitData.isEarlyDeparture = true;
                    }
                }
            }

            // Actualizar registro con salida
            const updatedRecord = await attendanceRepository.updateExit(existingRecord.id, exitData);

            return { message: 'Salida registrada exitosamente', record: updatedRecord, workedHours };
        } else if (type === 'BREAK_START') {
            if (!existingRecord) throw new Error('Debe registrar entrada antes de iniciar el almuerzo.');
            if (existingRecord.checkOut) throw new Error('Ya ha marcado su salida del día.');
            if (existingRecord.breakStart) throw new Error('Ya ha registrado un inicio de almuerzo.');

            const breakData = { breakStart: now, status: 'BREAK' };
            // We need a specific repository method or update generic
            // Assuming updateExit can be reused or we add a patch method.
            // Let's use prisma directly here or add repo method? 
            // Better to stay consistent. I'll stick to prisma here for speed as repo likely needs update too.
            // Actually, let's keep it robust. I will use prisma.attendance.update inside service or fallback to repo.
            // attendanceRepository.updateExit is just an update.
            // Let's assume we can simply add a method "updateBreak" to repo or use prisma.
            // I'll add the logic using prisma if allowed, or add "updateBreak" to repo.
            // Let's modify repo in next step. For now, I'll use prisma directly for this specific update to avoid file hop loop
            // BUT wait, I don't import prisma directly at top... yes I do: `import prisma from '../../database/db.js';` (line 2)

            await prisma.attendance.update({
                where: { id: existingRecord.id },
                data: breakData
            });

            return { message: 'Inicio de almuerzo registrado', status: 'BREAK' };

        } else if (type === 'BREAK_END') {
            if (!existingRecord) throw new Error('No hay registro de asistencia activo.');
            if (!existingRecord.breakStart) throw new Error('No ha iniciado el almuerzo.');
            if (existingRecord.breakEnd) throw new Error('Ya ha finalizado su almuerzo.');

            await prisma.attendance.update({
                where: { id: existingRecord.id },
                data: { breakEnd: now, status: 'WORKING' } // Back to working
            });

            return { message: 'Fin de almuerzo registrado', status: 'WORKING' };

        } else {
            throw new Error('Tipo de registro no válido (Use ENTRY, EXIT, BREAK_START, BREAK_END).');
        }
    },

    async getStatus(inputIdentifier) {
        // Resolve ID first
        let employeeId = inputIdentifier;
        let employee = null;

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const cuidRegex = /^c[a-z0-9]{20,}$/i;

        if (uuidRegex.test(inputIdentifier) || cuidRegex.test(inputIdentifier)) {
            // It is an ID, verify existence
            // employee = await employeeRepository.findById(inputIdentifier); // REMOVED: To avoid decryption errors
            employee = await prisma.employee.findUnique({
                where: { id: inputIdentifier },
                select: { id: true, firstName: true, lastName: true, position: true, department: true }
            });

            if (!employee) throw new Error('Empleado no encontrado');
            employeeId = employee.id;
        } else {
            // It is an identity card
            // employee = await employeeRepository.findByIdentityCard(inputIdentifier); // REMOVED: To avoid decryption errors
            employee = await prisma.employee.findUnique({
                where: { identityCard: inputIdentifier },
                select: { id: true, firstName: true, lastName: true, position: true, department: true }
            });

            if (!employee) throw new Error(`No se encontró empleado con la cédula: ${inputIdentifier}`);
            employeeId = employee.id;
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const record = await attendanceRepository.findByEmployeeAndDate(employeeId, today);

        const employeeData = {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            position: employee.position,
            department: employee.department
        };

        // Fetch Active Schedule
        const activeSchedule = await prisma.employeeSchedule.findFirst({
            where: {
                employeeId: employee.id,
                isActive: true,
                startDate: { lte: today },
                OR: [
                    { endDate: null },
                    { endDate: { gte: today } }
                ]
            },
            include: { shift: true }
        });

        // Helper to determine status and add metadata
        const buildResponse = (status, rec = null) => {
            const response = { status, employee: employeeData };
            if (rec) {
                response.checkIn = rec.checkIn;
                response.checkOut = rec.checkOut;

                // Add Location info
                if (rec.entryLatitude && rec.entryLongitude) {
                    response.entryLocation = { lat: rec.entryLatitude, lng: rec.entryLongitude };
                }

                // Determine Lateness
                // Default Rule: Start 8:00 AM, Tolerance 15min. (8:15 AM)
                // NEW: Dynamic based on Shift

                // Get configured start time (default 08:00 if no active schedule found)
                const shiftStartTime = activeSchedule?.shift?.startTime || "08:00";

                const checkInDate = new Date(rec.checkIn);
                const limitParams = new Date(checkInDate);

                // Parse shift time HH:MM
                const [sh, sm] = shiftStartTime.split(':').map(Number);
                const tolerance = activeSchedule?.shift?.toleranceMinutes || 15;
                limitParams.setHours(sh, sm + tolerance, 0, 0); // Start Time + Tolerance

                // If checkIn was AFTER limit

                // If checkIn was AFTER 8:15 AM
                if (checkInDate > limitParams) {
                    response.isLate = true;
                } else {
                    response.isLate = false;
                }
            }
            return response;
        };

        if (!record) return buildResponse('NOT_STARTED');
        if (record.checkIn && !record.checkOut) {
            if (record.breakStart && !record.breakEnd) {
                return buildResponse('ON_BREAK', record);
            }
            return buildResponse('WORKING', record);
        }
        if (record.checkOut) return buildResponse('COMPLETED', record);

        return { status: 'UNKNOWN', employee: employeeData };
    }
};
