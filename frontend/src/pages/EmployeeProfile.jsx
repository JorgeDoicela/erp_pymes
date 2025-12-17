import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployeeById } from '../services/employee.service';

const EmployeeProfile = ({ token }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('personal');

    useEffect(() => {
        fetchEmployee();
    }, [id]);

    const fetchEmployee = async () => {
        try {
            const data = await getEmployeeById(id, token);
            setEmployee(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Cargando perfil...</div>;
    if (!employee) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Empleado no encontrado</div>;

    const tabs = [
        { id: 'personal', label: 'Información Personal' },
        { id: 'job', label: 'Datos Laborales' },
        { id: 'history', label: 'Historial' },
        { id: 'documents', label: 'Documentos' },
        { id: 'skills', label: 'Habilidades' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/5 flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-4xl font-bold shadow-lg shadow-blue-500/20">
                        {employee.firstName[0]}
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
                    <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm">
                        Volver
                    </button>
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
                            <InfoItem label="Fecha de Nacimiento" value={new Date(employee.birthDate).toLocaleDateString()} />
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
                            <InfoItem label="Fecha de Ingreso" value={new Date(employee.hireDate).toLocaleDateString()} />
                            <InfoItem label="Tipo de Contrato" value={employee.contractType} />
                            <InfoItem label="Salario Base" value={`$${employee.salary}`} isPrivate />
                            <InfoItem label="Rol de Sistema" value={employee.role} />
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            {employee.workHistory && employee.workHistory.length > 0 ? (
                                employee.workHistory.map((item) => (
                                    <div key={item.id} className="border-l-2 border-blue-500 pl-4 py-1">
                                        <h4 className="text-lg font-semibold">{item.position}</h4>
                                        <p className="text-blue-400">{item.company}</p>
                                        <p className="text-sm text-slate-400">
                                            {new Date(item.startDate).toLocaleDateString()} - {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Presente'}
                                        </p>
                                        {item.description && <p className="mt-2 text-slate-300">{item.description}</p>}
                                    </div>
                                ))
                            ) : (
                                <EmptyState message="No hay historial laboral registrado." />
                            )}
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {employee.documents && employee.documents.length > 0 ? (
                                employee.documents.map((doc) => (
                                    <div key={doc.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center gap-3 hover:border-blue-500/50 transition-colors cursor-pointer group">
                                        <span className="text-2xl">📄</span>
                                        <div className="overflow-hidden">
                                            <p className="font-medium truncate group-hover:text-blue-400 transition-colors">{doc.name}</p>
                                            <p className="text-xs text-slate-500 uppercase">{doc.type}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState message="No hay documentos adjuntos." />
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

export default EmployeeProfile;
