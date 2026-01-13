import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createContract } from '../../../services/employees/employee.service';
import { EmptyState, InputField } from './EmployeeHelpers';
import { CONTRACT_TYPES } from '../../../constants/employeeOptions';

const ContractsTab = ({ contracts, user, employeeId, token, onUpdate }) => {
    const [isCreatingContract, setIsCreatingContract] = useState(false);
    const [contractForm, setContractForm] = useState({
        type: 'permanent',
        startDate: '',
        endDate: '',
        salary: '',
        clauses: '',
        document: null
    });

    const getContractTypeLabel = (type) => {
        const match = CONTRACT_TYPES.find(c => c.value === type);
        return match ? match.label : type;
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
            const formData = new FormData();
            formData.append('employeeId', employeeId);
            formData.append('type', contractForm.type);
            formData.append('startDate', contractForm.startDate);
            if (contractForm.endDate) formData.append('endDate', contractForm.endDate);
            formData.append('salary', contractForm.salary);
            if (contractForm.clauses) formData.append('clauses', contractForm.clauses);
            if (contractForm.document) formData.append('document', contractForm.document);

            await createContract(formData, token);
            await onUpdate();
            setIsCreatingContract(false);
            setContractForm({
                type: 'permanent',
                startDate: '',
                endDate: '',
                salary: '',
                clauses: '',
                document: null
            });
            toast.success('Contrato creado exitosamente');
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setIsCreatingContract(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Nuevo Contrato
                    </button>
                )}
            </div>
            <div className="space-y-4">
                {contracts && contracts.length > 0 ? (
                    contracts.map((contract) => (
                        <div key={contract.id} className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{getContractTypeLabel(contract.type)}</h3>
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
                                        {CONTRACT_TYPES.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
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

export default ContractsTab;
