import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    getAllExpedientsSummary,
    getEmployeeExpedient, 
    getMyExpedient,
    verifyExpedientDocument, 
    uploadExpedientDocument,
    deleteExpedientDocument
} from '../../services/employees/onboardingOffboarding.service';
import { 
    FiSearch, 
    FiArrowLeft, 
    FiUploadCloud, 
    FiExternalLink, 
    FiTrash2, 
    FiRefreshCw
} from 'react-icons/fi';

export default function EmployeeExpedient() {
    const { employeeId } = useParams();
    const navigate = useNavigate();

    // Modo de vista: 'directory' (cuando estamos en /admin/expedientes sin ID) o 'detail' (con ID o /my-expedient)
    const isMyExpedient = window.location.pathname.includes('/my-expedient');
    const isDetailMode = Boolean(employeeId) || isMyExpedient;
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'superadmin';

    // Estados para Modo Directorio General
    const [directoryData, setDirectoryData] = useState([]);
    const [directoryLoading, setDirectoryLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'COMPLETE' | 'INCOMPLETE' | 'PENDING_REVIEW'
    const [departmentFilter, setDepartmentFilter] = useState('ALL');

    // Estados para Modo Detalle de Expediente Individual
    const [expedientData, setExpedientData] = useState(null);
    const [expedientLoading, setExpedientLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadCategory, setUploadCategory] = useState('IDENTIFICATION');
    const [uploadUrl, setUploadUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [targetEmployeeId, setTargetEmployeeId] = useState('');
    const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);

    useEffect(() => {
        if (employeeId === 'undefined') {
            navigate(isAdmin ? '/admin/expedientes' : '/my-expedient', { replace: true });
            return;
        }

        if (isDetailMode) {
            loadExpedientDetail();
            if (isAdmin && !isMyExpedient) {
                getAllExpedientsSummary().then(res => {
                    if (res.success) setDirectoryData(res.data);
                }).catch(() => {});
            }
        } else {
            loadDirectory();
        }
    }, [employeeId, isDetailMode, isMyExpedient]);

    // Cargar Directorio de Todos los Expedientes
    const loadDirectory = async () => {
        setDirectoryLoading(true);
        try {
            const res = await getAllExpedientsSummary();
            if (res.success) {
                setDirectoryData(res.data);
            }
        } catch (error) {
            console.error('Error al cargar directorio de expedientes:', error);
        } finally {
            setDirectoryLoading(false);
        }
    };

    // Cargar Detalle de un Expediente
    const loadExpedientDetail = async () => {
        if (!employeeId && !isMyExpedient) return;
        setExpedientLoading(true);
        try {
            const res = isMyExpedient 
                ? await getMyExpedient()
                : await getEmployeeExpedient(employeeId);
            if (res.success) {
                setExpedientData(res.data);
                if (employeeId) setTargetEmployeeId(employeeId);
            } else {
                setExpedientData(null);
            }
        } catch (error) {
            console.error('Error al cargar expediente individual:', error);
            setExpedientData(null);
        } finally {
            setExpedientLoading(false);
        }
    };

    // Manejo de Subida de Archivos
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = () => {
            setUploadUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadUrl.trim()) {
            alert('Por favor selecciona un archivo o ingresa el enlace del documento.');
            return;
        }

        setActionLoading(true);
        try {
            const res = await uploadExpedientDocument({
                employeeId: targetEmployeeId || employeeId || expedientData?.employee?.id,
                type: uploadCategory,
                documentCategory: uploadCategory,
                documentUrl: uploadUrl.trim(),
                originalName: fileName.trim() || 'documento.pdf',
                expiryDate: expiryDate ? expiryDate : null
            });

            if (res.success) {
                setUploadModalOpen(false);
                setUploadUrl('');
                setFileName('');
                setExpiryDate('');
                if (isDetailMode) {
                    loadExpedientDetail();
                } else {
                    loadDirectory();
                }
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Validación / Aprobación / Rechazo
    const handleVerifyAction = async (status) => {
        if (!selectedItem || !selectedItem.document) return;
        setActionLoading(true);
        try {
            const res = await verifyExpedientDocument(selectedItem.document.id, status, reviewNotes);
            if (res.success) {
                setReviewModalOpen(false);
                setSelectedItem(null);
                setReviewNotes('');
                if (isDetailMode) {
                    loadExpedientDetail();
                } else {
                    loadDirectory();
                }
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Eliminación de Documento
    const handleDeleteDocumentConfirm = async () => {
        if (!documentToDelete?.id) return;
        setActionLoading(true);
        try {
            const res = await deleteExpedientDocument(documentToDelete.id);
            if (res.success) {
                setDeleteConfirmModalOpen(false);
                setDocumentToDelete(null);
                if (isDetailMode) {
                    loadExpedientDetail();
                } else {
                    loadDirectory();
                }
            }
        } catch (error) {
            console.error(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Filtrado de empleados en el directorio
    const filteredEmployees = useMemo(() => {
        if (!directoryData?.employees) return [];
        let list = directoryData.employees;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(emp => 
                emp.fullName.toLowerCase().includes(q) ||
                emp.identityCard.toLowerCase().includes(q) ||
                emp.department.toLowerCase().includes(q) ||
                emp.position.toLowerCase().includes(q)
            );
        }

        if (departmentFilter !== 'ALL') {
            list = list.filter(emp => emp.department === departmentFilter);
        }

        if (statusFilter === 'PENDING_REVIEW') {
            list = list.filter(emp => emp.pendingReviewCount > 0);
        } else if (statusFilter === 'INCOMPLETE') {
            list = list.filter(emp => !emp.isComplete);
        } else if (statusFilter === 'COMPLETE') {
            list = list.filter(emp => emp.isComplete);
        }

        return list;
    }, [directoryData, searchQuery, departmentFilter, statusFilter]);

    // Lista única de departamentos
    const departments = useMemo(() => {
        if (!directoryData?.employees) return [];
        const set = new Set(directoryData.employees.map(e => e.department).filter(Boolean));
        return Array.from(set);
    }, [directoryData]);

    const stats = directoryData?.stats || {
        totalEmployees: 0,
        completeCount: 0,
        incompleteCount: 0,
        pendingReviewsGlobal: 0,
        avgCompletion: 0
    };

    // -------------------------------------------------------------
    // RENDER: VISTA UNIFICADA
    // -------------------------------------------------------------
    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            {isDetailMode ? (
                expedientLoading ? (
                    <div className="p-12 text-center text-gray-400 text-xs font-mono">
                        Cargando Expediente Digital...
                    </div>
                ) : !expedientData ? (
                    <div className="bg-white p-8 rounded border border-gray-200 text-center max-w-md mx-auto my-12 space-y-4">
                        <p className="text-sm font-semibold text-gray-900">Expediente no disponible</p>
                        <p className="text-xs text-gray-500">No se encontró información documental para este colaborador.</p>
                        <button
                            onClick={() => navigate('/admin/expedientes')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                        >
                            Volver al Directorio de Expedientes
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Selector Rápido de Expediente de Colaborador */}
                        {(Array.isArray(directoryData) ? directoryData : (directoryData?.employees || [])).length > 0 && !window.location.pathname.includes('/my-expedient') && (
                            <div className="bg-white p-3.5 rounded border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700 whitespace-nowrap">Expediente de:</span>
                                    <select
                                        value={expedientData?.employee?.id || employeeId}
                                        onChange={(e) => navigate(`/admin/expedientes/${e.target.value}`)}
                                        className="bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-blue-500 cursor-pointer max-w-xs"
                                    >
                                        {(Array.isArray(directoryData) ? directoryData : (directoryData?.employees || [])).map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.firstName} {emp.lastName} ({emp.completionPercentage}% - {emp.identityCard || 'S/N'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        to={`/admin/employees/${expedientData?.employee?.id || employeeId}`}
                                        className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded transition-colors text-xs font-medium cursor-pointer"
                                    >
                                        Ver Ficha del Colaborador
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Header Limpio Directo a Datos */}
                        <div className="bg-white p-5 rounded border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono">
                                        {isMyExpedient ? 'Mi Portal · Expediente Digital' : 'Gestión de Capital Humano'}
                                    </span>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 font-mono">
                                        Cédula #{expedientData?.employee?.identityCard || 'S/N'}
                                    </span>
                                </div>
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                                    {isMyExpedient 
                                        ? 'Mi Expediente Digital' 
                                        : `Expediente de ${expedientData?.employee?.firstName} ${expedientData?.employee?.lastName}`}
                                </h1>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isMyExpedient ? (
                                        <>Consulta el estado de tu documentación laboral, contratos y requisitos legales.</>
                                    ) : (
                                        <>Cargo: <span className="font-semibold text-gray-800">{expedientData?.employee?.position || 'Colaborador'}</span> · Departamento: <span className="font-semibold text-gray-800">{expedientData?.employee?.department || 'General'}</span></>
                                    )}
                                    {' · '}Completitud: <span className="font-semibold font-mono text-gray-800 tabular-nums">{expedientData?.completionPercentage || 0}% ({expedientData?.verifiedCount || 0}/{expedientData?.totalRequired || 0} requeridos)</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => {
                                        setTargetEmployeeId(expedientData?.employee?.id);
                                        setUploadCategory('IDENTIFICATION');
                                        setUploadModalOpen(true);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                                >
                                    <FiUploadCloud className="w-3.5 h-3.5" />
                                    <span>Adjuntar Documento</span>
                                </button>

                                {!isMyExpedient && (
                                    <button
                                        onClick={() => navigate('/admin/expedientes')}
                                        className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer inline-flex items-center gap-1.5 bg-white"
                                    >
                                        <FiArrowLeft className="w-3.5 h-3.5" />
                                        <span>Volver al Directorio</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Cuadrícula de Categorías Documentales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(expedientData?.checklist || []).map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="bg-white p-4 rounded border border-gray-200 flex flex-col justify-between space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className="font-semibold text-xs text-gray-900 leading-snug">{item.label}</h4>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                {item.required ? 'Obligatorio por ley laboral' : 'Documento complementario'}
                                            </p>
                                        </div>
                                        {item.status === 'VERIFIED' ? (
                                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                VERIFICADO
                                            </span>
                                        ) : item.status === 'PENDING' ? (
                                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                                PENDIENTE REVISIÓN
                                            </span>
                                        ) : item.status === 'REJECTED' ? (
                                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                                RECHAZADO
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                                NO CARGADO
                                            </span>
                                        )}
                                    </div>

                                    {item.document ? (
                                        <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-gray-800 truncate max-w-[220px]" title={item.document.originalName}>
                                                    {item.document.originalName || 'Archivo adjunto'}
                                                </span>
                                                <a 
                                                    href={item.document.documentUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 font-medium text-[11px]"
                                                >
                                                    <span>Ver</span>
                                                    <FiExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>

                                            {item.document.expiryDate && (
                                                <p className="text-[11px] text-gray-500 font-mono">
                                                    Caducidad: {new Date(item.document.expiryDate).toLocaleDateString('es-EC')}
                                                </p>
                                            )}

                                            {item.document.verificationNotes && (
                                                <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                                                    Observación: {item.document.verificationNotes}
                                                </p>
                                            )}

                                            <div className="flex justify-between items-center text-gray-400 pt-1.5 border-t border-gray-200 text-[11px]">
                                                <span>Subido: {new Date(item.document.createdAt).toLocaleDateString('es-EC')}</span>
                                                <div className="flex items-center gap-3">
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setReviewNotes(item.document.verificationNotes || '');
                                                                setReviewModalOpen(true);
                                                            }}
                                                            className="text-blue-600 hover:underline font-medium cursor-pointer"
                                                        >
                                                            Revisar
                                                        </button>
                                                    )}
                                                    {(isAdmin || item.document.status === 'PENDING') && (
                                                        <button
                                                            onClick={() => {
                                                                setDocumentToDelete({
                                                                    id: item.document.id,
                                                                    name: item.document.originalName || item.label,
                                                                    category: item.label
                                                                });
                                                                setDeleteConfirmModalOpen(true);
                                                            }}
                                                            className="text-gray-400 hover:text-rose-600 cursor-pointer"
                                                            title="Eliminar documento"
                                                        >
                                                            <FiTrash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                                            <span>Pendiente de adjuntar</span>
                                            <button
                                                onClick={() => {
                                                    setTargetEmployeeId(expedientData?.employee?.id);
                                                    setUploadCategory(item.categoryKey);
                                                    setUploadModalOpen(true);
                                                }}
                                                className="border border-gray-300 hover:border-gray-400 text-gray-700 bg-white text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                            >
                                                Subir Archivo
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            ) : (
                <div className="space-y-6">
                    {/* Header Limpio del Directorio */}
                    <div className="bg-white p-5 rounded border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono">
                                    Gestión de Capital Humano
                                </span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                                    Expedientes Digitales
                                </span>
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                                Expedientes Digitales de Personal
                            </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Supervisa el cumplimiento de contratos, cédulas y documentos legales de todos los colaboradores.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={loadDirectory}
                        disabled={directoryLoading}
                        className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer bg-white flex items-center gap-1.5"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${directoryLoading ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                    </button>
                    <button
                        onClick={() => {
                            setUploadCategory('IDENTIFICATION');
                            setUploadModalOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <FiUploadCloud className="w-3.5 h-3.5" />
                        <span>Adjuntar Documento</span>
                    </button>
                </div>
            </div>

            {/* Pestañas de Filtro con Contadores Tabulares + Buscador */}
            <div className="bg-white border border-gray-200 rounded p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Tabs con Borde Inferior Activo 2px #111827 */}
                    <div className="flex items-center gap-6 border-b border-gray-200 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('ALL')}
                            className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                                statusFilter === 'ALL'
                                    ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Todos <span className="font-mono tabular-nums text-gray-400">({stats.totalEmployees})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('PENDING_REVIEW')}
                            className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                                statusFilter === 'PENDING_REVIEW'
                                    ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Por Validar <span className={`font-mono tabular-nums ${stats.pendingReviewsGlobal > 0 ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>({stats.pendingReviewsGlobal})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('INCOMPLETE')}
                            className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                                statusFilter === 'INCOMPLETE'
                                    ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Incompletos <span className="font-mono tabular-nums text-gray-400">({stats.incompleteCount})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('COMPLETE')}
                            className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                                statusFilter === 'COMPLETE'
                                    ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Completos <span className="font-mono tabular-nums text-gray-400">({stats.completeCount})</span>
                        </button>
                    </div>

                    {/* Filtros de Búsqueda y Departamento */}
                    <div className="flex items-center gap-3">
                        <div className="relative w-full sm:w-64">
                            <FiSearch className="absolute left-3 top-2 text-gray-400" size={13} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por nombre, cédula o cargo..."
                                className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1.5 text-gray-400 hover:text-gray-700 text-xs font-medium cursor-pointer"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="ALL">Todos los Departamentos</option>
                            {departments.map((dept, idx) => (
                                <option key={idx} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tabla de Expedientes Directa */}
                <div className="border border-gray-200 rounded overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="py-2.5 px-4">Colaborador</th>
                                    <th className="py-2.5 px-4">C.I. / DNI</th>
                                    <th className="py-2.5 px-4">Departamento y Cargo</th>
                                    <th className="py-2.5 px-4 w-44">Completitud</th>
                                    <th className="py-2.5 px-4">Aprobados</th>
                                    <th className="py-2.5 px-4">Por Validar</th>
                                    <th className="py-2.5 px-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {directoryLoading ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-gray-400 font-mono text-xs">
                                            Cargando expedientes de colaboradores...
                                        </td>
                                    </tr>
                                ) : filteredEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-gray-400 text-xs">
                                            No se encontraron colaboradores con los criterios especificados.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEmployees.map((emp) => (
                                        <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                                            <td className="py-2.5 px-4 font-semibold text-gray-900">
                                                {emp.fullName}
                                                <p className="text-[11px] font-normal text-gray-400">{emp.email}</p>
                                            </td>
                                            <td className="py-2.5 px-4 font-mono tabular-nums text-gray-700">
                                                {emp.identityCard}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <span className="text-gray-900 font-medium">{emp.position}</span>
                                                <p className="text-[11px] text-gray-400">{emp.department}</p>
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums mb-1">
                                                    <span>{emp.completionPercentage}%</span>
                                                    <span className="text-gray-400">{emp.verifiedRequired}/{emp.totalRequired}</span>
                                                </div>
                                                <div className="w-full bg-gray-100 h-1.5 rounded overflow-hidden border border-gray-200">
                                                    <div 
                                                        className="bg-gray-800 h-full rounded"
                                                        style={{ width: `${emp.completionPercentage}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-4 font-mono tabular-nums text-emerald-700 font-semibold">
                                                {emp.verifiedCount}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                {emp.pendingReviewCount > 0 ? (
                                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                        {emp.pendingReviewCount} pendiente{emp.pendingReviewCount > 1 ? 's' : ''}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 font-mono text-[11px]">—</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/admin/expedientes/${emp.id}`)}
                                                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                                                >
                                                    Ver Expediente →
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )}

            {/* Modal de Subida de Documento */}
            {uploadModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-900">Cargar Documento al Expediente</h3>
                            <button 
                                onClick={() => setUploadModalOpen(false)} 
                                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleUploadSubmit} className="p-5 space-y-3.5">
                            {!isDetailMode && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Colaborador Destino</label>
                                    <select
                                        className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
                                        value={targetEmployeeId}
                                        onChange={(e) => setTargetEmployeeId(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecciona un colaborador...</option>
                                        {(Array.isArray(directoryData) ? directoryData : (directoryData?.employees || [])).map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.fullName || `${emp.firstName} ${emp.lastName}`} ({emp.identityCard || 'S/N'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Categoría del Documento</label>
                                <select
                                    className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
                                    value={uploadCategory}
                                    onChange={(e) => setUploadCategory(e.target.value)}
                                >
                                    <option value="IDENTIFICATION">Cédula de Identidad / DNI</option>
                                    <option value="LABOR_CONTRACT">Contrato Laboral Firmado</option>
                                    <option value="BANK_CERTIFICATE">Certificado Bancario de Nómina</option>
                                    <option value="TITLE_DIPLOMA">Título Académico / Certificado de Estudios</option>
                                    <option value="POLICE_RECORD">Certificado de Antecedentes Penales</option>
                                    <option value="CURRICULUM">Hoja de Vida / Currículum Vitae</option>
                                    <option value="SAFETY_CERTIFICATE">Certificado Médico / Salud Ocupacional</option>
                                    <option value="IESS_AFFILIATION">Aviso de Entrada / Afiliación IESS</option>
                                    <option value="DISCIPLINARY_RECORD">Memorando o Novedad Disciplinaria</option>
                                    <option value="OTHER">Otro Documento</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Adjuntar Archivo Local (PDF o Imagen)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                    onChange={handleFileUpload}
                                    className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">O Enlace / URL Digital Directa</label>
                                <input
                                    type="url"
                                    placeholder="https://... (opcional si ya seleccionaste un archivo)"
                                    className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                                    value={uploadUrl}
                                    onChange={(e) => setUploadUrl(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de Caducidad / Vencimiento (Opcional)</label>
                                <input
                                    type="date"
                                    className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                                <button 
                                    type="button" 
                                    onClick={() => setUploadModalOpen(false)} 
                                    className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={actionLoading} 
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {actionLoading ? 'Guardando...' : 'Guardar en Expediente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Validación por RRHH / Admin */}
            {reviewModalOpen && selectedItem && selectedItem.document && (
                <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-900">Validar Documento</h3>
                            <button 
                                onClick={() => setReviewModalOpen(false)} 
                                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-5 space-y-3.5">
                            <p className="text-xs font-semibold text-gray-900">{selectedItem.label}</p>
                            <a
                                href={selectedItem.document.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 bg-gray-50 border border-gray-200 text-blue-600 text-xs text-center font-medium rounded hover:bg-gray-100 flex items-center justify-center gap-1.5"
                            >
                                Abrir Documento para Inspección <FiExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones de Validación</label>
                                <textarea
                                    rows="2"
                                    placeholder="Ej. Documento verificado correctamente / Falta firma / Ilegible..."
                                    className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 resize-none"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => handleVerifyAction('REJECTED')}
                                    disabled={actionLoading}
                                    className="border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer"
                                >
                                    Rechazar Documento
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

            {/* Modal de Confirmación Destructiva (Eliminar Documento) */}
            {deleteConfirmModalOpen && documentToDelete && (
                <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-sm font-semibold text-gray-900">Eliminar Documento</h3>
                            <button 
                                onClick={() => {
                                    setDeleteConfirmModalOpen(false);
                                    setDocumentToDelete(null);
                                }} 
                                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-5 space-y-2">
                            <p className="text-xs text-gray-700 leading-relaxed">
                                ¿Confirmas que deseas eliminar <strong className="text-gray-900 font-semibold">{documentToDelete.name}</strong> ({documentToDelete.category}) del expediente?
                            </p>
                            <p className="text-[11px] text-gray-400">
                                Esta acción eliminará el archivo del registro y recalculará la completitud del colaborador.
                            </p>
                        </div>
                        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeleteConfirmModalOpen(false);
                                    setDocumentToDelete(null);
                                }}
                                className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteDocumentConfirm}
                                disabled={actionLoading}
                                className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {actionLoading ? 'Eliminando...' : 'Eliminar Documento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
