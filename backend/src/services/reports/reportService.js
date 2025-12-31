import prisma from '../../database/db.js';

class ReportService {
    async getAttendanceStats(startDate, endDate, department, employeeId) {
        // Parse dates to start and end of day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Filter by department if provided
        const whereEmployee = {};
        if (department) whereEmployee.department = department;
        if (employeeId) whereEmployee.id = employeeId;

        // Filter by specific employee if provided (passed as argument but need to update method signature first)
        // We will handle it in the next step or assume method signature change. 

        // Let's refactor signature in next tool call or do hack here? 
        // I will stick to current and fix signature in next step.

        const employees = await prisma.employee.findMany({
            where: whereEmployee,
            include: {
                attendance: {
                    where: {
                        date: {
                            gte: start,
                            lte: end
                        }
                    }
                },
                absences: {
                    where: {
                        status: 'APPROVED',
                        OR: [
                            { startDate: { lte: end }, endDate: { gte: start } }
                        ]
                    }
                },
                schedules: {
                    include: { shift: true }
                }
            }
        });

        // Calculate aggregated stats
        let totalScheduledDays = 0;
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;
        let totalExcused = 0;
        let totalOvertime = 0;

        const employeeStats = employees.map(emp => {
            let present = 0;
            let late = 0;
            let absent = 0;
            let excused = 0;
            let workedHours = 0;
            let overtime = 0;

            // Simplification: Iterate through each day in range is expensive.
            // Instead, we analyze the attendance records we found.
            // NOTE: Identifying "Absent" days correctly requires checking the schedule day-by-day.
            // For this MVP, we will count 'Present' based on records.
            // And estimate 'Absent' roughly or just report what we have.

            // Let's iterate days for better accuracy (limit range to 31 days recommended in frontend)
            let currentDate = new Date(start);
            while (currentDate <= end) {
                // Check if employee should work today (Simple check: is there a schedule active?)
                // TODO: complex schedule logic (days of week). Assuming Mon-Fri for MVP if no complex schedule found.
                const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6; // Sun/Sat

                // Find attendance for this day
                const dailyRecord = emp.attendance.find(a =>
                    new Date(a.date).toDateString() === currentDate.toDateString()
                );

                // Find absence for this day
                const absence = emp.absences.find(a =>
                    currentDate >= new Date(a.startDate) && currentDate <= new Date(a.endDate)
                );

                if (dailyRecord) {
                    present++;
                    const hours = dailyRecord.workedHours || 0;
                    workedHours += hours;
                    if (hours > 8) overtime += (hours - 8); // Simple rule: > 8h is overtime
                    if (dailyRecord.status === 'LATE') late++;
                } else if (absence) {
                    excused++;
                } else if (!isWeekend) {
                    // Assume absent if Mon-Fri and no record and no excuse
                    // In a real system, we'd check specific shift days.
                    absent++;
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            totalPresent += present;
            totalLate += late;
            totalAbsent += absent;
            totalExcused += excused;
            totalOvertime += overtime;
            totalScheduledDays += (present + absent + excused);

            return {
                id: emp.id,
                name: `${emp.firstName} ${emp.lastName}`,
                department: emp.department,
                present,
                late,
                absent,
                excused,
                workedHours: Math.round(workedHours * 100) / 100,
                overtime: Math.round(overtime * 100) / 100,
                attendanceRate: (present + excused) / (present + absent + excused) * 100 || 0
            };
        });

        return {
            summary: {
                totalEmployees: employees.length,
                totalScheduledDays,
                present: totalPresent,
                late: totalLate,
                absent: totalAbsent,
                excused: totalExcused,
                totalOvertime: Math.round(totalOvertime * 100) / 100,
                attendanceRate: totalScheduledDays ? ((totalPresent + totalExcused) / totalScheduledDays * 100).toFixed(1) : 0
            },
            details: employeeStats
        };
    }
}

export default new ReportService();
