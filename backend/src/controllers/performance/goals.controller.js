import prisma from '../../database/db.js';

export const createGoal = async (req, res) => {
    try {
        const { title, description, metric, targetValue, unit, deadline, priority } = req.body;
        const userId = req.user.id;

        // Validation (Simple SMART check)
        if (!title || !metric || !targetValue || !deadline) {
            return res.status(400).json({ message: "Faltan campos obligatorios para definir un objetivo SMART." });
        }

        const goal = await prisma.employeeGoal.create({
            data: {
                employeeId: userId,
                title,
                description,
                metric,
                targetValue: parseFloat(targetValue),
                unit,
                deadline: new Date(deadline),
                priority,
                status: 'PENDING',
                progress: 0
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
        const userId = req.user.id;
        const goals = await prisma.employeeGoal.findMany({
            where: { employeeId: userId },
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
        const userId = req.user.id;

        const goal = await prisma.employeeGoal.findUnique({ where: { id } });

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
        const userId = req.user.id;

        await prisma.employeeGoal.deleteMany({
            where: { id, employeeId: userId }
        }); // deleteMany ensures ownership check implicitly via where clause safety logic usually, but unique ID is global. findFirst is safer.

        // Better pattern:
        const goal = await prisma.employeeGoal.findUnique({ where: { id } });
        if (!goal) return res.status(404).json({ message: "Not found" });
        if (goal.employeeId !== userId) return res.status(403).json({ message: "Forbidden" });

        await prisma.employeeGoal.delete({ where: { id } });

        res.json({ message: "Objetivo eliminado" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar" });
    }
};
