import { useState } from 'react';
import { FiCode, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import jorgeImg from '../../assets/images/jorge_doicela.jpg';

const DeveloperCard = () => {
    const [showDevModal, setShowDevModal] = useState(false);

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowDevModal(true)}
                    className="w-14 h-14 bg-slate-900/90 hover:bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 backdrop-blur-md transition-all group"
                    title="Conocer al desarrollador"
                >
                    <FiCode size={24} className="group-hover:text-blue-400 transition-colors" />
                </motion.button>
            </div>

            {/* Developer Modal */}
            <AnimatePresence>
                {showDevModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setShowDevModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] overflow-hidden max-w-xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative mx-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Image */}
                            <div className="relative w-full bg-slate-900 overflow-hidden group">
                                <img
                                    src={jorgeImg}
                                    alt="Jorge Doicela"
                                    className="w-full h-auto object-contain max-h-[60vh] mx-auto transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute top-0 right-0 left-0 h-16 bg-gradient-to-b from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <button
                                    onClick={() => setShowDevModal(false)}
                                    className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-90 z-20"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 md:p-10 bg-white">
                                <div className="space-y-2">
                                    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">Jorge Doicela</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
                                        <p className="text-sm text-blue-600 font-bold uppercase tracking-[0.2em]">Software Developer | DevSecOps</p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <p className="text-slate-500 text-lg leading-relaxed italic font-medium">
                                        "Desarrollador de software enfocado en la adopción de prácticas DevSecOps. Mi objetivo es crear soluciones digitales que no solo resuelvan problemas, sino que sean seguras y eficientes desde su concepción, aportando valor real en cada despliegue."
                                    </p>
                                </div>

                                <div className="mt-10">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowDevModal(false)}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10"
                                    >
                                        VOLVER AL PANEL
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default DeveloperCard;
