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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FiCalendar className="text-indigo-600" /> Periodos Contables
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de meses fiscales y estados de cierre</p>
                </div>
                <button
                    onClick={handleCreatePeriod}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
                >
                    <FiPlus /> Abrir Siguiente Mes
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {periods.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-2 h-full ${p.status === 'OPEN' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-3xl font-bold text-slate-800">{String(p.month).padStart(2, '0')}</h3>
                                <p className="text-slate-500 font-medium">Año {p.year}</p>
                            </div>
                            <div className={`p-3 rounded-2xl ${p.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                {p.status === 'OPEN' ? <FiClock className="w-6 h-6" /> : <FiLock className="w-6 h-6" />}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Estado:</span>
                                <span className={`font-bold ${p.status === 'OPEN' ? 'text-emerald-600' : 'text-slate-600'}`}>
                                    {p.status === 'OPEN' ? 'ABIERTO - PERMITE REGISTROS' : 'CERRADO'}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Desde:</span>
                                <span>{new Date(p.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Hasta:</span>
                                <span>{new Date(p.endDate).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <button
                                onClick={() => handleToggleStatus(p.id)}
                                className={`w-full py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${p.status === 'OPEN' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                            >
                                {p.status === 'OPEN' ? (
                                    <><FiLock className="w-4 h-4" /> Realizar Cierre de Mes</>
                                ) : (
                                    <><FiCheckCircle className="w-4 h-4" /> Re-abrir Periodo</>
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
