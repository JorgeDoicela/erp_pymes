import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getEmployees } from '../../services/employees/employee.service';
import {
    generateQrSignature,
    verifyQrSignature,
    inspectP12Certificate,
    signDocumentWithP12,
    verifyP12Signature
} from '../../services/signatures/signature.service';
import {
    FiCheck,
    FiCopy,
    FiDownload,
    FiExternalLink,
    FiFileText,
    FiShield,
    FiLock,
    FiEye,
    FiCheckCircle,
    FiAlertCircle,
    FiUser,
    FiInfo,
    FiHelpCircle
} from 'react-icons/fi';

const DOC_TYPES = [
    { key: 'PAYSLIP', label: 'Rol de Pagos Mensual' },
    { key: 'ASSET_HANDOVER', label: 'Acta de Entrega de Equipos / EPP' },
    { key: 'WORK_CERTIFICATE', label: 'Certificado Laboral de Trabajo' },
    { key: 'CONTRACT', label: 'Contrato o Anexo Laboral' },
    { key: 'ATTENDANCE', label: 'Comprobante de Marcación y Asistencia' },
    { key: 'CUSTOM', label: 'Otro Documento de la Empresa' }
];

const DigitalSignatureCenter = () => {
    const [activeTab, setActiveTab] = useState('QR'); // 'QR' | 'P12' | 'VERIFIER'
    const [employees, setEmployees] = useState([]);
    const [selectedEmpId, setSelectedEmpId] = useState('');

    // --- ESTADOS FIRMA QR ---
    const [qrForm, setQrForm] = useState({
        docType: 'PAYSLIP',
        docId: '',
        signerName: '',
        signerId: '',
        issuer: 'EMPLIFI S.A.',
        content: '',
        notes: 'Firma digital de conformidad',
        expiresInDays: 365
    });
    const [qrResult, setQrResult] = useState(null);
    const [loadingQr, setLoadingQr] = useState(false);

    // --- ESTADOS FIRMA ELECTRÓNICA .P12 ---
    const [p12File, setP12File] = useState(null);
    const [p12Password, setP12Password] = useState('');
    const [p12Inspection, setP12Inspection] = useState(null);
    const [inspecting, setInspecting] = useState(false);

    const [p12SignForm, setP12SignForm] = useState({
        documentName: 'Acta de Conformidad Legal',
        reason: 'Aprobación y Validez Jurídica (Ecuador)',
        documentContent: ''
    });
    const [p12SignResult, setP12SignResult] = useState(null);
    const [signingP12, setSigningP12] = useState(false);

    // --- ESTADOS VERIFICADOR ---
    const [verifyInput, setVerifyInput] = useState('');
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifying, setVerifying] = useState(false);

    // Cargar empleados para auto-completar
    useEffect(() => {
        const loadEmps = async () => {
            try {
                const res = await getEmployees();
                const list = Array.isArray(res)
                    ? res
                    : (res?.data || res?.employees || []);
                setEmployees(list.filter(e => e.isActive !== false));
            } catch (err) {
                console.error('Error cargando empleados:', err);
            }
        };
        loadEmps();
    }, []);

    // Cuando el usuario selecciona un empleado del desplegable
    const handleSelectEmployee = (empId) => {
        setSelectedEmpId(empId);
        if (!empId) return;
        const emp = employees.find(e => e.id === empId);
        if (emp) {
            const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
            const idCard = emp.identityCard || '';
            const defaultNotes = `Firma de ${DOC_TYPES.find(d => d.key === qrForm.docType)?.label || 'Documento'} para ${fullName}`;
            
            setQrForm(prev => ({
                ...prev,
                signerName: fullName,
                signerId: idCard,
                notes: defaultNotes,
                content: prev.content || `Documento oficial emitido a favor de ${fullName} (C.I. ${idCard}) - Cargo: ${emp.position || 'Colaborador'}`
            }));

            setP12SignForm(prev => ({
                ...prev,
                documentName: `${DOC_TYPES.find(d => d.key === qrForm.docType)?.label || 'Documento'} - ${fullName}`,
                documentContent: prev.documentContent || `Certificación y conformidad legal para el colaborador ${fullName} (C.I. ${idCard}).`
            }));
        }
    };

    // Copy helper
    const copyToClipboard = (text, label = 'Texto') => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado al portapapeles`);
    };

    // 1. Generar Firma QR
    const handleGenerateQr = async (e) => {
        e.preventDefault();
        if (!qrForm.signerName || !qrForm.signerId) {
            return toast.error('Seleccione un colaborador o ingrese nombre y cédula');
        }
        setLoadingQr(true);
        try {
            const res = await generateQrSignature(qrForm);
            if (res.success && res.data) {
                setQrResult(res.data);
                toast.success('Sello digital con Código QR generado con éxito');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al generar el sello QR');
        } finally {
            setLoadingQr(false);
        }
    };

    // 2. Inspeccionar Certificado .P12
    const handleInspectP12 = async (e) => {
        e.preventDefault();
        if (!p12File) return toast.error('Seleccione su archivo de firma (.p12 o .pfx)');
        if (!p12Password) return toast.error('Ingrese la contraseña de su firma electrónica');

        setInspecting(true);
        try {
            const res = await inspectP12Certificate(p12File, p12Password);
            if (res.success && res.data) {
                setP12Inspection(res.data);
                toast.success('Firma electrónica validada correctamente');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Contraseña incorrecta o archivo de firma no válido');
            setP12Inspection(null);
        } finally {
            setInspecting(false);
        }
    };

    // 3. Firmar con .P12
    const handleSignWithP12 = async (e) => {
        e.preventDefault();
        if (!p12File || !p12Password) {
            return toast.error('Primero cargue su archivo de firma (.p12) y contraseña');
        }
        if (!p12SignForm.documentContent) {
            return toast.error('Ingrese el detalle o descripción del documento a firmar');
        }

        setSigningP12(true);
        try {
            const res = await signDocumentWithP12(
                p12File,
                p12Password,
                p12SignForm.documentContent,
                p12SignForm.documentName,
                p12SignForm.reason
            );
            if (res.success && res.data) {
                setP12SignResult(res.data);
                toast.success('Documento firmado electrónicamente con validez legal');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al firmar electrónicamente');
        } finally {
            setSigningP12(false);
        }
    };

    // 4. Verificador Simple
    const handleVerify = async (e) => {
        e.preventDefault();
        if (!verifyInput.trim()) return toast.error('Pegue el enlace o código del código QR a verificar');

        setVerifying(true);
        try {
            // Extraer token si pegaron la URL completa
            const cleanToken = verifyInput.trim().replace(/^.*\/signatures\/verify\//, '');
            const res = await verifyQrSignature(cleanToken);
            setVerifyResult(res);
            if (res.valid) {
                toast.success('Documento y firma auténticos');
            } else {
                toast.error(res.message || 'Firma no válida');
            }
        } catch (error) {
            setVerifyResult(error.response?.data || { valid: false, message: 'El documento o firma no existen en el sistema o fueron alterados.' });
            toast.error('Firma no válida');
        } finally {
            setVerifying(false);
        }
    };

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";
    const labelClass = "block text-xs font-medium text-gray-700 mb-1";

    return (
        <div className="space-y-5 max-w-6xl mx-auto">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Seguridad & Cumplimiento Laboral</p>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Centro de Firmas y Certificación Digital</h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Emita sellos QR para validar documentos al instante o firme legalmente con su firma electrónica oficial (.p12).
                    </p>
                </div>
            </div>

            {/* Guía Rápida Explicativa para Usuarios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-white border border-gray-200 rounded text-xs">
                    <div className="font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[11px]">1</span>
                        Sello con Código QR
                    </div>
                    <p className="text-gray-500 text-[11px]">
                        Ideal para roles de pago, entrega de laptops y certificados. Cualquiera puede escanear el QR con su celular y ver si es original.
                    </p>
                </div>
                <div className="p-3.5 bg-white border border-gray-200 rounded text-xs">
                    <div className="font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[11px]">2</span>
                        Firma Electrónica (.p12)
                    </div>
                    <p className="text-gray-500 text-[11px]">
                        Para contratos y finiquitos legales. Usa tu archivo .p12 (Banco Central, Security Data, etc.) con plena validez jurídica en Ecuador.
                    </p>
                </div>
                <div className="p-3.5 bg-white border border-gray-200 rounded text-xs">
                    <div className="font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-[11px]">3</span>
                        Verificar Autenticidad
                    </div>
                    <p className="text-gray-500 text-[11px]">
                        Comprueba si un documento presentado por un empleado o externo es auténtico o si ha sido modificado.
                    </p>
                </div>
            </div>

            {/* Pestañas de Navegación */}
            <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('QR')}
                    className={`pb-2.5 px-4 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                        activeTab === 'QR'
                            ? 'border-gray-900 text-gray-900 font-bold'
                            : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                >
                    Generar Sello QR para Documento
                </button>
                <button
                    onClick={() => setActiveTab('P12')}
                    className={`pb-2.5 px-4 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                        activeTab === 'P12'
                            ? 'border-gray-900 text-gray-900 font-bold'
                            : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                >
                    Firmar con Firma Electrónica (.p12)
                </button>
                <button
                    onClick={() => setActiveTab('VERIFIER')}
                    className={`pb-2.5 px-4 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                        activeTab === 'VERIFIER'
                            ? 'border-gray-900 text-gray-900 font-bold'
                            : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                >
                    Verificar Documento o QR
                </button>
            </div>

            {/* PESTAÑA 1: SELLO QR */}
            {activeTab === 'QR' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Formulario */}
                    <div className="lg:col-span-7 bg-white border border-gray-200 rounded p-5 text-xs space-y-4">
                        <div>
                            <h2 className="font-semibold text-gray-900 text-sm">
                                Paso 1: Datos del Documento a Sellar
                            </h2>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                Seleccione a quién va dirigido el documento y el sistema generará un sello QR seguro.
                            </p>
                        </div>

                        <form onSubmit={handleGenerateQr} className="space-y-3.5">
                            <div>
                                <label className={labelClass}>Seleccionar Colaborador (Opcional - Llena datos automáticamente)</label>
                                <select
                                    className={inputClass}
                                    value={selectedEmpId}
                                    onChange={e => handleSelectEmployee(e.target.value)}
                                >
                                    <option value="">-- Seleccionar de la lista de colaboradores --</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName} · C.I. {emp.identityCard || 'S/N'} ({emp.department || 'General'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Tipo de Documento *</label>
                                    <select
                                        className={inputClass}
                                        value={qrForm.docType}
                                        onChange={e => setQrForm({ ...qrForm, docType: e.target.value })}
                                    >
                                        {DOC_TYPES.map(d => (
                                            <option key={d.key} value={d.key}>{d.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Número o Código de Referencia</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: ROL-2026-03 o ACTA-045"
                                        className={inputClass + ' font-mono'}
                                        value={qrForm.docId}
                                        onChange={e => setQrForm({ ...qrForm, docId: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Nombre del Colaborador / Titular *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ej. Carlos Mendoza"
                                        className={inputClass}
                                        value={qrForm.signerName}
                                        onChange={e => setQrForm({ ...qrForm, signerName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Cédula de Identidad *</label>
                                    <input
                                        required
                                        type="text"
                                        maxLength={13}
                                        placeholder="17xxxxxxxx"
                                        className={inputClass + ' font-mono'}
                                        value={qrForm.signerId}
                                        onChange={e => setQrForm({ ...qrForm, signerId: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Detalle o Descripción del Documento</label>
                                <textarea
                                    rows="2"
                                    placeholder="Ej: Entrega de computadora portátil Lenovo ThinkPad T14 serie PF4X990 en perfecto estado operativo."
                                    className={inputClass + ' resize-none'}
                                    value={qrForm.content}
                                    onChange={e => setQrForm({ ...qrForm, content: e.target.value })}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Este texto queda protegido por el sello digital y no podrá ser adulterado.</p>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loadingQr}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    {loadingQr ? 'Generando Sello...' : 'Generar Sello y Código QR'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Visor de Sello QR */}
                    <div className="lg:col-span-5 bg-white border border-gray-200 rounded p-5 text-xs flex flex-col justify-between">
                        <div>
                            <div className="border-b border-gray-100 pb-2 mb-4">
                                <h3 className="font-semibold text-gray-900 text-sm">
                                    Paso 2: Código QR Listo para Usar
                                </h3>
                                <p className="text-[11px] text-gray-400 mt-0.5">Puedes descargarlo para imprimirlo en el documento o compartir el enlace.</p>
                            </div>

                            {qrResult ? (
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded">
                                        <img
                                            src={qrResult.qrDataUrl}
                                            alt="Código QR de Firma"
                                            className="w-44 h-44 border border-gray-300 rounded bg-white p-2 shadow-xs"
                                        />
                                        <p className="text-[10px] text-gray-500 font-mono mt-2 text-center">
                                            Escanear con la cámara del celular para verificar
                                        </p>
                                    </div>

                                    <div className="space-y-2 text-[11px]">
                                        <div className="flex justify-between border-b border-gray-100 pb-1">
                                            <span className="text-gray-500">Código Oficial:</span>
                                            <span className="font-mono font-bold text-gray-900">{qrResult.verificationCode}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-1">
                                            <span className="text-gray-500">Colaborador:</span>
                                            <span className="font-semibold text-gray-900">{qrResult.payload.signerName}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-1">
                                            <span className="text-gray-500">Cédula:</span>
                                            <span className="font-mono text-gray-800">{qrResult.payload.signerId}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-1">
                                            <span className="text-gray-500">Fecha de Emisión:</span>
                                            <span className="text-gray-800">{new Date(qrResult.payload.timestamp).toLocaleString('es-EC')}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-16 text-center text-gray-400">
                                    <FiLock size={28} className="mx-auto mb-2 text-gray-300" />
                                    <p className="text-xs font-semibold text-gray-700">Aún no has generado ningún sello</p>
                                    <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                                        Completa los datos del formulario a la izquierda y presiona "Generar Sello" para ver el código QR aquí.
                                    </p>
                                </div>
                            )}
                        </div>

                        {qrResult && (
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                                <button
                                    onClick={() => copyToClipboard(qrResult.verificationUrl, 'Enlace de verificación')}
                                    className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <FiCopy size={12} />
                                    <span>Copiar Enlace</span>
                                </button>
                                <a
                                    href={qrResult.qrDataUrl}
                                    download={`Sello_QR_${qrResult.payload.signerName.replace(/\s+/g, '_')}.png`}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                >
                                    <FiDownload size={12} />
                                    <span>Descargar Imagen QR</span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PESTAÑA 2: FIRMA ELECTRÓNICA .P12 */}
            {activeTab === 'P12' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Cargar Certificado .P12 */}
                    <div className="lg:col-span-5 bg-white border border-gray-200 rounded p-5 text-xs space-y-4">
                        <div>
                            <h2 className="font-semibold text-gray-900 text-sm">
                                Paso 1: Tu Archivo de Firma (.p12 / .pfx)
                            </h2>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                Emplea tu certificado digital emitido por Security Data, Banco Central del Ecuador, ANF o UANATACA.
                            </p>
                        </div>

                        <form onSubmit={handleInspectP12} className="space-y-3">
                            <div>
                                <label className={labelClass}>Archivo de Firma Digital (.p12 o .pfx) *</label>
                                <input
                                    type="file"
                                    accept=".p12,.pfx"
                                    required
                                    onChange={e => setP12File(e.target.files[0])}
                                    className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:text-xs file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Contraseña de tu Firma Electrónica *</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="Contraseña de 4 a 12 caracteres..."
                                    className={inputClass}
                                    value={p12Password}
                                    onChange={e => setP12Password(e.target.value)}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Por tu seguridad, la contraseña no se almacena en el servidor.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={inspecting}
                                className="w-full px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {inspecting ? 'Validando...' : 'Cargar y Comprobar Firma'}
                            </button>
                        </form>

                        {/* Metadatos Claros del Certificado */}
                        {p12Inspection && (
                            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded space-y-2 text-[11px]">
                                <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                                    <span className="font-semibold text-emerald-950 flex items-center gap-1">
                                        <FiCheckCircle size={13} className="text-emerald-600" /> Firma Lista para Usar
                                    </span>
                                    <span className="font-mono text-[10px] text-emerald-800 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                                        {p12Inspection.validity.daysRemaining} días vigentes
                                    </span>
                                </div>

                                <div>
                                    <span className="text-gray-500 block">Titular de la Firma:</span>
                                    <span className="font-bold text-gray-900">{p12Inspection.signer.fullName}</span>
                                </div>

                                <div>
                                    <span className="text-gray-500 block">Cédula / RUC:</span>
                                    <span className="font-mono text-gray-800">{p12Inspection.signer.identityNumber || 'Identificación registrada'}</span>
                                </div>

                                <div>
                                    <span className="text-gray-500 block">Entidad Emisora:</span>
                                    <span className="font-medium text-gray-800">{p12Inspection.issuer.caName}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Firmar Documento */}
                    <div className="lg:col-span-7 bg-white border border-gray-200 rounded p-5 text-xs space-y-4">
                        <div>
                            <h2 className="font-semibold text-gray-900 text-sm">
                                Paso 2: Documento que deseas Firmar
                            </h2>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                El sistema estampará tu firma electrónica oficial con valor legal en el Ecuador.
                            </p>
                        </div>

                        <form onSubmit={handleSignWithP12} className="space-y-3.5">
                            <div>
                                <label className={labelClass}>Título del Documento *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej. Acta de Finiquito Laboral o Contrato de Trabajo"
                                    className={inputClass}
                                    value={p12SignForm.documentName}
                                    onChange={e => setP12SignForm({ ...p12SignForm, documentName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Motivo o Razón de la Firma</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Firma de Aprobación y Conformidad Legal"
                                    className={inputClass}
                                    value={p12SignForm.reason}
                                    onChange={e => setP12SignForm({ ...p12SignForm, reason: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Detalle o Contenido a Firmar *</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Escribe el resumen o texto del documento (ej. Se aprueba la liquidación del colaborador Carlos Mendoza por el valor de $1,250.00 USD)..."
                                    className={inputClass + ' resize-none'}
                                    value={p12SignForm.documentContent}
                                    onChange={e => setP12SignForm({ ...p12SignForm, documentContent: e.target.value })}
                                />
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={signingP12 || !p12File || !p12Password}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    {signingP12 ? 'Firmando Documento...' : 'Firmar Documento Oficialmente'}
                                </button>
                            </div>
                        </form>

                        {/* Comprobante de Firma */}
                        {p12SignResult && (
                            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded space-y-2 text-[11px] mt-4">
                                <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                                        <FiCheckCircle className="text-emerald-700" size={15} /> Documento Firmado Exitosamente
                                    </span>
                                    <span className="font-mono text-[10px] text-emerald-800 font-semibold">{p12SignResult.signatureId}</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-gray-500 block">Firmado Por:</span>
                                        <span className="font-semibold text-gray-900">{p12SignResult.signer.fullName}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Fecha y Hora:</span>
                                        <span className="text-gray-900">{new Date(p12SignResult.signedAt).toLocaleString('es-EC')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PESTAÑA 3: VERIFICADOR UNIVERSAL */}
            {activeTab === 'VERIFIER' && (
                <div className="bg-white border border-gray-200 rounded p-6 text-xs space-y-4 max-w-3xl mx-auto">
                    <div className="border-b border-gray-100 pb-3">
                        <h2 className="font-semibold text-gray-900 text-sm">
                            Comprobar si un Documento es Legítimo
                        </h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            Pega el enlace web del código QR o el código de verificación (ej. <span className="font-mono">SIG-A1B2C3D4-5678</span>) para verificar su validez.
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-3.5">
                        <div>
                            <label className={labelClass}>Enlace o Código de Verificación del QR *</label>
                            <input
                                required
                                type="text"
                                placeholder="Pega aquí el enlace del QR o el código..."
                                className={inputClass}
                                value={verifyInput}
                                onChange={e => setVerifyInput(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={verifying}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            {verifying ? 'Comprobando...' : 'Comprobar Validez'}
                        </button>
                    </form>

                    {verifyResult && (
                        <div className={`p-4 rounded border text-xs space-y-2 mt-4 ${
                            verifyResult.valid
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                : 'bg-red-50/60 border-red-200 text-red-950'
                        }`}>
                            <div className="flex items-center gap-2 font-bold">
                                {verifyResult.valid ? <FiCheckCircle className="text-emerald-700" size={16} /> : <FiAlertCircle className="text-red-700" size={16} />}
                                <span>{verifyResult.message}</span>
                            </div>

                            {verifyResult.valid && verifyResult.signer && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-emerald-200/60">
                                    <div>
                                        <span className="text-gray-500 block">Titular Firmante:</span>
                                        <span className="font-bold text-gray-900">{verifyResult.signer.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Cédula / RUC:</span>
                                        <span className="font-mono text-gray-800">{verifyResult.signer.id}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Empresa Emisora:</span>
                                        <span className="font-medium text-gray-800">{verifyResult.signer.issuer}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Fecha y Hora de Firma:</span>
                                        <span className="text-gray-800">{new Date(verifyResult.signedAt).toLocaleString('es-EC')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DigitalSignatureCenter;
