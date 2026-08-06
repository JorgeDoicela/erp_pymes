import React from 'react';
import { motion } from 'framer-motion';
import DigitalMarker from '../../../components/attendance/DigitalMarker';

const EmployeeAttendance = ({ user }) => {
    return (
        <div className="flex flex-col items-center py-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8 text-center"
            >
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2">
                    Control de Asistencia
                </h1>
                <p className="text-slate-500">Registra tu actividad diaria de forma segura</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full max-w-lg"
            >
                <DigitalMarker user={user} autoLoadUser={true} allowSearch={false} />
            </motion.div>
        </div>
    );
};

export default EmployeeAttendance;
