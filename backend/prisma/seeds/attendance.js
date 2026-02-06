export async function seedAttendance(prisma, employees) {
    console.log('⏳ Generando Asistencia (Últimos 90 días)...');

    const today = new Date();
    // Helper to generate range
    const getDates = (startDate, endDate) => {
        const dates = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);
    const datesToSeed = getDates(ninetyDaysAgo, today);

    // Pick candidates for specific patterns
    const suspiciousCandidates = employees.slice(0, 3); // First 3 employees will have suspicious absences
    const lateCandidates = employees.slice(3, 6); // Next 3 will be late often

    for (const emp of employees) {
        if (emp.role === 'admin') continue;

        // Skip if already seeded (simple check)
        const count = await prisma.attendance.count({ where: { employeeId: emp.id } });
        if (count > 50) continue;

        const isSuspicious = suspiciousCandidates.includes(emp);
        const isLate = lateCandidates.includes(emp);

        for (const date of datesToSeed) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

            // Determine Status
            let status = 'Presente';
            let checkIn = new Date(date); checkIn.setHours(8, 0, 0);
            let checkOut = new Date(date); checkOut.setHours(17, 0, 0);
            let workedHours = 8;
            let isLateToday = false;

            // Pattern: Suspicious (Mon/Fri absences)
            if (isSuspicious && (dayOfWeek === 1 || dayOfWeek === 5) && Math.random() > 0.6) {
                // FORCE create absence via Absence table separately? 
                // Using seedAbsences for that, but we can mark attendance as missing/null here or just skip creating
                // For logic, let's create a 'Falta' record in Attendance if system supports it, OR rely on lack of record + Absence
                // Let's creat a 'Falta' status
                await prisma.attendance.create({
                    data: {
                        employeeId: emp.id,
                        date: date,
                        checkIn: new Date(date), // Dummy
                        checkOut: null,
                        status: 'Falta',
                        workedHours: 0
                    }
                });
                continue;
            }

            // Pattern: Late
            if (isLate && Math.random() > 0.4) {
                isLateToday = true;
                checkIn.setMinutes(Math.floor(Math.random() * 45) + 15); // 8:15 - 9:00
            } else {
                // Random variation normal
                checkIn.setMinutes(Math.floor(Math.random() * 10)); // 8:00 - 8:10
            }

            // Random Absences for others (low probability)
            if (!isSuspicious && Math.random() < 0.02) {
                await prisma.attendance.create({
                    data: {
                        employeeId: emp.id,
                        date: date,
                        checkIn: new Date(date),
                        checkOut: null,
                        status: 'Falta',
                        workedHours: 0
                    }
                });
                continue;
            }

            // Create Present Record
            await prisma.attendance.create({
                data: {
                    employeeId: emp.id,
                    date: date,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    status: 'Presente',
                    workedHours: workedHours,
                    isLate: isLateToday
                }
            });
        }
    }
}
