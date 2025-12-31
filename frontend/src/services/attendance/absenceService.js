import api from '../../api/axios';

const createRequest = async (formData) => {
    try {
        // Important: Let browser set the boundary by not forcing Content-Type
        // But we explicitly tell axios to treat it as multipart
        const response = await api.post('/absences', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const getRequests = async (filters = {}) => {
    try {
        // Convert filters to query string
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/absences?${params}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const getMyRequests = async () => {
    try {
        const response = await api.get('/absences/my-requests');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const updateStatus = async (id, status, adminComment) => {
    try {
        const response = await api.patch(`/absences/${id}/status`, { status, adminComment });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export default {
    createRequest,
    getRequests,
    getMyRequests,
    updateStatus
};
