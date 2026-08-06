import recruitmentRepository from '../../repositories/recruitment/recruitmentRepository.js';
import prisma from '../../database/db.js';
import bcrypt from 'bcryptjs';
import emailService from '../notifications/emailService.js';
import auditRepository from '../../repositories/audit/auditRepository.js';
import { deleteFileFromStorage } from '../storage/blobService.js';

export const recruitmentService = {
    async createVacancy(data, userId, tenantId = null) {
        const { title, description, requirements, location, deadline, salaryMin, salaryMax } = data;

        if (!title || !description || !requirements || !location || !deadline) {
            throw new Error("Faltan campos obligatorios");
        }

        const vacancy = await recruitmentRepository.createVacancy({
            ...data,
            ...(tenantId ? { tenantId } : {}),
            salaryMin: salaryMin ? parseFloat(salaryMin) : null,
            salaryMax: salaryMax ? parseFloat(salaryMax) : null,
            deadline: new Date(deadline),
            status: 'OPEN',
            postedById: userId
        });

        // Audit Log
        auditRepository.createLog({
            entity: 'JobVacancy',
            entityId: vacancy.id,
            action: 'CREATE',
            performedBy: userId,
            details: `Created vacancy: ${title} in ${location}`
        }).catch(err => console.error('Audit Log Error:', err));

        return vacancy;
    },

    async getVacancies(tenantId = null) {
        const where = tenantId ? { OR: [{ tenantId }, { tenantId: null }] } : {};
        return recruitmentRepository.getVacancies(where, {
            postedBy: { select: { firstName: true, lastName: true } }
        });
    },

    async getPublicVacancies() {
        return recruitmentRepository.getVacancies({ status: 'OPEN' });
    },

    async getVacancyById(id) {
        const vacancy = await recruitmentRepository.getVacancyById(id);
        if (!vacancy) throw new Error("Vacante no encontrada");
        return vacancy;
    },

    async updateVacancyStatus(id, status) {
        const vacancy = await recruitmentRepository.updateVacancy(id, { status });
        
        auditRepository.createLog({
            entity: 'JobVacancy',
            entityId: id,
            action: 'UPDATE',
            performedBy: 'Admin',
            details: `Status updated to ${status}`
        }).catch(err => console.error('Audit Log Error:', err));

        return vacancy;
    },

    async deleteVacancy(id, tenantId = null) {
        const vacancy = await recruitmentRepository.getVacancyById(id);
        if (!vacancy) {
            throw new Error("Vacante no encontrada");
        }

        if (tenantId && vacancy.tenantId && vacancy.tenantId !== tenantId) {
            throw new Error("No tienes permisos para eliminar esta vacante");
        }

        // 1. Obtener postulaciones para borrar sus archivos subidos (CVs en PDF)
        const applications = await recruitmentRepository.getApplications({ vacancyId: id });
        for (const app of applications) {
            if (app.resumeUrl) {
                await deleteFileFromStorage(app.resumeUrl).catch(err => console.error("Error eliminando CV:", err));
            }
        }

        // 2. Eliminar vacante (la cascada de Prisma eliminará registros vinculados)
        await recruitmentRepository.deleteVacancy(id);

        // 3. Registrar auditoría
        auditRepository.createLog({
            entity: 'JobVacancy',
            entityId: id,
            action: 'DELETE',
            performedBy: 'Admin',
            details: `Vacante '${vacancy.title}' eliminada junto con ${applications.length} postulaciones y sus archivos`
        }).catch(err => console.error('Audit Log Error:', err));

        return { success: true, message: `Vacante eliminada exitosamente.` };
    },

    async applyToVacancy(id, applicantData, resumeUrl) {
        if (!resumeUrl) {
            throw new Error("El CV es obligatorio (PDF)");
        }

        const { email } = applicantData;
        const existingApplication = await recruitmentRepository.getApplications({
            vacancyId: id,
            email: email
        });

        if (existingApplication.length > 0) {
            throw new Error("Ya te has postulado a esta vacante con este correo electrónico.");
        }

        return recruitmentRepository.createApplication({
            ...applicantData,
            vacancyId: id,
            resumeUrl,
            status: 'PENDING'
        });
    },

    async getApplicationsByVacancy(vacancyId) {
        return recruitmentRepository.getApplications(
            { vacancyId },
            { notes: true }
        );
    },

    async getApplicationDetails(id) {
        const application = await recruitmentRepository.getApplicationById(id, {
            vacancy: true,
            notes: { orderBy: { createdAt: 'desc' } },
            interviews: { orderBy: { date: 'asc' } },
            evaluations: { include: { evaluator: { select: { firstName: true, lastName: true } } } }
        });

        if (!application) throw new Error("Postulación no encontrada");
        return application;
    },

    async updateApplicationStatus(id, status, sendEmail = true) {
        const application = await recruitmentRepository.updateApplication(id, { status });

        // Audit Log
        auditRepository.createLog({
            entity: 'JobApplication',
            entityId: id,
            action: 'UPDATE',
            performedBy: 'HR',
            details: `Application status updated to ${status}`
        }).catch(err => console.error('Audit Log Error:', err));

        // Enviar email si es rechazado y la opción está habilitada
        if (status === 'REJECTED' && sendEmail) {
            try {
                const fullApp = await recruitmentRepository.getApplicationById(id, { vacancy: true });
                if (fullApp) {
                    this._sendRejectionEmail(fullApp).catch(err => console.error("Error sending rejection email:", err));
                }
            } catch (error) {
                console.error("Error fetching application for rejection email:", error);
            }
        }

        return application;
    },

    async deleteCandidate(id) {
        const application = await recruitmentRepository.getApplicationById(id);
        if (!application) {
            throw new Error("Postulación no encontrada");
        }

        if (application.resumeUrl) {
            await deleteFileFromStorage(application.resumeUrl).catch(err => console.error("Error eliminando CV del candidato:", err));
        }

        await recruitmentRepository.deleteApplication(id);

        auditRepository.createLog({
            entity: 'JobApplication',
            entityId: id,
            action: 'DELETE',
            performedBy: 'HR/Admin',
            details: `Candidato ${application.firstName} ${application.lastName} (${application.email}) eliminado junto con sus archivos.`
        }).catch(err => console.error('Audit Log Error:', err));

        return { success: true, message: "Candidato eliminado exitosamente" };
    },

    async addNote(applicationId, content, userId, userName) {
        return recruitmentRepository.createNote({
            applicationId,
            content,
            createdById: userId,
            createdBy: userName
        });
    },

    async scheduleInterview(applicationId, interviewData, interviewerId) {
        const { date, type, location, notes } = interviewData;

        return recruitmentRepository.executeTransaction(async (tx) => {
            const interview = await tx.interview.create({
                data: {
                    applicationId,
                    date: new Date(date),
                    type,
                    location,
                    notes,
                    interviewerId
                }
            });

            await tx.jobApplication.update({
                where: { id: applicationId },
                data: { status: 'INTERVIEW' }
            });

            return interview;
        });
    },

    async evaluateCandidate(applicationId, evaluationData, evaluatorId) {
        return recruitmentRepository.createEvaluation({
            ...evaluationData,
            applicationId,
            evaluatorId
        });
    },

    async hireCandidate(applicationId, hireData) {
        const {
            identityCard, birthDate, address, civilStatus,
            contractType, salary, startDate, closeVacancy, password
        } = hireData;

        const application = await recruitmentRepository.getApplicationById(applicationId, { vacancy: true });
        if (!application) throw new Error("Postulación no encontrada");

        // Validar mayoría de edad (18 años)
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        if (age < 18) {
            throw new Error("El candidato debe ser mayor de 18 años para ser contratado.");
        }

        return recruitmentRepository.executeTransaction(async (tx) => {
            // 1. Update Application Status
            await tx.jobApplication.update({
                where: { id: applicationId },
                data: { status: 'HIRED' }
            });

            // 2. Create Employee
            if (!password || password.length < 8) {
                throw new Error("La contraseña es obligatoria y debe tener al menos 8 caracteres.");
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newEmployee = await tx.employee.create({
                data: {
                    firstName: application.firstName,
                    lastName: application.lastName,
                    email: application.email,
                    phone: application.phone,
                    department: application.vacancy.department,
                    position: application.vacancy.title,
                    identityCard,
                    birthDate: new Date(birthDate),
                    address,
                    civilStatus,
                    contractType,
                    hireDate: new Date(startDate),
                    salary: `ENC:${salary}`, // Mock encryption (kept for compatibility with legacy systems)
                    password: hashedPassword,
                    role: 'employee'
                }
            });

            // 3. Create initial Contract (Critical for payroll system)
            await tx.contract.create({
                data: {
                    employeeId: newEmployee.id,
                    type: contractType,
                    startDate: new Date(startDate),
                    salary: parseFloat(salary),
                    status: 'Active',
                    clauses: 'Contrato generado automáticamente desde proceso de reclutamiento.'
                }
            });

            // 4. Close Vacancy if requested
            if (closeVacancy) {
                await tx.jobVacancy.update({
                    where: { id: application.vacancyId },
                    data: { status: 'CLOSED' }
                });
            }

            // 5. Audit Log (Inside transaction to ensure atomicity with hiring)
            await auditRepository.createLog({
                entity: 'Employee',
                entityId: newEmployee.id,
                action: 'CREATE',
                performedBy: 'System/Recruitment',
                details: `Candidato contratado desde vacante: ${application.vacancy.title}. Contrato: ${contractType}, Salario: ${salary}`
            });

            return newEmployee;
        }).then(async (newEmployee) => {
            // Enviar email de bienvenida fuera de la transacción para no bloquearla
            const shouldSendEmail = hireData.sendEmail !== undefined ? hireData.sendEmail : true;
            if (shouldSendEmail) {
                try {
                    this._sendHiringEmail(application, hireData.startDate).catch(err => console.error("Error sending hiring email:", err));
                } catch (error) {
                    console.error("Error triggering hiring email:", error);
                }
            }
            return newEmployee;
        });
    },

    // Email Helpers
    async _sendHiringEmail(application, startDate) {
        const { firstName, lastName, email, vacancy } = application;
        const name = `${firstName} ${lastName}`;
        const position = vacancy ? vacancy.title : 'nuestro equipo';
        const formattedDate = new Date(startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const loginUrl = process.env.ORIGIN || 'https://recursoshumanos-eight.vercel.app';

        const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; overflow: hidden; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 20px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">¡Bienvenido a nuestro equipo!</h1>
                <p style="margin-top: 10px; opacity: 0.9; font-size: 16px;">Estamos emocionados de tenerte con nosotros</p>
            </div>
            <div style="padding: 40px; color: #1e293b; line-height: 1.8;">
                <p style="font-size: 18px;">Hola <strong>${name}</strong>,</p>
                <p>¡Muchas felicidades! Nos complace informarte que has sido seleccionado(a) para el puesto de <strong>${position}</strong> en <strong>Emplifi</strong>.</p>
                <p>Tu talento y experiencia destacaron entre los candidatos, y estamos convencidos de que harás una contribución valiosa a nuestra organización.</p>
                
                <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #f1f5f9;">
                    <h3 style="margin-top: 0; color: #2563eb; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Detalles de Inicio</h3>
                    <p style="margin-bottom: 5px;"><strong>Fecha de ingreso:</strong> ${formattedDate}</p>
                    <p style="margin-top: 0;"><strong>Acceso:</strong> Utiliza el correo electrónico registrado y la contraseña asignada por el administrador.</p>
                </div>

                <p>Ya puedes acceder al portal de empleados para completar tu perfil y revisar la documentación inicial.</p>
                
                <div style="margin-top: 40px; text-align: center;">
                    <a href="${loginUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);">Acceder al Portal</a>
                </div>
            </div>
            <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; background-color: #f8fafc;">
                © ${new Date().getFullYear()} Emplifi · Plataforma ERP para PYMEs. Todos los derechos reservados.<br>
                Este es un mensaje automático, por favor no respondas a este correo.
            </div>
        </div>
        `;

        return emailService.sendEmail({
            to: email,
            subject: `¡Bienvenido(a) a bordo! - ${position}`,
            html
        });
    },

    async _sendRejectionEmail(application) {
        const { firstName, lastName, email, vacancy } = application;
        const name = `${firstName} ${lastName}`;
        const position = vacancy ? vacancy.title : 'la vacante';

        const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; overflow: hidden;">
            <div style="background-color: #f8fafc; padding: 40px 20px; text-align: center; color: #1e293b; border-bottom: 2px solid #f1f5f9;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #334155;">Actualización de tu postulación</h1>
            </div>
            <div style="padding: 40px; color: #475569; line-height: 1.8;">
                <p style="font-size: 16px;">Hola <strong>${name}</strong>,</p>
                <p>Agradecemos sinceramente el tiempo y el interés que demostraste al postularte para la vacante de <strong>${position}</strong> en <strong>Emplifi</strong>.</p>
                <p>Tras una cuidadosa revisión de todas las candidaturas, queremos informarte que en esta ocasión hemos decidido avanzar con otros perfiles que se alinean más estrechamente con los requerimientos específicos del puesto en este momento.</p>
                <p>Tu perfil es muy valioso y mantendremos tu información en nuestra base de datos para futuras oportunidades que se ajusten a tu experiencia profesional.</p>
                <p style="margin-top: 20px;">Te deseamos mucho éxito en tu búsqueda laboral y en tus futuros proyectos profesionales.</p>
                <p style="margin-top: 30px; font-weight: 600; color: #1e293b;">Atentamente,<br><span style="color: #2563eb;">Equipo de Selección</span><br>Emplifi</p>
            </div>
            <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; background-color: #f8fafc;">
                © ${new Date().getFullYear()} Emplifi · Plataforma ERP para PYMEs. Todos los derechos reservados.
            </div>
        </div>
        `;

        return emailService.sendEmail({
            to: email,
            subject: `Actualización sobre tu postulación - ${position}`,
            html
        });
    }
};

export default recruitmentService;
