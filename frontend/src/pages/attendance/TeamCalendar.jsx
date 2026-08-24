import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import absenceService from '../../services/attendance/absenceService';

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const TYPE_COLORS = {
    'Vacaciones': 'bg-blue-50 text-blue-800 border-blue-200',
    'Enfermedad': 'bg-amber-50 text-amber-800 border-amber-200',
    'Permiso Médico': 'bg-amber-50 text-amber-800 border-amber-200',
    'Maternidad/Paternidad': 'bg-purple-50 text-purple-800 border-purple-200',
    'default': 'bg-gray-50 text-gray-800 border-gray-200'
};

const TeamCalendar = () => {
    const [absences, setAbsences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await absenceService.getRequests({ status: 'APPROVED' });
            if (res.success) {
                setAbsences(res.data || []);
            }
        } catch (error) {
            toast.error(error.message || 'Error al cargar el calendario de ausencias');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        absenceService.getRequests({ status: 'APPROVED' })
            .then(res => {
                if (isMounted && res.success) {
                    setAbsences(res.data || []);
                }
            })
            .catch(error => {
                if (isMounted) toast.error(error.message || 'Error al cargar el calendario');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    const prevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const goToday = () => {
        setCurrentDate(new Date());
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const today = new Date();
    const isCurrentMonthToday = today.getFullYear() === year && today.getMonth() === month;

    // Helper to check absences on a specific day
    const getAbsencesForDay = (day) => {
        const target = new Date(Date.UTC(year, month, day, 12, 0, 0));
        return absences.filter(req => {
            const start = new Date(req.startDate);
            const end = new Date(req.endDate);
            const startUTC = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 0, 0, 0));
            const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59));
            return target >= startUTC && target <= endUTC;
        });
    };

    return (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
            {/* Header del Calendario */}
            <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-900">
                        {MONTH_NAMES[month]} {year}
                    </h2>
                    <span className="text-xs text-gray-400 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ({absences.length} {absences.length === 1 ? 'ausencia aprobada' : 'ausencias aprobadas'})
                    </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="px-2.5 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                        title="Mes anterior"
                    >
                        ← Anterior
                    </button>
                    <button
                        type="button"
                        onClick={goToday}
                        className="px-2.5 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Hoy
                    </button>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="px-2.5 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                        title="Mes siguiente"
                    >
                        Siguiente →
                    </button>
                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="px-2.5 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer ml-1"
                        title="Actualizar datos"
                    >
                        {loading ? '...' : 'Actualizar'}
                    </button>
                </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/30 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2">
                {DAY_NAMES.map(d => (
                    <div key={d} className="py-0.5">{d}</div>
                ))}
            </div>

            {/* Cuadrícula de Días */}
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 bg-gray-100">
                {/* Espacios vacíos para días previos */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[90px] bg-gray-50/60 p-1.5" />
                ))}

                {/* Días del mes */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayAbsences = getAbsencesForDay(day);
                    const isToday = isCurrentMonthToday && today.getDate() === day;

                    return (
                        <div
                            key={day}
                            className={`min-h-[90px] bg-white p-1.5 flex flex-col justify-between transition-colors ${
                                isToday ? 'ring-1 ring-inset ring-blue-500 bg-blue-50/20' : ''
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span
                                    className={`text-[11px] font-mono font-semibold px-1 rounded ${
                                        isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
                                    }`}
                                    style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
                                >
                                    {day}
                                </span>
                                {dayAbsences.length > 0 && (
                                    <span className="text-[10px] text-gray-400 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {dayAbsences.length}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1 overflow-y-auto max-h-[65px]">
                                {dayAbsences.map(abs => {
                                    const cls = TYPE_COLORS[abs.type] || TYPE_COLORS.default;
                                    const empName = abs.employee
                                        ? `${abs.employee.firstName} ${abs.employee.lastName || ''}`.trim()
                                        : 'Colaborador';
                                    return (
                                        <div
                                            key={abs.id}
                                            className={`text-[10px] px-1.5 py-0.5 rounded border font-medium truncate ${cls}`}
                                            title={`${empName} — ${abs.type} (${abs.reason || 'Sin motivo'})`}
                                        >
                                            <span className="font-semibold">{empName}:</span> {abs.type}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TeamCalendar;
