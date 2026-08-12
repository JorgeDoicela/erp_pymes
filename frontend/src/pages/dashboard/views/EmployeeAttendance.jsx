import React from 'react';
import DigitalMarker from '../../../components/attendance/DigitalMarker';

const EmployeeAttendance = ({ user }) => {
    return (
        <div className="space-y-6 max-w-4xl mx-auto py-2">
            <div className="bg-white p-5 rounded border border-gray-200">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Tiempo y Asistencia
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    Control de Asistencia del Empleado
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                    Registra tu entrada, salidas y almuerzo con validación de seguridad y ubicación.
                </p>
            </div>

            <div className="w-full">
                <DigitalMarker user={user} autoLoadUser={true} allowSearch={false} />
            </div>
        </div>
    );
};

export default EmployeeAttendance;

