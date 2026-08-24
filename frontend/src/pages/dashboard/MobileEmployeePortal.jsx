import React, { useState, useEffect } from 'react';
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
    CheckCircleIcon,
    DocumentTextIcon,
    CalendarIcon,
    ArrowRightOnRectangleIcon,
    SparklesIcon,
    BuildingOfficeIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

const MobileEmployeePortal = ({ user }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('HOME'); // HOME | ATTENDANCE | PAYROLL | REQUESTS
    const [loading, setLoading] = useState(true);

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
                const res = await clockIn({
                    latitude: gpsLocation?.lat,
                    longitude: gpsLocation?.lng
                });
                setClockStatus('IN');
                setClockTime(new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }));
                alert('¡Entrada marcada exitosamente con GPS!');
            } else {
                const res = await clockOut({
                    latitude: gpsLocation?.lat,
                    longitude: gpsLocation?.lng
                });
                setClockStatus('OUT');
                setClockTime(null);
                alert('¡Salida registrada exitosamente!');
            }
        } catch (error) {
            alert(error.message || 'Error al registrar marcación');
        } finally {
            setClockLoading(false);
        }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const res = await createAbsenceRequest(requestForm);
            alert('Solicitud enviada a tu supervisor');
            setRequestModalOpen(false);
            setRequestForm({ type: 'VACATION', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], reason: '' });
            loadPortalData();
        } catch (error) {
            alert(error.message || 'Error al enviar solicitud');
        } finally {
            setFormLoading(false);
        }
    };

    const latestPayroll = payrolls[0];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-24 font-sans text-gray-800">
            {/* Mobile Header Banner */}
            <div className="bg-white text-gray-900 p-4 border-b border-gray-200 shadow-xs relative">
                <div className="relative z-10 flex justify-between items-center max-w-md mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-700 border border-gray-200">
                            {user?.firstName?.[0] || 'E'}{user?.lastName?.[0] || 'P'}
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-medium">Portal de Autoservicio</p>
                            <h2 className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h2>
                            <p className="text-[11px] text-gray-500 font-mono">{user?.position || 'Operativo'} • {user?.department || 'General'}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                        clockStatus === 'IN' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
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
                                        alert('No tienes roles de pago generados aún');
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
                                {clockTime && <span className="text-[11px] font-mono font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">Entrada: {clockTime}</span>}
                            </div>

                            <button
                                onClick={handleClockAction}
                                disabled={clockLoading}
                                className={`w-full py-2.5 rounded font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                                    clockStatus === 'OUT'
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                            >
                                <ClockIcon className="w-4 h-4" />
                                {clockLoading ? 'Procesando...' : clockStatus === 'OUT' ? 'Marcar Entrada Ahora' : 'Marcar Salida Ahora'}
                            </button>
                        </div>

                        {/* Recent Requests Preview */}
                        <div className="bg-white p-4 rounded border border-gray-200 shadow-xs space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">Solicitudes Recientes</h4>
                                <button onClick={() => setRequestModalOpen(true)} className="text-xs text-blue-600 font-medium hover:underline cursor-pointer">+ Nueva</button>
                            </div>

                            {absences.length === 0 ? (
                                <p className="text-xs text-gray-400 italic text-center py-2">No tienes solicitudes pendientes</p>
                            ) : (
                                absences.slice(0, 3).map(abs => (
                                    <div key={abs.id} className="p-2.5 bg-gray-50 rounded flex justify-between items-center border border-gray-200 text-xs">
                                        <div>
                                            <p className="font-medium text-gray-800">{abs.type === 'VACATION' ? 'Vacaciones' : abs.type}</p>
                                            <p className="text-[10px] text-gray-500 font-mono">
                                                {new Date(abs.startDate).toLocaleDateString('es-EC')} - {new Date(abs.endDate).toLocaleDateString('es-EC')}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                            abs.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                            {abs.status === 'APPROVED' ? 'Aprobado' : 'Pendiente'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {/* TAB 2: MARCACIÓN Y TURNOS */}
                {activeTab === 'ATTENDANCE' && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <div className="bg-white p-4 rounded border border-gray-200 shadow-xs text-center space-y-3">
                            <div className="w-12 h-12 rounded bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                                <ClockIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-sm">Control Horario y Marcaciones</h3>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">Turno Asignado: 08:00 - 17:00</p>
                            </div>

                            <button
                                onClick={handleClockAction}
                                disabled={clockLoading}
                                className={`w-full py-2.5 rounded font-medium text-xs shadow-xs transition-colors cursor-pointer ${
                                    clockStatus === 'OUT'
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                            >
                                {clockLoading ? 'Procesando...' : clockStatus === 'OUT' ? 'Marcar Entrada con GPS' : 'Marcar Salida con GPS'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* TAB 3: ROLES DE PAGO Y CERTIFICADOS */}
                {activeTab === 'PAYROLL' && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <div className="bg-white p-4 rounded border border-gray-200 shadow-xs space-y-3">
                            <h3 className="font-semibold text-gray-900 text-xs uppercase tracking-wider pb-2 border-b border-gray-100">Documentos y Roles</h3>

                            <button
                                onClick={() => generateCertificatePDF(user || {})}
                                className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs shadow-xs flex items-center justify-between transition-colors cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <DocumentTextIcon className="w-4 h-4" />
                                    Certificado Laboral Oficial (PDF)
                                </span>
                                <span className="text-[11px]">Descargar ↗</span>
                            </button>

                            <div className="space-y-2 pt-1">
                                <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Historial de Roles de Pago</h4>
                                {payrolls.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic py-2 text-center">Sin recibos registrados</p>
                                ) : (
                                    payrolls.map(det => (
                                        <div key={det.id} className="p-2.5 bg-gray-50 rounded border border-gray-200 flex justify-between items-center text-xs">
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    Nómina {new Date(det.payroll?.period || new Date()).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
                                                </p>
                                                <p className="text-gray-500 font-mono tabular-nums text-[11px]">Neto: ${(det.netSalary || 0).toFixed(2)}</p>
                                            </div>
                                            <button
                                                onClick={() => generatePayslipPDF(det, user, det.payroll?.period || new Date())}
                                                className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors"
                                            >
                                                PDF Rol
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* TAB 4: SOLICITUDES */}
                {activeTab === 'REQUESTS' && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <button
                            onClick={() => setRequestModalOpen(true)}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <PaperAirplaneIcon className="w-3.5 h-3.5" />
                            + Nueva Solicitud de Permiso
                        </button>

                        <div className="bg-white p-4 rounded border border-gray-200 shadow-xs space-y-2.5">
                            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider pb-2 border-b border-gray-100">Historial de Permisos</h4>
                            {absences.length === 0 ? (
                                <p className="text-xs text-gray-400 italic text-center py-3">No has registrado permisos</p>
                            ) : (
                                absences.map(abs => (
                                    <div key={abs.id} className="p-2.5 bg-gray-50 rounded border border-gray-200 flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-medium text-gray-800">{abs.type}</p>
                                            <p className="text-gray-500 text-[11px] mt-0.5">{abs.reason || 'Sin justificación'}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                            abs.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                            {abs.status === 'APPROVED' ? 'Aprobado' : 'Pendiente'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Request Form Modal */}
            <AnimatePresence>
                {requestModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md overflow-hidden p-5 space-y-4 text-xs"
                        >
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <h3 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">Solicitud de Vacaciones / Permiso</h3>
                                <button onClick={() => setRequestModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>

                            <form onSubmit={handleCreateRequest} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Permiso</label>
                                    <select
                                        className="w-full bg-white border border-gray-200 rounded p-2 text-xs text-gray-800 outline-none"
                                        value={requestForm.type}
                                        onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value })}
                                    >
                                        <option value="VACATION">Vacaciones</option>
                                        <option value="MEDICAL">Licencia Médica</option>
                                        <option value="PERSONAL">Asunto Personal</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Desde</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none font-mono"
                                            value={requestForm.startDate}
                                            onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Hasta</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none font-mono"
                                            value={requestForm.endDate}
                                            onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Motivo / Detalle</label>
                                    <textarea
                                        rows="2"
                                        required
                                        placeholder="Justificación del permiso..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none"
                                        value={requestForm.reason}
                                        onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setRequestModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancelar</button>
                                    <button type="submit" disabled={formLoading} className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md">
                                        {formLoading ? 'Enviando...' : 'Enviar Solicitud'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Fixed Mobile Bottom App Tab Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around items-center z-40 max-w-md mx-auto shadow-sm">
                {[
                    { key: 'HOME', label: 'Inicio', icon: HomeIcon },
                    { key: 'ATTENDANCE', label: 'Marcación', icon: ClockIcon },
                    { key: 'PAYROLL', label: 'Roles', icon: DocumentArrowDownIcon },
                    { key: 'REQUESTS', label: 'Permisos', icon: PaperAirplaneIcon }
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
                                isActive ? 'text-blue-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px]">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default MobileEmployeePortal;
