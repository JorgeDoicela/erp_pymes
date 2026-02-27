import { useNavigate } from 'react-router-dom';
import {
    FiUser, FiClock, FiCalendar, FiDollarSign, FiClipboard,
    FiTarget, FiHelpCircle, FiBriefcase, FiCheckCircle, FiActivity
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { employeeModules } from '../../constants/modules';

function EmployeeDashboard({ user }) {
    const navigate = useNavigate();

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    // Excluir el item "Dashboard" del grid de módulos (ya estamos en él)
    const displayModules = employeeModules.filter(m => m.path !== '/empleado');

    return (
        <motion.div
            className="space-y-8 max-w-[1600px] mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header Section */}
            <motion.div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4" variants={itemVariants}>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                        {getTimeBasedGreeting()}, {user?.firstName || 'Empleado'}
                    </h2>
                    <p className="text-slate-500">
                        Resumen de actividad del {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/performance/my-evaluations')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center gap-2"
                    >
                        <FiClipboard /> Mis Evaluaciones
                    </motion.button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-8">
                {/* Novedades Section */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row overflow-hidden">
                    <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <FiActivity size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Centro de Actividad</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">Novedades importantes de tu portal personal.</p>
                        <button
                            onClick={() => navigate('/performance/my-evaluations')}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                        >
                            Ver Evaluaciones <span className="text-lg">→</span>
                        </button>
                    </div>
                    <div className="p-6 md:w-2/3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div
                                onClick={() => navigate('/performance/my-evaluations')}
                                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer group"
                            >
                                <div className="mt-1 text-slate-400 group-hover:text-blue-600 transition-colors">
                                    <FiClipboard className="text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">Nueva Evaluación Pendiente</p>
                                    <span className="text-xs font-medium text-slate-400 group-hover:text-blue-500 mt-1 block">Ver detalle</span>
                                </div>
                            </div>
                            <div
                                onClick={() => navigate('/my-payments')}
                                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer group"
                            >
                                <div className="mt-1 text-slate-400 group-hover:text-blue-600 transition-colors">
                                    <FiCheckCircle className="text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">Nómina del mes depositada</p>
                                    <span className="text-xs font-medium text-slate-400 group-hover:text-blue-500 mt-1 block">Ver detalle</span>
                                </div>
                            </div>
                            <div
                                onClick={() => navigate('/empleado/asistencia')}
                                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer group"
                            >
                                <div className="mt-1 text-slate-400 group-hover:text-blue-600 transition-colors">
                                    <FiClock className="text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">Registrar asistencia de hoy</p>
                                    <span className="text-xs font-medium text-slate-400 group-hover:text-blue-500 mt-1 block">Registrar ahora</span>
                                </div>
                            </div>
                            <div
                                onClick={() => navigate('/performance/goals')}
                                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer group"
                            >
                                <div className="mt-1 text-slate-400 group-hover:text-blue-600 transition-colors">
                                    <FiTarget className="text-cyan-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">Actualiza tus objetivos SMART</p>
                                    <span className="text-xs font-medium text-slate-400 group-hover:text-blue-500 mt-1 block">Ver objetivos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Modules Grid */}
                <motion.section variants={itemVariants}>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                        <FiBriefcase className="text-slate-400" />
                        Mi Portal
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        {displayModules.map((mod, idx) => (
                            <motion.button
                                key={idx}
                                variants={itemVariants}
                                whileHover={{ y: -5 }}
                                onClick={() => navigate(mod.path)}
                                className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-400 transition-all duration-200 group h-40 text-center relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="p-3 rounded-xl bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mb-3 relative z-10 duration-200">
                                    <span className="text-2xl">{mod.icon}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 relative z-10">{mod.title}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.section>
            </div>
        </motion.div>
    );
}

export default EmployeeDashboard;
