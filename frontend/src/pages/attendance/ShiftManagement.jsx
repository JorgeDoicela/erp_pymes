import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import shiftService from '../../services/attendance/shiftService';
import * as employeeService from '../../services/employees/employee.service';

const ALL_DAYS = [
    { key: 'Lunes', short: 'Lun' },
    { key: 'Martes', short: 'Mar' },
    { key: 'Miércoles', short: 'Mié' },
    { key: 'Jueves', short: 'Jue' },
    { key: 'Viernes', short: 'Vie' },
    { key: 'Sábado', short: 'Sáb' },
    { key: 'Domingo', short: 'Dom' }
];

const ShiftManagement = () => {
    const [activeTab, setActiveTab] = useState('shifts'); // 'shifts' | 'assignments' | 'bulk_assign'
    const [shifts, setShifts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal Crear/Editar Turno
    const [shiftModal, setShiftModal] = useState({
        open: false,
        isEditing: false,
        id: null,
        name: '',
        startTime: '08:00',
        endTime: '17:00',
        toleranceMinutes: 15,
        breakMinutes: 60
    });

    // Formulario de Asignación Masiva
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [empSearch, setEmpSearch] = useState('');
    const [assignmentData, setAssignmentData] = useState({
        shiftId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        daysOfWeek: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
    });
    const [assigning, setAssigning] = useState(false);

    // Buscador en Asignaciones Activas
    const [scheduleSearch, setScheduleSearch] = useState('');

    // Modal de Confirmación Genérico
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        title: '',
        message: '',
        confirmText: 'Confirmar',
        isDestructive: false,
        onConfirm: null
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [sRes, eRes, schRes] = await Promise.all([
                shiftService.getShifts(),
                employeeService.getEmployees(),
                shiftService.getAllSchedules()
            ]);

            if (sRes.success) setShifts(sRes.data || []);
            if (Array.isArray(eRes)) setEmployees(eRes);
            else if (eRes?.data) setEmployees(eRes.data);
            if (schRes.success) setSchedules(schRes.data || []);
        } catch (error) {
            toast.error(error.message || 'Error al cargar datos de turnos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        let isMounted = true;

        Promise.all([
            shiftService.getShifts(),
            employeeService.getEmployees(),
            shiftService.getAllSchedules()
        ])
            .then(([sRes, eRes, schRes]) => {
                if (!isMounted) return;
                if (sRes.success) setShifts(sRes.data || []);
                if (Array.isArray(eRes)) setEmployees(eRes);
                else if (eRes?.data) setEmployees(eRes.data);
                if (schRes.success) setSchedules(schRes.data || []);
            })
            .catch(error => {
                if (isMounted) toast.error(error.message || 'Error al conectar con el servidor');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    // --- MANEJO DE TURNOS ---
    const openCreateModal = () => {
        setShiftModal({
            open: true,
            isEditing: false,
            id: null,
            name: '',
            startTime: '08:00',
            endTime: '17:00',
            toleranceMinutes: 15,
            breakMinutes: 60
        });
    };

    const openEditModal = (shift) => {
        setShiftModal({
            open: true,
            isEditing: true,
            id: shift.id,
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            toleranceMinutes: shift.toleranceMinutes ?? 15,
            breakMinutes: shift.breakMinutes ?? 60
        });
    };

    const handleSaveShift = async (e) => {
        e.preventDefault();
        const trimmedName = shiftModal.name.trim();
        if (!trimmedName) return toast.error('El nombre del turno es requerido');
        if (!shiftModal.startTime || !shiftModal.endTime) return toast.error('Las horas de inicio y fin son obligatorias');

        try {
            if (shiftModal.isEditing) {
                const res = await shiftService.updateShift(shiftModal.id, {
                    name: trimmedName,
                    startTime: shiftModal.startTime,
                    endTime: shiftModal.endTime,
                    toleranceMinutes: parseInt(shiftModal.toleranceMinutes, 10) || 0,
                    breakMinutes: parseInt(shiftModal.breakMinutes, 10) || 0
                });
                if (res.success) {
                    toast.success('Turno actualizado con éxito');
                    setShiftModal({ open: false, isEditing: false, id: null, name: '', startTime: '08:00', endTime: '17:00', toleranceMinutes: 15, breakMinutes: 60 });
                    await loadData();
                }
            } else {
                const res = await shiftService.createShift({
                    name: trimmedName,
                    startTime: shiftModal.startTime,
                    endTime: shiftModal.endTime,
                    toleranceMinutes: parseInt(shiftModal.toleranceMinutes, 10) || 0,
                    breakMinutes: parseInt(shiftModal.breakMinutes, 10) || 0
                });
                if (res.success) {
                    toast.success('Turno registrado con éxito');
                    setShiftModal({ open: false, isEditing: false, id: null, name: '', startTime: '08:00', endTime: '17:00', toleranceMinutes: 15, breakMinutes: 60 });
                    await loadData();
                }
            }
        } catch (error) {
            toast.error(error.message || 'Error al guardar el turno');
        }
    };

    const handleDeleteShift = (shift) => {
        setConfirmModal({
            open: true,
            title: 'Eliminar Turno',
            message: `¿Está seguro de eliminar el turno "${shift.name}" (${shift.startTime} - ${shift.endTime})? Las asignaciones vinculadas se verán afectadas.`,
            confirmText: 'Eliminar Turno',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const res = await shiftService.deleteShift(shift.id);
                    if (res.success) {
                        toast.success('Turno eliminado correctamente');
                        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
                        await loadData();
                    }
                } catch (error) {
                    toast.error(error.message || 'Error al eliminar el turno');
                }
            }
        });
    };

    // Filtros
    const filteredEmployees = useMemo(() => {
        if (!empSearch.trim()) return employees;
        const q = empSearch.toLowerCase();
        return employees.filter(e => {
            const name = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase();
            const pos = (e.position || '').toLowerCase();
            const dept = (e.department || '').toLowerCase();
            return name.includes(q) || pos.includes(q) || dept.includes(q);
        });
    }, [employees, empSearch]);

    const filteredSchedules = useMemo(() => {
        if (!scheduleSearch.trim()) return schedules;
        const q = scheduleSearch.toLowerCase();
        return schedules.filter(sch => {
            const name = `${sch.employee?.firstName || ''} ${sch.employee?.lastName || ''}`.toLowerCase();
            const shiftName = (sch.shift?.name || '').toLowerCase();
            const dept = (sch.employee?.department || '').toLowerCase();
            return name.includes(q) || shiftName.includes(q) || dept.includes(q);
        });
    }, [schedules, scheduleSearch]);

    // --- ASIGNACIÓN MASIVA ---
    const toggleEmployee = (id) => {
        setSelectedEmployees(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const toggleAllEmployees = () => {
        if (selectedEmployees.length === filteredEmployees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(filteredEmployees.map(e => e.id));
        }
    };

    const toggleDayOfWeek = (dayKey) => {
        setAssignmentData(prev => {
            const exists = prev.daysOfWeek.includes(dayKey);
            const updated = exists ? prev.daysOfWeek.filter(d => d !== dayKey) : [...prev.daysOfWeek, dayKey];
            return { ...prev, daysOfWeek: updated };
        });
    };

    const handleAssignShifts = async (e) => {
        e.preventDefault();
        if (selectedEmployees.length === 0) {
            return toast.error('Debe seleccionar al menos un colaborador');
        }
        if (!assignmentData.shiftId) {
            return toast.error('Seleccione un turno para asignar');
        }
        if (!assignmentData.startDate) {
            return toast.error('Ingrese la fecha de inicio de la vigencia');
        }
        if (assignmentData.daysOfWeek.length === 0) {
            return toast.error('Seleccione al menos un día de la semana para el horario');
        }

        setAssigning(true);
        try {
            const res = await shiftService.assignShifts({
                employeeIds: selectedEmployees,
                shiftId: assignmentData.shiftId,
                startDate: assignmentData.startDate,
                endDate: assignmentData.endDate || null,
                daysOfWeek: assignmentData.daysOfWeek
            });

            if (res.success) {
                const successCount = res.data.success?.length || 0;
                const errorCount = res.data.errors?.length || 0;

                if (errorCount === 0) {
                    toast.success(`Horario asignado exitosamente a ${successCount} colaborador(es)`);
                    setSelectedEmployees([]);
                    setActiveTab('assignments');
                } else if (successCount > 0) {
                    toast.success(`Asignados: ${successCount}. Con conflictos: ${errorCount}.`);
                } else {
                    toast.error(`No se pudo asignar. ${res.data.errors[0]?.message || 'Conflicto de horarios'}`);
                }
                await loadData();
            }
        } catch (error) {
            toast.error(error.message || 'Error al procesar la asignación');
        } finally {
            setAssigning(false);
        }
    };

    // --- DESASIGNAR HORARIO ---
    const handleDeleteSchedule = (sch) => {
        const empName = `${sch.employee?.firstName || ''} ${sch.employee?.lastName || ''}`.trim() || 'el colaborador';
        setConfirmModal({
            open: true,
            title: 'Cancelar Asignación de Turno',
            message: `¿Desea desasignar el turno "${sch.shift?.name}" a ${empName}?`,
            confirmText: 'Desasignar Horario',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const res = await shiftService.deleteSchedule(sch.id);
                    if (res.success) {
                        toast.success('Horario desasignado correctamente');
                        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
                        await loadData();
                    }
                } catch (error) {
                    toast.error(error.message || 'Error al cancelar la asignación');
                }
            }
        });
    };

    const calculateShiftHours = (start, end, breakMin = 60) => {
        try {
            if (!start || !end) return '';
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            let totalMins = (eh * 60 + em) - (sh * 60 + sm);
            if (totalMins < 0) totalMins += 24 * 60;
            const effectiveMins = Math.max(0, totalMins - (breakMin || 0));
            const hrs = (effectiveMins / 60).toFixed(1);
            return `${hrs}h efectivas (${breakMin}m almuerzo)`;
        } catch {
            return '';
        }
    };

    const parseDays = (days) => {
        try {
            if (Array.isArray(days)) return days.join(', ');
            if (typeof days === 'string') {
                const parsed = JSON.parse(days);
                return Array.isArray(parsed) ? parsed.join(', ') : days;
            }
            return 'Lunes a Viernes';
        } catch {
            return typeof days === 'string' ? days : 'Lunes a Viernes';
        }
    };

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";
    const labelClass = "block text-xs font-medium text-gray-600 mb-1";

    return (
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Asistencia · Turnos</p>
                    <h1 className="text-xl font-semibold text-gray-900">Gestión de Turnos y Horarios</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Configure los horarios laborales del personal y asigne turnos masiva o individualmente.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                    >
                        + Nuevo Turno
                    </button>
                </div>
            </div>

            {/* Pestañas con Contadores Tabulares */}
            <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto pb-px">
                {[
                    { key: 'shifts', label: 'Turnos Configurados', count: shifts.length },
                    { key: 'assignments', label: 'Asignaciones Activas', count: schedules.length },
                    { key: 'bulk_assign', label: 'Asignación Masiva', count: null }
                ].map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                            activeTab === tab.key
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span>{tab.label}</span>
                        {tab.count !== null && (
                            <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                    activeTab === tab.key ? 'bg-gray-100 text-gray-900' : 'bg-gray-50 text-gray-500'
                                }`}
                                style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* TAB 1: TURNOS CONFIGURADOS */}
            {activeTab === 'shifts' && (
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Catálogo de Turnos</h3>
                        <span className="text-[11px] font-mono text-gray-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {shifts.length} {shifts.length === 1 ? 'turno configurado' : 'turnos configurados'}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200">
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Nombre del Turno</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Horario</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Jornada Efectiva</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tolerancia</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-400 text-xs">
                                            Cargando turnos...
                                        </td>
                                    </tr>
                                ) : shifts.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-10 text-center text-gray-400">
                                            <p className="font-medium text-gray-700 text-xs">Sin turnos configurados</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Haga clic en "+ Nuevo Turno" para crear el primer horario.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    shifts.map(shift => (
                                        <tr key={shift.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="py-3 px-4 font-medium text-gray-900">
                                                {shift.name}
                                            </td>
                                            <td className="py-3 px-4 font-mono text-gray-800" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                {shift.startTime} — {shift.endTime}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 font-mono text-[11px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                {calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes)}
                                            </td>
                                            <td className="py-3 px-4 font-mono text-gray-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                {shift.toleranceMinutes ?? 15} min
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(shift)}
                                                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteShift(shift)}
                                                    className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: ASIGNACIONES ACTIVAS */}
            {activeTab === 'assignments' && (
                <div className="space-y-4">
                    {/* Barra de Filtro */}
                    <div className="bg-white border border-gray-200 rounded px-4 py-3 flex items-center justify-between gap-3">
                        <div className="w-full max-w-sm">
                            <input
                                type="text"
                                placeholder="Buscar colaborador, turno o departamento..."
                                className={inputClass}
                                value={scheduleSearch}
                                onChange={e => setScheduleSearch(e.target.value)}
                            />
                        </div>
                        <span className="text-[11px] text-gray-500 shrink-0 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            Mostrando {filteredSchedules.length} de {schedules.length} asignaciones
                        </span>
                    </div>

                    {/* Tabla de Asignaciones */}
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-200">
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Colaborador</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Turno</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Días Asignados</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Vigencia</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-gray-400 text-xs">
                                                Cargando asignaciones...
                                            </td>
                                        </tr>
                                    ) : filteredSchedules.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-10 text-center text-gray-400">
                                                <p className="font-medium text-gray-700 text-xs">Sin horarios asignados</p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">Vaya a la pestaña "Asignación Masiva" para asignar turnos a su equipo.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSchedules.map(sch => (
                                            <tr key={sch.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="py-3 px-4">
                                                    <p className="font-medium text-gray-900">{sch.employee?.firstName} {sch.employee?.lastName}</p>
                                                    <p className="text-[11px] text-gray-400">{sch.employee?.position || sch.employee?.department || 'General'}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="font-medium text-gray-900">{sch.shift?.name}</p>
                                                    <p className="text-[11px] text-gray-500 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                        {sch.shift?.startTime} — {sch.shift?.endTime}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-4 text-gray-700">
                                                    {parseDays(sch.daysOfWeek)}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-gray-700 text-[11px]" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                    {new Date(sch.startDate).toLocaleDateString('es-EC')} — {sch.endDate ? new Date(sch.endDate).toLocaleDateString('es-EC') : 'Indefinida'}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteSchedule(sch)}
                                                        className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                    >
                                                        Desasignar
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
            )}

            {/* TAB 3: ASIGNACIÓN MASIVA */}
            {activeTab === 'bulk_assign' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Panel de Selección de Colaboradores */}
                    <div className="lg:col-span-7 bg-white border border-gray-200 rounded overflow-hidden flex flex-col">
                        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">1. Seleccionar Colaboradores</h3>
                                <span className="text-[11px] font-mono text-gray-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                    {selectedEmployees.length} de {filteredEmployees.length} seleccionados
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={toggleAllEmployees}
                                    className="px-2.5 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                                >
                                    {selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0 ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                                </button>
                            </div>
                        </div>

                        {/* Buscador de Colaboradores */}
                        <div className="p-3 border-b border-gray-100 bg-gray-50/30">
                            <input
                                type="text"
                                placeholder="Filtrar por nombre, cargo o departamento..."
                                className={inputClass}
                                value={empSearch}
                                onChange={e => setEmpSearch(e.target.value)}
                            />
                        </div>

                        {/* Lista con Checkboxes */}
                        <div className="h-96 overflow-y-auto divide-y divide-gray-100">
                            {filteredEmployees.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-xs">
                                    No se encontraron colaboradores.
                                </div>
                            ) : (
                                filteredEmployees.map(emp => {
                                    const isSelected = selectedEmployees.includes(emp.id);
                                    return (
                                        <div
                                            key={emp.id}
                                            onClick={() => toggleEmployee(emp.id)}
                                            className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                                                isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50/60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}} // Handled by container onClick
                                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                                                />
                                                <div>
                                                    <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                        {emp.firstName} {emp.lastName}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400">
                                                        {emp.position || 'Sin cargo'} · {emp.department || 'General'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Panel de Configuración del Horario */}
                    <div className="lg:col-span-5 bg-white border border-gray-200 rounded overflow-hidden h-fit">
                        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-200">
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">2. Parámetros del Horario</h3>
                        </div>

                        <form onSubmit={handleAssignShifts} className="p-4 space-y-4">
                            <div>
                                <label className={labelClass}>Turno a Asignar</label>
                                <select
                                    className={inputClass}
                                    value={assignmentData.shiftId}
                                    onChange={e => setAssignmentData({ ...assignmentData, shiftId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione un turno...</option>
                                    {shifts.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.startTime}–{s.endTime})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Días de la Semana */}
                            <div>
                                <label className={labelClass}>Días Aplicables</label>
                                <div className="grid grid-cols-4 gap-1.5 pt-1">
                                    {ALL_DAYS.map(day => {
                                        const isSelected = assignmentData.daysOfWeek.includes(day.key);
                                        return (
                                            <button
                                                key={day.key}
                                                type="button"
                                                onClick={() => toggleDayOfWeek(day.key)}
                                                className={`py-1.5 px-2 text-xs font-medium rounded border transition-colors cursor-pointer text-center ${
                                                    isSelected
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {day.short}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Fechas de Vigencia */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Fecha Inicio</label>
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={assignmentData.startDate}
                                        onChange={e => setAssignmentData({ ...assignmentData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Fecha Fin (Opcional)</label>
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={assignmentData.endDate}
                                        onChange={e => setAssignmentData({ ...assignmentData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-400">
                                Si no especifica fecha de fin, el horario tendrá vigencia indefinida hasta que sea reasignado.
                            </p>

                            <div className="border-t border-gray-100 pt-3">
                                <button
                                    type="submit"
                                    disabled={assigning || selectedEmployees.length === 0}
                                    className="w-full px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                                >
                                    {assigning
                                        ? 'Asignando horarios...'
                                        : `Asignar a ${selectedEmployees.length} colaborador${selectedEmployees.length !== 1 ? 'es' : ''}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL — Crear / Editar Turno */}
            {shiftModal.open && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-md w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">
                                {shiftModal.isEditing ? 'Editar Turno' : 'Nuevo Turno de Trabajo'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShiftModal({ open: false, isEditing: false, id: null, name: '', startTime: '08:00', endTime: '17:00', toleranceMinutes: 15, breakMinutes: 60 })}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSaveShift}>
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className={labelClass}>Nombre del Turno</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Matutino Regular, Nocturno Operativo..."
                                        className={inputClass}
                                        value={shiftModal.name}
                                        onChange={e => setShiftModal({ ...shiftModal, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Hora de Inicio</label>
                                        <input
                                            type="time"
                                            className={`${inputClass} font-mono`}
                                            value={shiftModal.startTime}
                                            onChange={e => setShiftModal({ ...shiftModal, startTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Hora de Fin</label>
                                        <input
                                            type="time"
                                            className={`${inputClass} font-mono`}
                                            value={shiftModal.endTime}
                                            onChange={e => setShiftModal({ ...shiftModal, endTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Tolerancia de Atraso (min)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="120"
                                            className={`${inputClass} font-mono`}
                                            value={shiftModal.toleranceMinutes}
                                            onChange={e => setShiftModal({ ...shiftModal, toleranceMinutes: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Tiempo de Almuerzo (min)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="240"
                                            className={`${inputClass} font-mono`}
                                            value={shiftModal.breakMinutes}
                                            onChange={e => setShiftModal({ ...shiftModal, breakMinutes: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-600 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Jornada Calculada:</span>
                                        <span className="font-mono font-medium text-gray-900">
                                            {calculateShiftHours(shiftModal.startTime, shiftModal.endTime, shiftModal.breakMinutes)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShiftModal({ open: false, isEditing: false, id: null, name: '', startTime: '08:00', endTime: '17:00', toleranceMinutes: 15, breakMinutes: 60 })}
                                    className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                                >
                                    {shiftModal.isEditing ? 'Guardar Cambios' : 'Crear Turno'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación Estándar ERP */}
            {confirmModal.open && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-md w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">{confirmModal.title}</h3>
                            <button
                                type="button"
                                onClick={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-5 text-xs text-gray-600 leading-relaxed">
                            {confirmModal.message}
                        </div>
                        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
                                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmModal.onConfirm}
                                className={`px-3.5 py-2 text-white text-xs font-medium rounded transition-colors cursor-pointer ${
                                    confirmModal.isDestructive
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                                }`}
                            >
                                {confirmModal.confirmText || 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftManagement;
