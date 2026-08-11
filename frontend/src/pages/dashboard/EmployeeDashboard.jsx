import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiUser, FiClock, FiCalendar, FiDollarSign, FiClipboard,
    FiTarget, FiHelpCircle, FiBriefcase, FiCheckCircle, FiActivity,
    FiFileText, FiFolder, FiSend, FiVolume2
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getSectionsByRole } from '../../constants/modules';
import api from '../../api/axios';

function EmployeeDashboard({ user }) {
    const navigate = useNavigate();

    const [employeeMetrics, setEmployeeMetrics] = useState({
        vacationDays: user?.vacationDays || 15,
        todayAttendance: null,
        pendingAbsencesCount: 0,
        pendingEvaluationsCount: 0
    });
    const [loadingMetrics, setLoadingMetrics] = useState(true);

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
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
    };

    const sections = getSectionsByRole(user);

    useEffect(() => {
        const fetchEmployeeData = async () => {
            setLoadingMetrics(true);
            try {
                const [evalsRes, absencesRes] = await Promise.allSettled([
                    import('../../services/evaluation.service').then(m => m.getMyPendingEvaluations()),
                    api.get('/attendance/my-absences')
                ]);

                let pendingEvaluationsCount = 0;
                let pendingAbsencesCount = 0;

                if (evalsRes.status === 'fulfilled' && Array.isArray(evalsRes.value)) {
                    pendingEvaluationsCount = evalsRes.value.filter(e => e.status !== 'COMPLETED').length;
                }

                if (absencesRes.status === 'fulfilled' && absencesRes.value.data) {
                    const absList = absencesRes.value.data.data || absencesRes.value.data;
                    if (Array.isArray(absList)) {
                        pendingAbsencesCount = absList.filter(a => a.status === 'PENDING').length;
                    }
                }

                setEmployeeMetrics({
                    vacationDays: user?.vacationDays || 15,
                    pendingAbsencesCount,
                    pendingEvaluationsCount
                });
            } catch (error) {
                console.error('Error fetching employee dashboard stats:', error);
            } finally {
                setLoadingMetrics(false);
            }
        };

        fetchEmployeeData();
    }, [user]);

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            <motion.div
                className="space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header Bienvenida Personal */}
                <motion.div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs" variants={itemVariants}>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
                            <FiUser className="w-4 h-4" /> Portal de Autogestión del Empleado
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {getTimeBasedGreeting()}, {user?.firstName || 'Empleado'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Puesto: <span className="font-semibold text-slate-700">{user?.position || 'Colaborador'}</span> · Departamento: <span className="font-semibold text-slate-700">{user?.department || 'General'}</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => navigate('/empleado/asistencia')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                        >
                            <FiClock className="w-4 h-4" /> Registrar Marcación
                        </button>
                        <button
                            onClick={() => navigate('/empleado/ausencias')}
                            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            <FiCalendar className="w-4 h-4" /> Solicitar Permiso
                        </button>
                    </div>
                </motion.div>

                {/* Tarjetas KPI Personales */}
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" variants={itemVariants}>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vacaciones Disponibles</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {employeeMetrics.vacationDays} días
                            </p>
                            <p className="text-xs text-emerald-600 font-medium mt-1">Días acumulados pagados</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
                            <FiCalendar />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluaciones Pendientes</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {employeeMetrics.pendingEvaluationsCount}
                            </p>
                            <button
                                onClick={() => navigate('/performance/my-evaluations')}
                                className="text-xs text-indigo-600 font-semibold hover:underline mt-1 block"
                            >
                                Responder evaluaciones →
                            </button>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
                            <FiClipboard />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Solicitudes de Permiso</p>
                            <p className="text-2xl font-bold text-amber-600 mt-1">
                                {employeeMetrics.pendingAbsencesCount}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">En revisión por HR</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
                            <FiSend />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expediente Digital</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">Activo</p>
                            <button
                                onClick={() => navigate('/my-expedient')}
                                className="text-xs text-indigo-600 font-semibold hover:underline mt-1 block"
                            >
                                Ver mi expediente →
                            </button>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
                            <FiFolder />
                        </div>
                    </div>
                </motion.div>

                {/* Accesos Directos Personales */}
                <motion.section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6" variants={itemVariants}>
                    <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <FiActivity className="text-indigo-600" /> Accesos Rápidos Frecuentes
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div
                            onClick={() => navigate('/empleado/asistencia')}
                            className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-indigo-200 transition-all cursor-pointer flex items-center gap-3"
                        >
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                <FiClock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Marcaciones de Asistencia</p>
                                <p className="text-xs text-slate-500">Registra entrada y salida</p>
                            </div>
                        </div>

                        <div
                            onClick={() => navigate('/my-payments')}
                            className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-indigo-200 transition-all cursor-pointer flex items-center gap-3"
                        >
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                                <FiDollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Recibos de Pago</p>
                                <p className="text-xs text-slate-500">Descarga tu rol de pagos</p>
                            </div>
                        </div>

                        <div
                            onClick={() => navigate('/my-advances')}
                            className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-indigo-200 transition-all cursor-pointer flex items-center gap-3"
                        >
                            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                                <FiDollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Solicitar Anticipo</p>
                                <p className="text-xs text-slate-500">Solicitud de anticipo de sueldo</p>
                            </div>
                        </div>

                        <div
                            onClick={() => navigate('/announcements')}
                            className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-indigo-200 transition-all cursor-pointer flex items-center gap-3"
                        >
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                <FiVolume2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Comunicados Empresa</p>
                                <p className="text-xs text-slate-500">Notificaciones institucionales</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Secciones de Módulos Clasificados */}
                <div className="space-y-8">
                    {sections.map((section, sIdx) => {
                        const filteredModules = section.modules.filter(m => m.path !== '/empleado');
                        if (filteredModules.length === 0) return null;
                        return (
                            <motion.section key={sIdx} variants={itemVariants}>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FiBriefcase className="text-slate-400" />
                                    {section.title}
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredModules.map((mod, idx) => (
                                        <motion.button
                                            key={idx}
                                            variants={itemVariants}
                                            whileHover={{ y: -4, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)" }}
                                            onClick={() => navigate(mod.path)}
                                            className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all duration-200 group h-36 text-center relative overflow-hidden cursor-pointer shadow-xs"
                                        >
                                            <div className="p-3 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors mb-2 text-xl">
                                                {mod.icon}
                                            </div>
                                            <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900 leading-tight">{mod.title}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.section>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}

export default EmployeeDashboard;
