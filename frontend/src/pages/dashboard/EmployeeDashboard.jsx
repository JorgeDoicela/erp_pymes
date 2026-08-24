import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiClock, FiCalendar, FiDollarSign,
    FiFolder, FiUser, FiCheckSquare
} from 'react-icons/fi';
import { getSectionsByRole } from '../../constants/modules';
import api from '../../api/axios';
import SmartModuleHub from '../../components/dashboard/SmartModuleHub';
import MobileEmployeePortal from './MobileEmployeePortal';

function EmployeeDashboard({ user }) {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [employeeMetrics, setEmployeeMetrics] = useState({
        vacationDays: user?.vacationDays !== undefined && user?.vacationDays !== null ? user.vacationDays : null,
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
                const [evalsRes, absencesRes, profileRes] = await Promise.allSettled([
                    import('../../services/evaluation.service').then(m => m.getMyPendingEvaluations()),
                    api.get('/absences/my-requests'),
                    api.get('/employees/profile').catch(() => null)
                ]);

                let pendingEvaluationsCount = 0;
                let pendingAbsencesCount = 0;
                let realVacationDays = user?.vacationDays !== undefined && user?.vacationDays !== null ? user.vacationDays : null;

                if (evalsRes.status === 'fulfilled' && Array.isArray(evalsRes.value)) {
                    pendingEvaluationsCount = evalsRes.value.filter(e => e.status !== 'COMPLETED').length;
                }

                if (absencesRes.status === 'fulfilled' && absencesRes.value?.data) {
                    const absList = absencesRes.value.data.data || absencesRes.value.data;
                    if (Array.isArray(absList)) {
                        pendingAbsencesCount = absList.filter(a => a.status === 'PENDING').length;
                    }
                }

                if (profileRes?.status === 'fulfilled' && profileRes?.value?.data?.data?.vacationDays !== undefined) {
                    realVacationDays = profileRes.value.data.data.vacationDays;
                }

                setEmployeeMetrics({
                    vacationDays: realVacationDays !== null ? realVacationDays : (user?.vacationDays ?? 'N/D'),
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

    if (isMobile) {
        return <MobileEmployeePortal user={user} />;
    }

    return (
        <div className="space-y-4 max-w-[1400px] mx-auto">
            {/* Header Principal Sobrio con Balance Operativo */}
            <div className="bg-white p-5 rounded border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                        Portal de Autogestión del Colaborador
                    </p>
                    <h1 className="text-xl font-semibold text-gray-900">
                        {getTimeBasedGreeting()}, {user?.firstName || 'Colaborador'} {user?.lastName || ''}
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Puesto: <span className="font-semibold text-gray-800">{user?.position || 'Colaborador'}</span> · Departamento: <span className="font-semibold text-gray-800">{user?.department || 'General'}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-4 bg-white px-3.5 py-2 rounded border border-gray-200 font-mono text-xs">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Vacaciones</span>
                            <span className="font-semibold text-emerald-700 tabular-nums">
                                {loadingMetrics ? '...' : `${employeeMetrics.vacationDays} días`}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Permisos en Trámite</span>
                            <span className="font-semibold text-amber-700 tabular-nums">
                                {loadingMetrics ? '...' : employeeMetrics.pendingAbsencesCount}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Evaluaciones</span>
                            <span className="font-semibold text-blue-700 tabular-nums">
                                {loadingMetrics ? '...' : employeeMetrics.pendingEvaluationsCount}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/empleado/asistencia')}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                            <FiClock className="w-3.5 h-3.5" /> Marcación GPS
                        </button>
                        <button
                            onClick={() => navigate('/empleado/ausencias')}
                            className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <FiCalendar className="w-3.5 h-3.5" /> Solicitar Permiso
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Columna Izquierda / Principal: Consola Inteligente de Módulos */}
                <div className="lg:col-span-2 space-y-4">
                    <SmartModuleHub user={user} sections={sections} />
                </div>

                {/* Columna Derecha: Resumen de Estado y Accesos Rápidos */}
                <div className="space-y-4">
                    <div className="bg-white rounded border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-200">
                            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                Ficha de Estado Personal
                            </h3>
                        </div>

                        <div className="divide-y divide-gray-100 text-xs">
                            <div className="px-4 py-3 flex items-center justify-between">
                                <span className="text-gray-600">Días Disponibles de Vacaciones</span>
                                <span className="font-semibold text-gray-900 font-mono tabular-nums">
                                    {employeeMetrics.vacationDays} días
                                </span>
                            </div>

                            <div className="px-4 py-3 flex items-center justify-between">
                                <span className="text-gray-600">Evaluaciones de Desempeño</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 font-mono tabular-nums">
                                        {employeeMetrics.pendingEvaluationsCount}
                                    </span>
                                    {employeeMetrics.pendingEvaluationsCount > 0 && (
                                        <button
                                            onClick={() => navigate('/performance/my-evaluations')}
                                            className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                                        >
                                            Ver →
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="px-4 py-3 flex items-center justify-between">
                                <span className="text-gray-600">Solicitudes de Permiso Activas</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 font-mono tabular-nums">
                                        {employeeMetrics.pendingAbsencesCount}
                                    </span>
                                    <button
                                        onClick={() => navigate('/empleado/ausencias')}
                                        className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                                    >
                                        Gestionar →
                                    </button>
                                </div>
                            </div>

                            <div className="px-4 py-3 flex items-center justify-between">
                                <span className="text-gray-600">Expediente Digital</span>
                                <button
                                    onClick={() => navigate('/my-expedient')}
                                    className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer hover:bg-emerald-100 font-mono"
                                >
                                    ACTIVO ↗
                                </button>
                            </div>

                            <div className="px-4 py-3 flex items-center justify-between">
                                <span className="text-gray-600">Mis Roles de Pago</span>
                                <button
                                    onClick={() => navigate('/my-payments')}
                                    className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                                >
                                    Ver Recibos →
                                </button>
                            </div>

                            <div className="px-4 py-3 flex items-center justify-between">
                                <span className="text-gray-600">Perfil y Datos Personales</span>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                                >
                                    Ficha Completa →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmployeeDashboard;
