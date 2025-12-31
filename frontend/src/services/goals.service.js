import api from '../api/axios';

export const getMyGoals = async () => {
    const response = await api.get('/goals');
    return response.data;
};

export const createGoal = async (data) => {
    const response = await api.post('/goals', data);
    return response.data;
};

export const updateGoalProgress = async (id, data) => {
    const response = await api.put(`/goals/${id}/progress`, data);
    return response.data;
};

export const deleteGoal = async (id) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
};
