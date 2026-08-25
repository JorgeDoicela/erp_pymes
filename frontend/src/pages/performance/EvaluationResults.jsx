import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvaluationResults } from '../../services/evaluation.service';
import { FiDownload, FiArrowLeft, FiStar, FiTrendingUp, FiInfo, FiClock, FiCheckCircle } from 'react-icons/fi';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const EvaluationResults = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getEvaluationResults(id);
                setData(result);
            } catch (error) {
                console.error(error);
                alert("No se pudieron cargar los resultados");
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleDownloadPDF = async () => {
        const element = printRef.current;
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Resultados_Evaluacion_${id}.pdf`);
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-mono text-xs">Cargando resultados...</div>;
    if (!data) return null;

    const { evaluation, results, overallScore, feedback } = data;
    const { template, employee, reviewers = [] } = evaluation;

    const completedReviewersCount = reviewers.filter(r => r.status === 'COMPLETED').length;
    const totalReviewersCount = reviewers.length;
    const hasResponses = completedReviewersCount > 0 || results.some(r => r.score > 0);

    const maxScale = results[0]?.maxScore || 100;

    // Transform results for Chart
    const chartData = results.map(r => ({
        subject: r.criteria,
        A: r.score,
        fullMark: r.maxScore
    }));

    // Strengths and Improvements (only if has responses)
    const sortedResults = [...results].sort((a, b) => b.score - a.score);
    const strengths = hasResponses 
        ? sortedResults.slice(0, 3).filter(r => r.score >= (r.maxScore * 0.7) && r.score > 0)
        : [];
    const improvements = hasResponses 
        ? sortedResults.slice(-3).reverse().filter(r => r.score < (r.maxScore * 0.7) && r.score > 0)
        : [];

    return (
        <div className="space-y-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium text-xs">
                        <FiArrowLeft className="mr-1.5" /> Volver
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors shadow-xs font-medium cursor-pointer"
                    >
                        <FiDownload className="mr-1.5" /> Descargar PDF
                    </button>
                </div>

                {/* Printable Area */}
                <div ref={printRef} className="bg-white text-gray-800 rounded border border-gray-200 p-8 shadow-xs">
                    <header className="border-b border-gray-200 pb-5 mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono">
                                    Desempeño y Talento
                                </span>
                                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded font-mono border ${
                                    hasResponses 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                    {hasResponses ? 'Evaluación Calificada' : 'Evaluación En Proceso'}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Informe de Resultados</h1>
                            <h2 className="text-sm text-blue-600 font-semibold mt-0.5">{template.title}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Período: {template.period}</p>
                        </div>
                        <div className="sm:text-right">
                            <p className="text-xs text-gray-500">Colaborador Evaluado</p>
                            <p className="text-lg font-bold text-gray-900">{employee.firstName} {employee.lastName}</p>
                            <p className="text-xs text-gray-600">{employee.position} · {employee.department}</p>
                        </div>
                    </header>

                    {/* Banner de Estado si no se han completado evaluaciones */}
                    {!hasResponses && (
                        <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200 rounded flex items-start gap-3 text-xs text-amber-900">
                            <FiClock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Evaluación en proceso de recolección de respuestas ({completedReviewersCount} de {totalReviewersCount} evaluadores han completado).</p>
                                <p className="text-amber-700 mt-0.5">
                                    Los puntajes consolidados, el gráfico de radar de competencias y los desgloses se generarán automáticamente una vez que los evaluadores completen sus formularios.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Score Card */}
                        <div className="col-span-1 bg-gray-50 rounded p-6 text-center border border-gray-200 flex flex-col justify-center items-center">
                            <h3 className="text-gray-500 font-semibold text-xs uppercase tracking-wider mb-2">Puntaje Global</h3>
                            <div className="text-5xl font-black text-blue-600 mb-1 tracking-tight font-mono">
                                {hasResponses ? overallScore : '—'}
                            </div>
                            <div className="text-xs text-gray-500">
                                {hasResponses ? `Promedio Ponderado / ${maxScale}` : 'Sin calificaciones registradas'}
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="col-span-2 h-72">
                            <h3 className="text-gray-900 font-semibold text-xs uppercase tracking-wider mb-3">Radar de Competencias</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 11 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, maxScale]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                    <Radar name="Puntaje" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.4} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e5e7eb', fontSize: '11px' }} itemStyle={{ color: '#111827' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded border border-emerald-200 overflow-hidden">
                            <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between">
                                <h3 className="flex items-center text-emerald-900 font-semibold text-xs">
                                    <FiStar className="mr-1.5 text-emerald-700" /> Top Fortalezas
                                </h3>
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-semibold">Top 3</span>
                            </div>
                            <div className="p-5 space-y-3.5">
                                {strengths.length > 0 ? strengths.map((s, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-xs font-medium mb-1">
                                            <span className="text-gray-800">{s.criteria}</span>
                                            <span className="text-emerald-700 font-mono font-bold">{s.score}/{s.maxScore}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${(s.score / s.maxScore) * 100}%` }}></div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-gray-400 text-xs italic text-center py-3">
                                        {hasResponses ? 'No hay fortalezas destacadas.' : 'Pendiente de evaluación.'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded border border-amber-200 overflow-hidden">
                            <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100 flex items-center justify-between">
                                <h3 className="flex items-center text-amber-900 font-semibold text-xs">
                                    <FiTrendingUp className="mr-1.5 text-amber-700" /> Oportunidades de Mejora
                                </h3>
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-semibold">Prioritarias</span>
                            </div>
                            <div className="p-5 space-y-3.5">
                                {improvements.length > 0 ? improvements.map((s, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-xs font-medium mb-1">
                                            <span className="text-gray-800">{s.criteria}</span>
                                            <span className="text-amber-800 font-mono font-bold">{s.score}/{s.maxScore}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(s.score / s.maxScore) * 100}%` }}></div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-gray-400 text-xs italic text-center py-3">
                                        {hasResponses ? 'No se identificaron áreas críticas.' : 'Pendiente de evaluación.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Desglose por Competencia */}
                    <div className="mb-8">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-100 pb-1.5">
                            Desglose de Competencias
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {sortedResults.map((r, idx) => (
                                <div key={idx} className="bg-white border border-gray-200 rounded p-3.5 flex items-center justify-between">
                                    <div className="flex-1 mr-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-gray-800 text-xs">{r.criteria}</span>
                                            <span className="font-mono font-bold text-blue-700 text-xs">
                                                {hasResponses ? `${r.score}/${r.maxScore}` : `—/${r.maxScore}`}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full ${
                                                    !hasResponses 
                                                        ? 'bg-gray-200' 
                                                        : r.score >= (r.maxScore * 0.8) 
                                                            ? 'bg-emerald-600' 
                                                            : r.score >= (r.maxScore * 0.6) 
                                                                ? 'bg-blue-600' 
                                                                : 'bg-amber-500'
                                                }`}
                                                style={{ width: `${hasResponses ? (r.score / r.maxScore) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Retroalimentación Detallada */}
                    <div className="mt-8 pt-4 border-t border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Retroalimentación y Observaciones
                        </h3>
                        {feedback.length > 0 ? (
                            <div className="space-y-3">
                                {feedback.map((f, idx) => (
                                    <div key={idx} className="bg-gray-50 p-4 rounded border border-gray-200 text-xs">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="font-semibold text-gray-900">{f.reviewerName}</span>
                                            {f.score && <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold">Puntaje: {f.score.toFixed(1)}</span>}
                                        </div>
                                        <p className="text-gray-600 italic">"{f.comments}"</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic text-xs">
                                {hasResponses ? 'No se registraron comentarios adicionales.' : 'Sin retroalimentación registrada aún.'}
                            </p>
                        )}
                    </div>

                    <div className="mt-8 text-center text-gray-400 text-[11px] border-t border-gray-100 pt-3 font-mono">
                        Generado por Emplifi · Plataforma de Gestión de Talento Humano
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvaluationResults;
