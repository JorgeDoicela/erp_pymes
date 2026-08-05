import prisma from '../../database/db.js';
import auditRepository from '../../repositories/audit/auditRepository.js';
import { financial } from '../../utils/financialUtils.js';

class OffboardingService {
    /**
     * Simulador y cálculo oficial de Liquidación Legal (Acta de Finiquito).
     */
    async simulateSettlement({ employeeId, exitDate = new Date(), causal = 'VOLUNTARY_RESIGNATION' }) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                contracts: {
                    orderBy: { startDate: 'desc' },
                    take: 1
                }
            }
        });

        if (!employee) throw new Error('Empleado no encontrado');
        const contract = employee.contracts[0];
        if (!contract) throw new Error('El empleado no posee un contrato registrado');

        const startDate = new Date(contract.startDate);
        const endDate = new Date(exitDate);

        if (endDate < startDate) {
            throw new Error('La fecha de salida no puede ser anterior a la fecha de inicio de contrato');
        }

        const diffTime = Math.abs(endDate - startDate);
        const daysWorkedTotal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const yearsWorked = daysWorkedTotal / 365.25;
        const fullYearsWorked = Math.floor(yearsWorked);
        const monthsWorked = daysWorkedTotal / 30.4375;

        const baseSalary = financial.from(contract.salary);
        const dailySalary = financial.divide(baseSalary, 30);

        // 1. Décimo Tercero Proporcional (Período 1 Dic a 30 Nov)
        // Estimación sobre meses trabajados en el ciclo de acumulación actual (máximo 12 meses)
        const monthsInThirteenthPeriod = Math.min(monthsWorked, 12);
        const thirteenthProportional = financial.divide(financial.multiply(baseSalary, monthsInThirteenthPeriod), 12);

        // 2. Décimo Cuarto Proporcional (SBU Ecuador $460.00)
        const SBU = financial.from(460);
        const monthsInFourteenthPeriod = Math.min(monthsWorked, 12);
        const fourteenthProportional = financial.divide(financial.multiply(SBU, monthsInFourteenthPeriod), 12);

        // 3. Vacaciones No Gozadas (15 días por año = 1.25 días por mes)
        const earnedVacationDays = monthsWorked * 1.25;
        // Consultar ausencias por vacaciones ya tomadas
        const takenVacations = await prisma.absenceRequest.findMany({
            where: {
                employeeId,
                type: 'VACATION',
                status: 'APPROVED'
            }
        });

        let takenDays = 0;
        takenVacations.forEach(v => {
            const start = new Date(v.startDate);
            const end = new Date(v.endDate);
            const days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
            takenDays += days;
        });

        const pendingVacationDays = Math.max(0, earnedVacationDays - takenDays);
        const vacationAmount = financial.multiply(dailySalary, pendingVacationDays);

        // 4. Bonificación por Desahucio (25% del sueldo por año de servicio - Art. 185)
        // Aplica en Renuncia Voluntaria, Despido Intempestivo y Fin de Contrato
        let desahucioAmount = financial.from(0);
        if (['VOLUNTARY_RESIGNATION', 'UNFAIR_DISMISSAL', 'CONTRACT_END'].includes(causal) && fullYearsWorked >= 1) {
            desahucioAmount = financial.multiply(financial.multiply(baseSalary, 0.25), fullYearsWorked);
        }

        // 5. Indemnización por Despido Intempestivo (Art. 188)
        // Aplica ÚNICAMENTE en Despido Intempestivo (UNFAIR_DISMISSAL)
        let severanceAmount = financial.from(0);
        if (causal === 'UNFAIR_DISMISSAL') {
            if (yearsWorked <= 3) {
                // Hasta 3 años: 3 meses de remuneración
                severanceAmount = financial.multiply(baseSalary, 3);
            } else {
                // Más de 3 años: 1 mes de remuneración por cada año de servicio (máx 25 meses)
                const yearsToPay = Math.min(Math.ceil(yearsWorked), 25);
                severanceAmount = financial.multiply(baseSalary, yearsToPay);
            }
        }

        const totalSettlement = thirteenthProportional
            .plus(fourteenthProportional)
            .plus(vacationAmount)
            .plus(desahucioAmount)
            .plus(severanceAmount);

        return {
            employee: {
                id: employee.id,
                firstName: employee.firstName,
                lastName: employee.lastName,
                identityCard: employee.identityCard,
                department: employee.department,
                position: employee.position,
                startDate: contract.startDate
            },
            exitDate,
            causal,
            daysWorkedTotal,
            yearsWorked: Number(yearsWorked.toFixed(2)),
            monthsWorked: Number(monthsWorked.toFixed(2)),
            baseSalary: financial.round(baseSalary),
            thirteenthProportional: financial.round(thirteenthProportional),
            fourteenthProportional: financial.round(fourteenthProportional),
            pendingVacationDays: Number(pendingVacationDays.toFixed(1)),
            vacationAmount: financial.round(vacationAmount),
            desahucioAmount: financial.round(desahucioAmount),
            severanceAmount: financial.round(severanceAmount),
            totalSettlement: financial.round(totalSettlement)
        };
    }

    /**
     * Iniciar proceso oficial de Offboarding con Checklist de Salida.
     */
    async startOffboarding({ employeeId, exitDate, causal, notes, adminId }) {
        const simulation = await this.simulateSettlement({ employeeId, exitDate, causal });

        // Cargar activos asignados pendientes de devolución
        const assets = await prisma.employeeAsset.findMany({
            where: { employeeId, status: 'DELIVERED' }
        });

        // Construir checklist automático
        const defaultChecklist = [
            { id: 'IT_REVOKE', label: 'Revocación de correos corporativos y accesos a sistemas IT', completed: false, category: 'IT' },
            { id: 'EXIT_INTERVIEW', label: 'Realización de entrevista de salida con RRHH', completed: false, category: 'HR' },
            { id: 'SIGN_SETTLEMENT', label: 'Firma de Acta de Finiquito y acreditación de fondos', completed: false, category: 'LEGAL' }
        ];

        assets.forEach(asset => {
            defaultChecklist.push({
                id: `ASSET_RETURN_${asset.id}`,
                label: `Devolución de Activo/EPP: ${asset.name} (${asset.category})`,
                assetId: asset.id,
                completed: false,
                category: 'ASSETS'
            });
        });

        const offboarding = await prisma.offboardingProcess.create({
            data: {
                employeeId,
                exitDate: new Date(exitDate),
                causal,
                status: 'IN_PROGRESS',
                checklist: JSON.stringify(defaultChecklist),
                baseSalary: simulation.baseSalary,
                monthsWorked: simulation.monthsWorked,
                thirteenthProportional: simulation.thirteenthProportional,
                fourteenthProportional: simulation.fourteenthProportional,
                vacationDaysOwed: simulation.pendingVacationDays,
                vacationAmount: simulation.vacationAmount,
                desahucioAmount: simulation.desahucioAmount,
                severanceAmount: simulation.severanceAmount,
                totalSettlement: simulation.totalSettlement,
                notes
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, identityCard: true, department: true, position: true }
                }
            }
        });

        if (adminId) {
            auditRepository.createLog({
                entity: 'OffboardingProcess',
                entityId: offboarding.id,
                action: 'START_OFFBOARDING',
                performedBy: adminId,
                details: `Iniciado proceso de salida para ${offboarding.employee.firstName} ${offboarding.employee.lastName}. Causal: ${causal}. Total finiquito: $${offboarding.totalSettlement}`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return offboarding;
    }

    /**
     * Actualizar estado de una tarea del checklist de salida.
     */
    async updateChecklistStep(offboardingId, taskId, completed, adminId) {
        const process = await prisma.offboardingProcess.findUnique({
            where: { id: offboardingId }
        });

        if (!process) throw new Error('Proceso de salida no encontrado');

        const checklist = JSON.parse(process.checklist || '[]');
        const task = checklist.find(t => t.id === taskId);
        if (task) {
            task.completed = completed;
            task.completedAt = completed ? new Date() : null;
        }

        const allCompleted = checklist.every(t => t.completed);

        const updated = await prisma.offboardingProcess.update({
            where: { id: offboardingId },
            data: {
                checklist: JSON.stringify(checklist),
                status: allCompleted ? 'COMPLETED' : 'IN_PROGRESS'
            },
            include: { employee: true }
        });

        // Si la tarea era devolución de activo, actualizar estado del activo a RETURNED
        if (task && task.assetId && completed) {
            await prisma.employeeAsset.update({
                where: { id: task.assetId },
                data: { status: 'RETURNED', returnDate: new Date(), returnNotes: 'Devuelto durante Offboarding' }
            }).catch(err => console.error('Asset status update error:', err));
        }

        return updated;
    }

    /**
     * Listar procesos de Offboarding.
     */
    async getOffboardings({ status, search, page = 1, limit = 20 }) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) where.status = status;
        if (search) {
            where.employee = {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { identityCard: { contains: search, mode: 'insensitive' } }
                ]
            };
        }

        const [data, total] = await Promise.all([
            prisma.offboardingProcess.findMany({
                where,
                skip,
                take: limit,
                orderBy: { exitDate: 'desc' },
                include: {
                    employee: {
                        select: { id: true, firstName: true, lastName: true, identityCard: true, department: true, position: true }
                    }
                }
            }),
            prisma.offboardingProcess.count({ where })
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}

export default new OffboardingService();
