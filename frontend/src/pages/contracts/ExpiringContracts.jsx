import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const ExpiringContracts = () => {
    const navigate = useNavigate();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('ALL');
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, CRITICAL (<=15d), MODERATE (16-30d), NORMAL (>30d)
    const [daysRange, setDaysRange] = useState(60);

    // Modal de renovación
    const [selectedContract, setSelectedContract] = useState(null);
    const [renewModalOpen, setRenewModalOpen] = useState(false);
    const [renewType, setRenewType] = useState('Indefinido');
    const [renewEndDate, setRenewEndDate] = useState('');
    const [renewSalary, setRenewSalary] = useState('');
    const [renewNotes, setRenewNotes] = useState('');
    const [renewing, setRenewing] = useState(false);

    const fetchContracts = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        setError('');
        try {
            const response = await api.get(`/contracts/expiring?days=${daysRange}`);
            if (response.data.success) {
                setContracts(response.data.data || []);
            }
        } catch (err) {
            console.error('Error al cargar contratos por vencer:', err);
            setError('Error al consultar contratos por vencer.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, [daysRange]);

    const getDaysRemaining = (endDate) => {
        if (!endDate) return 999;
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const departments = useMemo(() => {
        const set = new Set();
        contracts.forEach(c => {
            if (c.employee?.department) set.add(c.employee.department);
        });
        return Array.from(set).sort();
    }, [contracts]);

    // Contadores para pestañas
    const counts = useMemo(() => {
        let critical = 0;
        let moderate = 0;
        let normal = 0;

        contracts.forEach(c => {
            const d = getDaysRemaining(c.endDate);
            if (d <= 15) critical++;
            else if (d <= 30) moderate++;
            else normal++;
        });

        return {
            all: contracts.length,
            critical,
            moderate,
            normal
        };
    }, [contracts]);

    // Filtrado de contratos
    const filteredContracts = useMemo(() => {
        return contracts.filter(c => {
            const days = getDaysRemaining(c.endDate);
            const empName = `${c.employee?.firstName || ''} ${c.employee?.lastName || ''}`.toLowerCase();
            const empEmail = (c.employee?.email || '').toLowerCase();
            const empDept = (c.employee?.department || '').toLowerCase();
            const empPos = (c.employee?.position || '').toLowerCase();
            const q = searchTerm.toLowerCase().trim();

            const matchesSearch = !q || empName.includes(q) || empEmail.includes(q) || empDept.includes(q) || empPos.includes(q);
            const matchesDept = selectedDepartment === 'ALL' || c.employee?.department === selectedDepartment;

            let matchesTab = true;
            if (activeTab === 'CRITICAL') matchesTab = days <= 15;
            else if (activeTab === 'MODERATE') matchesTab = days > 15 && days <= 30;
            else if (activeTab === 'NORMAL') matchesTab = days > 30;

            return matchesSearch && matchesDept && matchesTab;
        });
    }, [contracts, searchTerm, selectedDepartment, activeTab]);

    const handleOpenRenewModal = (contract) => {
        setSelectedContract(contract);
        setRenewType('Indefinido');
        setRenewEndDate('');
        setRenewSalary(contract.salary || '');
        setRenewNotes('');
        setRenewModalOpen(true);
    };

    const handleRenewSubmit = async (e) => {
        e.preventDefault();
        if (!selectedContract) return;

        if (renewType === 'Temporal' && !renewEndDate) {
            toast.error('Selecciona la fecha de fin para el contrato a plazo fijo');
            return;
        }

        setRenewing(true);
        try {
            const payload = {
                newType: renewType,
                newEndDate: renewType === 'Indefinido' ? null : renewEndDate,
                newSalary: renewSalary ? parseFloat(renewSalary) : undefined,
                notes: renewNotes
            };

            const res = await api.put(`/contracts/${selectedContract.id}/renew`, payload);
            if (res.data.success) {
                toast.success(`Contrato de ${selectedContract.employee?.firstName} renovado`);
                setRenewModalOpen(false);
                fetchContracts(true);
            }
        } catch (err) {
            console.error('Error al renovar contrato:', err);
            toast.error(err.response?.data?.message || 'Error al renovar el contrato');
        } finally {
            setRenewing(false);
        }
    };

    const handleExportCSV = () => {
        if (!filteredContracts.length) {
            toast.error('No hay registros para exportar');
            return;
        }

        const headers = ['Empleado', 'Email', 'Departamento', 'Cargo', 'Tipo Contrato', 'Salario', 'Fecha Inicio', 'Fecha Vencimiento', 'Dias Restantes'];
        const rows = filteredContracts.map(c => {
            const days = getDaysRemaining(c.endDate);
            return [
                `"${c.employee?.firstName || ''} ${c.employee?.lastName || ''}"`,
                `"${c.employee?.email || ''}"`,
                `"${c.employee?.department || ''}"`,
                `"${c.employee?.position || ''}"`,
                `"${c.type || 'Temporal'}"`,
                c.salary || 0,
                c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
                c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
                days
            ].join(',');
        });

        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Contratos_Por_Vencer_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusBadge = (days) => {
        if (days <= 7) {
            return (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono border bg-red-50 text-red-800 border-red-200">
                    {days} días restantes
                </span>
            );
        }
        if (days <= 15) {
            return (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono border bg-amber-50 text-amber-800 border-amber-200">
                    {days} días restantes
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono border bg-gray-50 text-gray-700 border-gray-200">
                {days} días restantes
            </span>
        );
    };

    return (
        <div className="space-y-5 font-sans">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Contratos · Alertas de Vencimiento</p>
                    <h1 className="text-xl font-semibold text-gray-900">Contratos por Vencer</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Gestión de renovaciones y terminaciones contractuales próximas ({daysRange} días).</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleExportCSV}
                        disabled={!filteredContracts.length}
                        className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Exportar CSV
                    </button>
                    <button
                        onClick={() => fetchContracts()}
                        disabled={loading}
                        className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer"
                    >
                        {loading ? 'Consultando...' : 'Actualizar'}
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer"
                    >
                        ← Panel Principal
                    </button>
                </div>
            </div>

            {/* Navegación por Pestañas con Contadores Integrados */}
            <div className="flex border-b border-gray-200 gap-6 overflow-x-auto text-xs">
                <button
                    onClick={() => setActiveTab('ALL')}
                    className={`pb-2.5 font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'ALL' ? 'border-gray-900 text-gray-900 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Todos <span className="font-mono tabular-nums text-gray-400 ml-1">({counts.all})</span>
                </button>
                <button
                    onClick={() => setActiveTab('CRITICAL')}
                    className={`pb-2.5 font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'CRITICAL' ? 'border-gray-900 text-red-700 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Críticos ≤15 días <span className="font-mono tabular-nums text-red-600 font-medium ml-1">({counts.critical})</span>
                </button>
                <button
                    onClick={() => setActiveTab('MODERATE')}
                    className={`pb-2.5 font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'MODERATE' ? 'border-gray-900 text-amber-700 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Atención 16-30 días <span className="font-mono tabular-nums text-amber-600 font-medium ml-1">({counts.moderate})</span>
                </button>
                <button
                    onClick={() => setActiveTab('NORMAL')}
                    className={`pb-2.5 font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'NORMAL' ? 'border-gray-900 text-gray-900 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Plazo Normal &gt;30 días <span className="font-mono tabular-nums text-gray-400 ml-1">({counts.normal})</span>
                </button>
            </div>

            {/* Barra de Herramientas Directa */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-1 max-w-lg">
                    <input
                        type="text"
                        placeholder="Buscar por colaborador, cargo o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 shrink-0"
                    >
                        <option value="ALL">Todos los Departamentos</option>
                        {departments.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-gray-500">
                    <span className="text-[11px] text-gray-400 uppercase font-medium">Horizonte:</span>
                    {[30, 60, 90].map(d => (
                        <button
                            key={d}
                            onClick={() => setDaysRange(d)}
                            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${daysRange === d ? 'bg-gray-900 text-white font-medium' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    {error}
                </div>
            )}

            {/* Tabla de Contratos */}
            {loading ? (
                <div className="p-12 text-center text-gray-400 text-xs bg-white rounded border border-gray-200">
                    Cargando contratos por vencer...
                </div>
            ) : (
                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    {/* VISTA ESCRITORIO */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200">
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Departamento / Cargo</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Fecha Vencimiento</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Restante</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredContracts.length > 0 ? (
                                    filteredContracts.map((contract) => {
                                        const days = getDaysRemaining(contract.endDate);
                                        return (
                                            <tr key={contract.id} className="hover:bg-gray-50/60 transition-colors">
                                                {/* Empleado */}
                                                <td className="py-2.5 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded bg-gray-100 text-gray-700 font-mono font-semibold text-xs flex items-center justify-center shrink-0">
                                                            {contract.employee?.firstName?.charAt(0)}{contract.employee?.lastName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {contract.employee?.firstName} {contract.employee?.lastName}
                                                            </p>
                                                            <p className="text-[11px] text-gray-400 font-mono">
                                                                {contract.employee?.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Depto / Cargo */}
                                                <td className="py-2.5 px-4">
                                                    <span className="text-gray-800">{contract.employee?.department || 'General'}</span>
                                                    <span className="text-[11px] text-gray-400 block">{contract.employee?.position || 'Colaborador'}</span>
                                                </td>

                                                {/* Tipo Contrato */}
                                                <td className="py-2.5 px-4 text-gray-700">
                                                    {contract.type || 'Temporal'}
                                                </td>

                                                {/* Fecha Vencimiento */}
                                                <td className="py-2.5 px-4 font-mono text-gray-700" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                    {contract.endDate ? new Date(contract.endDate).toLocaleDateString('es-EC') : '—'}
                                                </td>

                                                {/* Restante */}
                                                <td className="py-2.5 px-4">
                                                    {getStatusBadge(days)}
                                                </td>

                                                {/* Acciones */}
                                                <td className="py-2.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleOpenRenewModal(contract)}
                                                            className="border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                        >
                                                            Renovar
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/admin/employees/${contract.employee?.id}`)}
                                                            className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                        >
                                                            Expediente
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-gray-400 text-xs">
                                            No hay contratos próximos a vencer con los filtros aplicados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* VISTA MÓVIL */}
                    <div className="block md:hidden divide-y divide-gray-100">
                        {filteredContracts.length > 0 ? (
                            filteredContracts.map((contract) => {
                                const days = getDaysRemaining(contract.endDate);
                                return (
                                    <div key={contract.id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-xs">
                                                    {contract.employee?.firstName} {contract.employee?.lastName}
                                                </p>
                                                <p className="text-[11px] text-gray-400">{contract.employee?.department} · {contract.employee?.position}</p>
                                            </div>
                                            {getStatusBadge(days)}
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                                            <span className="font-mono">{contract.endDate ? new Date(contract.endDate).toLocaleDateString('es-EC') : '—'}</span>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleOpenRenewModal(contract)}
                                                    className="border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                >
                                                    Renovar
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin/employees/${contract.employee?.id}`)}
                                                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                >
                                                    Expediente
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-gray-400 text-xs">
                                No hay contratos próximos a vencer con los filtros aplicados.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Renovación Estándar ERP */}
            {renewModalOpen && selectedContract && (
                <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 rounded max-w-lg w-full overflow-hidden shadow-xl">
                        {/* Header Modal */}
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Renovación de Contrato</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {selectedContract.employee?.firstName} {selectedContract.employee?.lastName} · {selectedContract.employee?.department}
                                </p>
                            </div>
                            <button
                                onClick={() => setRenewModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-base font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleRenewSubmit}>
                            <div className="p-5 space-y-4 text-xs">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Régimen Contractual:</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setRenewType('Indefinido')}
                                            className={`p-3 rounded border text-left transition-colors cursor-pointer ${renewType === 'Indefinido' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <p className="font-semibold text-gray-900">Indefinido</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">Sin fecha fin determinada.</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRenewType('Temporal')}
                                            className={`p-3 rounded border text-left transition-colors cursor-pointer ${renewType === 'Temporal' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <p className="font-semibold text-gray-900">Plazo Fijo / Temporal</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">Extensión por período.</p>
                                        </button>
                                    </div>
                                </div>

                                {renewType === 'Temporal' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Nueva Fecha de Vencimiento: *</label>
                                        <input
                                            type="date"
                                            required
                                            value={renewEndDate}
                                            onChange={(e) => setRenewEndDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Remuneración Mensual (USD):</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Ej. 1800.00"
                                        value={renewSalary}
                                        onChange={(e) => setRenewSalary(e.target.value)}
                                        className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-0.5">Opcional. Dejar vacío si mantiene el salario actual.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones / Cláusula:</label>
                                    <textarea
                                        rows="2"
                                        placeholder="Motivo de renovación o adenda laboral..."
                                        value={renewNotes}
                                        onChange={(e) => setRenewNotes(e.target.value)}
                                        className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            {/* Footer Modal */}
                            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRenewModalOpen(false)}
                                    className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={renewing}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    {renewing ? 'Guardando...' : 'Confirmar Renovación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpiringContracts;
