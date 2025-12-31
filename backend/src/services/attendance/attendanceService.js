import { attendanceRepository } from '../../repositories/attendance/attendanceRepository.js';

export const attendanceService = {
    async registerAttendance(employeeId, type) {
        // Normalizar la fecha a medianoche para buscar el registro del día
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Buscar si ya existe registro hoy
        const existingRecord = await attendanceRepository.findByEmployeeAndDate(employeeId, today);

        if (type === 'ENTRY') {
            if (existingRecord) {
                throw new Error('Ya se ha registrado una entrada para este día.');
            }

            // Crear registro de entrada
            const newRecord = await attendanceRepository.createEntry({
                employeeId,
                date: today,
                checkIn: now,
                status: 'Present', // Estado inicial
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
            const diffMs = now - checkInTime;
            const workedHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

            // Actualizar registro con salida
            const updatedRecord = await attendanceRepository.updateExit(existingRecord.id, {
                checkOut: now,
                workedHours,
            });

            return { message: 'Salida registrada exitosamente', record: updatedRecord, workedHours };
        } else {
            throw new Error('Tipo de registro no válido (Use ENTRY o EXIT).');
        }
    },

    async getStatus(employeeId) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const record = await attendanceRepository.findByEmployeeAndDate(employeeId, today);

        if (!record) return { status: 'NOT_STARTED' };
        if (record.checkIn && !record.checkOut) return { status: 'WORKING', checkIn: record.checkIn };
        if (record.checkOut) return { status: 'COMPLETED', checkIn: record.checkIn, checkOut: record.checkOut };

        return { status: 'UNKNOWN' };
    }
};
