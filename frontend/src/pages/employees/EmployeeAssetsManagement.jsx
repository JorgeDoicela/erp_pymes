import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    getAllAssets, 
    deliverAsset, 
    returnAsset 
} from '../../services/employees/onboardingOffboarding.service';
import { getEmployees } from '../../services/employees/employeeService';
import { 
    CubeIcon, 
    CheckCircleIcon, 
    ArrowPathIcon, 
    PlusIcon, 
    ShieldCheckIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';

const EmployeeAssetsManagement = () => {
    const [assets, setAssets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [deliverModalOpen, setDeliverModalOpen] = useState(false);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Form Deliver
    const [deliverForm, setDeliverForm] = useState({
        employeeId: '',
        name: '',
        serialNumber: '',
        category: 'EQUIPMENT',
        condition: 'NEW'
    });

    // Form Return
    const [returnForm, setReturnForm] = useState({
        condition: 'GOOD',
        status: 'RETURNED',
        returnNotes: ''
    });

    useEffect(() => {
        loadData();
    }, [filterCategory, filterStatus]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resAssets, resEmployees] = await Promise.all([
                getAllAssets({ category: filterCategory || undefined, status: filterStatus || undefined, search: searchTerm || undefined }),
                getEmployees()
            ]);

            if (resAssets.success) setAssets(resAssets.data);
            if (resEmployees) setEmployees(Array.isArray(resEmployees) ? resEmployees : resEmployees.data || []);
        } catch (error) {
            console.error('Error al cargar activos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadData();
    };

    const handleDeliverSubmit = async (e) => {
        e.preventDefault();
        if (!deliverForm.employeeId || !deliverForm.name.trim()) {
            alert('Selecciona un empleado y proporciona el nombre del activo/EPP');
            return;
        }
        setActionLoading(true);
        try {
            const res = await deliverAsset(deliverForm);
            if (res.success) {
                alert('Entrega de activo/EPP registrada exitosamente');
                setDeliverModalOpen(false);
                setDeliverForm({ employeeId: '', name: '', serialNumber: '', category: 'EQUIPMENT', condition: 'NEW' });
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
                alert('Devolución de activo registrada');
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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'DELIVERED':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircleIcon className="w-4 h-4" /> Asignado / Entregado</span>;
            case 'RETURNED':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><ArrowUturnLeftIcon className="w-4 h-4" /> Devuelto a Bodega</span>;
            case 'LOST_DAMAGED':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Dañado / Perdido</span>;
            default:
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
        }
    };

    const getCategoryBadge = (category) => {
        switch (category) {
            case 'UNIFORM_PPE':
                return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg">EPP / Uniforme</span>;
            case 'EQUIPMENT':
                return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-lg">Equipo Computo</span>;
            case 'TOOL':
                return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-[11px] font-bold rounded-lg">Herramienta</span>;
            case 'ACCESS_CARD':
                return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-[11px] font-bold rounded-lg">Tarjeta Acceso</span>;
            default:
                return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg">{category}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <CubeIcon className="w-8 h-8 text-blue-600" />
                        Control de Equipos, Herramientas y EPPs
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Inventario y registro de activos asignados con acuse de recibo y devoluciones
                    </p>
                </div>
                <button
                    onClick={() => setDeliverModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all text-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    Registrar Entrega de Activo / EPP
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <FunnelIcon className="w-5 h-5 text-slate-400 shrink-0" />
                    {[
                        { label: 'Todos', value: '' },
                        { label: 'EPPs / Uniformes', value: 'UNIFORM_PPE' },
                        { label: 'Cómputo / Equipos', value: 'EQUIPMENT' },
                        { label: 'Herramientas', value: 'TOOL' }
                    ].map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setFilterCategory(tab.value)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                filterCategory === tab.value
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-72">
                    <div className="relative w-full">
                        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Buscar activo, serie o empleado..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all">Buscar</button>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-500 border-b border-slate-200/80">
                            <tr>
                                <th className="p-4">Activo / EPP</th>
                                <th className="p-4">Empleado Asignado</th>
                                <th className="p-4 text-center">Categoría</th>
                                <th className="p-4 text-center">Nº Serie / Código</th>
                                <th className="p-4 text-center">Fecha Entrega</th>
                                <th className="p-4 text-center">Estado</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-400">Cargando inventario de activos...</td></tr>
                            ) : assets.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-400">No se encontraron entregas de activos registradas.</td></tr>
                            ) : (
                                assets.map(asset => (
                                    <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 font-bold text-slate-900">
                                            {asset.name}
                                            <p className="text-xs font-normal text-slate-400">Condición inicial: {asset.condition}</p>
                                        </td>
                                        <td className="p-4 font-medium text-slate-800">
                                            {asset.employee?.firstName} {asset.employee?.lastName}
                                            <p className="text-xs text-slate-400">{asset.employee?.department || 'General'}</p>
                                        </td>
                                        <td className="p-4 text-center">{getCategoryBadge(asset.category)}</td>
                                        <td className="p-4 text-center font-mono text-xs text-slate-600">{asset.serialNumber || 'N/A'}</td>
                                        <td className="p-4 text-center text-xs text-slate-500">{new Date(asset.deliveryDate).toLocaleDateString('es-EC')}</td>
                                        <td className="p-4 text-center">{getStatusBadge(asset.status)}</td>
                                        <td className="p-4 text-center">
                                            {asset.status === 'DELIVERED' ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedAsset(asset);
                                                        setReturnModalOpen(true);
                                                    }}
                                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                                                >
                                                    Registrar Devolución
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">
                                                    Devuelto el {new Date(asset.returnDate).toLocaleDateString('es-EC')}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Deliver Asset Modal */}
            <AnimatePresence>
                {deliverModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800">Registrar Entrega de Activo / EPP</h3>
                                <button onClick={() => setDeliverModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
                            </div>
                            <form onSubmit={handleDeliverSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Empleado Receptor</label>
                                    <select
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={deliverForm.employeeId}
                                        onChange={(e) => setDeliverForm({ ...deliverForm, employeeId: e.target.value })}
                                    >
                                        <option value="">-- Selecciona un Empleado --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.firstName} {emp.lastName} ({emp.department || 'General'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nombre del Activo / EPP / Herramienta</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="ej. Laptop Lenovo ThinkPad T14 / Uniforme Talla L / Casco Dielectrico"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={deliverForm.name}
                                        onChange={(e) => setDeliverForm({ ...deliverForm, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Categoría</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            value={deliverForm.category}
                                            onChange={(e) => setDeliverForm({ ...deliverForm, category: e.target.value })}
                                        >
                                            <option value="EQUIPMENT">Cómputo / Tecnología</option>
                                            <option value="UNIFORM_PPE">EPP / Uniforme</option>
                                            <option value="TOOL">Herramienta de Trabajo</option>
                                            <option value="ACCESS_CARD">Tarjeta de Acceso / Llave</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nº Serie / Código</label>
                                        <input
                                            type="text"
                                            placeholder="ej. SN-883921"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            value={deliverForm.serialNumber}
                                            onChange={(e) => setDeliverForm({ ...deliverForm, serialNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-3">
                                    <button type="button" onClick={() => setDeliverModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancelar</button>
                                    <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md">
                                        {actionLoading ? 'Registrando...' : 'Confirmar Entrega'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Return Asset Modal */}
            <AnimatePresence>
                {returnModalOpen && selectedAsset && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800">Registrar Devolución de Activo</h3>
                                <button onClick={() => setReturnModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
                            </div>
                            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
                                <p className="text-xs font-bold text-slate-800">
                                    Activo: {selectedAsset.name} ({selectedAsset.employee?.firstName} {selectedAsset.employee?.lastName})
                                </p>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Estado al Recibir</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={returnForm.status}
                                        onChange={(e) => setReturnForm({ ...returnForm, status: e.target.value })}
                                    >
                                        <option value="RETURNED">Devuelto en Buen Estado</option>
                                        <option value="LOST_DAMAGED">Dañado o Perdido</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Observaciones de Devolución</label>
                                    <textarea
                                        rows="3"
                                        placeholder="ej. Entregado sin novedad / Rayón en pantalla..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={returnForm.returnNotes}
                                        onChange={(e) => setReturnForm({ ...returnForm, returnNotes: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setReturnModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancelar</button>
                                    <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md">
                                        {actionLoading ? 'Guardando...' : 'Confirmar Devolución'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EmployeeAssetsManagement;
