import { useState } from 'react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';

export default function SuperAdminCreateTenantModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        companyName: '',
        slug: '',
        ruc: '',
        plan: 'ESSENTIAL',
        maxEmployees: 50,
        adminFirstName: '',
        adminLastName: '',
        adminEmail: '',
        adminPassword: ''
    });

    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/superadmin/tenants', formData);
            if (res.data.success) {
                toast.success(res.data.message || 'Empresa creada exitosamente');
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al crear empresa');
        } finally {
            setLoading(false);
        }
    };

    const field = (label, props, hint) => (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
                {...props}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors"
            />
            {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded max-w-xl w-full overflow-hidden shadow-xl">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Backoffice · Alta directa</p>
                        <h2 className="text-base font-semibold text-gray-900 mt-0.5">Registrar nueva empresa</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
                    {/* Sección 1 */}
                    <div className="space-y-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100">
                            1. Datos de la empresa
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {field('Nombre de la empresa *', {
                                type: 'text', required: true,
                                placeholder: 'Ej: CorpAcme S.A.',
                                value: formData.companyName,
                                onChange: (e) => setFormData({ ...formData, companyName: e.target.value })
                            })}
                            {field('RUC / Identificador fiscal', {
                                type: 'text',
                                placeholder: 'Ej: 1790011223001',
                                value: formData.ruc,
                                onChange: (e) => setFormData({ ...formData, ruc: e.target.value })
                            })}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Plan inicial</label>
                                <select
                                    value={formData.plan}
                                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-400 cursor-pointer"
                                >
                                    <option value="ESSENTIAL">ESSENTIAL · $0.50/emp</option>
                                    <option value="GROWTH">GROWTH · $1.00/emp</option>
                                    <option value="ENTERPRISE">ENTERPRISE · $2.00/emp</option>
                                </select>
                            </div>
                            {field('Capacidad máxima de licencias', {
                                type: 'number', min: '5', max: '1000',
                                value: formData.maxEmployees,
                                onChange: (e) => setFormData({ ...formData, maxEmployees: e.target.value })
                            })}
                        </div>
                    </div>

                    {/* Sección 2 */}
                    <div className="space-y-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100">
                            2. Administrador principal
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {field('Nombre *', {
                                type: 'text', required: true,
                                placeholder: 'Ej: Carlos',
                                value: formData.adminFirstName,
                                onChange: (e) => setFormData({ ...formData, adminFirstName: e.target.value })
                            })}
                            {field('Apellido *', {
                                type: 'text', required: true,
                                placeholder: 'Ej: Pérez',
                                value: formData.adminLastName,
                                onChange: (e) => setFormData({ ...formData, adminLastName: e.target.value })
                            })}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {field('Correo electrónico *', {
                                type: 'email', required: true,
                                placeholder: 'admin@empresa.com',
                                value: formData.adminEmail,
                                onChange: (e) => setFormData({ ...formData, adminEmail: e.target.value })
                            })}
                            {field('Contraseña inicial *', {
                                type: 'password', required: true,
                                placeholder: '••••••••',
                                value: formData.adminPassword,
                                onChange: (e) => setFormData({ ...formData, adminPassword: e.target.value })
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 text-gray-600 hover:border-gray-300 text-xs font-medium rounded transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'Creando empresa...' : 'Crear empresa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
