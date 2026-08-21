import React, { useState } from 'react';
import { FiX, FiCopy, FiCheck, FiExternalLink, FiMaximize2, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function QrCodeModal({ isOpen, onClose, url, title = 'Escanear Encuesta en Vivo', description = 'Apunta la cámara de tu teléfono para abrir el formulario de investigación y registrar tu respuesta.' }) {
    const [copied, setCopied] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    if (!isOpen) return null;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-[1px]">
            <div className={`bg-white border border-gray-200 rounded w-full overflow-hidden shadow-xl transition-all ${
                isFullScreen ? 'max-w-3xl' : 'max-w-lg'
            }`}>
                {/* Header Estándar ERP */}
                <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
                            Participación de Audiencia
                        </span>
                        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                            title={isFullScreen ? "Modo normal" : "Pantalla para proyector"}
                        >
                            <FiMaximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body Estándar ERP */}
                <div className="p-5 flex flex-col items-center text-center space-y-3">
                    <div className={`p-3 bg-white border border-gray-200 rounded flex items-center justify-center ${
                        isFullScreen ? 'w-72 h-72' : 'w-52 h-52'
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
                            {copied ? <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FiCopy className="w-3.5 h-3.5" />}
                            {copied ? 'Copiado' : 'Copiar Enlace'}
                        </button>

                        <button
                            onClick={handleDownload}
                            className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 bg-white"
                        >
                            <FiDownload className="w-3.5 h-3.5" />
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

                {/* Footer Estándar ERP */}
                <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                    <span>Proyección en vivo para recolección de respuestas.</span>
                    <button
                        onClick={onClose}
                        className="text-xs font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
