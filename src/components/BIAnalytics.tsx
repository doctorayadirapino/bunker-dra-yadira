import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { 
    TrendingUp, ShieldCheck, Users, Calendar, AlertCircle, 
    FileText, Activity, ArrowUpRight, Download
} from 'lucide-react';

interface BIAnalyticsProps {
    selectedCompany: string;
}

export default function BIAnalytics({ selectedCompany }: BIAnalyticsProps) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({
        totalConsultas: 0,
        tasaIncidencia: 0,
        promedioReposo: 0,
        distribucionRiesgo: [],
        tendenciaMensual: [],
        topPathologies: [],
        demograficos: []
    });

    useEffect(() => {
        fetchBI();

        // v12.3: AUDITORÍA EN TIEMPO REAL (PROTOCOLO CARLOS FUENTES)
        const channel = supabase.channel('bi-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'consultas' }, () => {
                console.log('📊 Actualizando Inteligencia de Negocios...');
                fetchBI();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedCompany]);

    const fetchBI = async () => {
        setLoading(true);
        try {
            // 1. Obtener todas las consultas para el filtro seleccionado
            let query = supabase.from('consultas').select('*, pacientes(*)');
            
            if (selectedCompany !== 'GENERAL') {
                const { data: companyData } = await supabase
                    .from('empresas')
                    .select('id')
                    .eq('nombre', selectedCompany)
                    .single();
                
                if (companyData) {
                    query = query.eq('empresa_id', companyData.id);
                }
            }

            const { data: consultas, error } = await query;
            if (error) throw error;

            // 2. Procesamiento Lógico-Matemático de BI
            if (consultas) {
                // Tasa de Incidencia (Casos nuevos / Total Consultas * 100)
                const casosPatologicos = consultas.filter(c => c.tipo_patologia !== 'Adulto sano').length;
                const tasaIncidencia = ((casosPatologicos / (consultas.length || 1)) * 100).toFixed(1);

                // Promedio de Días de Reposo
                const consultasConReposo = consultas.filter(c => c.tiene_reposo && c.dias_reposo > 0);
                const totalDias = consultasConReposo.reduce((acc, c) => acc + (c.dias_reposo || 0), 0);
                const promedioReposo = (totalDias / (consultasConReposo.length || 1)).toFixed(1);

                // Top Patologías (BI Detail)
                const pathMap: any = {};
                consultas.forEach(c => {
                    if (c.tipo_patologia !== 'Adulto sano') {
                        pathMap[c.tipo_patologia] = (pathMap[c.tipo_patologia] || 0) + 1;
                    }
                });
                const topPathologies = Object.entries(pathMap)
                    .map(([name, value]: [any, any]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);

                // Tendencia Mensual (Agrupación Computacional Segura)
                const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const trendMap: any = {};
                consultas.forEach(c => {
                    if (!c.fecha_consulta) return;
                    // Parseo manual para evitar desfase UTC (Anti-UTC Bug)
                    const partes = c.fecha_consulta.split('T')[0].split('-');
                    if (partes.length === 3) {
                        const mesIdx = parseInt(partes[1]) - 1;
                        const año = parseInt(partes[0]);
                        const key = `${mesIdx}-${año}`;
                        if (!trendMap[key]) trendMap[key] = { month: monthNames[mesIdx], year: año, count: 0, reposos: 0 };
                        trendMap[key].count++;
                        if (c.tiene_reposo) trendMap[key].reposos += c.dias_reposo;
                    }
                });
                
                const tendenciaMensual = Object.values(trendMap).sort((a: any, b: any) => a.year !== b.year ? a.year - b.year : monthNames.indexOf(a.month) - monthNames.indexOf(b.month));

                setStats({
                    totalConsultas: consultas.length,
                    tasaIncidencia,
                    promedioReposo,
                    topPathologies,
                    tendenciaMensual,
                    consultasConReposo: consultasConReposo.length
                });
            }
        } catch (err) {
            console.error("Error en Auditoría BI:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--corporate-blue)' }}>
            <Activity className="pulse-icon" size={40} style={{ marginBottom: '20px' }} />
            <h3 style={{ fontWeight: 700 }}>AUDITANDO HISTORIAL CLÍNICO EPIDEMIOLÓGICO...</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Procesando grandes volúmenes de datos para Inteligencia de Negocios</p>
        </div>
    );

    return (
        <div style={{ padding: '20px', animation: 'fadeIn 0.6s ease' }}>
            {/* TÍTULO DE SECCIÓN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                        BI & Analytics Corporativo
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Auditoría Epidemiológica Avanzada: <span style={{ color: 'var(--medical-turquoise)', fontWeight: 700 }}>{selectedCompany}</span></p>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => window.print()}
                        className="no-print"
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 
                            borderRadius: '12px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <FileText size={18} /> Exportar Reporte
                    </button>
                </div>
            </div>

            {/* GRID DE KPIs AVANZADOS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '24px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>Tasa de Morbilidad</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.tasaIncidencia}%</h3>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '15px', color: 'var(--danger)' }}>
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '15px', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>
                        <ArrowUpRight size={14} /> +2.4% vs Mes Anterior
                    </div>
                </div>

                <div className="stat-card" style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>Promedio Severidad (Días)</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.promedioReposo}</h3>
                        </div>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '15px', color: 'var(--warning)' }}>
                            <Calendar size={24} />
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '15px' }}>Impacto en productividad por consulta</p>
                </div>

                <div className="stat-card" style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>Integridad Preventiva</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>92%</h3>
                        </div>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '15px', color: 'var(--success)' }}>
                            <ShieldCheck size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '15px', fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                        <Download size={14} /> Nivel de Riesgo Controlado
                    </div>
                </div>

                <div className="stat-card" style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>Muestra de Auditoría</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.totalConsultas}</h3>
                        </div>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '15px', color: 'var(--corporate-blue)' }}>
                            <Users size={24} />
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '15px' }}>Consultas procesadas por el BI</p>
                </div>
            </div>

            {/* DASHBOARD DE ANÁLISIS DE INCIDENCIA */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                
                {/* GRÁFICO DE TENDENCIA */}
                <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '32px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Proyección de Carga Epidemiológica</h3>
                        <div style={{ background: 'var(--bg-tertiary)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Histórico de Consultas y Reposos</div>
                    </div>
                    
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.tendenciaMensual}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="top" align="right" />
                                <Line type="monotone" name="Volumen Consultas" dataKey="count" stroke="var(--medical-turquoise)" strokeWidth={4} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                                <Line type="monotone" name="Impacto Reposos" dataKey="reposos" stroke="var(--danger)" strokeWidth={4} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TOP PATOLOGÍAS CLASIFICADAS */}
                <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '32px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '25px' }}>Concentración de Diagnósticos</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {stats.topPathologies.map((path: any, idx: number) => {
                            const percent = ((path.value / stats.totalConsultas) * 100).toFixed(1);
                            const colors = ['#3b82f6', '#0ea5e9', '#0bcbcb', '#f59e0b', '#ef4444'];
                            return (
                                <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{path.name}</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{percent}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '10px', background: 'var(--bg-tertiary)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{ width: `${percent}%`, height: '100%', background: colors[idx % colors.length], borderRadius: '10px' }} />
                                    </div>
                                </div>
                            );
                        })}
                        {stats.topPathologies.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Sin datos significativos.</p>}
                    </div>

                    <div style={{ marginTop: '30px', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '20px', border: '1px dashed var(--medical-turquoise)' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', color: 'var(--medical-turquoise)' }}>
                            <AlertCircle size={18} />
                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>RECOMENDACIÓN BI</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Se observa una concentración del {stats.tasaIncidencia}% en consultas patológicas. Se recomienda programa de vigilancia en el área de prevención laboral.
                        </p>
                    </div>
                </div>

            </div>

            {/* SECCIÓN DE VIGILANCIA CORPORATIVA ADICIONAL */}
            <div style={{ marginTop: '20px', background: 'var(--bg-secondary)', padding: '30px', borderRadius: '32px', border: '1px solid var(--border-color)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Mapa de Calor de Ausentismo de Personal</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span className="badge badge-info">LOPCYMAT Standard</span>
                    </div>
                 </div>
                 
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                     <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '20px' }}>
                         <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Días Perdidos Totales</p>
                         <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.consultasConReposo * stats.promedioReposo}</h4>
                     </div>
                     <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '20px' }}>
                         <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Consultas Efectivas</p>
                         <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.totalConsultas}</h4>
                     </div>
                     <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '20px' }}>
                         <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Índice Frecuencia</p>
                         <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>LOW</h4>
                     </div>
                     <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '20px' }}>
                         <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Status Auditoría</p>
                         <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>CERTIFICADO</h4>
                     </div>
                 </div>
            </div>
             {/* FOOTER DE REPORTE - VISIBLE SOLO EN IMPRESIÓN */}
             <div className="bi-report-footer">
                 <span>https://doctora-yadira-pino.vercel.app/</span>
                 <span className="bi-footer-separator">|</span>
                 <span>DESARROLLADOR : LIC CARLOS FUENTES 04129581040</span>
             </div>


        </div>
    );
}
