/**
 * @file report.service.js
 * @description Norma ERP - Servicio de Reportes Operativos
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import reportRepository from './report.repository.js';
import { decryptCoordinate } from '../../utils/encryption.js';

export class ReportService {
  async getAttendanceStats(startDate, endDate, department, employeeId, tenantId = null) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const whereEmployee = {};
    if (tenantId) whereEmployee.tenantId = tenantId;
    if (department) whereEmployee.department = department;
    if (employeeId) whereEmployee.id = employeeId;

    const employees = await reportRepository.findEmployeesAttendanceData(
      whereEmployee,
      start,
      end
    );

    let totalScheduledDays = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalExcused = 0;
    let totalOvertime = 0;

    const employeeStats = employees.map((emp) => {
      let present = 0;
      let late = 0;
      let absent = 0;
      let excused = 0;
      let workedHours = 0;
      let overtime = 0;

      const currentDate = new Date(start);
      while (currentDate <= end) {
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

        const dailyRecord = emp.attendance.find(
          (a) => new Date(a.date).toDateString() === currentDate.toDateString()
        );

        const absence = emp.absences.find(
          (a) => currentDate >= new Date(a.startDate) && currentDate <= new Date(a.endDate)
        );

        if (dailyRecord) {
          present++;
          const hours = dailyRecord.workedHours || 0;
          workedHours += hours;
          if (dailyRecord.overtimeHours) {
            overtime += dailyRecord.overtimeHours;
          } else if (hours > 8) {
            overtime += hours - 8;
          }
          if (dailyRecord.status === 'LATE') late++;
        } else if (absence) {
          excused++;
        } else if (!isWeekend) {
          absent++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      totalPresent += present;
      totalLate += late;
      totalAbsent += absent;
      totalExcused += excused;
      totalOvertime += overtime;
      totalScheduledDays += present + absent + excused;

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
        attendanceRate: ((present + excused) / (present + absent + excused)) * 100 || 0,
        records: emp.attendance.map((a) => {
          const entryLat = decryptCoordinate(a.entryLatitude);
          const entryLng = decryptCoordinate(a.entryLongitude);
          const exitLat = decryptCoordinate(a.exitLatitude);
          const exitLng = decryptCoordinate(a.exitLongitude);

          return {
            id: a.id,
            date: a.date,
            checkIn: a.checkIn,
            checkOut: a.checkOut,
            status: a.status,
            ipAddress: a.ipAddress,
            entryLocation:
              entryLat !== null && entryLng !== null ? { lat: entryLat, lng: entryLng } : null,
            exitLocation:
              exitLat !== null && exitLng !== null ? { lat: exitLat, lng: exitLng } : null,
          };
        }),
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
        attendanceRate: totalScheduledDays
          ? (((totalPresent + totalExcused) / totalScheduledDays) * 100).toFixed(1)
          : 0,
      },
      details: employeeStats,
    };
  }
}

export default new ReportService();

