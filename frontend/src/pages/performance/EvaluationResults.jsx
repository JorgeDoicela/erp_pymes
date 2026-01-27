import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvaluationResults } from '../../services/evaluation.service';
import { FiDownload, FiArrowLeft, FiStar, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
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

    if (loading) return <div className="p-8 text-white">Cargando resultados...</div>;
    if (!data) return null;

    const { evaluation, results, overallScore, feedback } = data;
    const { template, employee } = evaluation;

    // Transform results for Chart
    const chartData = results.map(r => ({
        subject: r.criteria,
        A: r.score,
        fullMark: r.maxScore
    }));

    // Strengths and Improvements
    const sortedResults = [...results].sort((a, b) => b.score - a.score);
    const strengths = sortedResults.slice(0, 3).filter(r => r.score >= (r.maxScore * 0.7)); // Top 3 and > 70%
    const improvements = sortedResults.slice(-3).reverse().filter(r => r.score < (r.maxScore * 0.7)); // Bottom 3 and < 70%

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-white">
                        <FiArrowLeft className="mr-2" /> Volver
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <FiDownload className="mr-2" /> Descargar PDF
                    </button>
                </div>

                {/* Printable Area */}
                <div ref={printRef} className="bg-white text-gray-900 rounded-xl p-8 shadow-xl">
                    <header className="border-b-2 border-gray-200 pb-6 mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Informe de Resultados</h1>
                            <h2 className="text-xl text-blue-600 font-semibold">{template.title}</h2>
                            <p className="text-gray-500">Periodo: {template.period}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Empleado Evaluado</p>
                            <p className="text-xl font-bold">{employee.firstName} {employee.lastName}</p>
                            <p className="text-gray-600">{employee.position} - {employee.department}</p>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* Score Card */}
                        <div className="col-span-1 bg-gray-50 rounded-xl p-6 text-center border border-gray-100 flex flex-col justify-center items-center">
                            <h3 className="text-gray-500 font-medium mb-2 uppercase tracking-wide">Puntaje Global</h3>
                            <div className="text-6xl font-black text-blue-600 mb-2">{overallScore}</div>
                            <div className="text-sm text-gray-400">Promedio General</div>
                        </div>

                        {/* Charts */}
                        <div className="col-span-2 h-80">
                            <h3 className="text-gray-700 font-bold mb-4">Radar de Competencias</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis />
                                    <Radar name="Puntaje" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
                            <div className="bg-green-50 p-4 border-b border-green-100 flex items-center justify-between">
                                <h3 className="flex items-center text-green-800 font-bold">
                                    <FiStar className="mr-2" /> Top Fortalezas
                                </h3>
                                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">Top 3</span>
                            </div>
                            <div className="p-6 space-y-4">
                                {strengths.length > 0 ? strengths.map((s, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm font-medium mb-1">
                                            <span className="text-gray-700">{s.criteria}</span>
                                            <span className="text-green-600 font-bold">{s.score}/{s.maxScore}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(s.score / s.maxScore) * 100}%` }}></div>
                                        </div>
                                    </div>
                                )) : <p className="text-gray-400 italic text-center py-4">No hay fortalezas destacadas.</p>}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
                            <div className="bg-orange-50 p-4 border-b border-orange-100 flex items-center justify-between">
                                <h3 className="flex items-center text-orange-800 font-bold">
                                    <FiTrendingUp className="mr-2" /> Oportunidades de Mejora
                                </h3>
                                <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full font-bold">Bottom 3</span>
                            </div>
                            <div className="p-6 space-y-4">
                                {improvements.length > 0 ? improvements.map((s, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm font-medium mb-1">
                                            <span className="text-gray-700">{s.criteria}</span>
                                            <span className="text-orange-600 font-bold">{s.score}/{s.maxScore}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                                            <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${(s.score / s.maxScore) * 100}%` }}></div>
                                        </div>
                                    </div>
                                )) : <p className="text-gray-400 italic text-center py-4">No hay áreas críticas.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Full Category Breakdown */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Desglose por Competencia</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sortedResults.map((r, idx) => (
                                <div key={idx} className="bg-white border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex-1 mr-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-gray-700">{r.criteria}</span>
                                            <span className="font-bold text-blue-600">{r.score}/{r.maxScore}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${r.score >= (r.maxScore * 0.8) ? 'bg-green-500' : (r.score >= (r.maxScore * 0.6) ? 'bg-blue-500' : 'bg-orange-500')}`}
                                                style={{ width: `${(r.score / r.maxScore) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Feedback */}
                    <div className="mt-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Retroalimentación Detallada</h3>
                        {feedback.length > 0 ? (
                            <div className="space-y-6">
                                {feedback.map((f, idx) => (
                                    <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-gray-700">{f.reviewerName}</span>
                                            {f.score && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">Score: {f.score.toFixed(1)}</span>}
                                        </div>
                                        <p className="text-gray-600 italic">"{f.comments}"</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No hay comentarios registrados.</p>
                        )}
                    </div>

                    <div className="mt-12 text-center text-gray-400 text-xs border-t pt-4">
                        Generado por EMPLIFI - Sistema de Gestión de Recursos Humanos
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvaluationResults;
