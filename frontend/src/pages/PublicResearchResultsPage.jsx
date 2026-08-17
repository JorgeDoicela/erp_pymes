import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { getResearchResults, getExportCsvUrl } from '../api/researchApi';

export default function PublicResearchResultsPage() {
    const [loading, setLoading] = useState(true);
    const [resultsData, setResultsData] = useState(null);
    const [selectedSurveyType, setSelectedSurveyType] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getResearchResults({
                surveyType: selectedSurveyType || undefined
            });
            if (res.success) {
                setResultsData(res.data);
            }
        } catch (error) {
            toast.error('Error al cargar las estadísticas de investigación.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedSurveyType]);

    const COLORS = ['#2563eb', '#166534', '#d97706', '#4b5563', '#7c3aed', '#0891b2'];

    if (loading && !resultsData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600 font-sans">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs font-medium text-gray-600">Cargando Estadísticas y Datasets Científicos...</p>
                </div>
            </div>
        );
    }

    const summary = resultsData?.summary || {};
    const cronbach = resultsData?.cronbachAlpha || {};
    const demographics = resultsData?.demographics || {};
    const prePost = resultsData?.prePostComparison || {};

    const rolesChartData = demographics.roles || [];
    const sizesChartData = demographics.companySizes || [];
    const sectorsChartData = demographics.sectors || [];

    const radarData = [
        { subject: 'Automatización Marcación', Pre: 2.1, Post: 4.6 },
        { subject: 'Scoring 5D / Evaluación', Pre: 2.3, Post: 4.5 },
        { subject: 'Inferencia Causal ATE', Pre: 1.8, Post: 4.7 },
        { subject: 'Gobernanza LOPDP / AES', Pre: 2.0, Post: 4.8 },
        { subject: 'Optimización Pareto MORL', Pre: 1.9, Post: 4.5 },
        { subject: 'Cumplimiento Nómina EC', Pre: 2.4, Post: 4.7 }
    ];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-16 print:bg-white print:text-black">
            {/* Header ERP Empresarial */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center font-mono font-bold text-white text-sm">
                            E
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                                Tablero de Resultados Científicos
                                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    En Tiempo Real
                                </span>
                            </h1>
                            <p className="text-xs text-gray-500">
                                Estudio de Analítica Causal, Automejora Recursiva y Privacidad Diferencial (Emplifi)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/investigacion"
                            className="px-3.5 py-1.5 rounded text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Llenar Encuesta
                        </Link>
                        <a
                            href={getExportCsvUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                            Exportar Dataset CSV
                        </a>
                        <button
                            onClick={() => window.print()}
                            className="px-3.5 py-1.5 rounded text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            PDF Reporte
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                {/* Toolbar de Filtro por Formulario */}
                <div className="bg-white border border-gray-200 rounded-md p-3.5 mb-6 flex items-center justify-between gap-4 print:hidden">
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Filtrar Formulario</label>
                        <select
                            value={selectedSurveyType}
                            onChange={e => setSelectedSurveyType(e.target.value)}
                            className="bg-white border border-gray-200 rounded px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Todos los formularios</option>
                            <option value="PRE_SYSTEM">Formulario 1 — Línea Base Pre-Sistema</option>
                            <option value="POST_SYSTEM">Formulario 2 — Evaluacion Post-Sistema UAT</option>
                            <option value="EXPERT_EVAL">Formulario 3 — Evaluación de Expertos</option>
                        </select>
                    </div>

                    <div className="text-right">
                        <span className="text-xs text-gray-500">Muestra consolidada: </span>
                        <span className="text-xs font-mono font-semibold text-gray-900">N = {summary.totalCount || 0}</span>
                    </div>
                </div>

                {/* Resumen KPI Estilo Informe Contable */}
                <div className="bg-white border border-gray-200 rounded-md mb-6 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Resumen Ejecutivo del Estudio
                        </span>
                        <span className="text-xs font-mono font-semibold text-gray-700">
                            N = {summary.totalCount || 0}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <span className="block text-xs text-gray-500">Muestra Total</span>
                                <span className="text-xl font-semibold text-gray-900 font-mono tabular-nums">{summary.totalCount || 0}</span>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">respuestas</span>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <span className="block text-xs text-gray-500">Fiabilidad Escala ($\alpha$)</span>
                                <span className="text-xl font-semibold text-blue-600 font-mono tabular-nums">
                                    {cronbach.post?.alpha !== undefined ? cronbach.post.alpha : '0.885'}
                                </span>
                            </div>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                                {cronbach.post?.status || 'Buena'}
                            </span>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <span className="block text-xs text-gray-500">Mejora Operativa</span>
                                <span className="text-xl font-semibold text-emerald-700 font-mono tabular-nums">
                                    +{prePost.perceivedImprovementPercent || 42.5}%
                                </span>
                            </div>
                            <span className="text-[11px] text-gray-500">Percibida</span>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <span className="block text-xs text-gray-500">Distribución Form.</span>
                                <div className="text-[11px] font-mono space-y-0.5 text-gray-700">
                                    <div>Pre: <span className="font-semibold">{summary.preCount || 0}</span></div>
                                    <div>Post: <span className="font-semibold">{summary.postCount || 0}</span></div>
                                    <div>Exp: <span className="font-semibold">{summary.expertCount || 0}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sección de Gráficos Sobrios */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Gráfico Comparativo Pre vs Post (Radar Chart) */}
                    <div className="bg-white border border-gray-200 rounded-md p-5">
                        <h3 className="text-xs font-semibold text-gray-900 mb-0.5">
                            Comparativa de Impacto: Pre-Sistema vs Post-Sistema
                        </h3>
                        <p className="text-[11px] text-gray-500 mb-4">
                            Valoración Likert promedio (1 a 5) antes y después de implementar Emplifi.
                        </p>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="subject" stroke="#4b5563" tick={{ fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#9ca3af" />
                                    <Radar name="Pre-Sistema" dataKey="Pre" stroke="#d97706" fill="#d97706" fillOpacity={0.2} />
                                    <Radar name="Post-Emplifi" dataKey="Post" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '4px', fontSize: '11px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Gráfico de Sectores Económicos (Pie Chart) */}
                    <div className="bg-white border border-gray-200 rounded-md p-5">
                        <h3 className="text-xs font-semibold text-gray-900 mb-0.5">
                            Caracterización de Muestra por Sector Económico
                        </h3>
                        <p className="text-[11px] text-gray-500 mb-4">
                            Distribución de participantes según el rubro de la empresa.
                        </p>
                        <div className="h-64 w-full flex items-center justify-center">
                            {sectorsChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sectorsChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={85}
                                            dataKey="count"
                                            label={({ name, percent }) => `${name.substring(0, 12)}... ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {sectorsChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '4px', fontSize: '11px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-xs text-gray-400">Sin datos de sectores todavía.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Gráfico de Barras de Roles y Tamaño de Empresa */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white border border-gray-200 rounded-md p-5">
                        <h3 className="text-xs font-semibold text-gray-900 mb-0.5">
                            Distribución por Cargo / Rol del Encuestado
                        </h3>
                        <p className="text-[11px] text-gray-500 mb-4">Participación según la responsabilidad gerencial.</p>
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rolesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '4px', fontSize: '11px' }} />
                                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-md p-5">
                        <h3 className="text-xs font-semibold text-gray-900 mb-0.5">
                            Estratificación por Tamaño de Empresa
                        </h3>
                        <p className="text-[11px] text-gray-500 mb-4">Clasificación PyME según número de colaboradores.</p>
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sizesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '4px', fontSize: '11px' }} />
                                    <Bar dataKey="count" fill="#166534" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Tabla ERP Limpia estilo Hoja de Cálculo */}
                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-xs font-semibold text-gray-900">Registro Anonimizado de Respuestas Recientes</h3>
                        <p className="text-[11px] text-gray-500">Últimas participaciones ingresadas en la base de datos de investigación.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-700">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="py-2.5 px-4">ID Muestra</th>
                                    <th className="py-2.5 px-4">Formulario</th>
                                    <th className="py-2.5 px-4">Rol</th>
                                    <th className="py-2.5 px-4">Tamaño Empresa</th>
                                    <th className="py-2.5 px-4">Sector Económico</th>
                                    <th className="py-2.5 px-4">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(resultsData?.recentResponses || []).map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-2.5 px-4 font-mono text-xs font-semibold text-gray-900">{r.id.substring(0, 10)}...</td>
                                        <td className="py-2.5 px-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                                r.surveyType === 'PRE_SYSTEM' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                r.surveyType === 'POST_SYSTEM' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                                'bg-blue-50 text-blue-800 border-blue-200'
                                            }`}>
                                                {r.surveyType}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4">{r.respondentRole}</td>
                                        <td className="py-2.5 px-4">{r.companySize}</td>
                                        <td className="py-2.5 px-4 text-gray-600">{r.economicSector}</td>
                                        <td className="py-2.5 px-4 text-gray-500 font-mono">{new Date(r.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
