import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifyQrPublic } from '../../services/signatures/signature.service';
import { FiCheckCircle, FiAlertTriangle, FiShield, FiLock, FiCalendar, FiUser, FiFileText } from 'react-icons/fi';

const DOC_TYPES_MAP = {
    PAYSLIP: 'Rol Individual de Pagos y Liquidación',
    ASSET_HANDOVER: 'Acta de Entrega-Recepción de Activo / Equipo',
    WORK_CERTIFICATE: 'Certificado Laboral Institucional',
    CONTRACT: 'Contrato Individual de Trabajo',
    ATTENDANCE: 'Registro y Marcación de Asistencia Biometrizada',
    CUSTOM: 'Documento Institucional Certificado'
};

const PublicSignatureVerification = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verify = async () => {
            setLoading(true);
            try {
                const res = await verifyQrPublic(token);
                setResult(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'No fue posible validar la firma digital');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            verify();
        } else {
            setError('Token de firma no provisto');
            setLoading(false);
        }
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
            <div className="max-w-lg w-full bg-white border border-gray-200 rounded p-6 sm:p-8 space-y-6 shadow-xs">
                {/* Cabecera Oficial */}
                <div className="text-center border-b border-gray-100 pb-5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                        SISTEMA DE VERIFICACIÓN DE FIRMAS DIGITALES
                    </p>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                        Validador Oficial de Integridad Documental
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Cumplimiento de la Ley de Comercio Electrónico y Mensajes de Datos del Ecuador
                    </p>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-gray-400 text-xs space-y-2">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p>Validando autenticidad y firma criptográfica en el sistema...</p>
                    </div>
                ) : error || !result?.valid ? (
                    <div className="p-5 bg-red-50/70 border border-red-200 rounded space-y-3 text-center">
                        <FiAlertTriangle className="mx-auto text-red-600" size={32} />
                        <h2 className="text-sm font-bold text-red-900">Firma No Válida o Documento Inexistente</h2>
                        <p className="text-xs text-red-700">
                            {error || result?.message || 'El código de seguridad no coincide con los registros oficiales o ha expirado.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Banner de Verificación Exitosa */}
                        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded flex items-center gap-3">
                            <FiCheckCircle className="text-emerald-700 shrink-0" size={24} />
                            <div>
                                <h2 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                                    Documento Auténtico y Verificado
                                </h2>
                                <p className="text-[11px] text-emerald-800">
                                    La firma digital es válida y fue emitida por la entidad autorizada.
                                </p>
                            </div>
                        </div>

                        {/* Detalles de la Firma y Documento */}
                        <div className="space-y-3 text-xs divide-y divide-gray-100">
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-gray-500">Tipo de Documento:</span>
                                <span className="font-semibold text-gray-900">
                                    {DOC_TYPES_MAP[result.docType] || result.docType}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-gray-500">Código de Verificación:</span>
                                <span className="font-mono font-bold text-gray-900 text-xs">
                                    {result.verificationCode}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-gray-500">Firmante:</span>
                                <span className="font-semibold text-gray-900">
                                    {result.signer.name}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-gray-500">C.I. / Identificación:</span>
                                <span className="font-mono text-gray-800">
                                    {result.signer.id}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-gray-500">Entidad Emisora:</span>
                                <span className="font-medium text-gray-800">
                                    {result.signer.issuer}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-gray-500">Fecha y Hora de Firma:</span>
                                <span className="font-mono text-gray-700">
                                    {new Date(result.signedAt).toLocaleString('es-EC')}
                                </span>
                            </div>

                            <div className="pt-2">
                                <span className="text-gray-500 block mb-1">Hash Criptográfico SHA-256:</span>
                                <span className="font-mono text-[10px] text-gray-600 bg-gray-50 border border-gray-200 rounded p-1.5 break-all block">
                                    {result.payload?.docHash}
                                </span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 text-center">
                            <p className="text-[11px] text-gray-400">
                                Este comprobante electrónico garantiza que la información no ha sido modificada con posterioridad a su firma.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 text-center">
                <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    Acceso a la Plataforma Institucional EMPLIFI
                </Link>
            </div>
        </div>
    );
};

export default PublicSignatureVerification;
