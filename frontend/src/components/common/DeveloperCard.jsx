import { useState } from 'react';
import { FiCode } from 'react-icons/fi';
import Modal from './Modal';

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
            <Modal
                isOpen={showDevModal}
                onClose={() => setShowDevModal(false)}
                title="Jorge Doicela"
                subtitle="Software Developer"
                size="md"
                footer={
                    <button
                        onClick={() => setShowDevModal(false)}
                        className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-4 py-1.5 rounded transition-colors cursor-pointer"
                    >
                        Cerrar
                    </button>
                }
            >
                <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                    <p className="italic bg-gray-50 p-3.5 border border-gray-200 rounded text-gray-700">
                        "Desarrollador de software apasionado por el diseño de soluciones empresariales de alto rendimiento. Construyendo sistemas robustos, seguros y eficientes, transformando ideas complejas en productos digitales que aportan valor real."
                    </p>
                </div>
            </Modal>
        </>
    );
};

export default DeveloperCard;
