import React from 'react';
import { useNavigate } from 'react-router-dom';
import DigitalMarker from '../../components/attendance/DigitalMarker';
import { motion } from 'framer-motion';

const AttendancePage = ({ user }) => {
    const navigate = useNavigate();
    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Control de Asistencia</h2>
                    <p className="text-slate-500 text-sm">Registre su entrada o salida diaria</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm font-medium"
                >
                    Volver
                </button>
            </header>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full flex justify-center py-8"
            >
                <div className="w-full max-w-lg">
                    <DigitalMarker user={user} />
                </div>
            </motion.div>
        </div>
    );
};

export default AttendancePage;
