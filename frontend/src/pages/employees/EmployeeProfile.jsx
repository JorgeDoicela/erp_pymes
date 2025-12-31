import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployeeById, updateEmployee, getEmployeeHistory, createContract, getContracts, uploadDocument, getDocuments, deleteDocument, getProfile } from '../../services/employees/employee.service';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const EmployeeProfile = ({ token }) => {
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
    const [isCreatingContract, setIsCreatingContract] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [contractForm, setContractForm] = useState({
        type: 'Indefinido',
        startDate: '',
        endDate: '',
        salary: '',
        clauses: '',
        document: null
    });

    useEffect(() => {
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
        if (!documentForm.file) return alert('Seleccione un archivo');

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
            alert('Documento subido correctamente');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!window.confirm('¿Está seguro de eliminar este documento?')) return;
        try {
            await deleteDocument(docId, token);
            await fetchDocuments();
        } catch (err) {
            alert(err.message);
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

    const handleContractChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'document') {
            setContractForm(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setContractForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCreateContract = async (e) => {
        e.preventDefault();
        try {
            const targetId = id || employee?.id;
            const formData = new FormData();
            formData.append('employeeId', targetId);
            formData.append('type', contractForm.type);
            formData.append('startDate', contractForm.startDate);
            if (contractForm.endDate) formData.append('endDate', contractForm.endDate);
            formData.append('salary', contractForm.salary);
            if (contractForm.clauses) formData.append('clauses', contractForm.clauses);
            if (contractForm.document) formData.append('document', contractForm.document);

            await createContract(formData, token);
            await fetchContracts();
            setIsCreatingContract(false);
            setContractForm({
                type: 'Indefinido',
                startDate: '',
                endDate: '',
                salary: '',
                clauses: '',
                document: null
            });
            alert('Contrato creado exitosamente');
        } catch (err) {
            alert(err.message);
        }
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
            civilStatus: employee.civilStatus
            // Identity Card not included -> Immutable
        });
        setIsEditing(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            const targetId = id || employee?.id;
            await updateEmployee(targetId, {
                ...editForm,
                salary: Number(editForm.salary)
            }, token);
            await fetchEmployee();
            setIsEditing(false);
            // Optionally fetch history if we are on that tab
            if (activeTab === 'history') fetchHistory();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Cargando perfil...</div>;
    if (!employee) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Empleado no encontrado</div>;

    const tabs = [
        { id: 'personal', label: 'Información Personal' },
        { id: 'job', label: 'Datos Laborales' },
        { id: 'contracts', label: 'Contratos' },
        { id: 'documents', label: 'Documentos' },
        { id: 'history', label: 'Historial' },
        { id: 'skills', label: 'Habilidades' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/5 flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-4xl font-bold shadow-lg shadow-blue-500/20">
                        {employee.firstName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-1">{employee.firstName} {employee.lastName}</h1>
                        <p className="text-xl text-blue-400">{employee.position}</p>
                        <div className="flex gap-4 mt-2 text-sm text-slate-400">
                            <span>{employee.department}</span>
                            <span>•</span>
                            <span>{employee.email}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleEditClick} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-sm font-medium">
                            Editar Perfil
                        </button>
                        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm">
                            Volver
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-slate-700 mb-8 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-slate-800/30 rounded-2xl p-8 border border-white/5 min-h-[400px]">
                    {activeTab === 'personal' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InfoItem label="Cédula" value={employee.identityCard} />
                            <InfoItem label="Fecha de Nacimiento" value={employee.birthDate ? new Date(employee.birthDate).toLocaleDateString() : 'N/A'} />
                            <InfoItem label="Estado Civil" value={employee.civilStatus} />
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
                            <InfoItem label="Tipo de Contrato" value={employee.contractType} />
                            <InfoItem label="Salario Base" value={`$${employee.salary}`} isPrivate />
                            <InfoItem label="Rol de Sistema" value={employee.role} />
                        </div>
                    )}

                    {activeTab === 'contracts' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => setIsCreatingContract(true)}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
                                >
                                    + Nuevo Contrato
                                </button>
                            </div>
                            <div className="space-y-4">
                                {contracts && contracts.length > 0 ? (
                                    contracts.map((contract) => (
                                        <div key={contract.id} className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">{contract.type}</h3>
                                                    <p className="text-sm text-slate-400">Inicio: {new Date(contract.startDate).toLocaleDateString()}</p>
                                                    {contract.endDate && <p className="text-sm text-slate-400">Fin: {new Date(contract.endDate).toLocaleDateString()}</p>}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${contract.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {contract.status === 'Active' ? 'ACTIVO' : contract.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                <div>
                                                    <span className="text-slate-500 block">Salario</span>
                                                    <span className="text-slate-200">${contract.salary}</span>
                                                </div>
                                                {contract.documentUrl && (
                                                    <div>
                                                        <span className="text-slate-500 block">Documento</span>
                                                        <a
                                                            href={`${import.meta.env.VITE_API_URL}/contracts/download/${contract.documentUrl}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-400 hover:underline"
                                                        >
                                                            Ver PDF
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            {contract.clauses && (
                                                <div className="bg-slate-950/50 p-3 rounded-lg text-xs text-slate-400">
                                                    <span className="font-semibold block mb-1">Cláusulas:</span>
                                                    {contract.clauses}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <EmptyState message="No hay contratos registrados." />
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div>
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 mb-6">
                                <h3 className="text-lg font-bold text-white mb-4">Subir Documento</h3>
                                <form onSubmit={handleUploadDocument} className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="text-sm font-medium text-slate-400 mb-1 block">Tipo</label>
                                        <select
                                            name="type"
                                            value={documentForm.type}
                                            onChange={handleDocumentChange}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white"
                                        >
                                            <option value="DNI">DNI / Pasaporte</option>
                                            <option value="Licencia">Licencia</option>
                                            <option value="Certificado">Certificado</option>
                                            <option value="Contrato_Firmado">Contrato Firmado</option>
                                            <option value="CV">Currículum</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="text-sm font-medium text-slate-400 mb-1 block">Archivo (PDF/IMG, Max 5MB)</label>
                                        <input
                                            type="file"
                                            name="file"
                                            onChange={handleDocumentChange}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                                        />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="text-sm font-medium text-slate-400 mb-1 block">Vencimiento (Opcional)</label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={documentForm.expiryDate}
                                            onChange={handleDocumentChange}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isUploading ? 'Subiendo...' : 'Subir'}
                                    </button>
                                </form>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {documents && documents.length > 0 ? (
                                    documents.map((doc) => (
                                        <div key={doc.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 relative group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">
                                                        {doc.mimeType?.includes('pdf') ? '📄' : '🖼️'}
                                                    </span>
                                                    <div>
                                                        <h4 className="font-bold text-white text-sm">{doc.type}</h4>
                                                        <p className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                            {doc.expiryDate && (
                                                <p className="text-xs text-yellow-500/80 mb-2">Vence: {new Date(doc.expiryDate).toLocaleDateString()}</p>
                                            )}
                                            <div className="mt-2">
                                                <a
                                                    href={`${API_URL}/documents/download/${doc.documentUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-300 px-3 py-1.5 rounded-lg w-full block text-center transition-colors"
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
                                    <div key={log.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-sm">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-semibold text-blue-400">{log.action}</span>
                                            <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div className="text-slate-300">
                                            {/* Render details nicely */}
                                            {Object.keys(log.details).map(field => (
                                                <div key={field} className="flex gap-2">
                                                    <span className="capitalize text-slate-400">{field}:</span>
                                                    <span>{log.details[field]?.from}</span>
                                                    <span>→</span>
                                                    <span className="text-emerald-400">{log.details[field]?.to}</span>
                                                </div>
                                            ))}
                                            {Object.keys(log.details).length === 0 && <span>Sin detalles de cambios</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState message="No hay historial de cambios registrados." />
                            )}
                        </div>
                    )}



                    {activeTab === 'skills' && (
                        <div className="flex flex-wrap gap-3">
                            {employee.skills && employee.skills.length > 0 ? (
                                employee.skills.map((skill) => (
                                    <div key={skill.id} className="bg-slate-900 px-4 py-2 rounded-full border border-slate-700 text-sm flex items-center gap-2">
                                        <span className="text-slate-200">{skill.name}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${getLevelColor(skill.level)}`}>{skill.level}</span>
                                    </div>
                                ))
                            ) : (
                                <EmptyState message="No hay habilidades registradas." />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">Editar Empleado</h2>
                        <form onSubmit={handleSaveEdit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                    <p className="text-yellow-200 text-sm">La Cédula ({employee.identityCard}) no se puede modificar.</p>
                                </div>

                                <InputField label="Nombre" name="firstName" value={editForm.firstName} onChange={handleEditChange} />
                                <InputField label="Apellido" name="lastName" value={editForm.lastName} onChange={handleEditChange} />
                                <InputField label="Email" name="email" value={editForm.email} onChange={handleEditChange} />
                                <InputField label="Teléfono" name="phone" value={editForm.phone} onChange={handleEditChange} />
                                <InputField label="Dirección" name="address" value={editForm.address} onChange={handleEditChange} />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-400">Estado Civil</label>
                                    <select name="civilStatus" value={editForm.civilStatus} onChange={handleEditChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                                        <option value="single">Soltero/a</option>
                                        <option value="married">Casado/a</option>
                                        <option value="divorced">Divorciado/a</option>
                                        <option value="widowed">Viudo/a</option>
                                    </select>
                                </div>
                                <InputField label="Departamento" name="department" value={editForm.department} onChange={handleEditChange} />
                                <InputField label="Cargo" name="position" value={editForm.position} onChange={handleEditChange} />
                                <InputField label="Salario" name="salary" type="number" value={editForm.salary} onChange={handleEditChange} />
                            </div>
                            <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5">Cancelar</button>
                                <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Create Contract Modal */}
            {isCreatingContract && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">Registrar Nuevo Contrato</h2>
                        <form onSubmit={handleCreateContract} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-400">Tipo de Contrato</label>
                                    <select name="type" value={contractForm.type} onChange={handleContractChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                                        <option value="Indefinido">Indefinido</option>
                                        <option value="Temporal">Temporal</option>
                                        <option value="Por Obra">Por Obra</option>
                                        <option value="Prácticas">Prácticas</option>
                                    </select>
                                </div>
                                <InputField label="Salario Mensual" name="salary" type="number" value={contractForm.salary} onChange={handleContractChange} />
                                <InputField label="Fecha Inicio" name="startDate" type="date" value={contractForm.startDate} onChange={handleContractChange} />
                                <InputField label="Fecha Fin (Opcional)" name="endDate" type="date" value={contractForm.endDate} onChange={handleContractChange} />
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-400 mb-1 block">Cláusulas Especiales</label>
                                    <textarea
                                        name="clauses"
                                        value={contractForm.clauses}
                                        onChange={handleContractChange}
                                        rows="3"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    ></textarea>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-400 mb-1 block">Documento PDF</label>
                                    <input
                                        type="file"
                                        name="document"
                                        accept="application/pdf"
                                        onChange={handleContractChange}
                                        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => setIsCreatingContract(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5">Cancelar</button>
                                <button type="submit" className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium">Crear Contrato</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoItem = ({ label, value, isPrivate }) => (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <label className="text-xs text-slate-500 uppercase font-semibold tracking-wider block mb-1">
            {label} {isPrivate && '🔒'}
        </label>
        <p className="text-lg font-medium text-slate-200">{value || 'N/A'}</p>
    </div>
);

const EmptyState = ({ message }) => (
    <div className="col-span-full py-12 text-center text-slate-500 italic border-2 border-dashed border-slate-800 rounded-xl">
        {message}
    </div>
);

const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
        case 'expert': return 'bg-emerald-500/20 text-emerald-300';
        case 'advanced': return 'bg-blue-500/20 text-blue-300';
        case 'intermediate': return 'bg-yellow-500/20 text-yellow-300';
        default: return 'bg-slate-500/20 text-slate-300';
    }
};

const InputField = ({ label, name, type = "text", value, onChange }) => (
    <div className="flex flex-col">
        <label className="text-sm font-medium text-slate-400 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
    </div>
);

export default EmployeeProfile;
