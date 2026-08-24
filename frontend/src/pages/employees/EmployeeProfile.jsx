import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEmployeeById, getEmployees, updateEmployee, getEmployeeHistory, getContracts, uploadDocument, getDocuments, deleteDocument, getProfile } from '../../services/employees/employee.service';
import EditEmployeeModal from './components/EditEmployeeModal';
import SkillsTab from './components/SkillsTab';
import ContractsTab from './components/ContractsTab';
import { InfoItem, EmptyState } from './components/EmployeeHelpers';
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

    const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';

    useEffect(() => {
        if (isAdminOrHR && token) {
            getEmployees(token).then(res => {
                const list = res?.data?.employees || res?.data || [];
                if (Array.isArray(list)) {
                    setEmployeesList(list);
                }
            }).catch(console.error);
        }
    }, [isAdminOrHR, token]);

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
                const cleanId = id.trim();
                data = await getEmployeeById(cleanId, token);
            } else if (isAdminOrHR && employeesList.length > 0) {
                data = await getEmployeeById(employeesList[0].id, token);
            } else {
                data = await getProfile(token);
                if ((!data || !data.data) && isAdminOrHR) {
                    const empRes = await getEmployees(token);
                    const list = empRes?.data?.employees || empRes?.data || [];
                    if (list.length > 0) {
                        data = await getEmployeeById(list[0].id, token);
                    }
                }
            }

            if (data && data.data) {
                setEmployee(data.data);
            } else if (data && (data.isSuperAdmin || checkIsSuperAdmin(user))) {
                setEmployee(null);
            } else {
                console.error("No employee data received", data);
                toast.error("No se pudo cargar la información del empleado");
            }
        } catch (err) {
            console.error("Profile Error:", err);
            toast.error(err.message || "Error al conectar con el servidor");
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

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        } else if (activeTab === 'contracts') {
            fetchContracts();
        } else if (activeTab === 'documents') {
            fetchDocuments();
        }
    }, [activeTab]);

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

    const handleDocumentChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'file') {
            const file = files[0];
            if (file && file.size > 4 * 1024 * 1024) {
                toast.error("El archivo es demasiado grande. El límite es 4MB.");
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
        if (!documentForm.file) return toast.error('Seleccione un archivo');

        const targetId = id || employee?.id;
        const formData = new FormData();
        formData.append('employeeId', targetId);
        formData.append('type', documentForm.type);
        formData.append('document', documentForm.file);
        if (documentForm.expiryDate) formData.append('expiryDate', documentForm.expiryDate);

        try {
            await uploadDocument(formData, token);
            await fetchDocuments();
            setIsUploading(false);
            setDocumentForm({ type: 'DNI', file: null, expiryDate: '' });
            toast.success('Documento subido correctamente');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!window.confirm('¿Está seguro de eliminar este documento?')) return;
        try {
            await deleteDocument(docId, token);
            await fetchDocuments();
            toast.success('Documento eliminado');
        } catch (err) {
            toast.error(err.message);
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
            toast.error('Por favor corrija los errores en el formulario');
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
            toast.success('Perfil actualizado correctamente');
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400 text-xs">Cargando perfil...</div>;

    const isSuperAdminUser = checkIsSuperAdmin(user);

    if (!employee && isSuperAdminUser) {
        return (
            <div className="max-w-4xl mx-auto space-y-5">
                <div className="bg-white rounded p-5 border border-gray-200">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                        <div className="w-10 h-10 rounded bg-gray-900 text-white flex items-center justify-center font-mono font-semibold text-xs shrink-0">
                            SA
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{user?.firstName || 'SuperAdmin'} {user?.lastName || 'SaaS'}</h1>
                            <p className="text-xs font-mono text-blue-600 mt-0.5">SuperAdministrador Global de la Plataforma EMPLIFI</p>
                            <p className="text-xs text-gray-400 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{user?.email || 'admin@emplifi.com'}</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Detalles de la Cuenta de Plataforma</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">Rol en el Sistema</span>
                                <span className="font-semibold text-gray-900 text-xs mt-0.5 block">SuperAdmin (Dueño de Software)</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">Alcance de Aislamiento</span>
                                <span className="font-semibold text-green-700 text-xs mt-0.5 block">Multi-Tenant Global</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">Permisos Especiales</span>
                                <span className="font-semibold text-blue-600 text-xs mt-0.5 block">Inspección, Gestión SaaS & Auditoría</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">Estado de Sesión</span>
                                <span className="font-semibold text-green-700 text-xs mt-0.5 block">Autenticación Activa</span>
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
                                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Ver Log de Auditoría Global
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!employee) return <div className="p-8 text-center text-gray-400 text-xs">Empleado no encontrado</div>;

    const tabs = [
        { id: 'personal', label: 'Información Personal' },
        { id: 'job', label: 'Datos Laborales' },
        { id: 'contracts', label: 'Contratos' },
        { id: 'documents', label: 'Documentos' },
        { id: 'history', label: 'Historial' },
        { id: 'skills', label: 'Habilidades' },
        (!id || id === user?.id) && { id: 'security', label: 'Seguridad' },
    ].filter(Boolean);

    return (
        <div className="space-y-5">
            <div className="max-w-5xl mx-auto space-y-5">
                {/* Selector Rápido de Colaboradores para Administradores / RRHH */}
                {isAdminOrHR && employeesList.length > 0 && (
                    <div className="bg-white p-3.5 rounded border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700 whitespace-nowrap">Ficha 360° de:</span>
                            <select
                                value={employee.id}
                                onChange={(e) => navigate(`/admin/employees/${e.target.value}`)}
                                className="bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-blue-500 cursor-pointer max-w-xs"
                            >
                                {employeesList.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName} ({emp.identityCard || emp.position || 'Colaborador'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                to={`/admin/expedientes/${employee.id}`}
                                className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded transition-colors text-xs font-medium cursor-pointer"
                            >
                                Ver Expediente Digital
                            </Link>
                            <Link
                                to="/admin/employees"
                                className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded transition-colors text-xs font-medium cursor-pointer"
                            >
                                Directorio de Empleados
                            </Link>
                        </div>
                    </div>
                )}

                {/* Header Limpio ERP */}
                <div className="bg-white rounded p-5 border border-gray-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-mono font-semibold text-gray-700 text-sm shrink-0">
                                {employee.firstName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900 leading-tight">{employee.firstName} {employee.lastName}</h1>
                                <p className="text-xs font-medium text-blue-600 mt-0.5">{employee.position} · <span className="text-gray-500">{employee.department}</span></p>
                                <p className="text-xs text-gray-400 font-mono mt-0.5" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{employee.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            <button
                                onClick={handleEditClick}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer flex-1 sm:flex-none text-center"
                            >
                                Editar Perfil
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer flex-1 sm:flex-none text-center"
                            >
                                Volver
                            </button>
                            {employee.isActive && user?.role === 'admin' && (
                                <button
                                    onClick={() => {
                                        if (confirm('¿Está seguro de dar de baja a este empleado? Esta acción no se puede deshacer fácilmente.')) {
                                            const reason = prompt('Ingrese motivo de salida (Renuncia, Despido, etc):');
                                            if (reason) {
                                                import('../../services/employees/employee.service').then(mod => {
                                                    mod.terminateEmployee(employee.id, {
                                                        exitDate: new Date(),
                                                        exitReason: reason,
                                                        exitType: 'Voluntary'
                                                    }, token).then(() => {
                                                        toast.success('Empleado dado de baja');
                                                        fetchEmployee();
                                                    }).catch(e => toast.error(e.message));
                                                });
                                            }
                                        }
                                    }}
                                    className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded transition-colors cursor-pointer shrink-0"
                                >
                                    Dar de Baja
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Navegación por pestañas ERP (Tab bar horizontal con borde inferior activo 2px #111827) */}
                    <div className="flex border-b border-gray-200 mt-4 overflow-x-auto gap-6 text-xs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-2.5 font-medium transition-colors whitespace-nowrap cursor-pointer ${
                                    activeTab === tab.id
                                        ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Contenido de la pestaña */}
                <div className="bg-white rounded p-5 border border-gray-200 min-h-[350px]">
                    {activeTab === 'personal' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                            <InfoItem label="Cédula / Identificación" value={employee.identityCard} isMasked={true} />
                            <InfoItem label="Fecha de Nacimiento" value={employee.birthDate ? new Date(employee.birthDate).toLocaleDateString('es-EC') : 'N/A'} />
                            <InfoItem label="Estado Civil" value={CIVIL_STATUS_OPTIONS.find(c => c.value === employee.civilStatus)?.label || employee.civilStatus} />
                            <InfoItem label="Dirección" value={employee.address} />
                            <InfoItem label="Teléfono" value={employee.phone} />
                            <InfoItem label="Email institucional" value={employee.email} />
                        </div>
                    )}

                    {activeTab === 'job' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                            <InfoItem label="Departamento" value={employee.department} />
                            <InfoItem label="Cargo Actual" value={employee.position} />
                            <InfoItem label="Fecha de Ingreso" value={employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('es-EC') : 'N/A'} />
                            <InfoItem label="Tipo de Contrato" value={CONTRACT_TYPES.find(c => c.value === employee.contractType)?.label || employee.contractType} />
                            <InfoItem label="Salario Base" value={employee.salary != null ? `$${employee.salary.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD` : null} isPrivate />
                            <InfoItem label="Rol de Sistema" value={{ admin: 'Administrador', employee: 'Empleado', manager: 'Gerente' }[employee.role] || employee.role} />
                            <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-gray-100">
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos Bancarios para Depósito</p>
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
                                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Subir Documento Adjunto</p>
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
                                            <option value="Licencia">Licencia</option>
                                            <option value="Certificado">Certificado</option>
                                            <option value="Contrato_Firmado">Contrato Firmado</option>
                                            <option value="CV">Currículum</option>
                                            <option value="Otro">Otro</option>
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
                                        <label className="block text-gray-600 mb-1">Vencimiento (Opcional)</label>
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
                                                    <p className="text-[11px] text-gray-400 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                        {new Date(doc.createdAt).toLocaleDateString('es-EC')}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    className="text-gray-400 hover:text-red-600 text-xs font-semibold px-1"
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
                                                Ver / Descargar Archivo
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-8 text-center text-gray-400 text-xs">
                                        No hay documentos adjuntos guardados.
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
                                            <span className="text-[11px] font-mono text-gray-400" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                {new Date(log.timestamp).toLocaleString('es-EC')}
                                            </span>
                                        </div>
                                        <div className="text-gray-600 space-y-0.5">
                                            {Object.keys(log.details).map(field => (
                                                <div key={field} className="flex items-center gap-2">
                                                    <span className="text-gray-400 font-medium capitalize">{field}:</span>
                                                    <span className="line-through text-red-500 font-mono">{log.details[field]?.from}</span>
                                                    <span className="text-gray-300">→</span>
                                                    <span className="text-green-700 font-semibold font-mono">{log.details[field]?.to}</span>
                                                </div>
                                            ))}
                                            {Object.keys(log.details).length === 0 && <span className="text-gray-400 italic">Sin detalles registrados</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-gray-400 text-xs">
                                    No hay historial de cambios registrados.
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
            </div>

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
        </div>
    );
};

export default EmployeeProfile;
