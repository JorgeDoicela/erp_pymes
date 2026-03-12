import prisma from '../../database/db.js';

export const getCapTable = async (req, res) => {
    try {
        const { id } = req.params;
        const equities = await prisma.entrepreneurshipEquity.findMany({
            where: { projectId: id },
            orderBy: { percentage: 'desc' }
        });
        res.json(equities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addEquityHolder = async (req, res) => {
    try {
        const { projectId, holderName, percentage, role, vestingTerms } = req.body;
        const equity = await prisma.entrepreneurshipEquity.create({
            data: {
                projectId,
                holderName,
                percentage: parseFloat(percentage),
                role,
                vestingTerms
            }
        });
        res.status(201).json(equity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateEquityHolder = async (req, res) => {
    try {
        const { id } = req.params;
        const { holderName, percentage, role, vestingTerms } = req.body;
        const equity = await prisma.entrepreneurshipEquity.update({
            where: { id },
            data: {
                holderName,
                percentage: percentage ? parseFloat(percentage) : undefined,
                role,
                vestingTerms
            }
        });
        res.json(equity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteEquityHolder = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.entrepreneurshipEquity.delete({
            where: { id }
        });
        res.json({ message: 'Socio eliminado del CapTable' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFundingRounds = async (req, res) => {
    try {
        const { id } = req.params;
        const rounds = await prisma.entrepreneurshipFundingRound.findMany({
            where: { projectId: id },
            orderBy: { date: 'desc' }
        });
        res.json(rounds);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addFundingRound = async (req, res) => {
    try {
        const { projectId, roundName, amountRaised, valuation, date, investors } = req.body;
        const round = await prisma.entrepreneurshipFundingRound.create({
            data: {
                projectId,
                roundName,
                amountRaised: parseFloat(amountRaised),
                valuation: parseFloat(valuation),
                date: new Date(date),
                investors
            }
        });
        // Actualizar valoración del proyecto automáticamente
        await prisma.entrepreneurship.update({
            where: { id: projectId },
            data: { valuation: parseFloat(valuation) }
        });
        res.status(201).json(round);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateFundingRound = async (req, res) => {
    try {
        const { id } = req.params;
        const { roundName, amountRaised, valuation, date, investors } = req.body;
        const round = await prisma.entrepreneurshipFundingRound.update({
            where: { id },
            data: {
                roundName,
                amountRaised: amountRaised ? parseFloat(amountRaised) : undefined,
                valuation: valuation ? parseFloat(valuation) : undefined,
                date: date ? new Date(date) : undefined,
                investors
            }
        });
        
        if (valuation) {
            await prisma.entrepreneurship.update({
                where: { id: round.projectId },
                data: { valuation: parseFloat(valuation) }
            });
        }

        res.json(round);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteFundingRound = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.entrepreneurshipFundingRound.delete({
            where: { id }
        });
        res.json({ message: 'Ronda de inversión eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
