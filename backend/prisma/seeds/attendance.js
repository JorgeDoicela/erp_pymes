export async function seedAttendance(prisma, employees) {
    console.log('⏳ Generando Asistencia (Último mes)...');
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (const emp of employees) {
        if (emp.role === 'admin') continue;

        try {
            // Check if already has basic attendance
            const stored = await prisma.attendance.findFirst({ where: { employeeId: emp.id } });
            if (stored) continue; // Skip if already populated to avoid duplication on re-seed

            // Seed until yesterday so we can test "today" manually
            const yesterdayDate = today.getDate() - 1;
            const limitDay = yesterdayDate < 1 ? 0 : yesterdayDate;

            for (let day = 1; day <= limitDay; day++) {
                const date = new Date(year, month, day);
                const dayOfWeek = date.getDay();

                if (dayOfWeek === 0 || dayOfWeek === 6) continue;

                const rand = Math.random();
                let status = 'Presente';
                let checkIn = new Date(year, month, day, 8, 0, 0);
                let checkOut = new Date(year, month, day, 17, 0, 0);
                let workedHours = 8;

                if (rand < 0.05) { // Falta
                    // Just 50% chance of inserting absence record to save loops/space
                    if (Math.random() > 0.5) {
                        await prisma.attendance.create({
                            data: {
                                employeeId: emp.id,
                                date: date,
                                checkIn: new Date(year, month, day, 0, 0, 0), // Required dummy
                                checkOut: null,
                                status: 'Falta',
                                workedHours: 0
                            }
                        });
                    }
                    continue;
                }

                await prisma.attendance.create({
                    data: {
                        employeeId: emp.id,
                        date: date,
                        checkIn: checkIn,
                        checkOut: checkOut,
                        status: status,
                        workedHours: workedHours
                    }
                });
            }
        } catch (e) { }
    }
}
