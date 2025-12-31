import reportService from '../../services/reports/reportService.js';

class ReportController {
    async getAttendanceReport(req, res) {
        try {
            const { startDate, endDate, department, employeeId } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ success: false, message: 'Se requieren fechas de inicio y fin' });
            }

            const report = await reportService.getAttendanceStats(startDate, endDate, department, employeeId);

            res.status(200).json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error generando reporte' });
        }
    }
}

export default new ReportController();
