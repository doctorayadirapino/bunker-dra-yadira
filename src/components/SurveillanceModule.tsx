import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileBarChart, Download, TrendingUp, Users, AlertCircle, FileText, PieChart as PieIcon, BarChart as BarIcon } from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer
} from 'recharts';
import { generarReporteVigilanciaPDF, generarListadoEmpresaPDF } from '../services/pdfService';

export default function SurveillanceModule({
    selectedCompanyProp
}: {
    selectedCompanyProp: string;
}) {
    const [loading, setLoading] = useState(true);
    const [empresas, setEmpresas] = useState<any[]>([]);
    const selectedEmpresa = selectedCompanyProp; // Vinculamos localmente para no romper lógica existente
    const [analytics, setAnalytics] = useState<any>(null);
    const [downloading, setDownloading] = useState(false);
    const [rawConsultas, setRawConsultas] = useState<any[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (empresas.length > 0) {
            calculateSurveillance();
        }
    }, [selectedEmpresa, empresas]);

    const fetchInitialData = async () => {
        setLoading(true);
        const { data: empData } = await supabase.from('empresas').select('*');
        if (empData) setEmpresas(empData);
        setLoading(false);
    };

    const calculateSurveillance = async () => {
        setLoading(true);
        try {
            let query = supabase.from('consultas').select('*, pacientes(*), empresas(*)');

            const { data, error } = await query;
            if (error || !data) {
                setLoading(false);
                return;
            }
            setRawConsultas(data);

            const filtered = selectedEmpresa === 'GENERAL'
                ? data
                : data.filter(c => c.empresas?.nombre === selectedEmpresa);

            // --- LÓGICA DE PROCESAMIENTO BI ---
            const patMap: Record<string, number> = {};
            const typeMap: Record<string, number> = {};
            let mCount = 0, fCount = 0;
            const demoMap: Record<string, any> = {
                '18-25': { group: '18-25', Masc: 0, Fem: 0 },
                '26-35': { group: '26-35', Masc: 0, Fem: 0 },
                '36-45': { group: '36-45', Masc: 0, Fem: 0 },
                '46-55': { group: '46-55', Masc: 0, Fem: 0 },
                '55+': { group: '55+', Masc: 0, Fem: 0 }
            };

            let totalReposodays = 0;
            const uniquePatients = new Set();

            filtered.forEach(row => {
                uniquePatients.add(row.paciente_id);
                totalReposodays += row.dias_reposo || 0;
                patMap[row.tipo_patologia] = (patMap[row.tipo_patologia] || 0) + 1;
                typeMap[row.tipo_consulta] = (typeMap[row.tipo_consulta] || 0) + 1;

                if (row.pacientes?.sexo === 'Masculino') mCount++; else fCount++;

                // Demografía
                let age = 30; // Default
                if (row.pacientes?.fecha_nacimiento) {
                    const birth = new Date(row.pacientes.fecha_nacimiento);
                    age = new Date().getFullYear() - birth.getFullYear();
                }
                let group = '55+';
                if (age < 26) group = '18-25';
                else if (age < 36) group = '26-35';
                else if (age < 46) group = '36-45';
                else if (age < 56) group = '46-55';

                if (row.pacientes?.sexo === 'Masculino') demoMap[group].Masc++; else demoMap[group].Fem++;
            });

            const stats = {
                totalPatients: uniquePatients.size || 0,
                totalConsultations: filtered.length || 0,
                absenteeismRate: uniquePatients.size > 0
                    ? ((totalReposodays / (uniquePatients.size * 20)) * 100).toFixed(2)
                    : "0.00",
                genderData: [
                    { name: 'Masculino', value: mCount, color: '#3b82f6' },
                    { name: 'Femenino', value: fCount, color: '#0bdada' }
                ],
                topPathologies: Object.entries(patMap).length > 0
                    ? Object.entries(patMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10)
                    : [],
                consultationTypes: Object.entries(typeMap).length > 0
                    ? Object.entries(typeMap).map(([name, value]) => ({ name, value }))
                    : [],
                demographics: Object.values(demoMap)
            };

            setAnalytics(stats);
            setLoading(false);
        } catch (err) {
            console.error('CRITICAL ERROR CALCULATING BI:', err);
            setLoading(false);
        }
    };

    const handleDownloadReport = async () => {
        if (!analytics) return;

        console.log('--- INICIANDO GENERACIÓN DE REPORTE VIGILANCIA (VERSIÓN LIMPIA) ---');
        const conFirma = window.confirm("¿Desea incluir la FIRMA DIGITAL en el Resumen Estadístico?\n\n• [Aceptar]: Para enviar por correo corporativo o WhatsApp.\n• [Cancelar]: Para imprimir y sellar físicamente.");

        setDownloading(true);
        try {
            await generarReporteVigilanciaPDF({
                companyName: selectedEmpresa,
                month: new Date().toLocaleDateString('es-VE', { month: 'long', year: 'numeric' }).toUpperCase(),
                stats: analytics,
                conFirmaDigital: conFirma
            });
            console.log('--- REPORTE GENERADO EXITOSAMENTE (SIN GRÁFICOS) ---');
        } catch (error) {
            console.error('Error in handleDownloadReport:', error);
            alert('Error al generar el PDF. Revise la consola para más detalles.');
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadList = async () => {
        setDownloading(true);
        try {
            const listData = selectedEmpresa === 'GENERAL'
                ? rawConsultas
                : rawConsultas.filter(c => c.empresas?.nombre === selectedEmpresa);

            await generarListadoEmpresaPDF(selectedEmpresa, listData);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div style={{ padding: '20px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 700 }}>Vigilancia Epidemiológica</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Análisis estadístico de salud ocupacional (LOPCYMAT)</p>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    {/* Filtro Maestro ya existe en el Header de App.tsx, lo removemos de aquí para evitar duplicidad */}

                    <button
                        onClick={handleDownloadReport}
                        disabled={loading || downloading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: downloading ? 'var(--text-secondary)' : 'var(--corporate-blue)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 600, cursor: (loading || downloading) ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', opacity: (loading || downloading) ? 0.7 : 1 }}
                    >
                        {downloading ? "Procesando..." : (
                            selectedEmpresa === 'GENERAL'
                                ? <><Download size={18} /> Reporte Consolidado (Global)</>
                                : <><Download size={18} /> Resumen: {selectedEmpresa}</>
                        )}
                    </button>

                    <button
                        onClick={handleDownloadList}
                        disabled={loading || downloading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: downloading ? 'var(--text-secondary)' : 'var(--medical-turquoise)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 600, cursor: (loading || downloading) ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', opacity: (loading || downloading) ? 0.7 : 1 }}
                    >
                        {downloading ? "Buscando..." : (
                            selectedEmpresa === 'GENERAL'
                                ? <><FileText size={18} /> Listado Maestro de Consultas</>
                                : <><FileText size={18} /> Listado: {selectedEmpresa}</>
                        )}
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: 'var(--corporate-blue)' }}>Procesando inteligencia epidemiológica...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {/* KPI CARDS */}
                    <div className="stat-card" style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '15px', color: 'var(--corporate-blue)' }}>
                            <Users size={30} />
                        </div>
                        <div>
                            <small style={{ color: 'var(--text-secondary)', display: 'block' }}>Población Evaluada</small>
                            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{analytics?.totalPatients}</span>
                        </div>
                    </div>

                    <div className="stat-card" style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '15px', color: 'var(--success)' }}>
                            <TrendingUp size={30} />
                        </div>
                        <div>
                            <small style={{ color: 'var(--text-secondary)', display: 'block' }}>Índice de Ausentismo</small>
                            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{analytics?.absenteeismRate}%</span>
                        </div>
                    </div>

                    <div className="stat-card" style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '15px', color: 'var(--danger)' }}>
                            <AlertCircle size={30} />
                        </div>
                        <div>
                            <small style={{ color: 'var(--text-secondary)', display: 'block' }}>Total Consultas</small>
                            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{analytics?.totalConsultations}</span>
                        </div>
                    </div>

                    {/* GRÁFICAS INTEGRADAS EN VIGILANCIA (SUJETAS A CAPTURA) */}
                    <div id="gender-pie" style={{ gridColumn: '1 / span 1', background: 'var(--bg-secondary)', padding: '25px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <PieIcon size={20} color="var(--corporate-blue)" /> Distribución por Sexo
                        </h3>
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={analytics?.genderData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {analytics?.genderData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div id="age-bar" style={{ gridColumn: '2 / span 2', background: 'var(--bg-secondary)', padding: '25px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <BarIcon size={20} color="var(--medical-turquoise)" /> Evolución de Consultas por Edad
                        </h3>
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics?.demographics}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                    <XAxis dataKey="group" stroke="var(--text-secondary)" />
                                    <YAxis stroke="var(--text-secondary)" />
                                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px' }} />
                                    <Bar dataKey="Masc" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Masculino" />
                                    <Bar dataKey="Fem" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Femenino" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* TABLES */}
                    <div style={{ gridColumn: '1 / -1', background: 'var(--bg-secondary)', borderRadius: '24px', padding: '30px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileBarChart size={24} color="var(--corporate-blue)" /> Distribución de Morbilidad por Sistema
                        </h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Patología / Diagnóstico</th>
                                    <th style={{ padding: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Total Casos</th>
                                    <th style={{ padding: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>% Prevalencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics?.topPathologies.map((p: any, i: number) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>{p.name}</td>
                                        <td style={{ padding: '15px', color: 'var(--text-primary)', textAlign: 'center' }}>{p.value}</td>
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                                                <div style={{ width: '100px', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${(p.value / analytics.totalConsultations) * 100}%`, height: '100%', background: 'var(--corporate-blue)' }}></div>
                                                </div>
                                                <small style={{ color: 'var(--text-secondary)' }}>{((p.value / analytics.totalConsultations) * 100).toFixed(1)}%</small>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
