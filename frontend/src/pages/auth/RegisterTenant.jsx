import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBriefcase, FiMail, FiLock, FiUser, FiPhone, FiCheck, FiArrowRight, FiShield } from 'react-icons/fi';
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

            toast.success('¡Empresa registrada con éxito! Prueba gratis de 14 días activa.');

            // Guardar sesión y redirigir
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
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link to="/" className="inline-block mb-4">
                    <img src={logoEmplifi} alt="EMPLIFI" className="h-12 w-auto mx-auto object-contain bg-white/10 p-2 rounded-xl" />
                </Link>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                    Registra tu Empresa en EMPLIFI
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                    Comienza tu prueba gratuita de 14 días. Sin tarjeta de crédito requerida.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/60 sm:px-10"
                >
                    {/* Stepper Header */}
                    <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
                        <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
                            <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs border border-blue-500/40">1</span>
                            <span className="text-sm">Datos de la Empresa</span>
                        </div>
                        <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
                            <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs border border-blue-500/40">2</span>
                            <span className="text-sm">Administrador Principal</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                        Nombre Comercial de la Empresa *
                                    </label>
                                    <div className="relative">
                                        <FiBriefcase className="absolute left-3.5 top-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            name="companyName"
                                            required
                                            placeholder="Ej: Servisecurity S.A."
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                            RUC Ecuatoriano (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            name="ruc"
                                            maxLength={13}
                                            placeholder="1792345678001"
                                            value={formData.ruc}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                            Plan Inicial
                                        </label>
                                        <select
                                            name="plan"
                                            value={formData.plan}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        >
                                            <option value="ESSENTIAL">Plan Essential (Hasta 25 empl.)</option>
                                            <option value="GROWTH">Plan Growth (Hasta 100 empl.)</option>
                                            <option value="ENTERPRISE">Plan Enterprise (Ilimitado)</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!formData.companyName.trim()) {
                                            toast.error('Ingresa el nombre de tu empresa');
                                            return;
                                        }
                                        setStep(2);
                                    }}
                                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm transition-all"
                                >
                                    Siguiente: Crear Cuenta Administrador <FiArrowRight />
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nombre *</label>
                                        <div className="relative">
                                            <FiUser className="absolute left-3.5 top-3.5 text-slate-400" />
                                            <input
                                                type="text"
                                                name="adminFirstName"
                                                required
                                                placeholder="Juan"
                                                value={formData.adminFirstName}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Apellido *</label>
                                        <input
                                            type="text"
                                            name="adminLastName"
                                            required
                                            placeholder="Pérez"
                                            value={formData.adminLastName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Correo Corporativo *</label>
                                    <div className="relative">
                                        <FiMail className="absolute left-3.5 top-3.5 text-slate-400" />
                                        <input
                                            type="email"
                                            name="adminEmail"
                                            required
                                            placeholder="admin@tuempresa.com"
                                            value={formData.adminEmail}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Contraseña *</label>
                                        <div className="relative">
                                            <FiLock className="absolute left-3.5 top-3.5 text-slate-400" />
                                            <input
                                                type="password"
                                                name="adminPassword"
                                                required
                                                minLength={6}
                                                placeholder="••••••••"
                                                value={formData.adminPassword}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Teléfono Movil</label>
                                        <div className="relative">
                                            <FiPhone className="absolute left-3.5 top-3.5 text-slate-400" />
                                            <input
                                                type="text"
                                                name="adminPhone"
                                                placeholder="0991234567"
                                                value={formData.adminPhone}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-1/3 py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-sm transition-all"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-2/3 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm transition-all"
                                    >
                                        {loading ? 'Creando Empresa...' : 'Completar Registro'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </form>

                    <div className="mt-6 text-center pt-4 border-t border-slate-700/60">
                        <span className="text-xs text-slate-400">¿Ya tienes una cuenta de empresa? </span>
                        <Link to="/login" className="text-xs text-blue-400 font-semibold hover:underline">
                            Iniciar Sesión
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
