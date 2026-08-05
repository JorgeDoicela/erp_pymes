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
        <div className="min-h-screen bg-slate-100 flex flex-col pb-24 font-sans text-slate-800">
            {/* Mobile Header Banner */}
            <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-6 rounded-b-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-extrabold text-lg text-white border border-white/20 shadow-inner">
                            {user?.firstName?.[0] || 'E'}{user?.lastName?.[0] || 'P'}
                        </div>
                        <div>
                            <p className="text-xs text-blue-200 font-medium">Portal de Autoservicio</p>
                            <h2 className="text-lg font-black tracking-tight">{user?.firstName} {user?.lastName}</h2>
                            <p className="text-[11px] text-blue-200/80">{user?.position || 'Personal Operativo'} • {user?.department || 'General'}</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider border backdrop-blur-md ${
                        clockStatus === 'IN' 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 animate-pulse' 
                            : 'bg-white/10 text-blue-200 border-white/20'
                    }`}>
                        {clockStatus === 'IN' ? '● EN TURNO' : '○ FUERA DE TURNO'}
                    </span>
                </div>
            </div>

            {/* Main Content Body */}
            <main className="p-4 space-y-5 flex-1 max-w-md mx-auto w-full">

                {/* TAB 1: INICIO (HOME) */}
                {activeTab === 'HOME' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        {/* Quick 1-Click Action Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => generateCertificatePDF(user || {})}
                                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col items-start space-y-2 text-left group"
                            >
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <DocumentTextIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-xs">Certificado Laboral</h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5">PDF con Firma y QR</p>
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
                                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col items-start space-y-2 text-left group"
                            >
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                    <DocumentArrowDownIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-xs">Último Rol de Pago</h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Descarga 1-Clic PDF</p>
                                </div>
                            </button>
                        </div>

                        {/* Quick Clock-in Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Marcación Rápida GPS</p>
                                    <p className="text-sm font-bold mt-0.5 flex items-center gap-1 text-slate-200">
                                        <MapPinIcon className="w-4 h-4 text-blue-400" />
                                        {gpsLocation ? 'Ubicación GPS Detectada' : 'Obteniendo GPS...'}
                                    </p>
                                </div>
                                {clockTime && <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded-lg">Entrada: {clockTime}</span>}
                            </div>

                            <button
                                onClick={handleClockAction}
                                disabled={clockLoading}
                                className={`w-full py-4 rounded-xl font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
                                    clockStatus === 'OUT'
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                                        : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white'
                                }`}
                            >
                                <ClockIcon className="w-5 h-5" />
                                {clockLoading ? 'Procesando Marcación...' : clockStatus === 'OUT' ? 'MARCAR ENTRADA AHORA' : 'MARCAR SALIDA AHORA'}
                            </button>
                        </div>

                        {/* Recent Requests Preview */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Mis Solicitudes Recientes</h4>
                                <button onClick={() => setRequestModalOpen(true)} className="text-xs text-blue-600 font-bold hover:underline">+ Nueva</button>
                            </div>

                            {absences.length === 0 ? (
                                <p className="text-xs text-slate-400 italic text-center py-3">No tienes solicitudes pendientes</p>
                            ) : (
                                absences.slice(0, 3).map(abs => (
                                    <div key={abs.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100 text-xs">
                                        <div>
                                            <p className="font-bold text-slate-800">{abs.type === 'VACATION' ? 'Vacaciones' : abs.type}</p>
                                            <p className="text-[11px] text-slate-400">
                                                {new Date(abs.startDate).toLocaleDateString('es-EC')} - {new Date(abs.endDate).toLocaleDateString('es-EC')}
                                            </p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                            abs.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                                <ClockIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base">Control Horario y Marcaciones</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Turno Asignado: 08:00 - 17:00 (Jornada Diurna)</p>
                            </div>

                            <button
                                onClick={handleClockAction}
                                disabled={clockLoading}
                                className={`w-full py-4 rounded-xl font-extrabold text-sm shadow-md transition-all ${
                                    clockStatus === 'OUT'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                                }`}
                            >
                                {clockLoading ? 'Procesando...' : clockStatus === 'OUT' ? 'MARCAR ENTRADA CON GPS' : 'MARCAR SALIDA CON GPS'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* TAB 3: ROLES DE PAGO Y CERTIFICADOS */}
                {activeTab === 'PAYROLL' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Documentos y Roles Disponibles</h3>

                            <button
                                onClick={() => generateCertificatePDF(user || {})}
                                className="w-full p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    <DocumentTextIcon className="w-5 h-5" />
                                    Certificado Laboral Oficial (PDF con QR)
                                </span>
                                <span>Descargar ↗</span>
                            </button>

                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Historial de Roles de Pago</h4>
                                {payrolls.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-2">Sin recibos de sueldo registrados</p>
                                ) : (
                                    payrolls.map(det => (
                                        <div key={det.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-center text-xs">
                                            <div>
                                                <p className="font-bold text-slate-800">
                                                    Nómina {new Date(det.payroll?.period || new Date()).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
                                                </p>
                                                <p className="text-slate-400 font-mono">Neto: ${(det.netSalary || 0).toFixed(2)}</p>
                                            </div>
                                            <button
                                                onClick={() => generatePayslipPDF(det, user, det.payroll?.period || new Date())}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
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
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <button
                            onClick={() => setRequestModalOpen(true)}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                        >
                            <PaperAirplaneIcon className="w-4 h-4" />
                            + Nueva Solicitud de Vacaciones / Permiso
                        </button>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Historial de Permisos Solicitados</h4>
                            {absences.length === 0 ? (
                                <p className="text-xs text-slate-400 italic text-center py-4">No has registrado permisos</p>
                            ) : (
                                absences.map(abs => (
                                    <div key={abs.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-bold text-slate-800">{abs.type}</p>
                                            <p className="text-slate-500 mt-0.5">{abs.reason || 'Sin justificación'}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                            abs.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4"
                        >
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <h3 className="font-bold text-slate-800 text-base">Solicitud de Vacaciones / Permiso</h3>
                                <button onClick={() => setRequestModalOpen(false)} className="text-slate-400 text-xl font-bold">&times;</button>
                            </div>

                            <form onSubmit={handleCreateRequest} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tipo de Permiso</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none"
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
            <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/80 px-6 py-2 flex justify-around items-center z-40 max-w-md mx-auto shadow-2xl">
                {[
                    { key: 'HOME', label: 'Inicio', icon: HomeIcon },
                    { key: 'ATTENDANCE', label: 'Marcación', icon: ClockIcon },
                    { key: 'PAYROLL', label: 'Roles/Cert.', icon: DocumentArrowDownIcon },
                    { key: 'REQUESTS', label: 'Permisos', icon: PaperAirplaneIcon }
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex flex-col items-center gap-1 transition-all ${
                                isActive ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-400 font-medium hover:text-slate-600'
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] tracking-tight">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default MobileEmployeePortal;
