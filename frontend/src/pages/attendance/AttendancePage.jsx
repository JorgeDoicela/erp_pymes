import React from 'react';
import DigitalMarker from '../../components/attendance/DigitalMarker';

const AttendancePage = ({ user }) => {
    return (
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Asistencia · Registro de Jornada</p>
                <h1 className="text-xl font-semibold text-gray-900">Control de Asistencia</h1>
                <p className="text-sm text-gray-500 mt-0.5">Registre su entrada o salida diaria en el sistema.</p>
            </div>

            <div className="w-full flex justify-center py-6">
                <div className="w-full max-w-lg">
                    <DigitalMarker user={user} autoLoadUser={false} allowSearch={true} />
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
