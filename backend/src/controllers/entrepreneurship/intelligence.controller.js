import * as intelligenceService from '../../services/entrepreneurship/intelligence.js';

export const getProjectAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const [score, financial, recommendedMentors] = await Promise.all([
            intelligenceService.calculateSuccessScore(id),
            intelligenceService.getFinancialAnalysis(id),
            intelligenceService.getMentorRecommendations(id)
        ]);

        res.json({
            successScore: score,
            financialAnalysis: financial,
            recommendedMentors
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
