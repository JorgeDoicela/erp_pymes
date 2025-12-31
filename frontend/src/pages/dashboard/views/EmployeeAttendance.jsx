import React from 'react';
import { motion } from 'framer-motion';
import DigitalMarker from '../../../components/Attendance/DigitalMarker';
import { useNavigate } from 'react-router-dom';

const EmployeeAttendance = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            {/* Navbar Simple */}
            <nav className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div onClick={() => navigate('/empleado')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                &larr; Volver al Dashboard
                            </span>
                        </div>
                        <div className="text-sm font-medium text-slate-400">
                            {user?.firstName}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-8 text-center"
                >
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">
                        Control de Asistencia
                    </h1>
                    <p className="text-slate-400">Registra tu actividad diaria de forma segura</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-lg"
                >
                    {/* Pass user to auto-handle ID */}
                    <DigitalMarker user={user} />
                </motion.div>
            </main>
        </div>
    );
};

export default EmployeeAttendance;
