import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const MaintenanceBanner = () => {
    const [maintenanceInfo, setMaintenanceInfo] = useState(null);

    useEffect(() => {
        const fetchSystemStatus = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/system/health`);
                const data = await response.json();

                // If there's a scheduled maintenance, check if it's within 24h
                if (data.maintenanceScheduled) {
                    const scheduledDate = new Date(data.maintenanceScheduled);
                    const now = new Date();
                    const diffHours = (scheduledDate - now) / (1000 * 60 * 60);

                    if (diffHours > 0 && diffHours <= 24) {
                        setMaintenanceInfo({
                            time: scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            date: scheduledDate.toLocaleDateString(),
                            hoursLeft: Math.round(diffHours)
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching system health for banner:', error);
            }
        };

        fetchSystemStatus();
        const interval = setInterval(fetchSystemStatus, 15 * 60 * 1000); // Check every 15 mins
        return () => clearInterval(interval);
    }, []);

    if (!maintenanceInfo) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-4 text-amber-200 text-sm z-[100]"
            >
                <div className="flex items-center gap-2">
                    <FiAlertTriangle className="text-amber-500 animate-pulse" />
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Mantenimiento Programado</span>
                </div>
                <div className="hidden md:flex items-center gap-1.5 opacity-80">
                    <FiClock size={14} />
                    <span>Inicia en aproximadamente {maintenanceInfo.hoursLeft} {maintenanceInfo.hoursLeft === 1 ? 'hora' : 'horas'} ({maintenanceInfo.date} {maintenanceInfo.time})</span>
                </div>
                <div className="md:hidden flex items-center gap-1.5 opacity-80">
                    <FiClock size={14} />
                    <span>Inicio: {maintenanceInfo.time}</span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MaintenanceBanner;
