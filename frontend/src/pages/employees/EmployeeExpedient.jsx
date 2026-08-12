import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    getEmployeeExpedient, 
    verifyExpedientDocument, 
    uploadExpedientDocument 
} from '../../services/employees/onboardingOffboarding.service';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon, 
    ArrowUpTrayIcon, 
    DocumentIcon,
    ExclamationTriangleIcon
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
                alert('Documento cargado exitosamente. Pendiente de verificación por RRHH.');
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
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">Verificado</span>;
            case 'PENDING':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">En Revisión</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">Rechazado</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-200">Faltante</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 text-gray-400 text-xs font-mono">
                Cargando Expediente Digital...
            </div>
        );
    }

    const { 
        employee = {}, 
        completionPercentage = 0, 
        verifiedCount = 0, 
        totalRequired = 0, 
        checklist = [] 
    } = data || {};

    const safeChecklist = Array.isArray(checklist) ? checklist : [];

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header Limpio ERP */}
            <div className="bg-white p-5 rounded border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Expediente Digital del Empleado
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        {employee?.firstName} {employee?.lastName}
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Puesto: <span className="font-semibold text-gray-800">{employee?.position || 'Colaborador'}</span> · C.I.: <span className="font-semibold font-mono text-gray-800">{employee?.identityCard || 'N/A'}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                        <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                        <span>Subir Documento</span>
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer"
                    >
                        Volver
                    </button>
                </div>
            </div>

            {/* Progress Card */}
            <div className="bg-white p-4 rounded border border-gray-200 flex flex-col md:flex-row gap-5 items-center justify-between">
                <div className="space-y-1.5 w-full md:w-2/3">
                    <div className="flex justify-between items-center text-xs font-medium text-gray-700">
                        <span>Completitud de Documentación</span>
                        <span className="font-mono font-semibold text-gray-900 tabular-nums">{completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded overflow-hidden border border-gray-200">
                        <div
                            className={`h-full rounded transition-all duration-300 ${
                                completionPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                    <p className="text-[11px] text-gray-500 font-mono tabular-nums">
                        {verifiedCount} de {totalRequired} documentos requeridos verificados.
                    </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-3 rounded text-center w-full md:w-auto shrink-0">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Estado Expediente</p>
                    <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded border ${
                        completionPercentage === 100
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                        {completionPercentage === 100 ? 'EXPEDIENTE COMPLETO' : 'DOCUMENTACIÓN PENDIENTE'}
                    </span>
                </div>
            </div>

            {/* Checklist Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {safeChecklist.length > 0 ? (
                    safeChecklist.map((item, idx) => (
                        <div 
                            key={idx} 
                            className="bg-white p-4 rounded border border-gray-200 flex flex-col justify-between space-y-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded bg-gray-100 text-gray-600 flex items-center justify-center font-mono shrink-0">
                                        <DocumentIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-xs text-gray-900">{item.label}</h4>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            {item.required ? 'Documento Obligatorio' : 'Opcional'}
                                        </p>
                                    </div>
                                </div>
                                {getStatusBadge(item.status)}
                            </div>

                            {item.document ? (
                                <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-mono text-xs text-gray-700 truncate max-w-[200px]">
                                            {item.document.originalName || 'DocumentoAdjunto.pdf'}
                                        </span>
                                        <a
                                            href={item.document.documentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline font-medium text-xs"
                                        >
                                            Ver Documento
                                        </a>
                                    </div>

                                    {item.document.verificationNotes && (
                                        <p className="text-red-700 text-[11px] bg-red-50 p-1.5 rounded border border-red-200">
                                            Nota: {item.document.verificationNotes}
                                        </p>
                                    )}

                                    <div className="flex justify-between items-center text-gray-400 pt-1.5 border-t border-gray-200 text-[11px]">
                                        <span>Cargado: {item.document.createdAt ? new Date(item.document.createdAt).toLocaleDateString('es-EC') : 'Reciente'}</span>
                                        <button
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setReviewNotes(item.document.verificationNotes || '');
                                                setReviewModalOpen(true);
                                            }}
                                            className="text-blue-600 hover:underline font-medium cursor-pointer"
                                        >
                                            Validar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs text-gray-600 flex justify-between items-center">
                                    <span>Documento pendiente de carga</span>
                                    <button
                                        onClick={() => {
                                            setUploadCategory(item.categoryKey);
                                            setUploadModalOpen(true);
                                        }}
                                        className="border border-gray-300 hover:border-gray-400 text-gray-700 bg-white text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                    >
                                        Cargar Archivo
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-full bg-white p-8 rounded border border-gray-200 text-center text-gray-400 text-sm">
                        No hay elementos registrados en el expediente.
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {uploadModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-900">Cargar Documento de Expediente</h3>
                            <button onClick={() => setUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer">&times;</button>
                        </div>
                        <form onSubmit={handleUploadSubmit} className="p-5 space-y-3.5">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Categoría del Documento</label>
                                <select
                                    className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                                    value={uploadCategory}
                                    onChange={(e) => setUploadCategory(e.target.value)}
                                >
                                    <option value="IDENTIFICATION">Cédula / DNI</option>
                                    <option value="BANK_CERTIFICATE">Certificado Bancario</option>
                                    <option value="TITLE_DIPLOMA">Título / Certificado Académico</option>
                                    <option value="POLICE_RECORD">Antecedentes Penales / Policiales</option>
                                    <option value="CURRICULUM">Hoja de Vida / CV</option>
                                    <option value="SAFETY_CERTIFICATE">Certificado de Salud</option>
                                    <option value="OTHER">Otro Documento</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del Archivo</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Cedula_JuanPerez.pdf"
                                    className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Enlace / URL del Documento Digital</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://... o enlace de archivo"
                                    className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono"
                                    value={uploadUrl}
                                    onChange={(e) => setUploadUrl(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setUploadModalOpen(false)} className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50">
                                    {actionLoading ? 'Guardando...' : 'Cargar Documento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Review / Verification Modal for Admin */}
            {reviewModalOpen && selectedItem && selectedItem.document && (
                <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-900">Validar Documento</h3>
                            <button onClick={() => setReviewModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer">&times;</button>
                        </div>
                        <div className="p-5 space-y-3.5">
                            <p className="text-xs font-semibold text-gray-900">{selectedItem.label}</p>
                            <a
                                href={selectedItem.document.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-2 bg-gray-50 border border-gray-200 text-blue-600 text-xs text-center font-medium rounded hover:bg-gray-100"
                            >
                                Abrir Documento para Inspección ↗
                            </a>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones de Validación</label>
                                <textarea
                                    rows="2"
                                    placeholder="Ej. Documento verificado correctamente / Imagen ilegible..."
                                    className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    onClick={() => handleVerifyAction('REJECTED')}
                                    disabled={actionLoading}
                                    className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer"
                                >
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => handleVerifyAction('VERIFIED')}
                                    disabled={actionLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer"
                                >
                                    Aprobar y Verificar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeExpedient;

