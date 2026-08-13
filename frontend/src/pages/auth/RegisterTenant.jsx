import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBriefcase, FiMail, FiLock, FiUser, FiPhone, FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import logoEmplifi from '../../assets/images/logo_emplifi.png';
import api from '../../api/axios';

export default function RegisterTenant() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        companyName: '',
        slug: '',
        ruc: '',
        plan: 'ESSENTIAL',
        adminFirstName: '',
        adminLastName: '',
        adminEmail: '',
        adminPassword: '',
        adminPhone: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'companyName' && !prev.slug ? {
                slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            } : {})
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/tenants/register', formData);
            const data = response.data;

            if (!data.success) {
                throw new Error(data.message || 'Error al registrar la empresa');
            }

            toast.success('Empresa registrada con éxito. Prueba de 45 días activa.');

            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                localStorage.setItem('tenant', JSON.stringify(data.data.tenant));
                window.location.href = '/admin';
            } else {
                navigate('/login');
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || 'Fallo en el registro de empresa';
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#f9fafb] text-[#374151] p-4 font-sans antialiased">
            <div className="w-full max-w-lg">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-center mb-6"
                >
                    <Link to="/" className="inline-block mb-3">
                        <img src={logoEmplifi} alt="EMPLIFI ERP" className="h-9 w-auto object-contain mx-auto" />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                        Registro de Empresa ERP
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Active su prueba gratuita de 45 días sin necesidad de tarjeta de crédito
                    </p>
                </motion.div>

                {/* Main Card */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded border border-[#e5e7eb] p-6 sm:p-7 shadow-none"
                >
                    {/* Stepper Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                        <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-semibold ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                1
                            </span>
                            <span className={`text-xs font-medium ${step === 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                                Datos de la Empresa
                            </span>
                        </div>
                        <div className="h-[1px] bg-gray-200 flex-1 mx-4"></div>
                        <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-semibold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                2
                            </span>
                            <span className={`text-xs font-medium ${step === 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                                Administrador Principal
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Nombre Comercial de la Empresa <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            name="companyName"
                                            required
                                            placeholder="Ej: Servisecurity S.A."
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors"
                                        />
                                    </div>
                                    {formData.slug && (
                                        <span className="text-[11px] text-gray-400 mt-1 block font-mono">
                                            Identificador interno: {formData.slug}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            RUC Ecuatoriano (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            name="ruc"
                                            maxLength={13}
                                            placeholder="1792345678001"
                                            value={formData.ruc}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-900 font-mono tabular-nums placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Plan Inicial ERP
                                        </label>
                                        <select
                                            name="plan"
                                            value={formData.plan}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors cursor-pointer"
                                        >
                                            <option value="ESSENTIAL">Plan Essential (Hasta 25 empl.)</option>
                                            <option value="GROWTH">Plan Growth (Hasta 100 empl.)</option>
                                            <option value="ENTERPRISE">Plan Enterprise (Ilimitado)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!formData.companyName.trim()) {
                                                toast.error('Ingrese el nombre de su empresa para continuar');
                                                return;
                                            }
                                            setStep(2);
                                        }}
                                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <span>Continuar al Paso 2</span>
                                        <FiArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Nombres del Admin <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                name="adminFirstName"
                                                required
                                                placeholder="Ej: Juan"
                                                value={formData.adminFirstName}
                                                onChange={handleChange}
                                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Apellidos del Admin <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="adminLastName"
                                            required
                                            placeholder="Ej: Pérez"
                                            value={formData.adminLastName}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Correo Corporativo <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="email"
                                            name="adminEmail"
                                            required
                                            placeholder="admin@tuempresa.com"
                                            value={formData.adminEmail}
                                            onChange={handleChange}
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Contraseña de Acceso <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="password"
                                                name="adminPassword"
                                                required
                                                minLength={6}
                                                placeholder="••••••••"
                                                value={formData.adminPassword}
                                                onChange={handleChange}
                                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Teléfono de Contacto
                                        </label>
                                        <div className="relative">
                                            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                name="adminPhone"
                                                placeholder="0991234567"
                                                value={formData.adminPhone}
                                                onChange={handleChange}
                                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-900 font-mono tabular-nums placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-1/3 py-2 px-3 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <FiArrowLeft className="w-3.5 h-3.5" />
                                        <span>Atrás</span>
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-2/3 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Procesando...
                                            </span>
                                        ) : (
                                            <>
                                                <FiCheck className="w-3.5 h-3.5" />
                                                <span>Completar Registro</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </form>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-500">¿Ya tiene una cuenta registrada?</span>
                        <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                            Iniciar Sesión
                        </Link>
                    </div>
                </motion.section>
            </div>
        </main>
    );
}

