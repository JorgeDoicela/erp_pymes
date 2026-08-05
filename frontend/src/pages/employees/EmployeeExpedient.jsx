import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    getEmployeeExpedient, 
    verifyExpedientDocument, 
    uploadExpedientDocument 
} from '../../services/employees/onboardingOffboarding.service';
import { 
    DocumentCheckIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon, 
    ArrowUpTrayIcon, 
    DocumentIcon,
    ExclamationTriangleIcon,
    ArrowLeftIcon,
    UserIcon
} from '@heroicons/react/24/outline';

const EmployeeExpedient = () => {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Form upload
    const [uploadCategory, setUploadCategory] = useState('IDENTIFICATION');
    const [uploadUrl, setUploadUrl] = useState('');
    const [fileName, setFileName] = useState('');

    useEffect(() => {
        loadExpedient();
    }, [employeeId]);

    const loadExpedient = async () => {
        setLoading(true);
        try {
            // Si no hay employeeId en URL, cargar expediente del usuario autenticado (mis documentos)
            const res = employeeId 
                ? await getEmployeeExpedient(employeeId)
                : await import('../../services/employees/onboardingOffboarding.service').then(m => m.getMyExpedient());
            if (res.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error('Error al cargar expediente:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadUrl.trim()) {
            alert('Ingresa la URL o enlace del documento subido');
            return;
        }
        setActionLoading(true);
        try {
            const res = await uploadExpedientDocument({
                type: uploadCategory,
                documentCategory: uploadCategory,
                documentUrl: uploadUrl.trim(),
                originalName: fileName.trim() || 'documento.pdf'
            });
            if (res.success) {
                alert('Documento cargado exitosamente. Está pendiente de verificación por RRHH.');
                setUploadModalOpen(false);
                setUploadUrl('');
                setFileName('');
                loadExpedient();
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerifyAction = async (status) => {
        if (!selectedItem || !selectedItem.document) return;
        setActionLoading(true);
        try {
            const res = await verifyExpedientDocument(selectedItem.document.id, status, reviewNotes);
            if (res.success) {
                alert(`Documento ${status === 'VERIFIED' ? 'aprobado' : 'rechazado'}`);
                setReviewModalOpen(false);
                setSelectedItem(null);
                setReviewNotes('');
                loadExpedient();
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'VERIFIED':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircleIcon className="w-4 h-4" /> Verificado</span>;
            case 'PENDING':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"><ClockIcon className="w-4 h-4" /> En Revisión</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><XCircleIcon className="w-4 h-4" /> Rechazado</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200"><ExclamationTriangleIcon className="w-4 h-4" /> Faltante</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24 text-slate-400">
                Cargando Expediente Digital...
            </div>
        );
    }

    const { employee, completionPercentage, verifiedCount, totalRequired, checklist } = data || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                            <DocumentCheckIcon className="w-8 h-8 text-blue-600" />
                            Expediente Digital del Empleado
                        </h2>
                        <p className="text-slate-500 text-sm mt-0.5">
                            {employee?.firstName} {employee?.lastName} • {employee?.department || 'General'} (C.I. {employee?.identityCard})
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setUploadModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all text-sm"
                >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    Subir Documento
                </button>
            </div>

            {/* Progress Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="space-y-1.5 w-full md:w-2/3">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                        <span>Completitud del Expediente de Onboarding</span>
                        <span className="font-mono text-blue-600 text-base">{completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200/80 p-0.5">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                completionPercentage === 100
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                            }`}
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500">
                        {verifiedCount} de {totalRequired} documentos requeridos verificados correctamente.
                    </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center w-full md:w-auto shrink-0">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estado Onboarding</p>
                    <span className={`inline-block mt-1 font-extrabold text-sm px-3 py-1 rounded-full ${
                        completionPercentage === 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                    }`}>
                        {completionPercentage === 100 ? '✓ EXPEDIENTE COMPLETO' : 'PENDIENTE VERIFICACIÓN'}
                    </span>
                </div>
            </div>

            {/* Checklist Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {checklist.map((item, idx) => (
                    <div 
                        key={idx} 
                        className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-200 transition-all"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                                    <DocumentIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{item.label}</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {item.required ? 'Documento Obligatorio' : 'Opcional'}
                                    </p>
                                </div>
                            </div>
                            {getStatusBadge(item.status)}
                        </div>

                        {item.document ? (
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-mono font-medium text-slate-700 truncate max-w-[200px]">
                                        {item.document.originalName || 'DocumentoAdjunto.pdf'}
                                    </span>
                                    <a
                                        href={item.document.documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 font-bold transition-colors"
                                    >
                                        Ver Documento →
                                    </a>
                                </div>

                                {item.document.verificationNotes && (
                                    <p className="text-rose-600 font-medium italic bg-rose-50 p-2 rounded-lg border border-rose-100">
                                        Nota de revisión: {item.document.verificationNotes}
                                    </p>
                                )}

                                <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-200/60 text-[11px]">
                                    <span>Cargado el {new Date(item.document.createdAt).toLocaleDateString('es-EC')}</span>
                                    {/* Action button for admin verification */}
                                    <button
                                        onClick={() => {
                                            setSelectedItem(item);
                                            setReviewNotes(item.document.verificationNotes || '');
                                            setReviewModalOpen(true);
                                        }}
                                        className="text-slate-600 hover:text-blue-600 font-bold underline"
                                    >
                                        Revisar / Validar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/60 text-xs text-amber-800 flex justify-between items-center">
                                <span>Aún no se ha cargado este documento</span>
                                <button
                                    onClick={() => {
                                        setUploadCategory(item.categoryKey);
                                        setUploadModalOpen(true);
                                    }}
                                    className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-all"
                                >
                                    Cargar Ahora
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {uploadModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800">Cargar Documento de Expediente</h3>
                                <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
                            </div>
                            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Categoría del Documento</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={uploadCategory}
                                        onChange={(e) => setUploadCategory(e.target.value)}
                                    >
                                        <option value="IDENTIFICATION">Cédula / DNI</option>
                                        <option value="BANK_CERTIFICATE">Certificado Bancario</option>
                                        <option value="TITLE_DIPLOMA">Título / Certificado Académico</option>
                                        <option value="POLICE_RECORD">Antecedentes Penales / Policiales</option>
                                        <option value="CURRICULUM">Hoja de Vida / CV</option>
                                        <option value="SAFETY_CERTIFICATE">Certificado de Salud / EPP</option>
                                        <option value="OTHER">Otro Documento</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nombre del Archivo</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="ej. Cedula_JuanPerez.pdf"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Enlace / URL del Documento Digital</label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://drive.google.com/file/... o URL de archivo"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono"
                                        value={uploadUrl}
                                        onChange={(e) => setUploadUrl(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-3">
                                    <button type="button" onClick={() => setUploadModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancelar</button>
                                    <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md">
                                        {actionLoading ? 'Guardando...' : 'Cargar Documento'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Review / Verification Modal for Admin */}
            <AnimatePresence>
                {reviewModalOpen && selectedItem && selectedItem.document && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800">Validar Documento</h3>
                                <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-xs font-bold text-slate-700">{selectedItem.label}</p>
                                <a
                                    href={selectedItem.document.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl text-center"
                                >
                                    Abrir Documento para Inspección ↗
                                </a>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Observaciones de Validación</label>
                                    <textarea
                                        rows="2"
                                        placeholder="ej. Documento legible y verificado / Foto ilegible..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={() => handleVerifyAction('REJECTED')}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
                                    >
                                        Rechazar
                                    </button>
                                    <button
                                        onClick={() => handleVerifyAction('VERIFIED')}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                                    >
                                        Aprobar y Verificar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EmployeeExpedient;
