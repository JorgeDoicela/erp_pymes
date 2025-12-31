import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { encryptSalary } from '../src/utils/encryption.js';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando Seed Completo del Sistema...');

    // 1. Limpieza de tablas (Orden específico por claves foráneas)
    const models = [
        'payrollDetail', 'payroll', 'payrollItem', 'payrollConfig',
        'attendance', 'absenceRequest', 'employeeSchedule', 'shift',
        'contract', 'document', 'skill', 'workHistory', 'auditLog', 'employee'
    ];

    // Deleting in order
    // Note: We use deleteMany() which allows cascading if configured in DB, but prisma schema has onDelete: Cascade so it should work.
    // However, clean delete is safer.
    await prisma.payrollDetail.deleteMany();
    await prisma.payroll.deleteMany();
    await prisma.payrollItem.deleteMany();
    await prisma.payrollConfig.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.absenceRequest.deleteMany();
    await prisma.employeeSchedule.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.document.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.workHistory.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.employee.deleteMany();

    console.log('🧹 Base de datos limpia.');

    // 2. Turnos
    const shiftMorning = await prisma.shift.create({
        data: { name: 'Matutino', startTime: '08:00', endTime: '17:00' }
    });
    const shiftEvening = await prisma.shift.create({
        data: { name: 'Vespertino', startTime: '14:00', endTime: '22:00' }
    });

    console.log('🕒 Turnos creados');

    // 3. Empleados y sus datos relacionados
    const password = await bcrypt.hash('123456', 10);

    const employeesData = [
        {
            firstName: 'Admin', lastName: 'Sistema', email: 'admin@emplifi.com', role: 'admin',
            department: 'Dirección', position: 'Administrador', salary: 5000,
            idCard: '0101010101', birth: '1985-05-05', shift: shiftMorning.id
        },
        {
            firstName: 'Ana', lastName: 'García', email: 'ana.garcia@emplifi.com', role: 'employee',
            department: 'Recursos Humanos', position: 'Gerente RRHH', salary: 3500,
            idCard: '0202020202', birth: '1990-08-15', shift: shiftMorning.id
        },
        {
            firstName: 'Carlos', lastName: 'Vera', email: 'carlos.vera@emplifi.com', role: 'employee',
            department: 'Desarrollo', position: 'Senior Backend Dev', salary: 2800,
            idCard: '0303030303', birth: '1993-02-20', shift: shiftMorning.id
        },
        {
            firstName: 'Diana', lastName: 'Torres', email: 'diana.torres@emplifi.com', role: 'employee',
            department: 'Desarrollo', position: 'Frontend Dev', salary: 2200,
            idCard: '0404040404', birth: '1996-11-10', shift: shiftMorning.id
        },
        {
            firstName: 'Eduardo', lastName: 'Ruiz', email: 'eduardo.ruiz@emplifi.com', role: 'employee',
            department: 'Soporte', position: 'Técnico Soporte', salary: 1200,
            idCard: '0505050505', birth: '1998-07-25', shift: shiftEvening.id
        },
        {
            firstName: 'Fernanda', lastName: 'Lopez', email: 'fernanda.lopez@emplifi.com', role: 'employee',
            department: 'Ventas', position: 'Ejecutiva Comercial', salary: 1500,
            idCard: '0606060606', birth: '1995-01-30', shift: shiftMorning.id
        }
    ];

    const createdEmployees = [];

    for (const emp of employeesData) {
        const newEmp = await prisma.employee.create({
            data: {
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                password: password,
                role: emp.role,
                department: emp.department,
                position: emp.position,
                salary: encryptSalary(emp.salary),
                identityCard: emp.idCard,
                birthDate: new Date(emp.birth),
                address: 'Quito, Ecuador',
                phone: '0900000000',
                hireDate: new Date('2023-01-01'),
                contractType: 'Indefinido',
                civilStatus: 'Soltero'
            }
        });
        createdEmployees.push(newEmp);

        // Contrato
        await prisma.contract.create({
            data: {
                employeeId: newEmp.id,
                type: 'Indefinido',
                startDate: new Date('2023-01-01'),
                salary: emp.salary,
                status: 'Active'
            }
        });

        // Horario
        await prisma.employeeSchedule.create({
            data: {
                employeeId: newEmp.id,
                shiftId: emp.shift,
                startDate: new Date(),
                daysOfWeek: JSON.stringify(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"])
            }
        });

        // Skills (Aleatorio)
        await prisma.skill.createMany({
            data: [
                { employeeId: newEmp.id, name: 'Trabajo en Equipo', level: 'Advanced' },
                { employeeId: newEmp.id, name: 'Comunicación', level: 'Intermediate' }
            ]
        });
    }

    console.log(`👥 ${createdEmployees.length} empleados creados con Contratos, Horarios y Skills.`);

    // 4. Asistencia (Último mes)
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    console.log('⏳ Generando asistencia...');

    for (const emp of createdEmployees) {
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();

            if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Fin de semana

            // Simulación realista
            const rand = Math.random();
            let status = 'Presente';
            let checkIn = new Date(year, month, day, 8, 0, 0);
            let checkOut = new Date(year, month, day, 17, 0, 0);
            let workedHours = 8;

            if (emp.role === 'admin') continue; // Admin a veces no marca o es perfecto, saltamos para variar.

            // 5% Falta
            if (rand < 0.05) {
                status = 'Falta';
                // Crear Absence Request si es falta
                if (Math.random() > 0.5) { // 50% justificada
                    await prisma.attendance.create({
                        data: {
                            employeeId: emp.id,
                            date: date,
                            checkIn: new Date(year, month, day, 0, 0, 0), // Dummy required
                            checkOut: null,
                            status: 'Falta',
                            workedHours: 0
                        }
                    });

                    await prisma.absenceRequest.create({
                        data: {
                            employeeId: emp.id,
                            type: 'Enfermedad',
                            startDate: date,
                            endDate: date,
                            reason: 'Gripe estacional',
                            status: 'APPROVED'
                        }
                    });
                } else {
                    await prisma.attendance.create({
                        data: {
                            employeeId: emp.id,
                            date: date,
                            checkIn: new Date(year, month, day, 0, 0, 0),
                            checkOut: null,
                            status: 'Falta',
                            workedHours: 0
                        }
                    });
                }
                continue;
            }

            // 15% Atraso
            if (rand < 0.20 && rand >= 0.05) {
                status = 'Atraso';
                const delayMinutes = Math.floor(Math.random() * 60);
                checkIn = new Date(year, month, day, 8, delayMinutes, 0);
                workedHours = 8 - (delayMinutes / 60);
            }

            // 10% Horas Extra
            if (rand > 0.90) {
                const extraHours = Math.floor(Math.random() * 3) + 1;
                checkOut = new Date(year, month, day, 17 + extraHours, 0, 0);
                workedHours = 8 + extraHours;
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
    }

    console.log('✅ Asistencia Generada.');

    // 5. Configuración Nómina
    await prisma.payrollConfig.create({
        data: {
            workingDays: 30,
            currency: 'USD',
            isActive: true,
            items: {
                create: [
                    { name: 'Aporte IESS', type: 'DEDUCTION', isMandatory: true, percentage: 9.45 },
                    { name: 'Impuesto Renta', type: 'DEDUCTION', isMandatory: false, fixedValue: 0 }, // Placeholder
                    { name: 'Bono Transporte', type: 'EARNING', isMandatory: false, fixedValue: 25.00 }
                ]
            }
        }
    });

    console.log('✅ Configuración de Nómina lista.');
    console.log('🚀 SEED COMPLETADO EXITOSAMENTE');
    console.log('Usuarios para login: admin@emplifi.com / 123456');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
