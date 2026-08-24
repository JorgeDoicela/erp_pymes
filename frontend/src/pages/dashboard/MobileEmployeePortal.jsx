import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getMyPayrolls } from '../../services/payroll/payrollConfig.service';
import { getMyAbsences, createAbsenceRequest } from '../../services/attendance/absenceService';
import { clockIn, clockOut } from '../../services/attendance/attendanceService';
import { generatePayslipPDF } from '../../utils/generatePayslipPDF';
import { generateCertificatePDF } from '../../utils/generateCertificatePDF';
import { 
    HomeIcon, 
    ClockIcon, 
    DocumentArrowDownIcon, 
    PaperAirplaneIcon, 
    MapPinIcon, 
    DocumentTextIcon,
    CalendarIcon,
    ArrowRightOnRectangleIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

const MobileEmployeePortal = ({ user }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('HOME'); // HOME | ATTENDANCE | PAYROLL | REQUESTS
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);

    // Data states
    const [payrolls, setPayrolls] = useState([]);
    const [absences, setAbsences] = useState([]);
    const [clockStatus, setClockStatus] = useState('OUT'); // IN | OUT
    const [clockTime, setClockTime] = useState(null);
    const [gpsLocation, setGpsLocation] = useState(null);
    const [clockLoading, setClockLoading] = useState(false);

    // Request Form Modal
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [requestForm, setRequestForm] = useState({
        type: 'VACATION',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: ''
    });
    const [formLoading, setFormLoading] = useState(false);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    useEffect(() => {
        loadPortalData();
        getGps();
    }, []);

    const loadPortalData = async () => {
        setLoading(true);
        try {
            const [resPayrolls, resAbsences] = await Promise.all([
                getMyPayrolls().catch(() => ({ data: [] })),
                getMyAbsences().catch(() => [])
            ]);
            if (resPayrolls.data) setPayrolls(resPayrolls.data);
            if (resAbsences) setAbsences(Array.isArray(resAbsences) ? resAbsences : resAbsences.data || []);
        } catch (error) {
            console.error('Error al cargar datos del portal:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGps = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => console.warn('GPS no disponible:', err.message)
            );
        }
    };

    const handleClockAction = async () => {
        setClockLoading(true);
        try {
            getGps();
            if (clockStatus === 'OUT') {
                await clockIn({
                    latitude: gpsLocation?.lat,
                    longitude: gpsLocation?.lng
                });
                setClockStatus('IN');
                setClockTime(new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }));
                showNotification('success', 'Entrada marcada exitosamente con geolocalización GPS');
            } else {
                await clockOut({
                    latitude: gpsLocation?.lat,
                    longitude: gpsLocation?.lng
                });
                setClockStatus('OUT');
                setClockTime(null);
                showNotification('success', 'Salida registrada exitosamente');
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al registrar marcación');
        } finally {
            setClockLoading(false);
        }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            await createAbsenceRequest(requestForm);
            showNotification('success', 'Solicitud de permiso enviada a su supervisor');
            setRequestModalOpen(false);
            setRequestForm({ type: 'VACATION', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], reason: '' });
            loadPortalData();
        } catch (error) {
            showNotification('error', error.message || 'Error al enviar solicitud');
        } finally {
            setFormLoading(false);
        }
    };

    const latestPayroll = payrolls[0];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-24 font-sans text-gray-800">
            {/* Notificación Toast Sobria */}
            {notification && (
                <div
                    className={`fixed top-4 left-4 right-4 z-50 px-4 py-2.5 rounded border text-xs font-medium shadow-md text-center transition-all ${
                        notification.type === 'success'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-red-50 text-red-900 border-red-200'
                    }`}
                >
                    {notification.message}
                </div>
            )}

            {/* Mobile Header Banner */}
            <div className="bg-white text-gray-900 p-4 border-b border-gray-200 shadow-xs relative">
                <div className="relative z-10 flex justify-between items-center max-w-md mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-700 border border-gray-200 font-mono">
                            {user?.firstName?.[0] || 'E'}{user?.lastName?.[0] || 'P'}
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Portal de Autogestión</p>
                            <h2 className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h2>
                            <p className="text-[11px] text-gray-500 font-mono">{user?.position || 'Colaborador'} · {user?.department || 'General'}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                        clockStatus === 'IN' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                        {clockStatus === 'IN' ? '● EN TURNO' : '○ FUERA DE TURNO'}
                    </span>
                </div>
            </div>

            {/* Main Content Body */}
            <main className="p-4 space-y-4 flex-1 max-w-md mx-auto w-full text-xs">

                {/* TAB 1: INICIO (HOME) */}
                {activeTab === 'HOME' && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        {/* Quick 1-Click Action Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => generateCertificatePDF(user || {})}
                                className="bg-white p-3.5 rounded border border-gray-200 shadow-xs hover:bg-gray-50 transition-colors flex flex-col items-start space-y-1.5 text-left cursor-pointer"
                            >
                                <div className="p-2 bg-gray-100 text-gray-700 rounded border border-gray-200">
                                    <DocumentTextIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 text-xs">Certificado Laboral</h4>
                                    <p className="text-[10px] text-gray-500">PDF con Firma y QR</p>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    if (latestPayroll) {
                                        generatePayslipPDF(latestPayroll, user, latestPayroll.payroll?.period || new Date());
                                    } else {
                                        showNotification('error', 'No cuenta con roles de pago generados aún');
                                    }
                                }}
                                className="bg-white p-3.5 rounded border border-gray-200 shadow-xs hover:bg-gray-50 transition-colors flex flex-col items-start space-y-1.5 text-left cursor-pointer"
                            >
                                <div className="p-2 bg-gray-100 text-gray-700 rounded border border-gray-200">
                                    <DocumentArrowDownIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 text-xs">Último Rol de Pago</h4>
                                    <p className="text-[10px] text-gray-500">Descarga 1-Clic PDF</p>
                                </div>
                            </button>
                        </div>

                        {/* Quick Clock-in Card */}
                        <div className="bg-white text-gray-900 p-4 rounded border border-gray-200 shadow-xs space-y-3">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Marcación de Asistencia</p>
                                    <p className="text-xs font-medium mt-0.5 flex items-center gap-1 text-gray-700">
                                        <MapPinIcon className="w-3.5 h-3.5 text-gray-500" />
                                        {gpsLocation ? 'Coordenadas GPS Listas' : 'Obteniendo GPS...'}
                                    </p>
                                </div>
                                {clockTime && (
                                    <span className="text-xs font-mono font-semibold text-emerald-700 tabular-nums">
                                        {clockTime}
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={handleClockAction}
                                disabled={clockLoading}
                                className={`w-full py-3 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                                    clockStatus === 'OUT'
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                        : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                                }`}
                            >
                                <ClockIcon className="w-4 h-4" />
                                {clockLoading ? 'Registrando...' : clockStatus === 'OUT' ? 'Marcar Entrada de Turno' : 'Marcar Salida de Turno'}
                            </button>
                        </div>

                        {/* Recent Requests Status */}
                        <div className="bg-white rounded border border-gray-200 p-4 space-y-3">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <h4 className="font-semibold text-xs text-gray-900">Mis Permisos Recientes</h4>
                                <button onClick={() => setActiveTab('REQUESTS')} className="text-[11px] text-blue-600 hover:underline font-medium">Ver todos →</button>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {absences.slice(0, 3).map((abs) => (
                                    <div key={abs.id} className="py-2.5 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-900 text-xs">{abs.type === 'VACATION' ? 'Vacaciones' : abs.type}</p>
                                            <p className="text-[10px] text-gray-400 font-mono tabular-nums">
                                                {new Date(abs.startDate).toLocaleDateString('es-EC')} - {new Date(abs.endDate).toLocaleDateString('es-EC')}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                                            abs.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                            abs.status === 'REJECTED' ? 'bg-red-50 text-red-800 border-red-200' :
                                            'bg-amber-50 text-amber-800 border-amber-200'
                                        }`}>
                                            {abs.status === 'APPROVED' ? 'Aprobado' : abs.status === 'REJECTED' ? 'Rechazado' : 'En Revisión'}
                                        </span>
                                    </div>
                                ))}

                                {absences.length === 0 && (
                                    <p className="text-gray-400 py-3 text-center text-xs">No tienes solicitudes recientes</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* TAB 2: ATTENDANCE */}
                {activeTab === 'ATTENDANCE' && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                            <h3 className="font-semibold text-xs text-gray-900 border-b border-gray-100 pb-2">Marcación en Tiempo Real</h3>
                            <p className="text-gray-500 text-[11px]">Su marcación registrará la hora oficial y las coordenadas GPS validadas contra la geocerca de la empresa.</p>

                            <button
                                onClick={handleClockAction}
                                disabled={clockLoading}
                                className={`w-full py-3 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                                    clockStatus === 'OUT'
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                            >
                                <ClockIcon className="w-4 h-4" />
                                {clockLoading ? 'Validando GPS...' : clockStatus === 'OUT' ? 'Marcar Entrada de Turno' : 'Marcar Salida de Turno'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* TAB 3: PAYROLL */}
                {activeTab === 'PAYROLL' && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <h3 className="font-semibold text-xs text-gray-900">Historial de Roles de Pago</h3>
                        {payrolls.map((p) => (
                            <div key={p.id} className="bg-white p-3.5 rounded border border-gray-200 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-900 text-xs">Rol Mensual</p>
                                    <p className="text-[11px] text-gray-400 font-mono tabular-nums">
                                        {p.payroll?.period ? new Date(p.payroll.period).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }) : 'Periodo Actual'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => generatePayslipPDF(p, user, p.payroll?.period || new Date())}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                                >
                                    Descargar PDF
                                </button>
                            </div>
                        ))}

                        {payrolls.length === 0 && (
                            <div className="bg-white p-8 rounded border border-gray-200 text-center text-gray-400 text-xs">
                                No se registran roles de pago emitidos aún
                            </div>
                        )}
                    </motion.div>
                )}

                {/* TAB 4: REQUESTS */}
                {activeTab === 'REQUESTS' && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-xs text-gray-900">Mis Solicitudes</h3>
                            <button
                                onClick={() => setRequestModalOpen(true)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                + Nueva Solicitud
                            </button>
                        </div>

                        <div className="space-y-2">
                            {absences.map((abs) => (
                                <div key={abs.id} className="bg-white p-3.5 rounded border border-gray-200 space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-gray-900 text-xs">{abs.type === 'VACATION' ? 'Vacaciones' : abs.type}</p>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                                            abs.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                            abs.status === 'REJECTED' ? 'bg-red-50 text-red-800 border-red-200' :
                                            'bg-amber-50 text-amber-800 border-amber-200'
                                        }`}>
                                            {abs.status === 'APPROVED' ? 'Aprobado' : abs.status === 'REJECTED' ? 'Rechazado' : 'En Revisión'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-mono tabular-nums">
                                        {new Date(abs.startDate).toLocaleDateString('es-EC')} al {new Date(abs.endDate).toLocaleDateString('es-EC')}
                                    </p>
                                    {abs.reason && <p className="text-[11px] text-gray-400">{abs.reason}</p>}
                                </div>
                            ))}

                            {absences.length === 0 && (
                                <div className="bg-white p-8 rounded border border-gray-200 text-center text-gray-400 text-xs">
                                    No hay solicitudes registradas
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Floating Request Modal */}
            <AnimatePresence>
                {requestModalOpen && (
                    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white border border-gray-200 rounded max-w-sm w-full p-5 space-y-4 shadow-xl text-xs"
                        >
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <h3 className="font-semibold text-sm text-gray-900">Solicitar Ausencia / Permiso</h3>
                                <button onClick={() => setRequestModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
                            </div>

                            <form onSubmit={handleCreateRequest} className="space-y-3">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Tipo de Permiso</label>
                                    <select
                                        value={requestForm.type}
                                        onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="VACATION">Vacaciones</option>
                                        <option value="SICK_LEAVE">Permiso Médico</option>
                                        <option value="PERSONAL">Asuntos Personales / Calamidad</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1">Desde</label>
                                        <input
                                            type="date"
                                            required
                                            value={requestForm.startDate}
                                            onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1">Hasta</label>
                                        <input
                                            type="date"
                                            required
                                            value={requestForm.endDate}
                                            onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Motivo / Detalle</label>
                                    <textarea
                                        rows={2}
                                        required
                                        placeholder="Describa el motivo de la solicitud..."
                                        value={requestForm.reason}
                                        onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setRequestModalOpen(false)}
                                        className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 rounded text-xs"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                                    >
                                        {formLoading ? 'Enviando...' : 'Enviar Solicitud'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bottom Mobile Tab Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-6 flex justify-around items-center z-40 max-w-md mx-auto">
                <button
                    onClick={() => setActiveTab('HOME')}
                    className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === 'HOME' ? 'text-blue-600 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <HomeIcon className="w-5 h-5" />
                    <span className="text-[10px]">Inicio</span>
                </button>

                <button
                    onClick={() => setActiveTab('ATTENDANCE')}
                    className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === 'ATTENDANCE' ? 'text-blue-600 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <ClockIcon className="w-5 h-5" />
                    <span className="text-[10px]">Asistencia</span>
                </button>

                <button
                    onClick={() => setActiveTab('PAYROLL')}
                    className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === 'PAYROLL' ? 'text-blue-600 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    <span className="text-[10px]">Mis Pagos</span>
                </button>

                <button
                    onClick={() => setActiveTab('REQUESTS')}
                    className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === 'REQUESTS' ? 'text-blue-600 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <PaperAirplaneIcon className="w-5 h-5" />
                    <span className="text-[10px]">Permisos</span>
                </button>
            </nav>
        </div>
    );
};

export default MobileEmployeePortal;
