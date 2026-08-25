import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { getMyAssets } from '../../services/employees/onboardingOffboarding.service';
import { 
    FiSearch, 
    FiRefreshCw, 
    FiPrinter, 
    FiEye,
    FiFileText
} from 'react-icons/fi';
import Modal from '../../components/common/Modal';

/**
 * Genera e imprime el acta formal de entrega-recepción de dotación/activos como PDF.
 */
const printActaPDF = (asset) => {
    const deliveryDateStr = asset.deliveryDate ? new Date(asset.deliveryDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('es-EC');
    const returnDateStr = asset.returnDate ? new Date(asset.returnDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }) : null;
    const emp = asset.employee || {};

    const categoryMap = {
        EQUIPMENT: 'Cómputo y Tecnología',
        UNIFORM_PPE: 'EPP e Indumentaria de Trabajo',
        TOOL: 'Herramienta de Trabajo',
        ACCESS_CARD: 'Tarjeta o Credencial de Acceso'
    };
    const categoryLabel = categoryMap[asset.category] || asset.category || 'Dotación General';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Acta de Entrega-Recepción - ${asset.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: #111827; background: white; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
    .company { font-size: 18px; font-weight: bold; color: #111827; }
    .company-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .badge { border: 1px solid #e5e7eb; background: #f9fafb; color: #374151; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; font-family: monospace; }
    .title { text-align: center; font-size: 14px; font-weight: bold; color: #111827; margin: 16px 0 24px; text-transform: uppercase; letter-spacing: 0.5px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
    .field { display: flex; flex-direction: column; }
    .field-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; }
    .field-value { font-size: 12px; font-weight: 500; color: #111827; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f9fafb; text-align: left; padding: 8px 12px; font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
    td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
    .policy-box { border: 1px solid #e5e7eb; border-radius: 4px; padding: 14px; margin-top: 20px; background: #f9fafb; font-size: 11px; line-height: 1.5; color: #4b5563; }
    .footer { margin-top: 48px; border-top: 1px solid #e5e7eb; padding-top: 20px; display: flex; justify-content: space-around; text-align: center; font-size: 10px; color: #6b7280; }
    .signature-line { border-top: 1px solid #111827; margin: 48px auto 4px; width: 200px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">SISTEMA DE TALENTO HUMANO & LOGÍSTICA</div>
      <div class="company-sub">Comprobante Oficial de Custodia y Asignación de Bienes</div>
    </div>
    <div class="badge">ACT-EQ-${asset.id.slice(-6).toUpperCase()}</div>
  </div>

  <div class="title">Acta de Entrega - Recepción y Custodia de Bienes</div>

  <div class="section">
    <div class="section-title">1. Datos del Colaborador Custodio</div>
    <div class="grid2">
      <div class="field"><span class="field-label">Nombre Completo</span><span class="field-value">${emp?.firstName || ''} ${emp?.lastName || ''}</span></div>
      <div class="field"><span class="field-label">Cédula / Identificación</span><span class="field-value" style="font-family: monospace;">${emp?.identityCard || 'S/N'}</span></div>
      <div class="field"><span class="field-label">Cargo / Puesto</span><span class="field-value">${emp?.position || 'Colaborador'}</span></div>
      <div class="field"><span class="field-label">Departamento</span><span class="field-value">${emp?.department || 'General'}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Especificaciones del Activo / Dotación</div>
    <table>
      <thead>
        <tr>
          <th>Descripción del Bien</th>
          <th>Categoría</th>
          <th>Nº de Serie / Código</th>
          <th>Estado Inicial</th>
          <th>Fecha Entrega</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: 600;">${asset.name}</td>
          <td>${categoryLabel}</td>
          <td style="font-family: monospace;">${asset.serialNumber || 'S/N'}</td>
          <td>${asset.condition === 'NEW' ? 'Nuevo' : 'Buen Estado'}</td>
          <td style="font-family: monospace;">${deliveryDateStr}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${returnDateStr ? `
  <div class="section">
    <div class="section-title">3. Estado de Devolución a Bodega</div>
    <div class="grid2">
      <div class="field"><span class="field-label">Fecha de Devolución</span><span class="field-value" style="font-family: monospace;">${returnDateStr}</span></div>
      <div class="field"><span class="field-label">Observaciones</span><span class="field-value">${asset.returnNotes || 'Devolución conforme.'}</span></div>
    </div>
  </div>` : ''}

  <div class="policy-box">
    <strong>Declaración y Compromiso de Responsabilidad:</strong><br/>
    El colaborador declara haber recibido el bien arriba detallado en óptimas condiciones de funcionamiento e higiene, comprometiéndose a destinarlo exclusivamente para el ejercicio de sus labores profesionales, cuidarlo diligentemente y restituirlo a la organización en caso de cese de funciones, renovación o solicitud justificada de la administración.
  </div>

  <div class="footer">
    <div>
      <div class="signature-line"></div>
      <div><strong>Firma del Colaborador Receptor</strong></div>
      <div style="font-family: monospace; font-size: 9px; margin-top: 2px;">C.I. ${emp?.identityCard || 'S/N'}</div>
    </div>
    <div>
      <div class="signature-line"></div>
      <div><strong>Responsable de Bodega / RRHH</strong></div>
      <div style="font-size: 9px; margin-top: 2px;">Departamento Administrativo</div>
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=800,height=900');
    win.document.write(html);
    win.document.close();
    win.onload = () => {
        win.focus();
        win.print();
    };
};

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
            toast.error(error.message || 'Error al cargar inventario de activos');
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
                (a.category && a.category.toLowerCase().includes(q))
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
                    className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer bg-white flex items-center gap-1.5 shrink-0 disabled:opacity-50"
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
                        <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={13} />
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
                                &times;
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
                                                <div className="inline-flex items-center gap-1.5 justify-end">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAsset(asset);
                                                            setActaModalOpen(true);
                                                        }}
                                                        className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                                                        title="Ver Acta"
                                                    >
                                                        <FiEye className="w-3.5 h-3.5 text-gray-500" />
                                                        <span>Ver</span>
                                                    </button>
                                                    <button
                                                        onClick={() => printActaPDF(asset)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                                                        title="Imprimir Acta Oficial PDF"
                                                    >
                                                        <FiPrinter className="w-3.5 h-3.5" />
                                                        <span>Imprimir</span>
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

            {/* Modal: Vista Previa de Acta Oficial */}
            <Modal
                isOpen={actaModalOpen && !!selectedAsset}
                onClose={() => setActaModalOpen(false)}
                title="Acta de Entrega - Recepción"
                subtitle="Comprobante de Dotación Individual"
                size="xl"
                footer={
                    <div className="flex items-center justify-between w-full">
                        <button
                            onClick={() => printActaPDF(selectedAsset)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer font-medium shadow-xs"
                        >
                            <FiPrinter className="w-3.5 h-3.5" />
                            <span>Imprimir PDF</span>
                        </button>
                        <button 
                            onClick={() => setActaModalOpen(false)} 
                            className="border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs font-medium px-4 py-1.5 rounded cursor-pointer transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                }
            >
                {selectedAsset && (
                    <div className="space-y-4 text-xs text-gray-800 font-sans">
                        <div className="border-b border-gray-200 pb-3 text-center">
                            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">ACTA DE ENTREGA - RECEPCIÓN Y CUSTODIA DE BIENES</h2>
                            <p className="text-[11px] text-gray-500 font-mono mt-0.5">Código: ACT-EQ-{selectedAsset.id.slice(-6).toUpperCase()}</p>
                        </div>

                        <div className="bg-gray-50/70 p-3.5 rounded border border-gray-200 space-y-1.5">
                            <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">1. Datos del Colaborador Receptor</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div><span className="text-gray-500">Nombre:</span> <span className="font-semibold text-gray-900">{selectedAsset.employee?.firstName} {selectedAsset.employee?.lastName}</span></div>
                                <div><span className="text-gray-500">Cédula:</span> <span className="font-mono font-semibold text-gray-900">{selectedAsset.employee?.identityCard || 'S/N'}</span></div>
                            </div>
                        </div>

                        <div className="bg-gray-50/70 p-3.5 rounded border border-gray-200 space-y-1.5">
                            <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">2. Detalle del Bien Asignado</h4>
                            <table className="w-full text-left text-xs mt-1 border-collapse">
                                <tbody>
                                    <tr className="border-b border-gray-200"><td className="py-1 text-gray-500 w-40">Bien / Dotación:</td><td className="py-1 font-semibold text-gray-900">{selectedAsset.name}</td></tr>
                                    <tr className="border-b border-gray-200"><td className="py-1 text-gray-500">Categoría:</td><td className="py-1">{getCategoryLabel(selectedAsset.category)}</td></tr>
                                    <tr className="border-b border-gray-200"><td className="py-1 text-gray-500">Número de Serie:</td><td className="py-1 font-mono font-semibold text-gray-900">{selectedAsset.serialNumber || 'S/N'}</td></tr>
                                    <tr className="border-b border-gray-200"><td className="py-1 text-gray-500">Estado de Entrega:</td><td className="py-1 font-semibold text-gray-900">{selectedAsset.condition === 'NEW' ? 'Nuevo' : 'Buen Estado'}</td></tr>
                                    <tr><td className="py-1 text-gray-500">Fecha de Entrega:</td><td className="py-1 font-mono text-gray-900">{selectedAsset.deliveryDate ? new Date(selectedAsset.deliveryDate).toLocaleDateString('es-EC') : '—'}</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="text-[11px] text-gray-600 space-y-1 leading-relaxed border border-gray-200 p-3 rounded bg-white">
                            <p className="font-semibold text-gray-800">3. Declaración de Custodia:</p>
                            <p>
                                Declaro recibir en óptimas condiciones el bien especificado para el desempeño de mis funciones laborales, asumiendo su cuidado y custodia responsable.
                            </p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
