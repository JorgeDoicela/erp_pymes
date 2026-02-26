import prisma from '../../database/db.js';
import { safeDecrypt } from '../../utils/encryption.js';
import exportService from '../../services/export/exportService.js';

class ExportController {
    /**
     * Export employees to CSV (UTF-8 BOM so Excel opens it correctly as a spreadsheet)
     * ExcelJS was replaced because it fails silently in Vercel serverless environments.
     */
    async exportEmployees(req, res) {
        try {
            const employees = await prisma.employee.findMany({
                include: {
                    contracts: {
                        where: { status: 'Active' },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });

            // Escape a value for CSV
            const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

            const headers = [
                'Cedula', 'Nombre', 'Apellido', 'Correo', 'Cargo',
                'Departamento', 'Fecha Ingreso', 'Estado', 'Salario Base',
                'Banco', 'N Cuenta'
            ];

            const rows = employees.map(emp => [
                cell(emp.identityCard),
                cell(emp.firstName),
                cell(emp.lastName),
                cell(emp.email),
                cell(emp.position),
                cell(emp.department),
                cell(emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('es-EC') : ''),
                cell(emp.isActive ? 'Activo' : 'Inactivo'),
                cell(emp.contracts?.[0]?.salary ?? ''),
                cell(safeDecrypt(emp.bankName) ?? 'No registrado'),
                cell(safeDecrypt(emp.accountNumber) ?? 'No registrado'),
            ].join(','));

            // UTF-8 BOM ensures Excel renders accented characters correctly
            const BOM = '\uFEFF';
            const csv = BOM + [headers.map(h => cell(h)).join(','), ...rows].join('\r\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename=lista_empleados.csv');
            res.send(csv);
        } catch (error) {
            console.error('EXPORT_EMPLOYEES_ERROR:', error);
            res.status(500).json({ success: false, message: 'Error al exportar empleados: ' + error.message });
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

            if (!payroll.length) return res.status(404).json({ message: 'No hay datos para esta nomina' });

            const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

            const headers = ['Cedula', 'Nombre', 'Cuenta', 'Banco', 'Monto', 'Concepto'];

            const rows = payroll.map(p => {
                const bank = safeDecrypt(p.employee.bankName) ?? 'No registrado';
                const account = safeDecrypt(p.employee.accountNumber) ?? 'No registrado';
                const period = new Date(p.payroll.period);
                return [
                    cell(p.employee.identityCard),
                    cell(`${p.employee.firstName} ${p.employee.lastName}`),
                    cell(account),
                    cell(bank),
                    cell(Number(p.netSalary).toFixed(2)),
                    cell(`Pago Nomina ${period.getMonth() + 1}/${period.getFullYear()}`)
                ].join(',');
            });

            const BOM = '\uFEFF';
            const csv = BOM + [headers.map(h => cell(h)).join(','), ...rows].join('\r\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=nomina_${id}.csv`);
            res.send(csv);
        } catch (error) {
            console.error('EXPORT_PAYROLL_CSV_ERROR:', error);
            res.status(500).json({ success: false, message: 'Error al exportar CSV de nomina: ' + error.message });
        }
    }

    /**
     * Export pay stub to PDF
     * NOTE: jsPDF references 'fs' which is unavailable in Vercel serverless.
     * Returns 501 until migrated to a compatible library (e.g. PDFKit).
     */
    async exportPayStubPDF(req, res) {
        return res.status(501).json({
            success: false,
            message: 'La exportacion de rol de pago en PDF no esta disponible en este entorno. Use la vista de impresion del navegador.'
        });
    }
}

export default new ExportController();
