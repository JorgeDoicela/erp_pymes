import React from 'react';
import DigitalMarker from '../../components/Attendance/DigitalMarker';
import { motion } from 'framer-motion';

const AttendancePage = () => {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8 text-center"
            >
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 mb-2">
                    Control de Asistencia
                </h1>
                <p className="text-gray-400">Registre su entrada o salida diaria</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full max-w-md"
            >
                <DigitalMarker />
            </motion.div>

            <footer className="mt-12 text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} Sistema de Recursos Humanos
            </footer>
        </div>
    );
};

export default AttendancePage;
