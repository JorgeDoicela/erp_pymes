import { useState } from 'react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { FiX, FiShield, FiBriefcase, FiUser, FiMail, FiLock, FiCheck } from 'react-icons/fi';

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

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header Modal */}
                <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FiBriefcase className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-lg font-bold">Alta Directa de Empresa (Backoffice)</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b border-slate-100 pb-1">
                            1. Datos de la Empresa (Tenant)
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Empresa *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: CorpAcme S.A."
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">RUC / Identificador Fiscal</label>
                                <input
                                    type="text"
                                    placeholder="Ej: 1790011223001"
                                    value={formData.ruc}
                                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Inicial SaaS</label>
                                <select
                                    value={formData.plan}
                                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                                >
                                    <option value="ESSENTIAL">ESSENTIAL ($1.50/emp)</option>
                                    <option value="GROWTH">GROWTH ($3.00/emp)</option>
                                    <option value="ENTERPRISE">ENTERPRISE ($5.00/emp)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Capacidad Máxima Licencias</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="1000"
                                    value={formData.maxEmployees}
                                    onChange={(e) => setFormData({ ...formData, maxEmployees: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b border-slate-100 pb-1">
                            2. Administrador Principal de la Empresa
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Carlos"
                                    value={formData.adminFirstName}
                                    onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Apellido *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Pérez"
                                    value={formData.adminLastName}
                                    onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico Admin *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="admin@empresa.com"
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña Inicial *</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={formData.adminPassword}
                                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <FiCheck className="w-4 h-4" /> {loading ? 'Creando Empresa...' : 'Crear Empresa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
