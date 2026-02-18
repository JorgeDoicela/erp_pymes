export async function seedAttendance(prisma, employees) {
    console.log('⏳ Generando Asistencia (Últimos 90 días)...');

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);

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

    // Seed from 90 days ago up to YESTERDAY (exclude today)
    const datesToSeed = getDates(ninetyDaysAgo, yesterday);

    console.log(`[DEBUG] Employees passed: ${employees.length}`);
    console.log(`[DEBUG] Dates to seed: ${datesToSeed.length}`);
    console.log(`[DEBUG] Date range: ${ninetyDaysAgo.toISOString()} -> ${yesterday.toISOString()}`);

    // Pick candidates for specific patterns
    // Using simple logic to ensure we target employees actually in the list
    const employeesList = employees.filter(e => e.role !== 'admin');
    console.log(`[DEBUG] Employees to seed (non-admin): ${employeesList.length}`);

    const suspiciousCandidates = employeesList.slice(0, 3);
    const lateCandidates = employeesList.slice(3, 6);

    const attendanceBatch = [];

    for (const emp of employeesList) {
        // Skip if already seeded (check count once per employee not needed if we rely on clean state or just append)
        // Optimization: checking count for every employee is slow. 
        // Better: Assumed seeded if ANY record exists? Or just skip check for speed if we trust clean
        // Let's keep a fast check or remove it. 
        // For mass seed, let's skip the check or do one check at start.
        // Doing one check per employee is 27 queries. That's fine.

        // Skip heavy check for speed in this context
        // const count = await prisma.attendance.count({ where: { employeeId: emp.id } });
        // if (count > 50) continue; 

        const isSuspicious = suspiciousCandidates.find(c => c.id === emp.id);
        const isLate = lateCandidates.find(c => c.id === emp.id);

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
                attendanceBatch.push({
                    employeeId: emp.id,
                    date: date,
                    checkIn: new Date(date), // Dummy
                    checkOut: null,
                    status: 'Falta',
                    workedHours: 0,
                    isLate: false
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
                attendanceBatch.push({
                    employeeId: emp.id,
                    date: date,
                    checkIn: new Date(date),
                    checkOut: null,
                    status: 'Falta',
                    workedHours: 0,
                    isLate: false
                });
                continue;
            }

            // Normalize date to midnight UTC to match unique constraint logic
            const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

            attendanceBatch.push({
                employeeId: emp.id,
                date: normalizedDate,
                checkIn: checkIn,
                checkOut: checkOut,
                status: 'Presente',
                workedHours: workedHours,
                isLate: isLateToday,
                entryLatitude: -0.1807, // Approx Quito
                entryLongitude: -78.4678,
                exitLatitude: -0.1807,
                exitLongitude: -78.4678
            });
        }
    }

    // Insert in chunks of 100 to avoid parameter limits and memory issues
    const chunkSize = 100;
    console.log(`[ATTENDANCE] Inserting ${attendanceBatch.length} records in chunks of ${chunkSize}...`);

    for (let i = 0; i < attendanceBatch.length; i += chunkSize) {
        const chunk = attendanceBatch.slice(i, i + chunkSize);
        try {
            await prisma.attendance.createMany({
                data: chunk,
                skipDuplicates: true
            });
        } catch (e) {
            console.error(`❌ Error inserting attendance chunk ${i}: ${e.message}`);
            // Don't crash, just log and continue
        }
    }
    console.log('[ATTENDANCE] Batch insert completed.');
}
