import { useState } from 'react';
import { FiCode, FiX } from 'react-icons/fi';

const DeveloperCard = () => {
    const [showDevModal, setShowDevModal] = useState(false);

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={() => setShowDevModal(true)}
                    className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium px-3 py-2 rounded transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Conocer al desarrollador"
                >
                    <FiCode className="w-4 h-4 text-blue-600" />
                    <span>Desarrollador</span>
                </button>
            </div>

            {/* Developer Modal */}
            {showDevModal && (
                <div
                    className="fixed inset-0 bg-gray-900/50 z-[100] flex items-center justify-center p-4"
                    onClick={() => setShowDevModal(false)}
                >
                    <div
                        className="bg-white border border-gray-200 rounded max-w-lg w-full overflow-hidden shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Jorge Doicela</h3>
                                <p className="text-[11px] font-mono font-medium text-gray-500 uppercase tracking-wider">
                                    Software Developer
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDevModal(false)}
                                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4 text-xs text-gray-600 leading-relaxed">
                            <p className="italic bg-gray-50 p-3.5 border border-gray-200 rounded text-gray-700">
                                "Desarrollador de software apasionado por el diseño de soluciones empresariales de alto rendimiento. Construyendo sistemas robustos, seguros y eficientes, transformando ideas complejas en productos digitales que aportan valor real."
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
                            <button
                                onClick={() => setShowDevModal(false)}
                                className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-4 py-1.5 rounded transition-colors cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DeveloperCard;
