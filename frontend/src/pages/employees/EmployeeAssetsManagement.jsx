import React, { useState, useEffect, useMemo } from 'react';
import { 
    getAllAssets, 
    deliverAsset, 
    updateAsset, 
    returnAsset, 
    deleteAsset 
} from '../../services/employees/onboardingOffboarding.service';
import { getEmployees } from '../../services/employees/employee.service';
import { 
    FiSearch, 
    FiPlus, 
    FiRefreshCw, 
    FiPrinter, 
    FiEdit2, 
    FiTrash2, 
    FiArrowDownLeft 
} from 'react-icons/fi';
import Modal from '../../components/common/Modal';

const CATEGORY_MAP = {
    EQUIPMENT: 'Cómputo y Tecnología',
    UNIFORM_PPE: 'EPP e Indumentaria',
    TOOL: 'Herramienta de Trabajo',
    ACCESS_CARD: 'Tarjeta de Acceso'
};

const CONDITION_MAP = {
    NEW: 'Nuevo / Sin Uso',
    GOOD: 'Buen Estado / Operativo',
    FAIR: 'Regular con Desgaste',
    DAMAGED: 'Dañado / Requiere Reparación'
};

export default function EmployeeAssetsManagement() {
    const [assets, setAssets] = useState([]);
    const [counts, setCounts] = useState({ total: 0, deliveredCount: 0, returnedCount: 0, lostDamagedCount: 0 });
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'DELIVERED' | 'RETURNED' | 'LOST_DAMAGED'
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [departmentFilter, setDepartmentFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Modales
    const [deliverModalOpen, setDeliverModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [actaModalOpen, setActaModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Formulario de Entrega
    const [deliverForm, setDeliverForm] = useState({
        employeeId: '',
        name: '',
        serialNumber: '',
        category: 'EQUIPMENT',
        condition: 'NEW',
        deliveryDate: new Date().toISOString().split('T')[0]
    });

    // Formulario de Edición
    const [editForm, setEditForm] = useState({
        name: '',
        serialNumber: '',
        category: 'EQUIPMENT',
        condition: 'GOOD',
        deliveryDate: ''
    });

    // Formulario de Devolución
    const [returnForm, setReturnForm] = useState({
        condition: 'GOOD',
        status: 'RETURNED',
        returnNotes: '',
        returnDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resAssets, resEmployees] = await Promise.all([
                getAllAssets(),
                getEmployees()
            ]);

            if (resAssets.success) {
                setAssets(resAssets.data || []);
                if (resAssets.counts) {
                    setCounts(resAssets.counts);
                } else {
                    const data = resAssets.data || [];
                    setCounts({
                        total: data.length,
                        deliveredCount: data.filter(a => a.status === 'DELIVERED').length,
                        returnedCount: data.filter(a => a.status === 'RETURNED').length,
                        lostDamagedCount: data.filter(a => a.status === 'LOST_DAMAGED').length
                    });
                }
            }

            if (resEmployees) {
                setEmployees(Array.isArray(resEmployees) ? resEmployees : resEmployees.data || []);
            }
        } catch (error) {
            console.error('Error al cargar activos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeliverSubmit = async (e) => {
        e.preventDefault();
        if (!deliverForm.employeeId || !deliverForm.name.trim()) {
            alert('Por favor selecciona un colaborador y escribe el nombre del activo o EPP.');
            return;
        }

        setActionLoading(true);
        try {
            const res = await deliverAsset(deliverForm);
            if (res.success) {
                setDeliverModalOpen(false);
                setDeliverForm({
                    employeeId: '',
                    name: '',
                    serialNumber: '',
                    category: 'EQUIPMENT',
                    condition: 'NEW',
                    deliveryDate: new Date().toISOString().split('T')[0]
                });
                loadData();
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAsset) return;
        setActionLoading(true);
        try {
            const res = await updateAsset(selectedAsset.id, editForm);
            if (res.success) {
                setEditModalOpen(false);
                setSelectedAsset(null);
                loadData();
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReturnSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAsset) return;
        setActionLoading(true);
        try {
            const res = await returnAsset(selectedAsset.id, returnForm);
            if (res.success) {
                setReturnModalOpen(false);
                setSelectedAsset(null);
                loadData();
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (assetId) => {
        if (!window.confirm('¿Confirmas que deseas eliminar este registro de activo?')) return;
        setActionLoading(true);
        try {
            const res = await deleteAsset(assetId);
            if (res.success) {
                loadData();
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const openEditModal = (asset) => {
        setSelectedAsset(asset);
        setEditForm({
            name: asset.name,
            serialNumber: asset.serialNumber || '',
            category: asset.category,
            condition: asset.condition,
            deliveryDate: asset.deliveryDate ? asset.deliveryDate.split('T')[0] : ''
        });
        setEditModalOpen(true);
    };

    const openReturnModal = (asset) => {
        setSelectedAsset(asset);
        setReturnForm({
            condition: asset.condition || 'GOOD',
            status: 'RETURNED',
            returnNotes: '',
            returnDate: new Date().toISOString().split('T')[0]
        });
        setReturnModalOpen(true);
    };

    const openActaModal = (asset) => {
        setSelectedAsset(asset);
        setActaModalOpen(true);
    };

    const filteredAssets = useMemo(() => {
        let list = assets;

        if (statusFilter !== 'ALL') {
            list = list.filter(a => a.status === statusFilter);
        }

        if (categoryFilter !== 'ALL') {
            list = list.filter(a => a.category === categoryFilter);
        }

        if (departmentFilter !== 'ALL') {
            list = list.filter(a => a.employee?.department === departmentFilter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(a => 
                a.name.toLowerCase().includes(q) ||
                (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
                (a.employee?.firstName && a.employee.firstName.toLowerCase().includes(q)) ||
                (a.employee?.lastName && a.employee.lastName.toLowerCase().includes(q)) ||
                (a.employee?.identityCard && a.employee.identityCard.toLowerCase().includes(q))
            );
        }

        return list;
    }, [assets, statusFilter, categoryFilter, departmentFilter, searchQuery]);

    const departments = useMemo(() => {
        const set = new Set(assets.map(a => a.employee?.department).filter(Boolean));
        return Array.from(set);
    }, [assets]);

    const getCategoryLabel = (category) => CATEGORY_MAP[category] || category || 'Bien General';

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            {/* Header Limpio ERP */}
            <div className="bg-white p-5 rounded border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono">
                            Gestión de Capital Humano
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                            Dotación y Custodia de Activos
                        </span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        Control de Equipos, Herramientas y EPPs
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Registro formal de custodia de bienes asignados a colaboradores con actas de entrega y control de devoluciones.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer bg-white flex items-center gap-1.5"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                    </button>
                    <button
                        onClick={() => setDeliverModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <FiPlus className="w-3.5 h-3.5" />
                        <span>Registrar Entrega</span>
                    </button>
                </div>
            </div>

            {/* Pestañas de Estado con Contadores Tabulares + Filtros */}
            <div className="bg-white border border-gray-200 rounded p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                            Todos <span className="font-mono tabular-nums text-gray-400">({counts.total})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('DELIVERED')}
                            className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                                statusFilter === 'DELIVERED'
                                    ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            En Custodia <span className={`font-mono tabular-nums ${counts.deliveredCount > 0 ? 'text-blue-700 font-semibold' : 'text-gray-400'}`}>({counts.deliveredCount})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('RETURNED')}
                            className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                                statusFilter === 'RETURNED'
                                    ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Devueltos a Bodega <span className="font-mono tabular-nums text-emerald-700 font-semibold">({counts.returnedCount})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('LOST_DAMAGED')}
                            className={`pb-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                                statusFilter === 'LOST_DAMAGED'
                                    ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Dañados / Extraviados <span className={`font-mono tabular-nums ${counts.lostDamagedCount > 0 ? 'text-rose-600 font-semibold' : 'text-gray-400'}`}>({counts.lostDamagedCount})</span>
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="relative w-full sm:w-56">
                            <FiSearch className="absolute left-3 top-2 text-gray-400" size={13} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar activo, serie o persona..."
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
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="ALL">Todas las Categorías</option>
                            <option value="EQUIPMENT">Cómputo y Tecnología</option>
                            <option value="UNIFORM_PPE">EPP e Indumentaria</option>
                            <option value="TOOL">Herramientas</option>
                            <option value="ACCESS_CARD">Tarjetas de Acceso</option>
                        </select>

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

                {/* Tabla de Activos */}
                <div className="border border-gray-200 rounded overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="py-2.5 px-4">Activo / Dotación</th>
                                    <th className="py-2.5 px-4">Colaborador Custodio</th>
                                    <th className="py-2.5 px-4">Nº Serie / Código</th>
                                    <th className="py-2.5 px-4">Fecha Entrega</th>
                                    <th className="py-2.5 px-4">Estado</th>
                                    <th className="py-2.5 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-400 font-mono text-xs">
                                            Cargando registro de dotación y activos...
                                        </td>
                                    </tr>
                                ) : filteredAssets.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-400 text-xs">
                                            No se encontraron activos o EPPs registrados con los criterios seleccionados.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAssets.map((asset) => (
                                        <tr key={asset.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                                            <td className="py-2.5 px-4">
                                                <div className="font-semibold text-gray-900">{asset.name}</div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                                        {getCategoryLabel(asset.category)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        Condición: {asset.condition === 'NEW' ? 'Nuevo' : asset.condition === 'GOOD' ? 'Buen Estado' : 'Regular'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-2.5 px-4">
                                                <span className="font-medium text-gray-900">
                                                    {asset.employee ? `${asset.employee.firstName} ${asset.employee.lastName}` : 'No asignado'}
                                                </span>
                                                <p className="text-[11px] text-gray-400">
                                                    {asset.employee?.department || 'General'} · C.I.: {asset.employee?.identityCard || 'S/N'}
                                                </p>
                                            </td>

                                            <td className="py-2.5 px-4 font-mono tabular-nums text-gray-800">
                                                {asset.serialNumber || 'S/N'}
                                            </td>

                                            <td className="py-2.5 px-4 font-mono tabular-nums text-gray-600">
                                                {asset.deliveryDate ? new Date(asset.deliveryDate).toLocaleDateString('es-EC') : '—'}
                                            </td>

                                            <td className="py-2.5 px-4">
                                                {asset.status === 'DELIVERED' ? (
                                                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                        EN CUSTODIA
                                                    </span>
                                                ) : asset.status === 'RETURNED' ? (
                                                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                        DEVUELTO ({asset.returnDate ? new Date(asset.returnDate).toLocaleDateString('es-EC') : 'Bodega'})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                                        EXTRAVIADO / DAÑADO
                                                    </span>
                                                )}
                                                {asset.returnNotes && (
                                                    <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px]">
                                                        Nota: {asset.returnNotes}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="py-2.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {asset.status === 'DELIVERED' && (
                                                        <button
                                                            onClick={() => openReturnModal(asset)}
                                                            className="border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 text-xs px-2 py-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                                                            title="Registrar devolución de activo a bodega"
                                                        >
                                                            <FiArrowDownLeft className="w-3 h-3 text-blue-600" />
                                                            <span>Devolución</span>
                                                        </button>
                                                    )}
                                                    
                                                    <button
                                                        onClick={() => openActaModal(asset)}
                                                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-xs p-1.5 rounded transition-colors cursor-pointer"
                                                        title="Ver / Imprimir Acta de Entrega - Recepción"
                                                    >
                                                        <FiPrinter className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => openEditModal(asset)}
                                                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-xs p-1.5 rounded transition-colors cursor-pointer"
                                                        title="Editar detalles del activo"
                                                    >
                                                        <FiEdit2 className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(asset.id)}
                                                        className="border border-gray-200 text-gray-400 hover:text-rose-600 hover:border-rose-200 text-xs p-1.5 rounded transition-colors cursor-pointer"
                                                        title="Eliminar registro"
                                                    >
                                                        <FiTrash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Entrega */}
            <Modal
                isOpen={deliverModalOpen}
                onClose={() => setDeliverModalOpen(false)}
                title="Registrar Entrega de Activo / EPP"
                size="lg"
            >
                <form onSubmit={handleDeliverSubmit} className="space-y-3.5">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Colaborador Receptor</label>
                        <select
                            required
                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            value={deliverForm.employeeId}
                            onChange={(e) => setDeliverForm({ ...deliverForm, employeeId: e.target.value })}
                        >
                            <option value="">-- Selecciona un Colaborador --</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName} ({emp.identityCard || 'S/N'}) - {emp.department || 'General'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre y Descripción del Activo / Dotación</label>
                        <input
                            type="text"
                            required
                            placeholder="ej. Laptop Lenovo ThinkPad T14, Casco Dieléctrico Talla M, etc."
                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            value={deliverForm.name}
                            onChange={(e) => setDeliverForm({ ...deliverForm, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                            <select
                                className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                value={deliverForm.category}
                                onChange={(e) => setDeliverForm({ ...deliverForm, category: e.target.value })}
                            >
                                <option value="EQUIPMENT">Cómputo y Tecnología</option>
                                <option value="UNIFORM_PPE">EPP e Indumentaria</option>
                                <option value="TOOL">Herramienta de Trabajo</option>
                                <option value="ACCESS_CARD">Tarjeta de Acceso</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Nº Serie / Código Inventario</label>
                            <input
                                type="text"
                                placeholder="ej. SN-883921"
                                className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-500"
                                value={deliverForm.serialNumber}
                                onChange={(e) => setDeliverForm({ ...deliverForm, serialNumber: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Condición de Entrega</label>
                            <select
                                className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                value={deliverForm.condition}
                                onChange={(e) => setDeliverForm({ ...deliverForm, condition: e.target.value })}
                            >
                                <option value="NEW">Nuevo / Sin Uso</option>
                                <option value="GOOD">Buen Estado / Operativo</option>
                                <option value="FAIR">Regular con Desgaste</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de Entrega</label>
                            <input
                                type="date"
                                className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-500"
                                value={deliverForm.deliveryDate}
                                onChange={(e) => setDeliverForm({ ...deliverForm, deliveryDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                        <button 
                            type="button" 
                            onClick={() => setDeliverModalOpen(false)} 
                            className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={actionLoading} 
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {actionLoading ? 'Guardando...' : 'Confirmar Entrega'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Edición */}
            <Modal
                isOpen={editModalOpen && !!selectedAsset}
                onClose={() => setEditModalOpen(false)}
                title="Editar Información del Activo"
                size="md"
            >
                {selectedAsset && (
                    <form onSubmit={handleEditSubmit} className="space-y-3.5">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del Activo</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Nº Serie / Código</label>
                            <input
                                type="text"
                                className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-500"
                                value={editForm.serialNumber}
                                onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                                <select
                                    className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                >
                                    <option value="EQUIPMENT">Cómputo</option>
                                    <option value="UNIFORM_PPE">EPP / Ropa</option>
                                    <option value="TOOL">Herramienta</option>
                                    <option value="ACCESS_CARD">Acceso</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Condición</label>
                                <select
                                    className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                    value={editForm.condition}
                                    onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                                >
                                    <option value="NEW">Nuevo</option>
                                    <option value="GOOD">Bueno</option>
                                    <option value="FAIR">Regular</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                            <button type="button" onClick={() => setEditModalOpen(false)} className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer">Cancelar</button>
                            <button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50">
                                {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal de Devolución */}
            <Modal
                isOpen={returnModalOpen && !!selectedAsset}
                onClose={() => setReturnModalOpen(false)}
                title="Registrar Devolución de Activo"
                size="md"
            >
                {selectedAsset && (
                    <form onSubmit={handleReturnSubmit} className="space-y-3.5">
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs">
                            <p className="font-semibold text-gray-900">{selectedAsset.name}</p>
                            <p className="text-gray-500 mt-0.5">Custodio: {selectedAsset.employee?.firstName} {selectedAsset.employee?.lastName} (Serie: {selectedAsset.serialNumber || 'S/N'})</p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Estado al Recibir</label>
                            <select
                                className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                value={returnForm.status}
                                onChange={(e) => setReturnForm({ ...returnForm, status: e.target.value })}
                            >
                                <option value="RETURNED">Devuelto a Bodega (Operativo / Buen Estado)</option>
                                <option value="LOST_DAMAGED">Reportar Daño Grave o Extravío</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Condición Física de Recepción</label>
                            <select
                                className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                value={returnForm.condition}
                                onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}
                            >
                                <option value="GOOD">Buen Estado</option>
                                <option value="FAIR">Desgaste Normal de Uso</option>
                                <option value="DAMAGED">Dañado / Requiere Reparación</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones / Novedades de Recepción</label>
                            <textarea
                                rows="2"
                                placeholder="ej. Entregado con cargador original / Rayón en cubierta..."
                                className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                                value={returnForm.returnNotes}
                                onChange={(e) => setReturnForm({ ...returnForm, returnNotes: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                            <button type="button" onClick={() => setReturnModalOpen(false)} className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer">Cancelar</button>
                            <button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50">
                                {actionLoading ? 'Guardando...' : 'Confirmar Devolución'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal de Acta Oficial */}
            <Modal
                isOpen={actaModalOpen && !!selectedAsset}
                onClose={() => setActaModalOpen(false)}
                title="Acta de Entrega - Recepción de Activos"
                subtitle="Documento Oficial de Custodia y Responsabilidad Laboral"
                size="xl"
                footer={
                    <div className="flex items-center justify-between w-full">
                        <button
                            onClick={() => window.print()}
                            className="bg-gray-900 hover:bg-black text-white text-xs px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer font-medium"
                        >
                            <FiPrinter className="w-3.5 h-3.5" />
                            <span>Imprimir Acta</span>
                        </button>
                        <button onClick={() => setActaModalOpen(false)} className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-4 py-1.5 rounded cursor-pointer">
                            Cerrar
                        </button>
                    </div>
                }
            >
                {selectedAsset && (
                    <div className="space-y-4">
                        {/* Membrete del Acta */}
                        <div className="border-b border-gray-200 pb-3 text-center">
                            <h2 className="text-sm font-bold text-gray-900 uppercase">Acta de Asignación y Responsabilidad de Bienes</h2>
                            <p className="text-[11px] text-gray-500 mt-0.5">Código Único de Registro: AST-{selectedAsset.id.slice(-6).toUpperCase()}</p>
                        </div>

                        {/* Datos de las Partes */}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Empresa / Empleador</span>
                                <p className="font-semibold text-gray-900">EMPLIFI S.A.</p>
                                <p className="text-gray-500 text-[11px]">RUC: 1792345678001</p>
                            </div>

                            <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Custodio / Colaborador</span>
                                <p className="font-semibold text-gray-900">{selectedAsset.employee?.firstName} {selectedAsset.employee?.lastName}</p>
                                <p className="text-gray-500 text-[11px]">C.I.: {selectedAsset.employee?.identityCard || 'S/N'} · {selectedAsset.employee?.department || 'General'}</p>
                            </div>
                        </div>

                        {/* Detalle del Activo */}
                        <div className="border border-gray-200 rounded p-4 space-y-2 text-xs">
                            <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1.5">Descripción Detallada del Bien</h4>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div><span className="text-gray-500">Bien / Dotación:</span> <strong className="text-gray-800">{selectedAsset.name}</strong></div>
                                <div><span className="text-gray-500">Categoría:</span> <strong className="text-gray-800">{CATEGORY_MAP[selectedAsset.category] || selectedAsset.category}</strong></div>
                                <div><span className="text-gray-500">Nº Serie / Placa:</span> <strong className="font-mono text-gray-800">{selectedAsset.serialNumber || 'No especificado'}</strong></div>
                                <div><span className="text-gray-500">Estado de Entrega:</span> <strong className="text-gray-800">{CONDITION_MAP[selectedAsset.condition] || selectedAsset.condition}</strong></div>
                                <div><span className="text-gray-500">Fecha de Entrega:</span> <strong className="font-mono text-gray-800">{new Date(selectedAsset.deliveryDate).toLocaleDateString('es-EC')}</strong></div>
                            </div>
                            {selectedAsset.notes && (
                                <div className="pt-2 border-t border-gray-100 text-[11px]">
                                    <span className="text-gray-500 block">Accesorios / Observaciones:</span>
                                    <p className="text-gray-700 italic mt-0.5">{selectedAsset.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Cláusula Legal */}
                        <div className="p-3 bg-gray-50/70 border border-gray-200 rounded text-[11px] text-gray-600 space-y-1.5 leading-relaxed text-justify">
                            <p className="font-semibold text-gray-900">TÉRMINOS Y CONDICIONES DE CUSTODIA:</p>
                            <p>
                                El colaborador declara recibir en perfecto estado de funcionamiento el bien descrito, comprometiéndose a utilizarlo exclusivamente para fines laborales y a velar por su adecuado cuidado y custodia. En caso de desvinculación laboral, el bien deberá ser devuelto a la empresa de forma obligatoria e inmediata.
                            </p>
                        </div>

                        {/* Firmas */}
                        <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                            <div>
                                <div className="border-t border-gray-400 pt-2 w-48 mx-auto font-semibold text-gray-900">
                                    Entregado por (RRHH)
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5">Administración de Talento</p>
                            </div>
                            <div>
                                <div className="border-t border-gray-400 pt-2 w-48 mx-auto font-semibold text-gray-900">
                                    Recibido Conforme (Custodio)
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5">{selectedAsset.employee?.firstName} {selectedAsset.employee?.lastName}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
