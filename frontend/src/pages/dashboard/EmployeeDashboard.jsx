import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiClock, FiCalendar, FiDollarSign, FiClipboard,
    FiSend, FiFolder, FiVolume2, FiArrowRight
} from 'react-icons/fi';
import { getSectionsByRole } from '../../constants/modules';
import api from '../../api/axios';

function EmployeeDashboard({ user }) {
    const navigate = useNavigate();

    const [employeeMetrics, setEmployeeMetrics] = useState({
        vacationDays: user?.vacationDays || 15,
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

    const sections = getSectionsByRole(user);

    useEffect(() => {
        const fetchEmployeeData = async () => {
            setLoadingMetrics(true);
            try {
                const [evalsRes, absencesRes] = await Promise.allSettled([
                    import('../../services/evaluation.service').then(m => m.getMyPendingEvaluations()),
                    api.get('/absences/my-requests')
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
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header Principal Sobrio */}
            <div className="bg-white p-5 rounded border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Portal de Autogestión del Empleado
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        {getTimeBasedGreeting()}, {user?.firstName || 'Empleado'} {user?.lastName || ''}
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Puesto: <span className="font-semibold text-gray-800">{user?.position || 'Colaborador'}</span> · Departamento: <span className="font-semibold text-gray-800">{user?.department || 'General'}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => navigate('/empleado/asistencia')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <FiClock className="w-3.5 h-3.5" /> Registrar Marcación
                    </button>
                    <button
                        onClick={() => navigate('/empleado/ausencias')}
                        className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <FiCalendar className="w-3.5 h-3.5" /> Solicitar Permiso
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda / Principal: Accesos directos y módulos */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Accesos Frecuentes */}
                    <div className="bg-white rounded border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Accesos Rápidos de Operación
                            </h2>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/empleado/asistencia')}
                                className="flex items-center justify-between p-3 rounded border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-mono shrink-0">
                                        <FiClock />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900 leading-tight">Control de Asistencia</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Marcación de entrada / salida</p>
                                    </div>
                                </div>
                                <FiArrowRight className="text-gray-400 group-hover:text-gray-700 transition-colors text-xs" />
                            </button>

                            <button
                                onClick={() => navigate('/my-payments')}
                                className="flex items-center justify-between p-3 rounded border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-mono shrink-0">
                                        <FiDollarSign />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900 leading-tight">Recibos de Pago</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Consulta de roles de pago</p>
                                    </div>
                                </div>
                                <FiArrowRight className="text-gray-400 group-hover:text-gray-700 transition-colors text-xs" />
                            </button>

                            <button
                                onClick={() => navigate('/my-advances')}
                                className="flex items-center justify-between p-3 rounded border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-mono shrink-0">
                                        <FiSend />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900 leading-tight">Anticipos de Sueldo</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Solicitudes de adelanto</p>
                                    </div>
                                </div>
                                <FiArrowRight className="text-gray-400 group-hover:text-gray-700 transition-colors text-xs" />
                            </button>

                            <button
                                onClick={() => navigate('/announcements')}
                                className="flex items-center justify-between p-3 rounded border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-mono shrink-0">
                                        <FiVolume2 />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900 leading-tight">Comunicados Oficiales</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Novedades e institucionales</p>
                                    </div>
                                </div>
                                <FiArrowRight className="text-gray-400 group-hover:text-gray-700 transition-colors text-xs" />
                            </button>
                        </div>
                    </div>

                    {/* Secciones de Módulos */}
                    <div className="space-y-4">
                        {sections.map((section, sIdx) => {
                            const filteredModules = section.modules.filter(m => m.path !== '/empleado');
                            if (filteredModules.length === 0) return null;
                            return (
                                <div key={sIdx} className="bg-white rounded border border-gray-200">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                            {section.title}
                                        </h3>
                                    </div>
                                    <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        {filteredModules.map((mod, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => navigate(mod.path)}
                                                className="flex items-center gap-2.5 p-2.5 rounded border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left cursor-pointer group"
                                            >
                                                <span className="text-gray-500 group-hover:text-gray-900 text-sm shrink-0">
                                                    {mod.icon}
                                                </span>
                                                <span className="text-xs font-medium text-gray-800 group-hover:text-gray-900 leading-tight">
                                                    {mod.title}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Columna Derecha: Resumen de Estado Personal (Panel Contable Sobrio) */}
                <div className="space-y-6">
                    <div className="bg-white rounded border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                Resumen de Estado Personal
                            </h3>
                        </div>

                        <div className="divide-y divide-gray-100">
                            <div className="px-4 py-3 flex items-center justify-between">
                                <span className="text-xs text-gray-600">Días de Vacaciones</span>
                                <span className="text-xs font-semibold text-gray-900 font-mono tabular-nums">
                                    {employeeMetrics.vacationDays} días
                                </span>
                            </div>

                            <div className="px-4 py-3 flex items-center justify-between">
                                <span className="text-xs text-gray-600">Evaluaciones Pendientes</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-900 font-mono tabular-nums">
                                        {employeeMetrics.pendingEvaluationsCount}
                                    </span>
                                    {employeeMetrics.pendingEvaluationsCount > 0 && (
                                        <button
                                            onClick={() => navigate('/performance/my-evaluations')}
                                            className="text-[11px] text-blue-600 hover:underline font-medium"
                                        >
                                            Ver
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="px-4 py-3 flex items-center justify-between">
                                <span className="text-xs text-gray-600">Permisos en Revisión</span>
                                <span className="text-xs font-semibold text-gray-900 font-mono tabular-nums">
                                    {employeeMetrics.pendingAbsencesCount}
                                </span>
                            </div>

                            <div className="px-4 py-3 flex items-center justify-between">
                                <span className="text-xs text-gray-600">Expediente Digital</span>
                                <button
                                    onClick={() => navigate('/my-expedient')}
                                    className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 cursor-pointer hover:bg-green-100"
                                >
                                    ACTIVO
                                </button>
                            </div>

                            <div className="px-4 py-3 flex items-center justify-between">
                                <span className="text-xs text-gray-600">Perfil de Usuario</span>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                                >
                                    Editar Perfil
                                </button>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => navigate('/help')}
                                className="w-full py-1.5 px-3 border border-gray-300 hover:bg-white text-gray-700 text-xs font-medium rounded transition-colors text-center cursor-pointer block"
                            >
                                Ir al Centro de Ayuda
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmployeeDashboard;

