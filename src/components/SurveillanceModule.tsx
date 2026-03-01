import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileBarChart, Download, Filter, TrendingUp, Users, AlertCircle, FileText } from 'lucide-react';
import { generarReporteVigilanciaPDF, generarListadoEmpresaPDF } from '../services/pdfService';

export default function SurveillanceModule() {
    const [loading, setLoading] = useState(true);
    const [empresas, setEmpresas] = useState<any[]>([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState('GENERAL');
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
                topPathologies: Object.entries(patMap).length > 0
                    ? Object.entries(patMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10)
                    : [],
                consultationTypes: Object.entries(typeMap).length > 0
                    ? Object.entries(typeMap).map(([name, value]) => ({ name, value }))
                    : [],
                demographics: Object.values(demoMap)
            };

            console.log('Analytics procesado con éxito:', stats);
            setAnalytics(stats);
            setLoading(false);
        } catch (err) {
            console.error('CRITICAL ERROR CALCULATING BI:', err);
            setLoading(false);
        }
    };

    const handleDownloadReport = async () => {
        if (!analytics) return;

        const conFirma = window.confirm("¿Desea incluir la FIRMA DIGITAL en el Resumen Estadístico?\n\n• [Aceptar]: Para enviar por correo corporativo o WhatsApp.\n• [Cancelar]: Para imprimir y sellar físicamente.");

        setDownloading(true);
        try {
            await generarReporteVigilanciaPDF({
                companyName: selectedEmpresa,
                month: new Date().toLocaleDateString('es-VE', { month: 'long', year: 'numeric' }).toUpperCase(),
                stats: analytics,
                conFirmaDigital: conFirma
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-secondary)', padding: '5px 15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <Filter size={18} color="var(--corporate-blue)" />
                        <select
                            value={selectedEmpresa}
                            onChange={e => setSelectedEmpresa(e.target.value)}
                            style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="GENERAL">TODAS LAS EMPRESAS</option>
                            {empresas.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                        </select>
                    </div>

                    <button
                        onClick={handleDownloadReport}
                        disabled={loading || downloading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: downloading ? 'var(--text-secondary)' : 'var(--corporate-blue)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 600, cursor: (loading || downloading) ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', opacity: (loading || downloading) ? 0.7 : 1 }}
                    >
                        {downloading ? "Procesando..." : <><Download size={18} /> Resumen Estadístico</>}
                    </button>

                    <button
                        onClick={handleDownloadList}
                        disabled={loading || downloading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: downloading ? 'var(--text-secondary)' : 'var(--medical-turquoise)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 600, cursor: (loading || downloading) ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', opacity: (loading || downloading) ? 0.7 : 1 }}
                    >
                        {downloading ? "Buscando..." : <><FileText size={18} /> Listado Detallado</>}
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
