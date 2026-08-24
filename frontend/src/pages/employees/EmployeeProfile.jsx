import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    getEmployeeById,
    getEmployees,
    updateEmployee,
    getEmployeeHistory,
    getContracts,
    uploadDocument,
    getDocuments,
    deleteDocument,
    getProfile,
    terminateEmployee
} from '../../services/employees/employee.service';
import EditEmployeeModal from './components/EditEmployeeModal';
import SkillsTab from './components/SkillsTab';
import ContractsTab from './components/ContractsTab';
import { InfoItem } from './components/EmployeeHelpers';
import BiometricSettings from '../../components/attendance/BiometricSettings';
import { CIVIL_STATUS_OPTIONS, CONTRACT_TYPES } from '../../constants/employeeOptions';
import { validateEmail, validatePhone, validateSalary, validateDates } from '../../utils/validationUtils';
import { isSuperAdmin as checkIsSuperAdmin } from '../../constants/roles.js';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const EmployeeProfile = ({ token, user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [employeesList, setEmployeesList] = useState([]);
    const [history, setHistory] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const [documentForm, setDocumentForm] = useState({
        type: 'DNI',
        file: null,
        expiryDate: ''
    });

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [notification, setNotification] = useState(null);

    // Modal de Baja de Colaborador (Elimina prompt/confirm)
    const [isTerminateOpen, setIsTerminateOpen] = useState(false);
    const [terminateForm, setTerminateForm] = useState({
        exitDate: new Date().toISOString().split('T')[0],
        exitReason: 'Renuncia Voluntaria',
        exitType: 'Voluntary',
        notes: ''
    });
    const [isTerminating, setIsTerminating] = useState(false);

    // Modal de Confirmación para Eliminar Documento
    const [docToDelete, setDocToDelete] = useState(null);

    const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    useEffect(() => {
        if (isAdminOrHR && token && id) {
            getEmployees(token).then(res => {
                const list = res?.data?.employees || res?.data || [];
                if (Array.isArray(list)) {
                    setEmployeesList(list);
                }
            }).catch(console.error);
        }
    }, [isAdminOrHR, token, id]);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (token) {
            fetchEmployee();
        }
    }, [id, token]);

    const fetchEmployee = async () => {
        if (!token) return;
        setLoading(true);
        try {
            let data;
            if (id) {
                // Ficha 360° de un empleado específico
                data = await getEmployeeById(id.trim(), token);
            } else {
                // Perfil propio del usuario autenticado (/profile)
                data = await getProfile(token);
            }

            if (data && data.data) {
                setEmployee(data.data);
                // Pre-cargar colecciones iniciales si vienen anidadas
                if (data.data.contracts) setContracts(data.data.contracts);
                if (data.data.documents) setDocuments(data.data.documents);
                if (data.data.workHistory) setHistory(data.data.workHistory);
            } else if (data && (data.isSuperAdmin || checkIsSuperAdmin(user))) {
                setEmployee(null);
            } else {
                showNotification('error', 'No se pudo cargar la información del perfil');
            }
        } catch (err) {
            console.error("Profile Error:", err);
            showNotification('error', err.message || 'Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        const targetId = id || employee?.id;
        if (!targetId) return;
        try {
            const data = await getEmployeeHistory(targetId, token);
            setHistory(data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchContracts = async () => {
        const targetId = id || employee?.id;
        if (!targetId) return;
        try {
            const data = await getContracts(targetId, token);
            setContracts(data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDocuments = async () => {
        const targetId = id || employee?.id;
        if (!targetId) return;
        try {
            const data = await getDocuments(targetId, token);
            setDocuments(data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') fetchHistory();
        else if (activeTab === 'contracts') fetchContracts();
        else if (activeTab === 'documents') fetchDocuments();
    }, [activeTab]);

    const handleDocumentChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'file') {
            const file = files[0];
            if (file && file.size > 4 * 1024 * 1024) {
                showNotification('error', 'El archivo supera el límite permitido de 4MB.');
                e.target.value = null;
                setDocumentForm(prev => ({ ...prev, [name]: null }));
                return;
            }
            setDocumentForm(prev => ({ ...prev, [name]: file }));
        } else {
            setDocumentForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleUploadDocument = async (e) => {
        e.preventDefault();
        if (!documentForm.file) return showNotification('error', 'Seleccione un archivo');

        const targetId = id || employee?.id;
        const formData = new FormData();
        formData.append('employeeId', targetId);
        formData.append('type', documentForm.type);
        formData.append('document', documentForm.file);
        if (documentForm.expiryDate) formData.append('expiryDate', documentForm.expiryDate);

        setIsUploading(true);
        try {
            await uploadDocument(formData, token);
            await fetchDocuments();
            setIsUploading(false);
            setDocumentForm({ type: 'DNI', file: null, expiryDate: '' });
            showNotification('success', 'Documento subido correctamente');
        } catch (err) {
            showNotification('error', err.message || 'Error al subir documento');
            setIsUploading(false);
        }
    };

    const handleConfirmDeleteDoc = async () => {
        if (!docToDelete) return;
        try {
            await deleteDocument(docToDelete, token);
            await fetchDocuments();
            setDocToDelete(null);
            showNotification('success', 'Documento eliminado correctamente');
        } catch (err) {
            showNotification('error', err.message || 'Error al eliminar documento');
        }
    };

    const handleAddSkillLocal = (newSkill) => {
        setEmployee(prev => ({
            ...prev,
            skills: [...(prev.skills || []), newSkill]
        }));
    };

    const handleDeleteSkillLocal = (skillId) => {
        setEmployee(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s.id !== skillId)
        }));
    };

    const handleEditClick = () => {
        setEditForm({
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone,
            address: employee.address,
            department: employee.department,
            position: employee.position,
            salary: employee.salary,
            civilStatus: employee.civilStatus,
            birthDate: employee.birthDate ? new Date(employee.birthDate).toISOString().split('T')[0] : '',
            hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
            contractType: employee.contractType,
            hasNightSurcharge: employee.contracts?.find(c => c.status === 'Active')?.hasNightSurcharge ?? true,
            hasDoubleOvertime: employee.contracts?.find(c => c.status === 'Active')?.hasDoubleOvertime ?? true,
            bankName: employee.bankName || '',
            accountNumber: employee.accountNumber || '',
            accountType: employee.accountType || 'Ahorros',
            workLatitude: employee.workLatitude || '',
            workLongitude: employee.workLongitude || '',
            geofenceRadius: employee.geofenceRadius || 200,
            enforceGeofence: employee.enforceGeofence || false
        });
        setFieldErrors({});
        setIsEditing(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));

        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();

        const errors = {};
        if (user?.role === 'admin') {
            const emailErr = validateEmail(editForm.email);
            if (emailErr) errors.email = emailErr;

            const salaryErr = validateSalary(editForm.salary);
            if (salaryErr) errors.salary = salaryErr;

            const dateErr = validateDates(editForm.birthDate, editForm.hireDate);
            if (dateErr) errors.dates = dateErr;
        }

        const phoneErr = validatePhone(editForm.phone);
        if (phoneErr) errors.phone = phoneErr;

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            showNotification('error', 'Por favor corrija los errores en el formulario');
            return;
        }

        try {
            const targetId = id || employee?.id;
            await updateEmployee(targetId, {
                ...editForm,
                salary: Number(editForm.salary),
                birthDate: new Date(editForm.birthDate),
                hireDate: new Date(editForm.hireDate)
            }, token);
            await fetchEmployee();
            setIsEditing(false);
            if (activeTab === 'history') fetchHistory();
            showNotification('success', 'Perfil actualizado correctamente');
        } catch (err) {
            showNotification('error', err.message || 'Error al actualizar perfil');
        }
    };

    const handleTerminateSubmit = async (e) => {
        e.preventDefault();
        setIsTerminating(true);
        try {
            await terminateEmployee(employee.id, {
                exitDate: new Date(terminateForm.exitDate),
                exitReason: terminateForm.exitReason + (terminateForm.notes ? `: ${terminateForm.notes}` : ''),
                exitType: terminateForm.exitType
            }, token);
            setIsTerminateOpen(false);
            showNotification('success', 'Empleado dado de baja exitosamente');
            await fetchEmployee();
        } catch (err) {
            showNotification('error', err.message || 'Error al procesar la baja');
        } finally {
            setIsTerminating(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-400 text-xs">Cargando perfil...</div>;

    const isSuperAdminUser = checkIsSuperAdmin(user);

    if (!employee && isSuperAdminUser) {
        return (
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="bg-white rounded p-5 border border-gray-200">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                        <div className="w-10 h-10 rounded bg-gray-900 text-white flex items-center justify-center font-mono font-semibold text-xs shrink-0">
                            SA
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{user?.firstName || 'SuperAdmin'} {user?.lastName || 'SaaS'}</h1>
                            <p className="text-xs font-mono text-purple-700 mt-0.5">SuperAdministrador Global · Dueño de Plataforma</p>
                            <p className="text-xs text-gray-400 font-mono tabular-nums">{user?.email || 'admin@emplifi.com'}</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Detalles de la Cuenta de Plataforma</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block font-sans">Rol en el Sistema</span>
                                <span className="font-semibold text-gray-900 text-xs mt-0.5 block">SuperAdmin (Dueño de Software)</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block font-sans">Alcance de Aislamiento</span>
                                <span className="font-semibold text-emerald-700 text-xs mt-0.5 block font-mono">Multi-Tenant Global</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block font-sans">Permisos Especiales</span>
                                <span className="font-semibold text-blue-700 text-xs mt-0.5 block">Inspección, Gestión SaaS & Auditoría</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block font-sans">Estado de Sesión</span>
                                <span className="font-semibold text-emerald-700 text-xs mt-0.5 block">Autenticación Activa</span>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                            <button
                                onClick={() => navigate('/superadmin/dashboard')}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Ir al Backoffice SuperAdmin
                            </button>
                            <button
                                onClick={() => navigate('/superadmin/audit')}
                                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Ver Auditoría Global
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!employee) return <div className="p-12 text-center text-gray-400 text-xs">Colaborador no encontrado</div>;

    const tabs = [
        { id: 'personal', label: 'Información Personal' },
        { id: 'job', label: 'Datos Laborales' },
        { id: 'contracts', label: 'Contratos', count: contracts.length },
        { id: 'documents', label: 'Documentos', count: documents.length },
        { id: 'history', label: 'Historial', count: history.length },
        { id: 'skills', label: 'Habilidades', count: employee.skills?.length || 0 },
        (!id || id === user?.id) && { id: 'security', label: 'Seguridad' },
    ].filter(Boolean);

    return (
        <div className="space-y-4">
            {/* Notificación Toast Sobria */}
            {notification && (
                <div
                    className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded border text-xs font-medium shadow-md transition-all ${
                        notification.type === 'success'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-red-50 text-red-900 border-red-200'
                    }`}
                >
                    {notification.message}
                </div>
            )}

            {/* Selector de Empleado para Administradores cuando ven un ID específico */}
            {isAdminOrHR && id && employeesList.length > 0 && (
                <div className="bg-white p-3 rounded border border-gray-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-600">Visualizando Colaborador:</span>
                        <select
                            value={employee.id}
                            onChange={(e) => navigate(`/admin/employees/${e.target.value}`)}
                            className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-medium"
                        >
                            {employeesList.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName} ({emp.identityCard || emp.position})
                                </option>
                            ))}
                        </select>
                    </div>
                    <Link
                        to="/profile"
                        className="text-xs text-blue-600 hover:underline font-medium"
                    >
                        ← Ir a Mi Perfil Personal
                    </Link>
                </div>
            )}

            {/* Header ERP con Balance Operativo */}
            <div className="bg-white rounded p-5 border border-gray-200 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-mono font-bold text-gray-800 text-base shrink-0">
                            {employee.firstName?.charAt(0) || 'U'}{employee.lastName?.charAt(0) || ''}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold text-gray-900 leading-tight">
                                    {employee.firstName} {employee.lastName}
                                </h1>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                                    employee.isActive
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-red-50 text-red-800 border-red-200'
                                }`}>
                                    {employee.isActive ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                            </div>
                            <p className="text-xs font-medium text-blue-700 mt-0.5">
                                {employee.position} · <span className="text-gray-500">{employee.department}</span>
                            </p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5 tabular-nums">{employee.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {id && (
                            <Link
                                to={`/admin/expedientes/${employee.id}`}
                                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Ver Expediente Digital ↗
                            </Link>
                        )}
                        <button
                            onClick={handleEditClick}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                        >
                            Editar Perfil
                        </button>
                        {id && (
                            <button
                                onClick={() => navigate('/admin/employees')}
                                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Volver a Nómina
                            </button>
                        )}
                        {employee.isActive && user?.role === 'admin' && id && (
                            <button
                                onClick={() => setIsTerminateOpen(true)}
                                className="px-3 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Dar de Baja
                            </button>
                        )}
                    </div>
                </div>

                {/* Resumen Métrico en Línea */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50/70 p-3 rounded border border-gray-200">
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Departamento</span>
                        <span className="font-semibold text-gray-900">{employee.department || '—'}</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Tipo de Contrato</span>
                        <span className="font-semibold text-gray-900">{CONTRACT_TYPES.find(c => c.value === employee.contractType)?.label || employee.contractType || 'Indefinido'}</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Fecha de Ingreso</span>
                        <span className="font-mono text-gray-800 tabular-nums">
                            {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('es-EC') : '—'}
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Salario Base</span>
                        <span className="font-mono text-emerald-800 font-semibold tabular-nums">
                            {employee.salary != null ? `$${employee.salary.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD` : 'Confidencial'}
                        </span>
                    </div>
                </div>

                {/* Pestañas con Contadores Integrados */}
                <div className="flex border-b border-gray-200 overflow-x-auto gap-1 text-xs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-2.5 px-3 font-medium transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                                activeTab === tab.id
                                    ? 'border-gray-900 text-gray-900 font-semibold'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className="ml-1.5 font-mono text-[11px] text-gray-400">({tab.count})</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido de la Pestaña Activa */}
            <div className="bg-white rounded p-5 border border-gray-200 min-h-[350px]">
                {activeTab === 'personal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <InfoItem label="Cédula / Identificación Fiscal" value={employee.identityCard} isMasked={true} />
                        <InfoItem label="Fecha de Nacimiento" value={employee.birthDate ? new Date(employee.birthDate).toLocaleDateString('es-EC') : 'N/A'} />
                        <InfoItem label="Estado Civil" value={CIVIL_STATUS_OPTIONS.find(c => c.value === employee.civilStatus)?.label || employee.civilStatus} />
                        <InfoItem label="Dirección Domiciliaria" value={employee.address} />
                        <InfoItem label="Teléfono de Contacto" value={employee.phone} />
                        <InfoItem label="Correo Electrónico" value={employee.email} />
                    </div>
                )}

                {activeTab === 'job' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <InfoItem label="Departamento" value={employee.department} />
                        <InfoItem label="Cargo / Posición" value={employee.position} />
                        <InfoItem label="Fecha de Ingreso" value={employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('es-EC') : 'N/A'} />
                        <InfoItem label="Modalidad de Contrato" value={CONTRACT_TYPES.find(c => c.value === employee.contractType)?.label || employee.contractType} />
                        <InfoItem label="Salario Base Mensual" value={employee.salary != null ? `$${employee.salary.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD` : null} isPrivate />
                        <InfoItem label="Rol en el Sistema" value={{ admin: 'Administrador', employee: 'Colaborador', manager: 'Gerente / Supervisor' }[employee.role] || employee.role} />
                        <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-gray-100">
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos Bancarios para Acreditación</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <InfoItem label="Institución Bancaria" value={employee.bankName} isPrivate />
                                <InfoItem label="N° Cuenta" value={employee.accountNumber} isPrivate />
                                <InfoItem label="Tipo de Cuenta" value={employee.accountType} isPrivate />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'contracts' && (
                    <ContractsTab
                        contracts={contracts}
                        user={user}
                        employeeId={employee.id}
                        token={token}
                        onUpdate={fetchContracts}
                    />
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-4">
                        <div className="bg-gray-50/70 p-4 rounded border border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Subir Nuevo Documento Adjunto</p>
                            <form onSubmit={handleUploadDocument} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end text-xs">
                                <div>
                                    <label className="block text-gray-600 mb-1">Tipo de Documento</label>
                                    <select
                                        name="type"
                                        value={documentForm.type}
                                        onChange={handleDocumentChange}
                                        className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="DNI">Cédula / Pasaporte</option>
                                        <option value="Licencia">Licencia de Conducir</option>
                                        <option value="Certificado">Certificado de Salud / Estudio</option>
                                        <option value="Contrato_Firmado">Contrato Firmado</option>
                                        <option value="CV">Hoja de Vida (CV)</option>
                                        <option value="Otro">Otro Documento</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-600 mb-1">Archivo (PDF / Imagen, Máx 4MB)</label>
                                    <input
                                        type="file"
                                        name="file"
                                        onChange={handleDocumentChange}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="w-full text-xs text-gray-500 bg-white border border-gray-200 rounded px-2 py-1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-600 mb-1">Fecha de Vencimiento (Opcional)</label>
                                    <input
                                        type="date"
                                        name="expiryDate"
                                        value={documentForm.expiryDate}
                                        onChange={handleDocumentChange}
                                        className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="sm:col-span-3 flex justify-end pt-1">
                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        {isUploading ? 'Subiendo...' : 'Subir Documento'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {documents && documents.length > 0 ? (
                                documents.map((doc) => (
                                    <div key={doc.id} className="bg-white p-3.5 rounded border border-gray-200 text-xs flex flex-col justify-between space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-900">{doc.type}</p>
                                                <p className="text-[11px] text-gray-400 font-mono tabular-nums">
                                                    {new Date(doc.createdAt).toLocaleDateString('es-EC')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setDocToDelete(doc.id)}
                                                className="text-gray-400 hover:text-red-600 text-xs font-semibold px-1 cursor-pointer"
                                                title="Eliminar documento"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                        {doc.expiryDate && (
                                            <p className="text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded inline-block">
                                                Vence: {new Date(doc.expiryDate).toLocaleDateString('es-EC')}
                                            </p>
                                        )}
                                        <a
                                            href={`${API_URL}/documents/download/${doc.documentUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2.5 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium rounded text-center transition-colors block mt-2"
                                        >
                                            Ver / Descargar Archivo ↗
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-8 text-center text-gray-400 text-xs">
                                    No hay documentos adjuntos registrados en el expediente.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-3">
                        {history && history.length > 0 ? (
                            history.map((log) => (
                                <div key={log.id} className="bg-white p-3.5 rounded border border-gray-200 text-xs space-y-1.5">
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                                        <span className="font-semibold text-gray-900">{log.action}</span>
                                        <span className="text-[11px] font-mono text-gray-400 tabular-nums">
                                            {new Date(log.timestamp).toLocaleString('es-EC')}
                                        </span>
                                    </div>
                                    <div className="text-gray-600 space-y-0.5">
                                        {Object.keys(log.details || {}).map(field => (
                                            <div key={field} className="flex items-center gap-2">
                                                <span className="text-gray-400 font-medium capitalize">{field}:</span>
                                                <span className="line-through text-red-500 font-mono">{log.details[field]?.from}</span>
                                                <span className="text-gray-300">→</span>
                                                <span className="text-emerald-700 font-semibold font-mono">{log.details[field]?.to}</span>
                                            </div>
                                        ))}
                                        {(!log.details || Object.keys(log.details).length === 0) && (
                                            <span className="text-gray-400 italic">Sin detalles registrados</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-gray-400 text-xs">
                                No hay historial de cambios registrado.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'skills' && (
                    <SkillsTab
                        skills={employee.skills}
                        user={user}
                        employeeId={employee.id}
                        token={token}
                        onUpdate={fetchEmployee}
                        onAddSkill={handleAddSkillLocal}
                        onDeleteSkill={handleDeleteSkillLocal}
                    />
                )}

                {activeTab === 'security' && (
                    <div className="max-w-2xl mx-auto">
                        <BiometricSettings />
                    </div>
                )}
            </div>

            {/* Modal de Edición de Perfil */}
            <EditEmployeeModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                onSave={handleSaveEdit}
                editForm={editForm}
                onChange={handleEditChange}
                user={user}
                employeeIdentityCard={employee.identityCard}
                fieldErrors={fieldErrors}
            />

            {/* Modal Sobrio de Baja de Colaborador (Elimina confirm/prompt) */}
            {isTerminateOpen && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-md w-full overflow-hidden shadow-xl text-xs">
                        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Dar de Baja a Colaborador</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">{employee.firstName} {employee.lastName}</p>
                            </div>
                            <button
                                onClick={() => setIsTerminateOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleTerminateSubmit} className="p-5 space-y-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Fecha Efectiva de Salida
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={terminateForm.exitDate}
                                    onChange={e => setTerminateForm({ ...terminateForm, exitDate: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Tipo de Desvinculación
                                </label>
                                <select
                                    value={terminateForm.exitType}
                                    onChange={e => setTerminateForm({ ...terminateForm, exitType: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="Voluntary">Voluntaria (Renuncia)</option>
                                    <option value="Involuntary">Involuntaria (Despido)</option>
                                    <option value="ContractEnd">Fin de Contrato a Plazo Fijo</option>
                                    <option value="Retirement">Jubilación</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Motivo / Justificación
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Renuncia voluntaria por nuevos proyectos"
                                    value={terminateForm.exitReason}
                                    onChange={e => setTerminateForm({ ...terminateForm, exitReason: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Observaciones Adicionales
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Detalles sobre entrega de activos, liquidación, etc."
                                    value={terminateForm.notes}
                                    onChange={e => setTerminateForm({ ...terminateForm, notes: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsTerminateOpen(false)}
                                    className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 rounded transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isTerminating}
                                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded font-medium transition-colors cursor-pointer"
                                >
                                    {isTerminating ? 'Procesando...' : 'Confirmar Baja'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación para Eliminar Documento */}
            {docToDelete && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-sm w-full p-5 shadow-xl text-xs space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900">¿Eliminar documento adjunto?</h3>
                        <p className="text-gray-500 text-[11px]">Esta acción eliminará el archivo del expediente digital del colaborador.</p>
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                                onClick={() => setDocToDelete(null)}
                                className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 rounded cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDeleteDoc}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer font-medium"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeProfile;
