import api from '../api/axios';

// ==========================================
// 1. Accounting Periods
// ==========================================
export const getPeriods = async () => {
    const response = await api.get('/accounting/periods');
    return response.data;
};

export const createPeriod = async (data) => {
    const response = await api.post('/accounting/periods', data);
    return response.data;
};

export const togglePeriod = async (id) => {
    const response = await api.patch(`/accounting/periods/${id}/toggle`);
    return response.data;
};

export const deletePeriod = async (id) => {
    const response = await api.delete(`/accounting/periods/${id}`);
    return response.data;
};

// ==========================================
// 2. Chart of Accounts
// ==========================================
export const getAccounts = async () => {
    const response = await api.get('/accounting/accounts');
    return response.data;
};

export const createAccount = async (data) => {
    const response = await api.post('/accounting/accounts', data);
    return response.data;
};

export const updateAccount = async (id, data) => {
    const response = await api.put(`/accounting/accounts/${id}`, data);
    return response.data;
};

export const deleteAccount = async (id) => {
    const response = await api.delete(`/accounting/accounts/${id}`);
    return response.data;
};

// ==========================================
// 3. Cost Centers
// ==========================================
export const getCostCenters = async () => {
    const response = await api.get('/accounting/cost-centers');
    return response.data;
};

export const createCostCenter = async (data) => {
    const response = await api.post('/accounting/cost-centers', data);
    return response.data;
};

export const updateCostCenter = async (id, data) => {
    const response = await api.put(`/accounting/cost-centers/${id}`, data);
    return response.data;
};

export const deleteCostCenter = async (id) => {
    const response = await api.delete(`/accounting/cost-centers/${id}`);
    return response.data;
};

// ==========================================
// 4. Journal Entries
// ==========================================
export const getJournalEntries = async (periodId) => {
    const response = await api.get('/accounting/journals', {
        params: { periodId }
    });
    return response.data;
};

export const createJournalEntry = async (data) => {
    const response = await api.post('/accounting/journals', data);
    return response.data;
};

export const postJournalEntry = async (id) => {
    const res = await api.patch(`/accounting/journals/${id}/post`); // Cambiado a PATCH para coincidir con el backend
    return res.data;
};

export const deleteJournalEntry = async (id) => {
    const res = await api.delete(`/accounting/journals/${id}`);
    return res.data;
};

export const integratePayroll = async (payrollId) => {
    const res = await api.post('/accounting/integrate/payroll', { payrollId });
    return res.data;
};

// ==========================================
// 5. Reports
// ==========================================
export const getTrialBalance = async (periodId) => {
    const response = await api.get('/accounting/reports/trial-balance', {
        params: { periodId }
    });
    return response.data;
};

export const getGeneralLedger = async (accountId, periodId, costCenterId) => {
    const response = await api.get('/accounting/reports/general-ledger', {
        params: { accountId, periodId, costCenterId }
    });
    return response.data;
};
