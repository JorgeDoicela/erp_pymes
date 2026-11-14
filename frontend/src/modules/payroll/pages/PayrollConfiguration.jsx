/**
 * @file PayrollConfiguration.jsx
 * @description Configuración de parámetros y catálogo de rubros de nómina.
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPayrollConfig, savePayrollConfig } from '../services/payrollConfig.service';
import { FiBookOpen } from 'react-icons/fi';
import {
  SYSTEM_DYNAMIC_RUBROS,
  LEGAL_PRESET_ITEMS,
} from '../constants/payrollLegalRubros.constants';
import PayrollRubrosTable from '../components/PayrollRubrosTable';
import PayrollLegalGuideModal, {
  PayrollBaseParamsCard,
} from '../components/PayrollLegalGuideModal';

const EMPTY_ITEM = { name: '', type: 'EARNING', isMandatory: false, value: '' };
const CLOSED_CONFIRM = { open: false, title: '', message: '', onConfirm: null };

const PayrollConfiguration = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({ workingDays: 30, items: [] });
  const [newItemMode, setNewItemMode] = useState('PERCENTAGE');
  const [newItem, setNewItem] = useState(EMPTY_ITEM);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editItemMode, setEditItemMode] = useState('PERCENTAGE');
  const [editItem, setEditItem] = useState(EMPTY_ITEM);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(CLOSED_CONFIRM);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await getPayrollConfig();
      if (res.success && res.data) {
        setConfig({
          workingDays: res.data.workingDays || 30,
          items: (res.data.items || []).map((item, idx) => ({
            ...item,
            id: item.id || `item-${idx}-${Date.now()}`,
          })),
        });
      }
    } catch (error) {
      toast.error(error.message || 'Error al cargar la configuración de nómina');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleAddItem = (e) => {
    e.preventDefault();
    const trimmedName = newItem.name.trim();
    if (!trimmedName) return toast.error('El nombre del rubro es obligatorio');
    const val = parseFloat(newItem.value);
    if (isNaN(val) || val < 0) return toast.error('Ingrese un valor numérico válido');
    if (newItemMode === 'PERCENTAGE' && val > 100) {
      return toast.error('El porcentaje no puede ser superior al 100%');
    }
    if (config.items.some((i) => i.name.toLowerCase() === trimmedName.toLowerCase())) {
      return toast.error(`Ya existe un rubro llamado "${trimmedName}"`);
    }

    const nextItem = {
      id: `new-${Date.now()}`,
      name: trimmedName,
      type: newItem.type,
      isMandatory: newItem.isMandatory,
      percentage: newItemMode === 'PERCENTAGE' ? val : null,
      fixedValue: newItemMode === 'FIXED' ? val : null,
    };
    setConfig({ ...config, items: [...config.items, nextItem] });
    setNewItem(EMPTY_ITEM);
    toast.success(`Rubro "${trimmedName}" añadido`);
  };

  const handleStartEdit = (index) => {
    const item = config.items[index];
    const isPct = item.percentage !== null && item.percentage !== undefined;
    setEditingIndex(index);
    setEditItemMode(isPct ? 'PERCENTAGE' : 'FIXED');
    setEditItem({
      name: item.name,
      type: item.type,
      isMandatory: item.isMandatory || false,
      value: isPct ? item.percentage : (item.fixedValue ?? ''),
    });
  };

  const handleSaveEdit = () => {
    const trimmedName = editItem.name.trim();
    if (!trimmedName) return toast.error('El nombre del rubro no puede estar vacío');
    const isDynamic = !!SYSTEM_DYNAMIC_RUBROS[trimmedName];
    let pct = null;
    let fix = null;

    if (!isDynamic) {
      const val = parseFloat(editItem.value);
      if (isNaN(val) || val < 0) return toast.error('Ingrese un valor numérico válido');
      if (editItemMode === 'PERCENTAGE' && val > 100) {
        return toast.error('El porcentaje no puede exceder el 100%');
      }
      if (editItemMode === 'PERCENTAGE') pct = val;
      else fix = val;
    }

    const updated = [...config.items];
    updated[editingIndex] = {
      ...updated[editingIndex],
      name: trimmedName,
      type: editItem.type,
      isMandatory: editItem.isMandatory,
      percentage: pct,
      fixedValue: fix,
    };
    setConfig({ ...config, items: updated });
    setEditingIndex(null);
    toast.success('Rubro actualizado');
  };

  const handleRemoveItem = (index) => {
    const item = config.items[index];
    setConfirmModal({
      open: true,
      title: 'Eliminar Rubro',
      message: `¿Está seguro de eliminar el rubro "${item.name}"? Los cambios se aplicarán al guardar la configuración.`,
      onConfirm: () => {
        const updated = [...config.items];
        updated.splice(index, 1);
        setConfig({ ...config, items: updated });
        setConfirmModal(CLOSED_CONFIRM);
        toast.success(`Rubro "${item.name}" eliminado de la lista`);
      },
    });
  };

  const handleLoadLegalPreset = () => {
    const applyPreset = () => {
      const existingNames = new Set(config.items.map((i) => i.name.toLowerCase()));
      const newItems = [...config.items];
      let addedCount = 0;
      LEGAL_PRESET_ITEMS.forEach((item) => {
        if (!existingNames.has(item.name.toLowerCase())) {
          newItems.push({ ...item, id: `legal-${Date.now()}-${Math.random()}` });
          addedCount++;
        }
      });
      setConfig({ ...config, workingDays: 30, items: newItems });
      setConfirmModal(CLOSED_CONFIRM);
      toast.success(
        addedCount > 0
          ? `Se incorporaron ${addedCount} rubros de la plantilla legal.`
          : 'Todos los rubros de ley ya están configurados.'
      );
    };

    if (config.items.length > 0) {
      setConfirmModal({
        open: true,
        title: 'Cargar Plantilla Legal IESS & Código del Trabajo',
        message: '¿Desea incorporar los rubros de ley ecuatoriana al catálogo actual?',
        onConfirm: applyPreset,
      });
    } else {
      applyPreset();
    }
  };

  const handleSave = async () => {
    const workingDays = parseInt(config.workingDays, 10);
    if (isNaN(workingDays) || workingDays < 1 || workingDays > 31) {
      return toast.error('Los días laborables por mes deben ser un número entre 1 y 31');
    }
    setSaving(true);
    try {
      await savePayrollConfig(config);
      toast.success('Configuración de nómina guardada con éxito.');
      loadConfig();
    } catch (error) {
      toast.error(error.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
            Nómina · Legislación Laboral del Ecuador
          </p>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Parámetros y Catálogo de Rubros de Nómina
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Definición de base de cálculo mensual, aportes al IESS, beneficios de ley y bonos.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded cursor-pointer flex items-center gap-1.5"
          >
            <FiBookOpen size={13} />
            <span>Guía Legal Ecuador</span>
          </button>
          <button
            type="button"
            onClick={handleLoadLegalPreset}
            className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded cursor-pointer"
          >
            Cargar Plantilla IESS / Ley
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <PayrollBaseParamsCard
          workingDays={config.workingDays}
          onWorkingDaysChange={(workingDays) => setConfig({ ...config, workingDays })}
        />
        <PayrollRubrosTable
          items={config.items}
          loading={loading}
          newItem={newItem}
          setNewItem={setNewItem}
          newItemMode={newItemMode}
          setNewItemMode={setNewItemMode}
          onAddItem={handleAddItem}
          editingIndex={editingIndex}
          setEditingIndex={setEditingIndex}
          editItem={editItem}
          setEditItem={setEditItem}
          editItemMode={editItemMode}
          setEditItemMode={setEditItemMode}
          onStartEdit={handleStartEdit}
          onSaveEdit={handleSaveEdit}
          onRemoveItem={handleRemoveItem}
        />
      </div>

      <PayrollLegalGuideModal
        showGuideModal={showGuideModal}
        setShowGuideModal={setShowGuideModal}
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
      />
    </div>
  );
};

export default PayrollConfiguration;
