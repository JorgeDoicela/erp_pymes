import prisma from '../../database/db.js';

export const getInterviews = async (req, res) => {
    try {
        const { id } = req.params;
        const interviews = await prisma.entrepreneurshipInterview.findMany({
            where: { projectId: id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(interviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addInterview = async (req, res) => {
    try {
        const { projectId, customerName, feedback, sentiment, insights } = req.body;
        const interview = await prisma.entrepreneurshipInterview.create({
            data: {
                projectId,
                customerName,
                feedback,
                sentiment,
                insights
            }
        });
        res.status(201).json(interview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { customerName, feedback, sentiment, insights } = req.body;
        const interview = await prisma.entrepreneurshipInterview.update({
            where: { id },
            data: {
                customerName,
                feedback,
                sentiment,
                insights
            }
        });
        res.json(interview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteInterview = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.entrepreneurshipInterview.delete({
            where: { id }
        });
        res.json({ message: 'Entrevista eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateMarketSize = async (req, res) => {
    try {
        const { projectId, tam, sam, som } = req.body;
        const market = await prisma.entrepreneurshipTargetMarket.upsert({
            where: { projectId },
            update: {
                tam: parseFloat(tam),
                sam: parseFloat(sam),
                som: parseFloat(som)
            },
            create: {
                projectId,
                tam: parseFloat(tam),
                sam: parseFloat(sam),
                som: parseFloat(som)
            }
        });
        res.json(market);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
