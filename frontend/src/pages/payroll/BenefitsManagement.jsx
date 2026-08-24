import { useState, useEffect, useMemo } from 'react';
import { getEmployees } from '../../services/employees/employee.service';
import {
    getBenefits,
    getBenefitStats,
    createBenefit,
    updateBenefit,
    deactivateBenefit,
    bulkCreateBenefit
} from '../../services/payroll/benefits.service';

const STATUS_MAP = {
    ACTIVE: { label: 'PENDIENTE', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    PROCESSED: { label: 'PROCESADO', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
    CANCELLED: { label: 'CANCELADO', cls: 'bg-gray-50 text-gray-700 border-gray-200' }
};

const TYPE_MAP = {
    BONUS: 'Bono',
    INCENTIVE: 'Incentivo',
    ALLOWANCE: 'Viático / Otros'
};

const BenefitsManagement = () => {
    // Datos y listas
    const [benefits, setBenefits] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, processed: 0, cancelled: 0, activeAmountTotal: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Filtros y Paginación
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, PROCESSED, CANCELLED
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

    // Modales
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    // Selecciones y Formularios
    const [selectedBenefit, setSelectedBenefit] = useState(null);
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }

    const [singleFormData, setSingleFormData] = useState({
        employeeId: '',
        name: '',
        amount: '',
        type: 'BONUS',
        frequency: 'ONE_TIME'
    });

    const [editFormData, setEditFormData] = useState({
        name: '',
        amount: '',
        type: 'BONUS',
        frequency: 'ONE_TIME'
    });

    const [bulkData, setBulkData] = useState({
        name: '',
        amount: '',
        type: 'BONUS',
        frequency: 'ONE_TIME',
        isSpecial: false,
        specialType: '',
        selectedDepartment: 'ALL',
        selectedEmployees: []
    });

    // Carga inicial
    useEffect(() => {
        loadEmployeesList();
    }, []);

    // Carga de beneficios y estadísticas
    useEffect(() => {
        loadBenefitsData();
        loadStatsData();
    }, [activeTab, filterType, pagination.page]);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const loadEmployeesList = async () => {
        try {
            const res = await getEmployees();
            if (res.success && Array.isArray(res.data)) {
                setEmployees(res.data);
            }
        } catch (error) {
            console.error('Error al cargar empleados:', error);
        }
    };

    const loadStatsData = async () => {
        try {
            const res = await getBenefitStats();
            if (res.success && res.data) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Error al cargar estadísticas de beneficios:', error);
        }
    };

    const loadBenefitsData = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                status: activeTab === 'ALL' ? undefined : activeTab,
                type: filterType || undefined,
                search: searchTerm.trim() || undefined
            };

            const res = await getBenefits(params);
            if (res.success) {
                setBenefits(res.data || []);
                if (res.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        total: res.pagination.total || 0,
                        totalPages: res.pagination.totalPages || 1
                    }));
                }
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al cargar beneficios');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        loadBenefitsData();
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Creación individual
    const handleOpenCreateModal = (preselectedEmpId = '') => {
        setSingleFormData({
            employeeId: preselectedEmpId || (employees[0]?.id || ''),
            name: '',
            amount: '',
            type: 'BONUS',
            frequency: 'ONE_TIME'
        });
        setCreateModalOpen(true);
    };

    const handleSingleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!singleFormData.employeeId) {
            showNotification('error', 'Debe seleccionar un colaborador');
            return;
        }

        setActionLoading(true);
        try {
            const res = await createBenefit({
                employeeId: singleFormData.employeeId,
                name: singleFormData.name,
                amount: parseFloat(singleFormData.amount),
                type: singleFormData.type,
                frequency: singleFormData.frequency
            });

            if (res.success) {
                showNotification('success', 'Beneficio registrado exitosamente');
                setCreateModalOpen(false);
                loadBenefitsData();
                loadStatsData();
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al crear beneficio');
        } finally {
            setActionLoading(false);
        }
    };

    // Edición
    const handleOpenEditModal = (benefit) => {
        setSelectedBenefit(benefit);
        setEditFormData({
            name: benefit.name,
            amount: benefit.amount.toString(),
            type: benefit.type,
            frequency: benefit.frequency
        });
        setEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBenefit) return;

        setActionLoading(true);
        try {
            const res = await updateBenefit(selectedBenefit.id, {
                name: editFormData.name,
                amount: parseFloat(editFormData.amount),
                type: editFormData.type,
                frequency: editFormData.frequency
            });

            if (res.success) {
                showNotification('success', 'Beneficio actualizado exitosamente');
                setEditModalOpen(false);
                setSelectedBenefit(null);
                loadBenefitsData();
                loadStatsData();
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al actualizar beneficio');
        } finally {
            setActionLoading(false);
        }
    };

    // Cancelación
    const handleOpenConfirmDeactivate = (benefit) => {
        setSelectedBenefit(benefit);
        setConfirmModalOpen(true);
    };

    const handleConfirmDeactivate = async () => {
        if (!selectedBenefit) return;

        setActionLoading(true);
        try {
            const res = await deactivateBenefit(selectedBenefit.id);
            if (res.success) {
                showNotification('success', 'Beneficio cancelado exitosamente');
                setConfirmModalOpen(false);
                setSelectedBenefit(null);
                loadBenefitsData();
                loadStatsData();
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al cancelar beneficio');
        } finally {
            setActionLoading(false);
        }
    };

    // Asignación Masiva
    const handleOpenBulkModal = () => {
        setBulkData({
            name: '',
            amount: '',
            type: 'BONUS',
            frequency: 'ONE_TIME',
            isSpecial: false,
            specialType: '',
            selectedDepartment: 'ALL',
            selectedEmployees: employees.map(e => e.id)
        });
        setBulkModalOpen(true);
    };

    const departments = useMemo(() => {
        const set = new Set();
        employees.forEach(e => {
            if (e.department) set.add(e.department);
        });
        return Array.from(set).sort();
    }, [employees]);

    const filteredBulkEmployees = useMemo(() => {
        if (bulkData.selectedDepartment === 'ALL') return employees;
        return employees.filter(e => e.department === bulkData.selectedDepartment);
    }, [employees, bulkData.selectedDepartment]);

    const handleDepartmentFilterChange = (dept) => {
        setBulkData(prev => {
            const targetEmps = dept === 'ALL' ? employees : employees.filter(e => e.department === dept);
            return {
                ...prev,
                selectedDepartment: dept,
                selectedEmployees: targetEmps.map(e => e.id)
            };
        });
    };

    const toggleBulkEmployee = (id) => {
        setBulkData(prev => ({
            ...prev,
            selectedEmployees: prev.selectedEmployees.includes(id)
                ? prev.selectedEmployees.filter(e => e !== id)
                : [...prev.selectedEmployees, id]
        }));
    };

    const handleSelectAllBulk = () => {
        const currentIds = filteredBulkEmployees.map(e => e.id);
        const allSelected = currentIds.every(id => bulkData.selectedEmployees.includes(id));

        setBulkData(prev => ({
            ...prev,
            selectedEmployees: allSelected
                ? prev.selectedEmployees.filter(id => !currentIds.includes(id))
                : Array.from(new Set([...prev.selectedEmployees, ...currentIds]))
        }));
    };

    const applyTemplate = (templateKey) => {
        if (templateKey === 'DECIMO_3') {
            setBulkData(prev => ({
                ...prev,
                name: 'Décimo Tercer Sueldo (Bono Navideño)',
                isSpecial: true,
                specialType: 'DECIMO_TERCERO',
                type: 'BONUS',
                amount: ''
            }));
        } else if (templateKey === 'DECIMO_4') {
            setBulkData(prev => ({
                ...prev,
                name: 'Décimo Cuarto Sueldo (Bono Escolar SBU)',
                isSpecial: true,
                specialType: 'DECIMO_CUARTO',
                type: 'BONUS',
                amount: ''
            }));
        } else if (templateKey === 'FONDO_RESERVA') {
            setBulkData(prev => ({
                ...prev,
                name: 'Fondos de Reserva (Mensual 8.33%)',
                isSpecial: true,
                specialType: 'FONDO_RESERVA',
                type: 'BONUS',
                amount: ''
            }));
        } else if (templateKey === 'UTILIDADES') {
            setBulkData(prev => ({
                ...prev,
                name: 'Participación de Utilidades',
                isSpecial: true,
                specialType: 'UTILIDADES',
                type: 'BONUS',
                amount: ''
            }));
        } else if (templateKey === 'CUSTOM') {
            setBulkData(prev => ({
                ...prev,
                name: '',
                isSpecial: false,
                specialType: '',
                amount: ''
            }));
        }
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        if (bulkData.selectedEmployees.length === 0) {
            showNotification('error', 'Debe seleccionar al menos un colaborador');
            return;
        }

        setActionLoading(true);
        try {
            const payload = {
                employeeIds: bulkData.selectedEmployees,
                name: bulkData.name,
                amount: bulkData.isSpecial ? 0 : parseFloat(bulkData.amount),
                type: bulkData.type,
                frequency: bulkData.frequency || 'ONE_TIME',
                isSpecialCalculation: bulkData.isSpecial ? bulkData.specialType : null
            };

            const res = await bulkCreateBenefit(payload);
            if (res.success) {
                showNotification('success', res.message || 'Asignación masiva completada');
                setBulkModalOpen(false);
                loadBenefitsData();
                loadStatsData();
            }
        } catch (error) {
            showNotification('error', error.message || 'Error en asignación masiva');
        } finally {
            setActionLoading(false);
        }
    };

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";
    const labelClass = "block text-xs font-medium text-gray-600 mb-1";

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

            {/* Header ERP con Balance Financiero Integrado */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Nómina · Beneficios e Incentivos</p>
                    <h1 className="text-xl font-semibold text-gray-900">Gestión de Beneficios e Incentivos</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Administre bonos, viáticos y beneficios legales para su integración al rol de pagos.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-4 bg-white px-3.5 py-2 rounded border border-gray-200 font-mono text-xs">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Pendiente a Nómina</span>
                            <span className="font-semibold text-gray-900 tabular-nums">
                                ${Number(stats.activeAmountTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => handleOpenCreateModal()}
                        className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer"
                    >
                        + Asignar Individual
                    </button>

                    <button
                        onClick={handleOpenBulkModal}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                    >
                        + Asignación Masiva
                    </button>
                </div>
            </div>

            {/* Pestañas con Contadores Integrados (Holded/Linear Style) */}
            <div className="flex items-center justify-between border-b border-gray-200 gap-4 overflow-x-auto">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleTabChange('ALL')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'ALL'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Todos <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.total})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('ACTIVE')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'ACTIVE'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Pendientes de Pago <span className="ml-1.5 font-mono text-[11px] text-emerald-600">({stats.active})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('PROCESSED')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'PROCESSED'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Procesados en Nómina <span className="ml-1.5 font-mono text-[11px] text-blue-600">({stats.processed})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('CANCELLED')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'CANCELLED'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Cancelados <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.cancelled})</span>
                    </button>
                </div>
            </div>

            {/* Barra de Herramientas y Filtros */}
            <div className="bg-white p-3 rounded border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por colaborador, cédula o concepto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={inputClass}
                    />
                    <button
                        type="submit"
                        className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors shrink-0 cursor-pointer"
                    >
                        Buscar
                    </button>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setPagination(prev => ({ ...prev, page: 1 }));
                                setTimeout(loadBenefitsData, 0);
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer shrink-0"
                        >
                            Limpiar
                        </button>
                    )}
                </form>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <select
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className={inputClass + ' sm:w-44'}
                    >
                        <option value="">Todas las categorías</option>
                        <option value="BONUS">Bonos</option>
                        <option value="INCENTIVE">Incentivos</option>
                        <option value="ALLOWANCE">Viáticos / Otros</option>
                    </select>
                </div>
            </div>

            {/* Tabla Principal de Beneficios (Hoja de Cálculo Sobria) */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-2.5 px-4">Colaborador</th>
                                <th className="py-2.5 px-4">Concepto / Detalle</th>
                                <th className="py-2.5 px-4">Categoría</th>
                                <th className="py-2.5 px-4">Frecuencia</th>
                                <th className="py-2.5 px-4 text-right">Monto</th>
                                <th className="py-2.5 px-4">Fecha Registro</th>
                                <th className="py-2.5 px-4 text-center">Estado</th>
                                <th className="py-2.5 px-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-gray-400 text-xs">
                                        Cargando registros de beneficios...
                                    </td>
                                </tr>
                            ) : benefits.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center">
                                        <p className="text-sm font-medium text-gray-700">Sin beneficios registrados</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            No se encontraron asignaciones con los filtros seleccionados.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                benefits.map(b => {
                                    const statusConfig = STATUS_MAP[b.status] || STATUS_MAP.ACTIVE;
                                    return (
                                        <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="py-2.5 px-4">
                                                <p className="font-medium text-gray-900">
                                                    {b.employee?.firstName} {b.employee?.lastName}
                                                </p>
                                                <p className="text-gray-400 text-[11px]">
                                                    {b.employee?.identityCard || 'C.I. S/N'} · {b.employee?.department || 'General'}
                                                </p>
                                            </td>
                                            <td className="py-2.5 px-4 font-medium text-gray-900">
                                                {b.name}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <span className="px-2 py-0.5 rounded text-[11px] font-medium border bg-gray-50 text-gray-700 border-gray-200">
                                                    {TYPE_MAP[b.type] || b.type}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-gray-500">
                                                {b.frequency === 'ONE_TIME' ? 'Pago Único' : 'Recurrente'}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900 tabular-nums">
                                                ${Number(b.amount || 0).toFixed(2)}
                                            </td>
                                            <td className="py-2.5 px-4 font-mono text-[11px] text-gray-500 tabular-nums">
                                                {new Date(b.createdAt).toLocaleDateString('es-EC')}
                                            </td>
                                            <td className="py-2.5 px-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${statusConfig.cls}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-right">
                                                {b.status === 'ACTIVE' ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleOpenEditModal(b)}
                                                            className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenConfirmDeactivate(b)}
                                                            className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-[11px] font-mono">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {!loading && pagination.totalPages > 1 && (
                    <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                        <span>Mostrando página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)</span>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                className="px-2.5 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                className="px-2.5 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL ASIGNACIÓN INDIVIDUAL */}
            {createModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-lg w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Nuevo Beneficio Individual</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Asigne un bono o viático a un colaborador específico.</p>
                            </div>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSingleCreateSubmit} className="p-5 space-y-4">
                            <div>
                                <label className={labelClass}>Colaborador</label>
                                <select
                                    required
                                    className={inputClass}
                                    value={singleFormData.employeeId}
                                    onChange={(e) => setSingleFormData({ ...singleFormData, employeeId: e.target.value })}
                                >
                                    <option value="">Seleccione un colaborador...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName} — {emp.department || 'General'} ({emp.position || 'Colaborador'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Concepto / Descripción</label>
                                <input
                                    type="text"
                                    required
                                    className={inputClass}
                                    placeholder="Ej. Bono por Cumplimiento de Metas"
                                    value={singleFormData.name}
                                    onChange={(e) => setSingleFormData({ ...singleFormData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Monto ($ USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        className={inputClass + ' font-mono'}
                                        placeholder="0.00"
                                        value={singleFormData.amount}
                                        onChange={(e) => setSingleFormData({ ...singleFormData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Frecuencia</label>
                                    <select
                                        className={inputClass}
                                        value={singleFormData.frequency}
                                        onChange={(e) => setSingleFormData({ ...singleFormData, frequency: e.target.value })}
                                    >
                                        <option value="ONE_TIME">Pago Único (Próxima Nómina)</option>
                                        <option value="RECURRING">Recurrente Mensual</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Categoría</label>
                                <select
                                    className={inputClass}
                                    value={singleFormData.type}
                                    onChange={(e) => setSingleFormData({ ...singleFormData, type: e.target.value })}
                                >
                                    <option value="BONUS">Bono</option>
                                    <option value="INCENTIVE">Incentivo</option>
                                    <option value="ALLOWANCE">Viático / Otros</option>
                                </select>
                            </div>

                            <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {actionLoading ? 'Guardando...' : 'Asignar Beneficio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EDICIÓN */}
            {editModalOpen && selectedBenefit && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-lg w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Editar Beneficio</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Colaborador: {selectedBenefit.employee?.firstName} {selectedBenefit.employee?.lastName}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                            <div>
                                <label className={labelClass}>Concepto / Descripción</label>
                                <input
                                    type="text"
                                    required
                                    className={inputClass}
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Monto ($ USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        className={inputClass + ' font-mono'}
                                        value={editFormData.amount}
                                        onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Frecuencia</label>
                                    <select
                                        className={inputClass}
                                        value={editFormData.frequency}
                                        onChange={(e) => setEditFormData({ ...editFormData, frequency: e.target.value })}
                                    >
                                        <option value="ONE_TIME">Pago Único</option>
                                        <option value="RECURRING">Recurrente</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Categoría</label>
                                <select
                                    className={inputClass}
                                    value={editFormData.type}
                                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                                >
                                    <option value="BONUS">Bono</option>
                                    <option value="INCENTIVE">Incentivo</option>
                                    <option value="ALLOWANCE">Viático / Otros</option>
                                </select>
                            </div>

                            <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {actionLoading ? 'Actualizando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ASIGNACIÓN MASIVA */}
            {bulkModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-2xl w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Asignación Masiva de Beneficios</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Asigne beneficios fijos o cálculos de ley a múltiples colaboradores.</p>
                            </div>
                            <button
                                onClick={() => setBulkModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                            {/* Plantillas Legales */}
                            <div>
                                <label className={labelClass}>Plantillas Rápidas (Normativa Ecuador)</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => applyTemplate('DECIMO_3')}
                                        className={`p-2.5 border rounded text-left transition-colors cursor-pointer ${
                                            bulkData.specialType === 'DECIMO_TERCERO'
                                                ? 'border-blue-500 bg-blue-50/50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <p className="font-semibold text-xs text-gray-800">Décimo Tercero</p>
                                        <p className="text-[11px] text-gray-400">1 Sueldo Base</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => applyTemplate('DECIMO_4')}
                                        className={`p-2.5 border rounded text-left transition-colors cursor-pointer ${
                                            bulkData.specialType === 'DECIMO_CUARTO'
                                                ? 'border-blue-500 bg-blue-50/50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <p className="font-semibold text-xs text-gray-800">Décimo Cuarto</p>
                                        <p className="text-[11px] text-gray-400">1 SBU ($460.00)</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => applyTemplate('FONDO_RESERVA')}
                                        className={`p-2.5 border rounded text-left transition-colors cursor-pointer ${
                                            bulkData.specialType === 'FONDO_RESERVA'
                                                ? 'border-blue-500 bg-blue-50/50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <p className="font-semibold text-xs text-gray-800">Fondo Reserva</p>
                                        <p className="text-[11px] text-gray-400">8.33% mensual</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => applyTemplate('CUSTOM')}
                                        className={`p-2.5 border rounded text-left transition-colors cursor-pointer ${
                                            !bulkData.isSpecial
                                                ? 'border-blue-500 bg-blue-50/50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <p className="font-semibold text-xs text-gray-800">Monto Manual</p>
                                        <p className="text-[11px] text-gray-400">Valor fijo ($)</p>
                                    </button>
                                </div>
                            </div>

                            <form id="bulkForm" onSubmit={handleBulkSubmit} className="space-y-3">
                                <div>
                                    <label className={labelClass}>Nombre / Concepto del Beneficio</label>
                                    <input
                                        type="text"
                                        required
                                        className={inputClass}
                                        placeholder="Ej. Bono de Productividad Trimestral"
                                        value={bulkData.name}
                                        onChange={(e) => setBulkData({ ...bulkData, name: e.target.value })}
                                    />
                                </div>

                                {!bulkData.isSpecial ? (
                                    <div>
                                        <label className={labelClass}>Monto Fijo por Colaborador ($ USD)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            required
                                            className={inputClass + ' font-mono'}
                                            placeholder="0.00"
                                            value={bulkData.amount}
                                            onChange={(e) => setBulkData({ ...bulkData, amount: e.target.value })}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
                                        <p className="font-medium text-gray-900">Cálculo Dinámico por Contrato</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            El sistema extraerá automáticamente el sueldo del contrato vigente de cada colaborador y computará el valor correspondiente.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Categoría</label>
                                        <select
                                            className={inputClass}
                                            value={bulkData.type}
                                            onChange={(e) => setBulkData({ ...bulkData, type: e.target.value })}
                                        >
                                            <option value="BONUS">Bono</option>
                                            <option value="INCENTIVE">Incentivo</option>
                                            <option value="ALLOWANCE">Viático / Otros</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Frecuencia</label>
                                        <select
                                            className={inputClass}
                                            value={bulkData.frequency}
                                            onChange={(e) => setBulkData({ ...bulkData, frequency: e.target.value })}
                                        >
                                            <option value="ONE_TIME">Pago Único</option>
                                            <option value="RECURRING">Recurrente</option>
                                        </select>
                                    </div>
                                </div>
                            </form>

                            {/* Selección de Colaboradores */}
                            <div className="space-y-2 pt-2 border-t border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <label className={labelClass}>Colaboradores Destino</label>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={bulkData.selectedDepartment}
                                            onChange={(e) => handleDepartmentFilterChange(e.target.value)}
                                            className="text-xs bg-white border border-gray-200 rounded px-2 py-1"
                                        >
                                            <option value="ALL">Todos los Departamentos</option>
                                            {departments.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                        <span className="text-[11px] font-mono text-gray-500">
                                            {bulkData.selectedEmployees.length} de {employees.length} seleccionados
                                        </span>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded max-h-48 overflow-y-auto divide-y divide-gray-100">
                                    <label className="p-2.5 flex items-center gap-2 cursor-pointer hover:bg-gray-50 text-xs font-semibold text-gray-800 bg-gray-50/50">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={
                                                filteredBulkEmployees.length > 0 &&
                                                filteredBulkEmployees.every(e => bulkData.selectedEmployees.includes(e.id))
                                            }
                                            onChange={handleSelectAllBulk}
                                        />
                                        <span>Seleccionar Visibles ({filteredBulkEmployees.length})</span>
                                    </label>

                                    {filteredBulkEmployees.map(emp => (
                                        <label key={emp.id} className="p-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50 text-xs text-gray-700">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={bulkData.selectedEmployees.includes(emp.id)}
                                                onChange={() => toggleBulkEmployee(emp.id)}
                                            />
                                            <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                                            <span className="text-[11px] text-gray-400 ml-auto">{emp.department || 'General'} · {emp.position || 'Colaborador'}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setBulkModalOpen(false)}
                                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                form="bulkForm"
                                type="submit"
                                disabled={actionLoading || bulkData.selectedEmployees.length === 0}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                                {actionLoading ? 'Procesando...' : `Asignar a ${bulkData.selectedEmployees.length} Colaboradores`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN DE CANCELACIÓN */}
            {confirmModalOpen && selectedBenefit && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-sm w-full overflow-hidden shadow-xl">
                        <div className="p-5">
                            <h3 className="text-sm font-semibold text-gray-900">¿Cancelar este beneficio?</h3>
                            <p className="text-xs text-gray-500 mt-2">
                                Esta acción marcará el beneficio <span className="font-medium text-gray-800">"{selectedBenefit.name}"</span> (${selectedBenefit.amount.toFixed(2)}) de <span className="font-medium text-gray-800">{selectedBenefit.employee?.firstName} {selectedBenefit.employee?.lastName}</span> como cancelado y no se incluirá en el próximo rol de pagos.
                            </p>
                        </div>
                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setConfirmModalOpen(false);
                                    setSelectedBenefit(null);
                                }}
                                className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Mantener
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleConfirmDeactivate}
                                className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {actionLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BenefitsManagement;
