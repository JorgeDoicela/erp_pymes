import React, { useState } from 'react';
import { FiCopy, FiCheck, FiExternalLink, FiMaximize2, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from './Modal';

export default function QrCodeModal({ isOpen, onClose, url, title = 'Escanear Encuesta en Vivo', description = 'Apunta la cámara de tu teléfono para abrir el formulario de investigación y registrar tu respuesta.' }) {
    const [copied, setCopied] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const targetUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}/investigacion` : 'https://emplifi.app/investigacion');
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(targetUrl)}&margin=10&color=111827&bgcolor=ffffff`;

    const handleCopy = () => {
        navigator.clipboard.writeText(targetUrl);
        setCopied(true);
        toast.success('Enlace copiado al portapapeles');
        setTimeout(() => setCopied(false), 2500);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = qrImageUrl;
        link.download = 'emplifi_qr_investigacion.png';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Descargando imagen QR');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            subtitle="Participación de Audiencia"
            size={isFullScreen ? "lg" : "md"}
            footer={
                <div className="flex items-center justify-between w-full text-xs text-gray-500">
                    <span>Proyección en vivo para recolección de respuestas.</span>
                    <button
                        onClick={onClose}
                        className="text-xs font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>
            }
        >
            <div className="flex flex-col items-center text-center space-y-3">
                <div className="flex justify-end w-full">
                    <button
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors cursor-pointer text-xs flex items-center gap-1"
                        title={isFullScreen ? "Modo normal" : "Pantalla para proyector"}
                    >
                        <FiMaximize2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">{isFullScreen ? "Reducir" : "Ampliar"}</span>
                    </button>
                </div>

                <div className={`p-3 bg-white border border-gray-200 rounded flex items-center justify-center ${
                    isFullScreen ? 'w-64 h-64' : 'w-48 h-48'
                }`}>
                    <img
                        src={qrImageUrl}
                        alt="Código QR para acceso a encuesta"
                        className="w-full h-full object-contain"
                        loading="eager"
                    />
                </div>

                <p className="text-xs text-gray-600 max-w-sm">
                    {description}
                </p>
                <p className="text-xs text-gray-500 font-mono break-all px-3 py-1 bg-gray-50 rounded border border-gray-200 max-w-full">
                    {targetUrl}
                </p>

                {/* Botones Estándar ERP */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 w-full">
                    <button
                        onClick={handleCopy}
                        className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 bg-white"
                    >
                        {copied ? <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FiCopy className="w-3.5 h-3.5 text-gray-500" />}
                        {copied ? 'Copiado' : 'Copiar Enlace'}
                    </button>

                    <button
                        onClick={handleDownload}
                        className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 bg-white"
                    >
                        <FiDownload className="w-3.5 h-3.5 text-gray-500" />
                        Guardar Imagen
                    </button>

                    <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <FiExternalLink className="w-3.5 h-3.5" />
                        Abrir Formulario
                    </a>
                </div>
            </div>
        </Modal>
    );
}
