import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

export default function ErrorState({ title = "Error al cargar la información", message = "Ocurrió un problema inesperado al consultar los datos de inteligencia.", onRetry }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 text-center max-w-lg mx-auto my-12"
        >
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <FiAlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-100 active:scale-95"
                >
                    <FiRefreshCw className="w-4 h-4" />
                    Reintentar
                </button>
            )}
        </motion.div>
    );
}

ErrorState.propTypes = {
    title: PropTypes.string,
    message: PropTypes.string,
    onRetry: PropTypes.func,
};
