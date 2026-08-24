import React, { useState, useEffect, useMemo } from 'react';
import { getMyAssets } from '../../services/employees/onboardingOffboarding.service';
import { 
    FiSearch, 
    FiRefreshCw, 
    FiPrinter, 
    FiPackage, 
    FiCheckCircle, 
    FiClock, 
    FiAlertCircle 
} from 'react-icons/fi';

export default function MyAssets() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'DELIVERED' | 'RETURNED'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [actaModalOpen, setActaModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getMyAssets();
            if (res.success) {
                setAssets(res.data || []);
            }
        } catch (error) {
            console.error('Error al cargar mis activos:', error);
        } finally {
            setLoading(false);
        }
    };

    const counts = useMemo(() => {
        return {
            total: assets.length,
            delivered: assets.filter(a => a.status === 'DELIVERED').length,
            returned: assets.filter(a => a.status === 'RETURNED').length
        };
    }, [assets]);

    const filteredAssets = useMemo(() => {
        let list = assets;
        if (statusFilter !== 'ALL') {
            list = list.filter(a => a.status === statusFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(a => 
                a.name.toLowerCase().includes(q) ||
                (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
                a.category.toLowerCase().includes(q)
            );
        }
        return list;
    }, [assets, statusFilter, searchQuery]);

    const getCategoryLabel = (category) => {
        switch (category) {
            case 'EQUIPMENT': return 'Cómputo y Tecnología';
            case 'UNIFORM_PPE': return 'EPP e Indumentaria';
            case 'TOOL': return 'Herramienta de Trabajo';
            case 'ACCESS_CARD': return 'Tarjeta de Acceso';
            default: return category || 'Dotación General';
        }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            {/* Header Limpio ERP */}
            <div className="bg-white p-5 rounded border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono">
                            Mi Portal de Autogestión
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                            Dotación y Activos en Custodia
                        </span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        Mis Equipos, Herramientas y EPPs
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Consulta el registro formal de activos asignados bajo tu responsabilidad y descarga tus actas de entrega.
                    </p>
                </div>

                <button
                    onClick={loadData}
                    disabled={loading}
                    className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer bg-white flex items-center gap-1.5 shrink-0"
                >
                    <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                </button>
            </div>

            {/* Pestañas con Contadores Tabulares + Buscador */}
            <div className="bg-white border border-gray-200 rounded p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Tabs con Borde Inferior Activo 2px #111827 */}
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
                            En Custodia <span className={`font-mono tabular-nums ${counts.delivered > 0 ? 'text-blue-700 font-semibold' : 'text-gray-400'}`}>({counts.delivered})</span>
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
                            Devueltos a Bodega <span className="font-mono tabular-nums text-emerald-700 font-semibold">({counts.returned})</span>
                        </button>
                    </div>

                    {/* Buscador */}
                    <div className="relative w-full sm:w-64">
                        <FiSearch className="absolute left-3 top-2 text-gray-400" size={13} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por activo, serie o categoría..."
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
                </div>

                {/* Tabla de Activos */}
                <div className="border border-gray-200 rounded overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="py-2.5 px-4">Activo / Dotación</th>
                                    <th className="py-2.5 px-4">Categoría</th>
                                    <th className="py-2.5 px-4">Nº Serie / Código</th>
                                    <th className="py-2.5 px-4">Fecha Asignación</th>
                                    <th className="py-2.5 px-4">Estado</th>
                                    <th className="py-2.5 px-4 text-right">Comprobante</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-400 font-mono text-xs">
                                            Cargando tus activos y equipos...
                                        </td>
                                    </tr>
                                ) : filteredAssets.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-400 text-xs">
                                            No tienes equipos o activos asignados en esta categoría.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAssets.map((asset) => (
                                        <tr key={asset.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                                            <td className="py-2.5 px-4 font-semibold text-gray-900">
                                                {asset.name}
                                                <p className="text-[11px] font-normal text-gray-400">
                                                    Condición inicial: {asset.condition === 'NEW' ? 'Nuevo' : 'Buen Estado'}
                                                </p>
                                            </td>

                                            <td className="py-2.5 px-4">
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                                                    {getCategoryLabel(asset.category)}
                                                </span>
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
                                                        EN TU CUSTODIA
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                        DEVUELTO EL {asset.returnDate ? new Date(asset.returnDate).toLocaleDateString('es-EC') : ''}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-2.5 px-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAsset(asset);
                                                        setActaModalOpen(true);
                                                    }}
                                                    className="border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                                >
                                                    <FiPrinter className="w-3.5 h-3.5 text-gray-500" />
                                                    <span>Ver Acta</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal: Acta Oficial Imprimible */}
            {actaModalOpen && selectedAsset && (
                <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded border border-gray-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Acta de Entrega - Recepción</h3>
                                <p className="text-[11px] text-gray-500 font-mono">Comprobante de Dotación Individual</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="bg-gray-900 hover:bg-black text-white text-xs px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer font-medium"
                                >
                                    <FiPrinter className="w-3.5 h-3.5" />
                                    <span>Imprimir</span>
                                </button>
                                <button onClick={() => setActaModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer">&times;</button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5 text-xs text-gray-800 font-sans" id="acta-print-area">
                            <div className="border-b border-gray-300 pb-3 text-center">
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">ACTA DE ENTREGA - RECEPCIÓN Y CUSTODIA DE BIENES</h2>
                                <p className="text-[11px] text-gray-500 font-mono mt-0.5">Código: ACT-EQ-{selectedAsset.id.slice(-6).toUpperCase()}</p>
                            </div>

                            <div className="bg-gray-50 p-3.5 rounded border border-gray-200 space-y-1.5">
                                <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">1. Datos del Colaborador Receptor</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div><span className="text-gray-500">Nombre:</span> <span className="font-semibold">{selectedAsset.employee?.firstName} {selectedAsset.employee?.lastName}</span></div>
                                    <div><span className="text-gray-500">Cédula:</span> <span className="font-mono font-semibold">{selectedAsset.employee?.identityCard || 'S/N'}</span></div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3.5 rounded border border-gray-200 space-y-1.5">
                                <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">2. Detalle del Bien Asignado</h4>
                                <table className="w-full text-left text-xs mt-1 border-collapse">
                                    <tbody>
                                        <tr className="border-b border-gray-200"><td className="py-1 text-gray-500 w-40">Bien / Dotación:</td><td className="py-1 font-semibold">{selectedAsset.name}</td></tr>
                                        <tr className="border-b border-gray-200"><td className="py-1 text-gray-500">Categoría:</td><td className="py-1">{getCategoryLabel(selectedAsset.category)}</td></tr>
                                        <tr className="border-b border-gray-200"><td className="py-1 text-gray-500">Número de Serie:</td><td className="py-1 font-mono font-semibold">{selectedAsset.serialNumber || 'S/N'}</td></tr>
                                        <tr className="border-b border-gray-200"><td className="py-1 text-gray-500">Estado de Entrega:</td><td className="py-1 font-semibold">{selectedAsset.condition === 'NEW' ? 'Nuevo' : 'Buen Estado'}</td></tr>
                                        <tr><td className="py-1 text-gray-500">Fecha de Entrega:</td><td className="py-1 font-mono">{selectedAsset.deliveryDate ? new Date(selectedAsset.deliveryDate).toLocaleDateString('es-EC') : '—'}</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="text-[11px] text-gray-600 space-y-1 leading-relaxed border p-3 rounded bg-white">
                                <p className="font-bold text-gray-800">3. Declaración de Custodia:</p>
                                <p>
                                    Declaro recibir en óptimas condiciones el bien especificado para el desempeño de mis funciones laborales, asumiendo su cuidado y custodia.
                                </p>
                            </div>
                        </div>

                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button onClick={() => setActaModalOpen(false)} className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-4 py-1.5 rounded cursor-pointer">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
