import prisma from '../../database/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encrypt } from '../../utils/encryption.js';

/**
 * Registro público de una nueva empresa (Onboarding SaaS)
 * Crea el Tenant y el primer usuario Administrador de la empresa.
 */
export const registerTenant = async (req, res) => {
    try {
        const {
            companyName,
            slug: slugRaw,
            ruc,
            adminFirstName,
            adminLastName,
            adminEmail,
            adminPassword,
            adminPhone,
            plan = 'ESSENTIAL'
        } = req.body;

        if (!companyName || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
            return res.status(400).json({
                success: false,
                message: 'Nombre de empresa, datos del administrador (nombre, correo y contraseña) son requeridos.'
            });
        }

        // Generar slug normalizado (máximo 50 caracteres)
        const slug = (slugRaw || companyName)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 50);

        // Verificar unicidad de Slug, RUC o Correo de Admin
        const existingTenant = await prisma.tenant.findFirst({
            where: {
                OR: [
                    { slug },
                    ...(ruc ? [{ ruc }] : [])
                ]
            }
        });

        if (existingTenant) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una empresa registrada con ese nombre/slug o RUC.'
            });
        }

        const existingUser = await prisma.employee.findUnique({
            where: { email: adminEmail }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado en el sistema.'
            });
        }

        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const trialDays = 14;
        const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

        // Crear Tenant y Admin en una transacción atómica
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: companyName,
                    slug,
                    ruc: ruc || null,
                    plan: plan.toUpperCase(),
                    subscriptionStatus: 'TRIAL',
                    trialEndsAt,
                    maxEmployees: plan.toUpperCase() === 'ESSENTIAL' ? 25 : 100
                }
            });

            // Crear SystemSetting inicial para el Tenant
            await tx.systemSetting.create({
                data: {
                    tenantId: tenant.id,
                    maintenanceMode: false,
                    biometricEnabled: false
                }
            });

            // Crear Admin de la empresa
            const admin = await tx.employee.create({
                data: {
                    tenantId: tenant.id,
                    firstName: adminFirstName,
                    lastName: adminLastName,
                    email: adminEmail.toLowerCase().trim(),
                    password: passwordHash,
                    role: 'admin',
                    department: 'Dirección',
                    position: 'Administrador General',
                    salary: encrypt('0'),
                    identityCard: `ADM-${Date.now().toString().slice(-7)}`,
                    birthDate: new Date('1990-01-01'),
                    hireDate: new Date(),
                    address: 'Matriz Principal',
                    phone: adminPhone || '0999999999',
                    civilStatus: 'Soltero',
                    contractType: 'Indefinido',
                    vacationDays: 15
                }
            });

            return { tenant, admin };
        });

        // Generar JWT Token para el nuevo Admin
        const token = jwt.sign(
            { id: result.admin.id, role: result.admin.role, tenantId: result.tenant.id },
            process.env.JWT_SECRET || 'secret_key_change_me',
            { expiresIn: '1d' }
        );

        res.status(201).json({
            success: true,
            message: 'Empresa registrada exitosamente. Período de prueba de 14 días activado.',
            data: {
                tenant: {
                    id: result.tenant.id,
                    name: result.tenant.name,
                    slug: result.tenant.slug,
                    plan: result.tenant.plan,
                    subscriptionStatus: result.tenant.subscriptionStatus,
                    trialEndsAt: result.tenant.trialEndsAt
                },
                user: {
                    id: result.admin.id,
                    firstName: result.admin.firstName,
                    lastName: result.admin.lastName,
                    email: result.admin.email,
                    role: result.admin.role
                },
                token
            }
        });
    } catch (error) {
        console.error('[REGISTER TENANT ERROR]:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar la empresa: ' + error.message
        });
    }
};

/**
 * Obtener perfil de la empresa actual del usuario autenticado
 */
export const getMyTenant = async (req, res) => {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: req.tenantId },
            include: {
                _count: {
                    select: { employees: true }
                }
            }
        });

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        }

        res.json({
            success: true,
            data: tenant
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Actualizar configuración/perfil de la empresa
 */
export const updateMyTenant = async (req, res) => {
    try {
        const { name, ruc } = req.body;

        const updated = await prisma.tenant.update({
            where: { id: req.tenantId },
            data: {
                ...(name ? { name } : {}),
                ...(ruc !== undefined ? { ruc } : {})
            }
        });

        res.json({
            success: true,
            message: 'Empresa actualizada exitosamente',
            data: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
