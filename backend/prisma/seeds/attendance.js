import prisma from '../../src/database/db.js';
import { encryptCoordinate } from '../../src/utils/encryption.js';

export async function seedAttendance(prisma, employees) {
    console.log('⏳ Generando Asistencia (Últimos 180 días con patrones determinísticos)...');

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const hundredEightyDaysAgo = new Date();
    hundredEightyDaysAgo.setDate(today.getDate() - 180);

    const getDates = (startDate, endDate) => {
        const dates = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const datesToSeed = getDates(hundredEightyDaysAgo, yesterday);
    const employeesList = employees.filter(e => e.role !== 'admin');

    // Helper para hash numérico de ID de string
    const getEmpNumericHash = (id) => {
        if (!id) return 1;
        return String(id).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    };

    const attendanceBatch = [];

    for (const emp of employeesList) {
        const empHash = getEmpNumericHash(emp.id);
        const isCriticalSuspicious = emp.email === 'kevin.arismendi@emplifi.com';
        const isHighSuspicious = emp.email === 'lucia.paz@emplifi.com';
        const isChronicLate = emp.email === 'gabriela.torres@emplifi.com';
        const isModerateLate = emp.email === 'camila.rodriguez@emplifi.com';

        for (const date of datesToSeed) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Fin de semana

            // Normalizar fecha a medianoche UTC
            const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const checkIn = new Date(date); checkIn.setHours(8, 0, 0);
            const checkOut = new Date(date); checkOut.setHours(17, 0, 0);
            let workedHours = 8;
            let isLateToday = false;

            // Determinar si es falta sospechosa (Lunes = 1, Viernes = 5)
            let isAbsence = false;

            if (isCriticalSuspicious && (dayOfWeek === 1 || dayOfWeek === 5)) {
                const dayHash = (date.getDate() * 17 + date.getMonth() * 31) % 100;
                if (dayHash < 45) isAbsence = true;
            } else if (isHighSuspicious && (dayOfWeek === 1 || dayOfWeek === 5)) {
                const dayHash = (date.getDate() * 13 + date.getMonth() * 29) % 100;
                if (dayHash < 35) isAbsence = true;
            } else {
                const dayHash = (empHash * 7 + date.getDate() * 19 + date.getMonth() * 3) % 1000;
                if (dayHash < 15) isAbsence = true;
            }

            if (isAbsence) {
                attendanceBatch.push({
                    employeeId: emp.id,
                    date: normalizedDate,
                    checkIn: new Date(date),
                    checkOut: null,
                    status: 'Falta',
                    workedHours: 0,
                    isLate: false
                });
                continue;
            }

            // Determinar retraso
            const dayHashLate = (empHash * 11 + date.getDate() * 23 + date.getMonth() * 7) % 100;

            if (isChronicLate && dayHashLate < 60) {
                isLateToday = true;
                checkIn.setMinutes(15 + (dayHashLate % 30)); // 8:15 a 8:45
            } else if ((isModerateLate || isCriticalSuspicious) && dayHashLate < 40) {
                isLateToday = true;
                checkIn.setMinutes(10 + (dayHashLate % 25)); // 8:10 a 8:35
            } else if (dayHashLate < 8) {
                isLateToday = true;
                checkIn.setMinutes(5 + (dayHashLate % 15));
            } else {
                checkIn.setMinutes(dayHashLate % 8); // 8:00 a 8:07 (a tiempo)
            }

            attendanceBatch.push({
                employeeId: emp.id,
                date: normalizedDate,
                checkIn: checkIn,
                checkOut: checkOut,
                status: 'Presente',
                workedHours: workedHours,
                isLate: isLateToday,
                entryLatitude: encryptCoordinate(-0.1807),
                entryLongitude: encryptCoordinate(-78.4678),
                exitLatitude: encryptCoordinate(-0.1807),
                exitLongitude: encryptCoordinate(-78.4678)
            });
        }
    }

    // Inserción en chunks de 150
    const chunkSize = 150;
    console.log(`[ATTENDANCE] Insertando ${attendanceBatch.length} registros en chunks de ${chunkSize}...`);

    for (let i = 0; i < attendanceBatch.length; i += chunkSize) {
        const chunk = attendanceBatch.slice(i, i + chunkSize);
        try {
            await prisma.attendance.createMany({
                data: chunk,
                skipDuplicates: true
            });
        } catch (e) {
            console.error(`❌ Error insertando chunk de asistencia ${i}: ${e.message}`);
        }
    }
    console.log('[ATTENDANCE] Carga determinística de 180 días completada.');
}
