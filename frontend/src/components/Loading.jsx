import { motion } from "framer-motion";
import { FiLoader } from "react-icons/fi";

const Loading = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
            >
                {/* Spinner con anillos concéntricos */}
                <div className="relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-indigo-400 rounded-full"
                    />
                </div>

                {/* Texto animado */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 text-slate-600 font-medium"
                >
                    Cargando datos...
                </motion.p>

                {/* Puntos animados */}
                <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Loading;
