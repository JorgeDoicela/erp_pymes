import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

export default function ErrorState({ title = "Error al cargar la información", message = "Ocurrió un problema inesperado al consultar los datos de inteligencia.", onRetry }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded border border-gray-200 p-6 text-center max-w-md mx-auto my-8 shadow-xs text-xs space-y-3"
        >
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100">
                <FiAlertCircle className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-xs text-gray-600 leading-normal">{message}</p>
            </div>
            {onRetry && (
                <div className="pt-2">
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-xs cursor-pointer"
                    >
                        <FiRefreshCw className="w-3.5 h-3.5" />
                        Reintentar
                    </button>
                </div>
            )}
        </motion.div>
    );
}

ErrorState.propTypes = {
    title: PropTypes.string,
    message: PropTypes.string,
    onRetry: PropTypes.func,
};
