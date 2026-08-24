import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiClock, FiCalendar, FiDollarSign, FiClipboard,
    FiSend, FiFolder, FiVolume2, FiArrowRight
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

    if (isMobile) {
        return <MobileEmployeePortal user={user} />;
    }

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
                {/* Columna Izquierda / Principal: Consola Inteligente de Módulos */}
                <div className="lg:col-span-2 space-y-6">
                    <SmartModuleHub user={user} sections={sections} />
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
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmployeeDashboard;

