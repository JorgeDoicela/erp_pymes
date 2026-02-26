import exportService from '../../services/export/exportService.js';
import prisma from '../../database/db.js';
import { safeDecrypt } from '../../utils/encryption.js';

class ExportController {
    /**
     * Export employees to Excel
     */
    async exportEmployees(req, res) {
        try {
            // Fetch employees with their active contract (salary stored as Float there)
            const employees = await prisma.employee.findMany({
                include: {
                    contracts: {
                        where: { status: 'Active' },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });

            const columns = [
                { header: 'Cédula', key: 'cedula', width: 15 },
                { header: 'Nombre', key: 'firstName', width: 20 },
                { header: 'Apellido', key: 'lastName', width: 20 },
                { header: 'Correo', key: 'email', width: 30 },
                { header: 'Cargo', key: 'position', width: 25 },
                { header: 'Departamento', key: 'department', width: 20 },
                { header: 'Fecha Ingreso', key: 'hireDate', width: 15 },
                { header: 'Estado', key: 'status', width: 12 },
                { header: 'Salario Base', key: 'salary', width: 15 },
                { header: 'Banco', key: 'bank', width: 20 },
                { header: 'N° Cuenta', key: 'account', width: 20 }
            ];

            const rows = employees.map(emp => ({
                cedula: emp.identityCard || '',
                firstName: emp.firstName || '',
                lastName: emp.lastName || '',
                email: emp.email || '',
                position: emp.position || '',
                department: emp.department || '',
                hireDate: emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('es-EC') : '',
                status: emp.isActive ? 'Activo' : 'Inactivo',
                // Salary from active contract (plain Float — no decryption needed)
                salary: emp.contracts?.[0]?.salary ?? '',
                // Bank data: decrypt safely — show empty if key mismatch
                bank: safeDecrypt(emp.bankName) ?? 'No registrado',
                account: safeDecrypt(emp.accountNumber) ?? 'No registrado',
            }));

            const buffer = await exportService.generateExcel(rows, 'Empleados', columns);

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
                // safeDecrypt returns null on failure — use fallback string
                const bank = safeDecrypt(p.employee.bankName) ?? 'No registrado';
                const account = safeDecrypt(p.employee.accountNumber) ?? 'No registrado';

                const period = new Date(p.payroll.period);
                return {
                    cedula: p.employee.identityCard,
                    nombre: `${p.employee.firstName} ${p.employee.lastName}`,
                    cuenta: account,
                    banco: bank,
                    monto: Number(p.netSalary).toFixed(2),
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
        // NOTE: PDF generation via jsPDF uses 'fs' which is not available in Vercel serverless.
        // Returning 501 until this is migrated to a server-side PDF library (e.g. PDFKit).
        return res.status(501).json({
            success: false,
            message: 'La exportación de rol de pago en PDF no está disponible en este entorno. Use la vista de impresión del navegador.'
        });
    }
}

export default new ExportController();
