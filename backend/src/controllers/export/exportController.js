import exportService from '../../services/export/exportService.js';
import prisma from '../../database/db.js';
import { safeDecrypt } from '../../utils/encryption.js';

class ExportController {
    /**
     * Export employees to Excel
     */
    async exportEmployees(req, res) {
        try {
            const employees = await prisma.employee.findMany();

            const columns = [
                { header: 'Cédula', key: 'cedula' },
                { header: 'Nombre', key: 'firstName' },
                { header: 'Apellido', key: 'lastName' },
                { header: 'Correo', key: 'email' },
                { header: 'Cargo', key: 'position' },
                { header: 'Departamento', key: 'department' },
                { header: 'Fecha Ingreso', key: 'hireDate' },
                { header: 'Salario', key: 'salary' }
            ];

            const buffer = await exportService.generateExcel(employees, 'Empleados', columns);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=empleados.xlsx');
            res.send(buffer);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error al exportar empleados' });
        }
    }

    /**
     * Export payroll to CSV for accounting
     */
    async exportPayrollCSV(req, res) {
        try {
            const { id } = req.params;
            const payroll = await prisma.payrollDetail.findMany({
                where: { payrollId: id },
                include: { employee: true, payroll: true }
            });

            if (!payroll.length) return res.status(404).json({ message: 'No hay datos para esta nómina' });

            const data = payroll.map(p => {
                let bank = '';
                let account = '';
                try {
                    bank = p.employee.bankName ? safeDecrypt(p.employee.bankName) : '';
                    account = p.employee.accountNumber ? safeDecrypt(p.employee.accountNumber) : '';
                } catch (e) {
                    bank = 'ENC_ERROR';
                    account = 'ENC_ERROR';
                }

                const period = new Date(p.payroll.period);
                return {
                    cedula: p.employee.identityCard,
                    nombre: `${p.employee.firstName} ${p.employee.lastName}`,
                    cuenta: account,
                    banco: bank,
                    monto: p.netSalary.toFixed(2),
                    concepto: `Pago Nómina ${period.getMonth() + 1}/${period.getFullYear()}`
                };
            });

            const fields = ['cedula', 'nombre', 'cuenta', 'banco', 'monto', 'concepto'];
            const csv = await exportService.generateCSV(data, fields);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=payroll_${id}.csv`);
            res.send(csv);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error al exportar CSV de nómina' });
        }
    }

    /**
     * Export pay stub to PDF
     */
    async exportPayStubPDF(req, res) {
        try {
            const { id } = req.params;
            const record = await prisma.payrollDetail.findUnique({
                where: { id },
                include: { employee: true, payroll: true }
            });

            if (!record) return res.status(404).json({ message: 'Registro de nómina no encontrado' });

            // Check authorization: Admin can see all, Employee only their own
            if (req.user.role !== 'admin' && record.employeeId !== req.user.id) {
                return res.status(403).json({ message: 'No tienes permiso para ver este rol de pago' });
            }

            // Parse bonuses and deductions from JSON strings
            const bonuses = JSON.parse(record.bonuses || '[]');
            const deductionsArr = JSON.parse(record.deductions || '[]');

            // Construct data for PDF
            const periodDate = new Date(record.payroll.period);
            const pdfData = {
                employee: record.employee,
                period: { month: periodDate.getMonth() + 1, year: periodDate.getFullYear() },
                totalEarnings: record.baseSalary + record.overtimeAmount + bonuses.reduce((a, b) => a + b.amount, 0),
                totalDeductions: deductionsArr.reduce((a, b) => a + b.amount, 0),
                netSalary: record.netSalary,
                details: [
                    { description: 'Sueldo Básico', amount: record.baseSalary, type: 'earning' },
                    { description: 'Horas Extras', amount: record.overtimeAmount, type: 'earning' },
                    ...bonuses.map(b => ({ description: b.name, amount: b.amount, type: 'earning' })),
                    ...deductionsArr.map(d => ({ description: d.name, amount: d.amount, type: 'deduction' }))
                ]
            };

            const buffer = await exportService.generatePayStubPDF(pdfData);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=rol_pago_${record.employee.lastName}.pdf`);
            res.send(buffer);
        } catch (error) {
            console.error('EXPORT_PAY_STUB_PDF_ERROR:', error);
            res.status(500).json({ success: false, message: 'Error al generar PDF de rol de pago: ' + error.message });
        }
    }
}

export default new ExportController();
