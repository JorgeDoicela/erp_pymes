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
            toast.success('Contrato registrado exitosamente');
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Historial de Contratos Laborales</h3>
                    <p className="text-[11px] text-gray-400">Registro cronológico de relaciones contractuales y condiciones salariales.</p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setIsCreatingContract(true)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                    >
                        + Nuevo Contrato
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {contracts && contracts.length > 0 ? (
                    contracts.map((contract) => (
                        <div key={contract.id} className="bg-white p-4 rounded border border-gray-200 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-semibold text-gray-900">{getContractTypeLabel(contract.type)}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                                            contract.status === 'Active' 
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                                : 'bg-gray-100 text-gray-700 border-gray-200'
                                        }`}>
                                            {contract.status === 'Active' ? 'VIGENTE' : (contract.status || 'FINALIZADO')}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-mono mt-0.5 tabular-nums">
                                        Vigencia: {new Date(contract.startDate).toLocaleDateString('es-EC')}
                                        {contract.endDate ? ` hasta ${new Date(contract.endDate).toLocaleDateString('es-EC')}` : ' (Indefinido)'}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Remuneración</span>
                                    <span className="text-xs font-mono font-bold text-gray-900 tabular-nums">
                                        {contract.salary != null ? `$${Number(contract.salary).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD` : 'Confidencial'}
                                    </span>
                                </div>
                            </div>

                            {contract.clauses && (
                                <div className="bg-gray-50 p-2.5 rounded border border-gray-200 text-xs text-gray-700 space-y-0.5">
                                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block font-sans">Cláusulas y Condiciones Particulares</span>
                                    <p className="leading-relaxed">{contract.clauses}</p>
                                </div>
                            )}

                            {contract.documentUrl && (
                                <div className="pt-2 border-t border-gray-100 flex justify-end">
                                    <a
                                        href={`${import.meta.env.VITE_API_URL}/contracts/download/${contract.documentUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                                    >
                                        Descargar Copia Legal Firmada (PDF) ↗
                                    </a>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <EmptyState message="No hay contratos registrados para este colaborador." />
                )}
            </div>

            {/* Create Contract Modal */}
            {isCreatingContract && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto text-xs space-y-4">
                        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Registrar Nuevo Contrato Laboral</h2>
                                <p className="text-[11px] text-gray-500 mt-0.5">Establece las condiciones formales, vigencia y remuneración pactada.</p>
                            </div>
                            <button 
                                onClick={() => setIsCreatingContract(false)} 
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleCreateContract} className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Modalidad Contractual</label>
                                    <select 
                                        name="type" 
                                        value={contractForm.type} 
                                        onChange={handleContractChange} 
                                        className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                    >
                                        {CONTRACT_TYPES.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <InputField label="Salario Base ($ USD)" name="salary" type="number" value={contractForm.salary} onChange={handleContractChange} help="Monto mensual pactado." />
                                <InputField label="Fecha de Inicio" name="startDate" type="date" value={contractForm.startDate} onChange={handleContractChange} />
                                <InputField label="Fecha de Finalización (Opcional)" name="endDate" type="date" value={contractForm.endDate} onChange={handleContractChange} />
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Cláusulas Especiales / Anexos</label>
                                    <textarea
                                        name="clauses"
                                        value={contractForm.clauses}
                                        onChange={handleContractChange}
                                        rows="2"
                                        placeholder="Ej. Periodo de prueba de 90 días, confidencialidad estricta, jornada especial..."
                                        className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                    ></textarea>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Documento PDF Firmado</label>
                                    <input
                                        type="file"
                                        name="document"
                                        accept="application/pdf"
                                        onChange={handleContractChange}
                                        className="block w-full text-xs text-gray-500 bg-white border border-gray-200 rounded px-2 py-1"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreatingContract(false)} 
                                    className="border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer shadow-xs"
                                >
                                    Crear Contrato
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractsTab;
