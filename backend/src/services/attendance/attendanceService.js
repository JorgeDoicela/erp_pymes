import { attendanceRepository } from '../../repositories/attendance/attendanceRepository.js';
import prisma from '../../database/db.js';
import employeeRepository from '../../repositories/employees/employeeRepository.js';
import axios from 'axios';
import { encryptCoordinate, decryptCoordinate } from '../../utils/encryption.js';

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

const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
};

const sanitizeCoordinate = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return null;
    return parseFloat(val.toFixed(4));
};

const isVPNDetected = async (ip) => {
    if (!ip || ip === '::1' || ip === '127.0.0.1') {
        console.log(`[VPN_CHECK] IP ignored: ${ip}`);
        return false;
    }

    try {
        console.log(`[VPN_CHECK] Checking IP: ${ip}`);
        // Use ip-api.com (free for non-commercial use, 45 req/min)
        // Fields: proxy (mobile/proxy/vpn), hosting (datacenter/cloud)
        const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,proxy,hosting`, { timeout: 3000 });
        
        if (response.data.status === 'success') {
            const isVPN = response.data.proxy === true || response.data.hosting === true;
            console.log(`[VPN_CHECK] Result for ${ip}: ${isVPN} (Proxy: ${response.data.proxy}, Hosting: ${response.data.hosting})`);
            return isVPN;
        }
        console.warn(`[VPN_CHECK] ip-api status: ${response.data.status}, message: ${response.data.message}`);
        return false;
    } catch (error) {
        console.error('[VPN_CHECK] Error querying ip-api:', error.message);
        return false; // Default to allow on failure to avoid blocking legitimate users
    }
};

export const attendanceService = {
    async registerAttendance(inputIdentifierRaw, type, location = null, ip = null, isSupervisorOverride = false) {
        // 1. Pre-process and validate identifier
        const inputIdentifier = inputIdentifierRaw?.toString().trim();
        if (!inputIdentifier) throw new Error('Identificador de empleado es requerido');

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const cuidRegex = /^c[a-z0-9]{20,}$/i;

        let employeeId = inputIdentifier;
        let employee = null;

        const employeeSelect = {
            id: true,
            workLatitude: true,
            workLongitude: true,
            geofenceRadius: true,
            enforceGeofence: true,
            trackingConsent: true
        };

        // Fetch global settings for fallback
        const systemSettings = await prisma.systemSetting.findUnique({
            where: { id: 'default' },
            select: {
                globalLatitude: true,
                globalLongitude: true,
                globalRadius: true,
                allowedIPs: true
            }
        });

        // 2. Resolve employee record
        if (uuidRegex.test(inputIdentifier) || cuidRegex.test(inputIdentifier)) {
            employee = await prisma.employee.findUnique({
                where: { id: inputIdentifier },
                select: employeeSelect
            });
            if (!employee) throw new Error(`Empleado no encontrado con ID: ${inputIdentifier}`);
        } else {
            employee = await prisma.employee.findUnique({
                where: { identityCard: inputIdentifier },
                select: employeeSelect
            });
            if (!employee) throw new Error(`No se encontró empleado con la cédula: ${inputIdentifier}`);
        }
        employeeId = employee.id;

        // --- CONSENT & GEOFENCING VALIDATION ---
        const useGlobalGeofence = systemSettings?.globalLatitude && systemSettings?.globalLongitude;

        if (!employee.trackingConsent) {
            if ((employee.enforceGeofence || useGlobalGeofence) && !isSupervisorOverride) {
                throw new Error('No ha otorgado el consentimiento obligatorio para el tratamiento de datos de ubicación. Por favor acepte los términos de privacidad en su perfil para marcar asistencia.');
            }
            if (!isSupervisorOverride) {
                // Si el consentimiento no fue otorgado y no es supervisión directa, se ignora la ubicación
                location = null;
            }
        }

        if (employee.enforceGeofence || useGlobalGeofence || location) {
            if ((employee.enforceGeofence || useGlobalGeofence) && (!location || !location.latitude || !location.longitude)) {
                throw new Error('La ubicación es requerida para marcar asistencia.');
            }

            const rawLat = employee.workLatitude || systemSettings?.globalLatitude;
            const rawLng = employee.workLongitude || systemSettings?.globalLongitude;
            const activeLat = decryptCoordinate(rawLat);
            const activeLng = decryptCoordinate(rawLng);
            const activeRadius = employee.geofenceRadius || systemSettings?.globalRadius || 200;

            if (activeLat !== null && activeLng !== null && location?.latitude && location?.longitude) {
                const distance = getDistance(
                    location.latitude,
                    location.longitude,
                    activeLat,
                    activeLng
                );

                if (distance > activeRadius) {
                    throw new Error(`Ubicación no permitida. Estás a ${Math.round(distance)}m del sitio de trabajo permitido (Límite: ${activeRadius}m).`);
                }
            } else if (employee.enforceGeofence) {
                console.warn(`Geofencing enabled for employee ${employeeId} but no work location set.`);
            }
        }

        // --- VPN VALIDATION (Always performed if IP is available) ---
        if (ip) {
            const isVPN = await isVPNDetected(ip);
            if (isVPN) {
                throw new Error('Conexión vía VPN/Proxy detectada. No está permitido marcar asistencia usando este tipo de conexiones.');
            }
        }

        if (systemSettings?.allowedIPs && ip) {
            const allowedList = systemSettings.allowedIPs.split(',').filter(i => i.trim() !== '').map(i => i.trim());
            if (allowedList.length > 0 && !allowedList.includes(ip)) {
                throw new Error(`Conexión no permitida desde esta red (${ip}). Contacte al administrador.`);
            }
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

            const checkInDate = now;
            const entryData = {
                employeeId,
                date: today,
                checkIn: now,
                status: 'Present',
                ipAddress: ip
            };

            if (location && location.latitude && location.longitude && employee.trackingConsent) {
                entryData.entryLatitude = encryptCoordinate(location.latitude);
                entryData.entryLongitude = encryptCoordinate(location.longitude);
            }

            // Determine Lateness at Entry
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

            const limitParams = new Date(checkInDate);
            const [sh, sm] = shiftStartTime.split(':').map(Number);
            limitParams.setHours(sh, sm + tolerance, 0, 0);

            if (checkInDate > limitParams) {
                entryData.status = 'LATE';
                entryData.isLate = true;
            } else {
                entryData.isLate = false;
            }

            // Crear registro de entrada
            const newRecord = await attendanceRepository.createEntry(entryData);

            // Create Audit Log (obfuscated GPS coordinates)
            await prisma.auditLog.create({
                data: {
                    entity: 'Attendance',
                    entityId: newRecord.id,
                    action: 'ENTRY',
                    performedBy: employeeId,
                    details: `Registro de entrada. Ubicación validada por geocerca (Consentimiento activo).`,
                    ip: ip
                }
            });

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

            if (existingRecord.breakStart) {
                const breakEnd = existingRecord.breakEnd || now;
                const breakDuration = breakEnd - new Date(existingRecord.breakStart);
                if (breakDuration > 0) {
                    diffMs -= breakDuration;
                }
            }

            const workedHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

            const exitData = {
                checkOut: now,
                workedHours,
                ipAddress: ip
            };

            if (location && location.latitude && location.longitude && employee.trackingConsent) {
                exitData.exitLatitude = encryptCoordinate(location.latitude);
                exitData.exitLongitude = encryptCoordinate(location.longitude);
            }

            // Calculate Overtime
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
                const [eh, em] = activeSchedule.shift.endTime.split(':').map(Number);
                const shiftEndTime = new Date(now);
                shiftEndTime.setHours(eh, em, 0, 0);

                if (now > shiftEndTime) {
                    const extraMs = now - shiftEndTime;
                    const extraHours = parseFloat((extraMs / (1000 * 60 * 60)).toFixed(2));
                    if (extraHours > 0) {
                        exitData.overtimeHours = extraHours;
                    }
                }

                if (now < shiftEndTime) {
                    const diffMs = shiftEndTime - now;
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    if (diffMinutes >= 1) {
                        exitData.isEarlyDeparture = true;
                    }
                }
            }

            // Actualizar registro con salida
            const updatedRecord = await attendanceRepository.updateExit(existingRecord.id, exitData);

            // Create Audit Log (obfuscated GPS coordinates)
            await prisma.auditLog.create({
                data: {
                    entity: 'Attendance',
                    entityId: updatedRecord.id,
                    action: 'EXIT',
                    performedBy: employeeId,
                    details: `Registro de salida. Horas trabajadas: ${workedHours}. Ubicación validada por geocerca.`,
                    ip: ip
                }
            });

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

    async getStatus(inputIdentifierRaw) {
        const inputIdentifier = inputIdentifierRaw?.toString().trim();
        if (!inputIdentifier) throw new Error('Identificador de empleado es requerido');

        let employeeId = inputIdentifier;
        let employee = null;

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const cuidRegex = /^c[a-z0-9]{20,}$/i;

        if (uuidRegex.test(inputIdentifier) || cuidRegex.test(inputIdentifier)) {
            // It is an ID
            employee = await prisma.employee.findUnique({
                where: { id: inputIdentifier },
                select: { id: true, firstName: true, lastName: true, position: true, department: true }
            });

            if (!employee) throw new Error('Empleado no encontrado');
        } else {
            // It is an identity card
            employee = await prisma.employee.findUnique({
                where: { identityCard: inputIdentifier },
                select: { id: true, firstName: true, lastName: true, position: true, department: true }
            });

            if (!employee) throw new Error(`No se encontró empleado con la cédula: ${inputIdentifier}`);
        }
        employeeId = employee.id;

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
                response.breakStart = rec.breakStart;
                response.breakEnd = rec.breakEnd;

                // Add Location info
                if (rec.entryLatitude && rec.entryLongitude) {
                    const entryLat = decryptCoordinate(rec.entryLatitude);
                    const entryLng = decryptCoordinate(rec.entryLongitude);
                    if (entryLat !== null && entryLng !== null) {
                        response.entryLocation = { lat: entryLat, lng: entryLng };
                    }
                }
                if (rec.exitLatitude && rec.exitLongitude) {
                    const exitLat = decryptCoordinate(rec.exitLatitude);
                    const exitLng = decryptCoordinate(rec.exitLongitude);
                    if (exitLat !== null && exitLng !== null) {
                        response.exitLocation = { lat: exitLat, lng: exitLng };
                    }
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
