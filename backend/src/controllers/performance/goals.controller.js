import prisma from '../../database/db.js';

const getActualEmployeeId = async (user) => {
    const directId = user.employeeId || user.id;
    const emp = await prisma.employee.findFirst({
        where: {
            OR: [
                ...(directId ? [{ id: directId }] : []),
                ...(user.email ? [{ email: user.email }] : [])
            ],
            ...(user.tenantId ? { tenantId: user.tenantId } : {})
        },
        select: { id: true }
    });
    return emp ? emp.id : directId;
};

export const createGoal = async (req, res) => {
    try {
        const { title, description, metric, targetValue, unit, deadline, priority } = req.body;
        const employeeId = await getActualEmployeeId(req.user);

        if (!title || !metric || !targetValue || !deadline) {
            return res.status(400).json({ message: "Faltan campos obligatorios para definir un objetivo SMART." });
        }

        const goal = await prisma.employeeGoal.create({
            data: {
                employeeId,
                title: title.trim(),
                description: description ? description.trim() : null,
                metric: metric.trim(),
                targetValue: parseFloat(targetValue),
                unit: unit || '%',
                deadline: new Date(deadline),
                priority: priority || 'MEDIUM',
                status: 'PENDING',
                progress: 0,
                currentValue: 0
            }
        });

        res.status(201).json(goal);
    } catch (error) {
        console.error("Error creating goal:", error);
        res.status(500).json({ message: "Error al crear el objetivo" });
    }
};

export const getMyGoals = async (req, res) => {
    try {
        const employeeId = await getActualEmployeeId(req.user);
        const goals = await prisma.employeeGoal.findMany({
            where: { employeeId },
            orderBy: { deadline: 'asc' }
        });
        res.json(goals);
    } catch (error) {
        console.error("Error fetching goals:", error);
        res.status(500).json({ message: "Error al obtener objetivos" });
    }
};

export const updateGoalProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentValue, status } = req.body;
        const employeeId = await getActualEmployeeId(req.user);
        const isAdminOrHR = ['admin', 'hr', 'superadmin'].includes(req.user.role);

        const goal = await prisma.employeeGoal.findUnique({ where: { id } });
        if (!goal) return res.status(404).json({ message: "Objetivo no encontrado" });
        if (goal.employeeId !== employeeId && !isAdminOrHR) {
            return res.status(403).json({ message: "No tienes permiso para actualizar este objetivo" });
        }

        const newVal = parseFloat(currentValue);
        const validNewVal = isNaN(newVal) ? 0 : newVal;
        const target = parseFloat(goal.targetValue);

        let newProgress = 0;
        if (!isNaN(target) && target > 0) {
            newProgress = Math.max(0, Math.min(100, parseFloat(((validNewVal / target) * 100).toFixed(2))));
        } else if (validNewVal >= target && target <= 0) {
            newProgress = 100;
        }

        let newStatus = status || goal.status;
        if (newProgress >= 100) newStatus = 'COMPLETED';
        else if (newProgress > 0 && newStatus === 'PENDING') newStatus = 'IN_PROGRESS';

        const updatedGoal = await prisma.employeeGoal.update({
            where: { id },
            data: {
                currentValue: validNewVal,
                progress: newProgress,
                status: newStatus
            }
        });

        res.json(updatedGoal);
    } catch (error) {
        console.error("Error updating goal:", error);
        res.status(500).json({ message: "Error al actualizar progreso" });
    }
};

export const deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = await getActualEmployeeId(req.user);
        const isAdminOrHR = ['admin', 'hr', 'superadmin'].includes(req.user.role);

        const goal = await prisma.employeeGoal.findUnique({ where: { id } });
        if (!goal) return res.status(404).json({ message: "Objetivo no encontrado" });
        if (goal.employeeId !== employeeId && !isAdminOrHR) {
            return res.status(403).json({ message: "No tienes permiso para eliminar este objetivo" });
        }

        await prisma.employeeGoal.delete({ where: { id } });

        res.json({ success: true, message: "Objetivo eliminado correctamente" });
    } catch (error) {
        console.error("Error deleting goal:", error);
        res.status(500).json({ message: "Error al eliminar objetivo" });
    }
};
