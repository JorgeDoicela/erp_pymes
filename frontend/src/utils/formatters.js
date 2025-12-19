export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', { // Or user's locale
        style: 'currency',
        currency: 'COP', // Or relevant currency
        minimumFractionDigits: 0
    }).format(amount);
};

export const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};
