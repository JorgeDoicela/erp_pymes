import React, { useState } from 'react';
import { FiDownload, FiFileText, FiGrid, FiActivity } from 'react-icons/fi';

const ExportButtons = ({ type, id, fileName = 'export' }) => {
    const [loading, setLoading] = useState(false);

    const handleExport = async (format) => {
        setLoading(true);
        try {
            let url = '';
            let extension = '';

            if (type === 'employees' && format === 'excel') {
                url = '/export/employees/excel';
                extension = 'xlsx';
            } else if (type === 'payroll_csv') {
                url = `/export/payroll/${id}/csv`;
                extension = 'csv';
            } else if (type === 'paystub' && format === 'pdf') {
                url = `/export/paystub/${id}/pdf`;
                extension = 'pdf';
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Error en la descarga');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `${fileName}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('No se pudo generar el archivo. Por favor, intente más tarde.');
        } finally {
            setLoading(false);
        }
    };

    if (type === 'paystub') {
        return (
            <button
                onClick={() => handleExport('pdf')}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-colors text-xs font-medium border border-indigo-500/30"
            >
                {loading ? <FiActivity className="animate-spin" /> : <FiFileText />}
                Descargar PDF
            </button>
        );
    }

    return (
        <div className="flex gap-2">
            {type === 'employees' && (
                <button
                    onClick={() => handleExport('excel')}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-green-900/20"
                >
                    {loading ? <FiActivity className="animate-spin" /> : <FiGrid />}
                    Exportar Excel
                </button>
            )}
            {type === 'payroll_csv' && (
                <button
                    onClick={() => handleExport('csv')}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium border border-white/10"
                >
                    {loading ? <FiActivity className="animate-spin" /> : <FiDownload />}
                    Exportar CSV (Contabilidad)
                </button>
            )}
        </div>
    );
};

export default ExportButtons;
