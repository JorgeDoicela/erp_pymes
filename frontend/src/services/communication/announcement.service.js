import api from '../../api/axios';

export const getAnnouncements = async (params = {}) => {
    try {
        const response = await api.get('/announcements', { params });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar comunicados');
    }
};

export const createAnnouncement = async (data) => {
    try {
        const response = await api.post('/announcements', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al publicar comunicado');
    }
};

export const markAnnouncementReadOrAcknowledge = async (id, acknowledge = false) => {
    try {
        const response = await api.post(`/announcements/${id}/read`, { acknowledge });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al registrar acuse de recibo');
    }
};

export const getAnnouncementStats = async (id) => {
    try {
        const response = await api.get(`/announcements/${id}/stats`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar métricas de lectura');
    }
};

export const getBirthdays = async () => {
    try {
        const response = await api.get('/announcements/birthdays');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al cargar cumpleaños del mes');
    }
};
