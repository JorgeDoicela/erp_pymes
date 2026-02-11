import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployeeById, updateEmployee, getEmployeeHistory, getContracts, uploadDocument, getDocuments, deleteDocument, getProfile } from '../../services/employees/employee.service';
import EditEmployeeModal from './components/EditEmployeeModal';
import SkillsTab from './components/SkillsTab';
import ContractsTab from './components/ContractsTab';
import { InfoItem, EmptyState } from './components/EmployeeHelpers';
import { CIVIL_STATUS_OPTIONS, CONTRACT_TYPES } from '../../constants/employeeOptions';
import { validateEmail, validatePhone, validateSalary, validateDates } from '../../utils/validationUtils';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const EmployeeProfile = ({ token, user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
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

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchEmployee();
    }, [id]);

    const fetchEmployee = async () => {
        try {
            let data;
            if (id) {
                data = await getEmployeeById(id, token);
            } else {
                data = await getProfile(token);
            }
            if (data.data) {
                setEmployee(data.data);
            } else {
                console.error("No employee data received", data);
            }
        } catch (err) {
            console.error("Profile Error:", err);
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
            setDocumentForm(prev => ({ ...prev, [name]: files[0] }));
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
            accountType: employee.accountType || 'Ahorros'
            // Identity Card not included -> Immutable
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

        // Front-end Validation
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
            // Optionally fetch history if we are on that tab
            if (activeTab === 'history') fetchHistory();
            toast.success('Perfil actualizado correctamente');
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando perfil...</div>;
    if (!employee) return <div className="min-h-screen flex items-center justify-center text-slate-500">Empleado no encontrado</div>;

    const tabs = [
        { id: 'personal', label: 'Información Personal' },
        { id: 'job', label: 'Datos Laborales' },
        { id: 'contracts', label: 'Contratos' },
        { id: 'documents', label: 'Documentos' },
        { id: 'history', label: 'Historial' },
        { id: 'skills', label: 'Habilidades' },
    ];

    return (
        <div className="space-y-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl p-8 mb-8 border border-slate-200 shadow-sm flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-4xl font-bold text-blue-600 shadow-sm border border-blue-100">
                        {employee.firstName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-1 text-slate-800">{employee.firstName} {employee.lastName}</h1>
                        <p className="text-xl text-blue-600 font-medium">{employee.position}</p>
                        <div className="flex gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                {employee.department}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                {employee.email}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleEditClick} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-medium shadow-sm hover:shadow-md">
                            Editar Perfil
                        </button>
                        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm font-medium">
                            Volver
                        </button>
                        {employee.isActive && (
                            <button
                                onClick={() => {
                                    if (confirm('¿Está seguro de dar de baja a este empleado? Esta acción no se puede deshacer fácilmente.')) {
                                        // Simple prompt for reason
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
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                                Dar de Baja
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm min-h-[400px]">
                    {activeTab === 'personal' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InfoItem label="Cédula" value={employee.identityCard} />
                            <InfoItem label="Fecha de Nacimiento" value={employee.birthDate ? new Date(employee.birthDate).toLocaleDateString() : 'N/A'} />
                            <InfoItem label="Estado Civil" value={CIVIL_STATUS_OPTIONS.find(c => c.value === employee.civilStatus)?.label || employee.civilStatus} />
                            <InfoItem label="Dirección" value={employee.address} />
                            <InfoItem label="Teléfono" value={employee.phone} />
                            <InfoItem label="Email" value={employee.email} />
                        </div>
                    )}

                    {activeTab === 'job' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InfoItem label="Departamento" value={employee.department} />
                            <InfoItem label="Cargo Actual" value={employee.position} />
                            <InfoItem label="Fecha de Ingreso" value={employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'} />
                            <InfoItem label="Tipo de Contrato" value={CONTRACT_TYPES.find(c => c.value === employee.contractType)?.label || employee.contractType} />
                            <InfoItem label="Salario Base" value={`$${employee.salary}`} isPrivate />
                            <InfoItem label="Rol de Sistema" value={employee.role} />
                            <div className="col-span-1 md:col-span-2 mt-4 border-t border-slate-200 pt-4">
                                <h4 className="text-lg font-semibold text-emerald-600 mb-4">Datos Bancarios</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InfoItem label="Banco" value={employee.bankName} isPrivate />
                                    <InfoItem label="N° Cuenta" value={employee.accountNumber} isPrivate />
                                    <InfoItem label="Tipo Cuenta" value={employee.accountType} isPrivate />
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
                        <div>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Subir Documento</h3>
                                <form onSubmit={handleUploadDocument} className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">Tipo</label>
                                        <select
                                            name="type"
                                            value={documentForm.type}
                                            onChange={handleDocumentChange}
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="DNI">Cédula / Pasaporte</option>
                                            <option value="Licencia">Licencia</option>
                                            <option value="Certificado">Certificado</option>
                                            <option value="Contrato_Firmado">Contrato Firmado</option>
                                            <option value="CV">Currículum</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">Archivo (PDF/IMG, Max 5MB)</label>
                                        <input
                                            type="file"
                                            name="file"
                                            onChange={handleDocumentChange}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                                        />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">Vencimiento (Opcional)</label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={documentForm.expiryDate}
                                            onChange={handleDocumentChange}
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                                    >
                                        {isUploading ? 'Subiendo...' : 'Subir'}
                                    </button>
                                </form>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {documents && documents.length > 0 ? (
                                    documents.map((doc) => (
                                        <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 relative group shadow-sm hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl text-slate-400">
                                                        {doc.mimeType?.includes('pdf') ? '📄' : '🖼️'}
                                                    </span>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm">{doc.type}</h4>
                                                        <p className="text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            {doc.expiryDate && (
                                                <p className="text-xs text-amber-600 font-medium mb-2 bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-100">Vence: {new Date(doc.expiryDate).toLocaleDateString()}</p>
                                            )}
                                            <div className="mt-2">
                                                <a
                                                    href={`${API_URL}/documents/download/${doc.documentUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs bg-slate-50 hover:bg-white border border-slate-200 text-blue-600 font-medium px-3 py-1.5 rounded-lg w-full block text-center transition-colors shadow-sm"
                                                >
                                                    Ver / Descargar
                                                </a>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full">
                                        <EmptyState message="No hay documentos guardados." />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            {history && history.length > 0 ? (
                                history.map((log) => (
                                    <div key={log.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-semibold text-blue-600">{log.action}</span>
                                            <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div className="text-slate-600">
                                            {/* Render details nicely */}
                                            {Object.keys(log.details).map(field => (
                                                <div key={field} className="flex gap-2">
                                                    <span className="capitalize text-slate-500 font-medium">{field}:</span>
                                                    <span className="line-through text-red-400 decoration-red-400/50">{log.details[field]?.from}</span>
                                                    <span className="text-slate-400">→</span>
                                                    <span className="text-emerald-600 font-medium bg-emerald-50 px-1 rounded">{log.details[field]?.to}</span>
                                                </div>
                                            ))}
                                            {Object.keys(log.details).length === 0 && <span className="text-slate-400 italic">Sin detalles de cambios</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState message="No hay historial de cambios registrados." />
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





        </div >
    );
};



export default EmployeeProfile;
