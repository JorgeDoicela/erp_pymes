import React, { useState, useEffect } from 'react';
import absenceService from '../../services/attendance/absenceService';
import { motion } from 'framer-motion';

const TeamCalendar = () => {
    const [absences, setAbsences] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await absenceService.getRequests({ status: 'APPROVED' });
            if (res.success) setAbsences(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // Helper to check if a day has absences
    const getAbsencesForDay = (day) => {
        const target = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return absences.filter(req => {
            const start = new Date(req.startDate);
            const end = new Date(req.endDate);
            return target >= start && target <= end;
        });
    };

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sun

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className="bg-slate-800 rounded-xl border border-white/5 p-6 mt-8">
            <h3 className="text-xl font-bold mb-4 text-white">Calendario de Equipo - {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>

            <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-slate-400 mb-2">
                <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {/* Empty slots for start of month */}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-24 bg-slate-900/30 rounded border border-white/5"></div>
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayAbsences = getAbsencesForDay(day);
                    return (
                        <div key={day} className="h-24 bg-slate-900/50 rounded border border-white/5 p-1 overflow-y-auto">
                            <p className="text-right text-slate-500 text-xs mb-1">{day}</p>
                            {dayAbsences.map(abs => (
                                <div key={abs.id} className="text-[10px] bg-blue-500/20 text-blue-300 rounded px-1 py-0.5 mb-1 truncate" title={`${abs.employee.firstName}: ${abs.type}`}>
                                    {abs.employee.firstName}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TeamCalendar;
