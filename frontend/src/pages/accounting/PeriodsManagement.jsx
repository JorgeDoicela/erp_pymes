import React, { useState, useEffect } from 'react';
import { getPeriods, createPeriod, togglePeriod } from '../../services/accounting.service';
import { FiCalendar, FiPlus, FiLock, FiCheckCircle, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PeriodsManagement = () => {
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        setLoading(true);
        try {
            const data = await getPeriods();
            setPeriods(data);
        } catch (error) {
            toast.error('Error al cargar periodos');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePeriod = async () => {
        // Sugerir el siguiente periodo
        const last = periods[0] || { month: new Date().getMonth(), year: new Date().getFullYear() };
        let nextMonth = last.month + 1;
        let nextYear = last.year;
        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear++;
        }

        const startDate = new Date(nextYear, nextMonth - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(nextYear, nextMonth, 0).toISOString().split('T')[0];

        try {
            await createPeriod({ year: nextYear, month: nextMonth, startDate, endDate });
            toast.success(`Periodo ${nextMonth}/${nextYear} abierto exitosamente.`);
            fetchPeriods();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al abrir periodo');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await togglePeriod(id);
            toast.success('Estado del periodo actualizado');
            fetchPeriods();
        } catch (error) {
            toast.error('Error al cambiar estado del periodo');
        }
    };

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Contabilidad · Ejercicio Fiscal</p>
                    <h1 className="text-xl font-semibold text-gray-900">Periodos Contables y Cierres</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Control de apertura y bloqueo de meses para integridad de libros contables.</p>
                </div>
                <button
                    onClick={handleCreatePeriod}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                    <FiPlus size={14} /> Abrir Siguiente Mes
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {periods.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded border border-gray-200 space-y-3">
                        <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-mono font-semibold text-gray-900">Periodo {String(p.month).padStart(2, '0')}/{p.year}</h3>
                                <p className="text-[11px] text-gray-400 font-mono">{new Date(p.startDate).toLocaleDateString('es-EC')} - {new Date(p.endDate).toLocaleDateString('es-EC')}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${p.status === 'OPEN' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                {p.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
                            </span>
                        </div>

                        <div className="text-xs space-y-1.5 text-gray-600">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Régimen:</span>
                                <span className="font-medium text-gray-800">{p.status === 'OPEN' ? 'Permite Asientos' : 'Bloqueado a Escritura'}</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <button
                                onClick={() => handleToggleStatus(p.id)}
                                className={`w-full py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                                    p.status === 'OPEN' 
                                        ? 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700' 
                                        : 'bg-green-50 border border-green-200 hover:bg-green-100 text-green-800'
                                }`}
                            >
                                {p.status === 'OPEN' ? (
                                    <><FiLock size={12} /> Bloquear / Cerrar Mes</>
                                ) : (
                                    <><FiCheckCircle size={12} /> Reabrir Periodo</>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PeriodsManagement;
