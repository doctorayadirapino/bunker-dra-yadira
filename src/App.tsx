import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import {
  Activity, Users, FileText, CalendarDays, AlertTriangle,
  PlusCircle, BriefcaseMedical, Stethoscope
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import NewEvaluationForm from './components/NewEvaluationForm';
import PatientsList from './components/PatientsList';
import SurveillanceModule from './components/SurveillanceModule';
import CompaniesModule from './components/CompaniesModule';

// Definición de Interfaces para TypeScript
interface Paciente {
  sexo: string;
  nombre_completo: string;
  fecha_nacimiento?: string;
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
  const [activeView, setActiveView] = useState('dashboard');

  // Estados de Datos Reales (Búnker Supabase)
  const [kpis, setKpis] = useState({ total_pacientes: 0, consultas_mes: 0, dias_reposo: 0, ausentismo: 0 });
  const [genderData, setGenderData] = useState<{ name: string, value: number, color: string }[]>([]);
  const [consultationData, setConsultationData] = useState<{ name: string, val: number }[]>([]);
  const [topPathologies, setTopPathologies] = useState<{ name: string, v: number, c: string }[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [latestConsultations, setLatestConsultations] = useState<Consulta[]>([]);
  const [demographicStats, setDemographicStats] = useState<any[]>([]);
  const [absenteeismStats, setAbsenteeismStats] = useState<any[]>([]);

  // Estados para Multi-Empresa
  const [allConsultations, setAllConsultations] = useState<Consulta[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('GENERAL');

  // Función Core: Extraer y Masticar Datos
  // Función para procesar reportes por segmento (General o Empresa específica)
  const processAnalytics = (data: Consulta[], filterCompany: string) => {
    const filtered = filterCompany === 'GENERAL'
      ? data
      : data.filter(c => c.empresas?.nombre === filterCompany);

    const mesActual = new Date().getMonth();
    const añoActual = new Date().getFullYear();
    let consultasMes = 0;
    let diasReposoTotal = 0;

    // Agrupadores
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

    const ageGroups = ['18-25', '26-35', '36-45', '46-55', '55+'];
    const demoMap: Record<string, any> = {};
    const absentMap: Record<string, any> = {};
    ageGroups.forEach(g => {
      demoMap[g] = { group: g, Masc: 0, Fem: 0 };
      absentMap[g] = { group: g, Masc: 0, Fem: 0 };
    });

    const uniquePatients = new Set();

    filtered.forEach(row => {
      diasReposoTotal += row.dias_reposo || 0;
      const d = new Date(row.fecha_consulta);
      if (d.getMonth() === mesActual && d.getFullYear() === añoActual) consultasMes++;

      // Paciente Único (Simulando conteo por filtrado)
      uniquePatients.add(row.pacientes?.nombre_completo);

      // Demografía
      let age = 0;
      if (row.pacientes?.fecha_nacimiento) {
        const birth = new Date(row.pacientes.fecha_nacimiento);
        age = new Date().getFullYear() - birth.getFullYear();
      }
      let group = '55+';
      if (age < 26) group = '18-25';
      else if (age < 36) group = '26-35';
      else if (age < 46) group = '36-45';
      else if (age < 56) group = '46-55';

      const isMasc = row.pacientes?.sexo === 'Masculino';
      if (isMasc) mCount++; else fCount++;

      if (row.tipo_patologia !== 'Adulto sano') {
        if (isMasc) demoMap[group].Masc++; else demoMap[group].Fem++;
      }
      if (row.dias_reposo > 0) {
        if (isMasc) absentMap[group].Masc += row.dias_reposo; else absentMap[group].Fem += row.dias_reposo;
      }

      consulMap[row.tipo_consulta] = (consulMap[row.tipo_consulta] || 0) + 1;
      patMap[row.tipo_patologia] = (patMap[row.tipo_patologia] || 0) + 1;

      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const mName = monthNames[d.getMonth()];
      if (monthTrends[mName]) {
        if (row.categoria_reposo === 'ENFERMEDAD COMUN') monthTrends[mName].enf_comun++;
        if (row.categoria_reposo === 'ACCIDENTE LABORAL') monthTrends[mName].acc_laboral++;
        if (row.categoria_reposo === 'ENFERMEDAD OCUPACIONAL') monthTrends[mName].enf_ocupacional++;
        if (row.categoria_reposo === 'ACCIDENTE COMUN') monthTrends[mName].acc_comun++;
      }
    });

    // Seteo de Estados de Gráficos
    setGenderData([
      { name: 'Masculino', value: mCount, color: '#3b82f6' },
      { name: 'Femenino', value: fCount, color: '#0bdada' }
    ]);

    const cData = Object.keys(consulMap).map(k => ({ name: k, val: consulMap[k] })).sort((a, b) => b.val - a.val).slice(0, 5);
    setConsultationData(cData.length ? cData : [{ name: 'Sin Datos', val: 0 }]);

    const colorsArr = ['#ef4444', '#f59e0b', '#3b82f6', '#22d3ee'];
    const pData = Object.keys(patMap).map(k => ({ name: k, v: patMap[k] })).sort((a, b) => b.v - a.v).slice(0, 4).map((item, idx) => ({ ...item, c: colorsArr[idx % 4] }));
    setTopPathologies(pData);
    setTrendData(Object.values(monthTrends).slice(0, mesActual + 1));
    setDemographicStats(Object.values(demoMap));
    setAbsenteeismStats(Object.values(absentMap));
    setLatestConsultations(filtered.slice(0, 10));

    const totalPac = filterCompany === 'GENERAL' ? uniquePatients.size : uniquePatients.size;
    const ausent = ((diasReposoTotal / ((totalPac || 1) * 20)) * 100).toFixed(1);

    setKpis({
      total_pacientes: totalPac,
      consultas_mes: consultasMes,
      dias_reposo: diasReposoTotal,
      ausentismo: parseFloat(ausent)
    });
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: rawData, error } = await supabase
        .from('consultas')
        .select(`
          id, tipo_consulta, tipo_patologia, categoria_reposo, dias_reposo, fecha_consulta,
          pacientes (sexo, nombre_completo, fecha_nacimiento),
          empresas (nombre, rif)
        `)
        .order('fecha_consulta', { ascending: false });

      if (error) throw error;
      const data = (rawData || []) as unknown as Consulta[];
      setAllConsultations(data);

      const comps = Array.from(new Set(data.map(c => c.empresas?.nombre).filter(Boolean)));
      setAvailableCompanies(comps as string[]);

      processAnalytics(data, selectedCompany);

    } catch (err) {
      console.error("Error cargando Búnker Data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultas' }, () => {
        fetchDashboardData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Efecto para re-procesar cuando cambie el filtro
  useEffect(() => {
    if (allConsultations.length > 0) {
      processAnalytics(allConsultations, selectedCompany);
    }
  }, [selectedCompany]);

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

          <button
            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <Activity size={20} />
            Dashboard
          </button>
          <button
            className={`nav-item ${activeView === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveView('patients')}
          >
            <Users size={20} />
            Pacientes
          </button>
          <button
            className={`nav-item ${activeView === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveView('companies')}
          >
            <BriefcaseMedical size={20} />
            Empresas
          </button>
          <button
            className={`nav-item ${activeView === 'surveillance' ? 'active' : ''}`}
            onClick={() => setActiveView('surveillance')}
          >
            <FileText size={20} />
            Vigilancia
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* HEADER */}
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <h2 className="page-title">Centro de Mando Epidemiológico</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                Sistema v23.0 conectado a Supabase Cloud (Oficial)
              </p>
            </div>

            {/* Filtro Maestro de Empresa */}
            <div style={{ marginLeft: '20px', padding: '4px 12px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BriefcaseMedical size={18} color="var(--medical-turquoise)" />
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, outline: 'none', cursor: 'pointer', minWidth: '150px' }}
              >
                <option value="GENERAL" style={{ background: 'var(--bg-primary)' }}>📊 VISTA GENERAL</option>
                {availableCompanies.map(c => (
                  <option key={c} value={c} style={{ background: 'var(--bg-primary)' }}>🏢 {c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="user-profile">
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Dra Yadira Pino</span>
            <div className="user-avatar">YP</div>
          </div>
        </header>

        {loading ? (
          <div style={{ color: 'var(--corporate-blue)', textAlign: 'center', marginTop: '100px', fontSize: '20px', fontWeight: 600 }}>
            Cargando Búnker de Datos y Calculando BI...
          </div>
        ) : (
          <div className="view-transition-wrapper">
            {activeView === 'dashboard' && (
              <div className="dashboard-view fade-in">
                {/* KPIs */}
                <section className="kpi-grid">
                  <div className="kpi-card" style={{ borderLeft: '4px solid var(--corporate-blue)' }}>
                    <div className="kpi-header">
                      <span>{selectedCompany === 'GENERAL' ? 'Pacientes (Universo Total)' : `Personal (${selectedCompany})`}</span>
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

                  {/* Chart 5: PATOLOGÍAS POR EDAD Y SEXO */}
                  <div className="chart-card">
                    <h3 className="chart-title">Distribución de Patologías por Edad y Sexo</h3>
                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer>
                        <BarChart data={demographicStats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                          <XAxis dataKey="group" stroke="var(--text-secondary)" />
                          <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
                          <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px' }} />
                          <Legend />
                          <Bar dataKey="Masc" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Hombres" />
                          <Bar dataKey="Fem" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Mujeres" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 6: AUSENTISMO POR EDAD Y SEXO */}
                  <div className="chart-card">
                    <h3 className="chart-title">Ausentismo (Días) por Edad y Sexo</h3>
                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer>
                        <BarChart data={absenteeismStats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                          <XAxis dataKey="group" stroke="var(--text-secondary)" />
                          <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
                          <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px' }} />
                          <Legend />
                          <Bar dataKey="Masc" fill="#2563eb" radius={[4, 4, 0, 0]} name="Total Días Hombres" />
                          <Bar dataKey="Fem" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Total Días Mujeres" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>

                {/* EPIDEMIOLOGICAL TABLE */}
                <section className="data-table-card">
                  <h3 className="chart-title" style={{ marginBottom: 8 }}>
                    {selectedCompany === 'GENERAL' ? 'Vigilancia Epidemiológica - Histórico General' : `Histórico de Consultas - ${selectedCompany}`}
                  </h3>
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
                              ) : (cons.categoria_reposo || '').includes('ACCIDENTE') ? (
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
              </div>
            )}

            {activeView === 'patients' && <PatientsList key="patients-view" />}
            {activeView === 'companies' && <CompaniesModule key="companies-view" />}
            {activeView === 'surveillance' && <SurveillanceModule key="surveillance-view" />}
          </div>
        )}
      </main>

      {/* MODAL DE NUEVA EVALUACIÓN (SUPABASE) */}
      {showForm && <NewEvaluationForm onClose={handleFormClose} />}
    </div>
  );
}
