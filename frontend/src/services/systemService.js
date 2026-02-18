import api from '../api/axios';

const getSettings = async () => {
    try {
        const response = await api.get('/system/settings');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const updateSettings = async (data) => {
    try {
        const response = await api.put('/system/settings', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const getBiometricSetting = async () => {
    try {
        const response = await api.get('/system/biometric-setting');
        return response.data;
    } catch (error) {
        return { success: true, biometricEnabled: false };
    }
};

export default { getSettings, updateSettings, getBiometricSetting };
