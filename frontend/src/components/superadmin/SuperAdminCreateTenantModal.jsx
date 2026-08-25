import { useState } from 'react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import Modal from '../common/Modal.jsx';

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/api/superadmin/tenants', formData);
            if (res.data.success) {
                toast.success('Empresa y administrador creados exitosamente');
                onSuccess();
                onClose();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al crear la empresa');
        } finally {
            setLoading(false);
        }
    };

    const field = (label, inputProps) => (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
                {...inputProps}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-400 placeholder:text-gray-300"
            />
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Registrar nueva empresa"
            subtitle="Backoffice · Alta directa"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
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
        </Modal>
    );
}
