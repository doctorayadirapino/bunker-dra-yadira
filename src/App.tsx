import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import {
  Activity, Users, FileText, CalendarDays, AlertTriangle,
  PlusCircle, BriefcaseMedical, Stethoscope, ChevronDown
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import NewEvaluationForm from './components/NewEvaluationForm';

// Definición de Interfaces para TypeScript
interface Paciente {
  sexo: string;
  nombre_completo: string;
}

interface Empresa {
  nombre: string;
  rif: string;
}

interface Consulta {
  id: string;
  tipo_consulta: string;
  tipo_patologia: string;
  categoria_reposo: string;
  dias_reposo: number;
  fecha_consulta: string;
  pacientes: Paciente;
  empresas: Empresa;
}

export default function App() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados de Datos Reales (Búnker Supabase)
  const [kpis, setKpis] = useState({ total_pacientes: 0, consultas_mes: 0, dias_reposo: 0, ausentismo: 0 });
  const [genderData, setGenderData] = useState<{ name: string, value: number, color: string }[]>([]);
  const [consultationData, setConsultationData] = useState<{ name: string, val: number }[]>([]);
  const [topPathologies, setTopPathologies] = useState<{ name: string, v: number, c: string }[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [latestConsultations, setLatestConsultations] = useState<Consulta[]>([]);

  // Función Core: Extraer y Masticar Datos
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Pedimos todas las consultas con las relaciones de pacientes y empresas
      const { data: rawData, error } = await supabase
        .from('consultas')
        .select(`
          id, tipo_consulta, tipo_patologia, categoria_reposo, dias_reposo, fecha_consulta,
          pacientes (sexo, nombre_completo),
          empresas (nombre, rif)
        `)
        .order('fecha_consulta', { ascending: false });

      if (error) throw error;
      const data = (rawData || []) as unknown as Consulta[];

      // 1. Calcular KPIs
      const mesActual = new Date().getMonth();
      const añoActual = new Date().getFullYear();
      let consultasMes = 0;
      let diasReposoTotal = 0;

      // Contar pacientes únicos (Simulación rápida vía Set)
      const { count: pacientesCount } = await supabase.from('pacientes').select('*', { count: 'exact', head: true });

      // 2. Agrupadores
      let mCount = 0, fCount = 0;
      const consulMap: Record<string, number> = {};
      const patMap: Record<string, number> = {};
      const monthTrends: Record<string, any> = {
        'Ene': { month: 'Ene', enf_comun: 0, acc_laboral: 0, enf_ocupacional: 0, acc_comun: 0 },
        'Feb': { month: 'Feb', enf_comun: 0, acc_laboral: 0, enf_ocupacional: 0, acc_comun: 0 },
        'Mar': { month: 'Mar', enf_comun: 0, acc_laboral: 0, enf_ocupacional: 0, acc_comun: 0 },
        'Abr': { month: 'Abr', enf_comun: 0, acc_laboral: 0, enf_ocupacional: 0, acc_comun: 0 },
        'May': { month: 'May', enf_comun: 0, acc_laboral: 0, enf_ocupacional: 0, acc_comun: 0 },
        'Jun': { month: 'Jun', enf_comun: 0, acc_laboral: 0, enf_ocupacional: 0, acc_comun: 0 },
        'Jul': { month: 'Jul', enf_comun: 0, acc_laboral: 0, enf_ocupacional: 0, acc_comun: 0 },
        'Ago': { month: 'Ago', enf_comun: 0, acc_laboral: 0, enf_ocupacional: 0, acc_comun: 0 },
        'Sep': { month: 'Sep', enf_comun: 0, acc_laboral: 0, enf_ocupacional: 0, acc_comun: 0 },
        'Oct': { month: 'Oct', enf_comun: 0, acc_laboral: 0, enf_ocupacional: 0, acc_comun: 0 },
        'Nov': { month: 'Nov', enf_comun: 0, acc_laboral: 0, enf_ocupacional: 0, acc_comun: 0 },
        'Dic': { month: 'Dic', enf_comun: 0, acc_laboral: 0, enf_ocupacional: 0, acc_comun: 0 },
      };

      data.forEach(row => {
        // KPI: Días de reposo general
        diasReposoTotal += row.dias_reposo || 0;

        // KPI: Consultas del Mes
        const d = new Date(row.fecha_consulta);
        if (d.getMonth() === mesActual && d.getFullYear() === añoActual) {
          consultasMes++;
        }

        // Gráfico 1: Sexo
        if (row.pacientes?.sexo === 'Masculino') mCount++;
        if (row.pacientes?.sexo === 'Femenino') fCount++;

        // Gráfico 2: Tipo Consulta
        consulMap[row.tipo_consulta] = (consulMap[row.tipo_consulta] || 0) + 1;

        // Gráfico 3: Patologías
        patMap[row.tipo_patologia] = (patMap[row.tipo_patologia] || 0) + 1;

        // Gráfico 4: Tendencias (Mes a Mes)
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mName = monthNames[d.getMonth()];
        if (monthTrends[mName]) {
          if (row.categoria_reposo === 'ENFERMEDAD COMUN') monthTrends[mName].enf_comun++;
          if (row.categoria_reposo === 'ACCIDENTE LABORAL') monthTrends[mName].acc_laboral++;
          if (row.categoria_reposo === 'ENFERMEDAD OCUPACIONAL') monthTrends[mName].enf_ocupacional++;
          if (row.categoria_reposo === 'ACCIDENTE COMUN') monthTrends[mName].acc_comun++;
        }
      });

      // Formatear para Recharts
      setGenderData([
        { name: 'Masculino', value: mCount, color: '#3b82f6' },
        { name: 'Femenino', value: fCount, color: '#0bdada' }
      ]);

      const cData = Object.keys(consulMap).map(k => ({ name: k, val: consulMap[k] })).sort((a, b) => b.val - a.val).slice(0, 5);
      setConsultationData(cData.length ? cData : [{ name: 'Sin Datos', val: 0 }]);

      const colors = ['var(--danger)', 'var(--warning)', 'var(--corporate-blue)', 'var(--medical-turquoise)'];
      const pData = Object.keys(patMap)
        .map(k => ({ name: k, v: patMap[k] }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 4)
        .map((item, idx) => ({ ...item, c: colors[idx % 4] }));
      setTopPathologies(pData);

      // Calcular solo hasta el mes actual para la tendencia
      const finalTrend = Object.values(monthTrends).slice(0, mesActual + 1);
      setTrendData(finalTrend);

      // Ultimas consultas (Máximo 5 para UI)
      setLatestConsultations(data.slice(0, 5));

      // Simulamos Ausentismo (Ecuación rápida: Días Reposo / (Pacientes * 20 días hábiles)) * 100
      const totalPac = pacientesCount || 0;
      const pacForAusentismo = totalPac === 0 ? 1 : totalPac;
      const ausent = ((diasReposoTotal / (pacForAusentismo * 20)) * 100).toFixed(1);

      setKpis({
        total_pacientes: totalPac,
        consultas_mes: consultasMes,
        dias_reposo: diasReposoTotal,
        ausentismo: parseFloat(ausent)
      });

    } catch (err) {
      console.error("Error cargando Búnker Data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Sincronización en Tiempo Real: Si alguien agrega consulta, refrescar!
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultas' }, () => {
        console.log("Detectado nuevo ingreso en el Búnker. Recalculando Inteligencia...");
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleFormClose = () => {
    setShowForm(false);
    // El realtime trigger recargará la data automáticamente, pero forzamos por si acaso
    fetchDashboardData();
  };

  // Renderización UI
  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="brand-title">
            <Activity className="brand-icon" size={28} />
            Salud Laboral
          </h1>
        </div>

        <nav className="nav-links">
          <button className="new-eval-btn-sidebar" onClick={() => setShowForm(true)} style={{ marginBottom: '20px' }}>
            <PlusCircle size={20} />
            Nueva Evaluación
          </button>

          <a href="#" className="nav-item active">
            <Activity size={20} />
            Dashboard
          </a>
          <a href="#" className="nav-item">
            <Users size={20} />
            Pacientes
          </a>
          <a href="#" className="nav-item">
            <BriefcaseMedical size={20} />
            Empresas
          </a>
          <a href="#" className="nav-item">
            <FileText size={20} />
            Vigilancia
          </a>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* HEADER */}
        <header className="top-bar">
          <div>
            <h2 className="page-title">Centro de Mando Epidemiológico</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Sistema v23.0 conectado a Supabase Cloud (Datos Oficiales LOPCYMAT)
            </p>
          </div>
          <div className="user-profile">
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Dra Yadira Pino</span>
            <div className="user-avatar">YP</div>
            <ChevronDown size={16} color="var(--text-secondary)" />
          </div>
        </header>

        {loading ? (
          <div style={{ color: 'var(--medical-turquoise)', textAlign: 'center', marginTop: '100px', fontSize: '20px' }}>
            Cargando Búnker de Datos y Calculando BI...
          </div>
        ) : (
          <>
            {/* KPIs */}
            <section className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-header">
                  <span>Total Pacientes (Nativos)</span>
                  <Users size={20} color="var(--corporate-blue)" />
                </div>
                <div className="kpi-value">{kpis.total_pacientes}</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span>Consultas (Mes Actual)</span>
                  <Stethoscope size={20} color="var(--medical-turquoise)" />
                </div>
                <div className="kpi-value">{kpis.consultas_mes}</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span>Días Cómputo Reposo</span>
                  <CalendarDays size={20} color="var(--warning)" />
                </div>
                <div className="kpi-value">{kpis.dias_reposo}</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span>% Índice Ausentismo</span>
                  <AlertTriangle size={20} color="var(--danger)" />
                </div>
                <div className="kpi-value">{kpis.ausentismo}%</div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ecuación referencial LOPCYMAT</span>
              </div>
            </section>

            {/* CHARTS */}
            <section className="charts-grid">
              {/* Chart 1: SEXO */}
              <div className="chart-card">
                <h3 className="chart-title">Distribución por Sexo</h3>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={genderData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: TIPO CONSULTA */}
              <div className="chart-card">
                <h3 className="chart-title">Tipos de Consulta Clave (Top 5)</h3>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={consultationData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                      <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                      <RechartsTooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px' }}
                      />
                      <Bar dataKey="val" fill="var(--medical-turquoise)" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: PATOLOGÍAS OVERVIEW */}
              <div className="chart-card">
                <h3 className="chart-title">Top 4 Patologías Detectadas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                  {topPathologies.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No hay casos patológicos registrados</span>}
                  {topPathologies.map((item, i) => {
                    const maxV = topPathologies[0].v;
                    const percent = (item.v / maxV) * 100;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                          <span>{item.name}</span>
                          <span>{item.v} casos</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', backgroundColor: item.c }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Chart 4: REPOSOS TREND */}
              <div className="chart-card">
                <h3 className="chart-title">Clasificación de Eventos Mensuales</h3>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-secondary)" />
                      <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Line type="monotone" name="Enf. Común" dataKey="enf_comun" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" name="Acc. Laboral" dataKey="acc_laboral" stroke="var(--danger)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* EPIDEMIOLOGICAL TABLE */}
            <section className="data-table-card">
              <h3 className="chart-title" style={{ marginBottom: 8 }}>Vigilancia Epidemiológica - Histórico Oficial</h3>
              {latestConsultations.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No se han ingresado consultas médicas al búnker v23.0.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Paciente</th>
                      <th>Empresa (RIF)</th>
                      <th>Tipo Consulta</th>
                      <th>Patología Detección</th>
                      <th>Reposo Registrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestConsultations.map(cons => (
                      <tr key={cons.id}>
                        <td>{new Date(cons.fecha_consulta).toLocaleDateString()}</td>
                        <td>{cons.pacientes?.nombre_completo || 'Anónimo'}</td>
                        <td>{cons.empresas?.nombre || 'Independiente'} ({cons.empresas?.rif})</td>
                        <td>{cons.tipo_consulta}</td>
                        <td>{cons.tipo_patologia}</td>
                        <td>
                          {cons.categoria_reposo === 'NINGUNO' ? (
                            <span className="badge badge-info">SIN REPOSO</span>
                          ) : cons.categoria_reposo.includes('ACCIDENTE') ? (
                            <span className="badge badge-danger">{cons.categoria_reposo} ({cons.dias_reposo}D)</span>
                          ) : (
                            <span className="badge badge-warning">{cons.categoria_reposo} ({cons.dias_reposo}D)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>

      {/* MODAL DE NUEVA EVALUACIÓN (SUPABASE) */}
      {showForm && <NewEvaluationForm onClose={handleFormClose} />}
    </div >
  );
}
