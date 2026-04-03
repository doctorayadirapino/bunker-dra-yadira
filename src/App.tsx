import { useState, useEffect, Suspense, lazy } from 'react';
import { supabase } from './lib/supabase';
import {
  Activity, Users, FileText, CalendarDays, AlertTriangle,
  PlusCircle, BriefcaseMedical, Stethoscope, Printer, LogOut, BookOpen,
  Menu, X
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import Login from './components/Login';

// MÓDULOS LAZY LOADED (Optimización v12.4 Carlos Fuentes)
const NewEvaluationForm = lazy(() => import('./components/NewEvaluationForm'));
const PatientsList = lazy(() => import('./components/PatientsList'));
const SurveillanceModule = lazy(() => import('./components/SurveillanceModule'));
const CompaniesModule = lazy(() => import('./components/CompaniesModule'));
const ConsultasModule = lazy(() => import('./components/ConsultasModule'));
const ReposoModulo = lazy(() => import('./components/ReposoModulo'));
const FisiatriaDashboard = lazy(() => import('./components/FisiatriaDashboard'));
const BIAnalytics = lazy(() => import('./components/BIAnalytics'));

import type { Session } from '@supabase/supabase-js';

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
  const [session, setSession] = useState<Session | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [prefilledCedula, setPrefilledCedula] = useState<string | undefined>(undefined);

  // Estados de Datos Reales (Supabase Cloud)
  const [kpis, setKpis] = useState({ total_pacientes: 0, consultas_mes: 0, dias_reposo: 0, ausentismo: 0 });
  const [genderData, setGenderData] = useState<{ name: string, value: number, color: string }[]>([]);
  const [consultationData, setConsultationData] = useState<{ name: string, val: number }[]>([]);
  const [topPathologies, setTopPathologies] = useState<{ name: string, v: number, c: string }[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [demographicStats, setDemographicStats] = useState<any[]>([]);
  const [absenteeismStats, setAbsenteeismStats] = useState<any[]>([]);
  const [latestConsultations, setLatestConsultations] = useState<Consulta[]>([]);
  const [userRole, setUserRole] = useState<'laboral' | 'fisiatria' | null>(null);

  // Estados para Multi-Empresa
  const [allConsultations, setAllConsultations] = useState<Consulta[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('GENERAL');

  // Función Core: Extraer y Masticar Datos
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

    const parseFechaStr = (str: string) => {
      const partes = (str || '').split('T')[0].split('-');
      if (partes.length === 3) return { año: parseInt(partes[0]), mes: parseInt(partes[1]) - 1, dia: parseInt(partes[2]) };
      return null;
    };

    filtered.forEach(row => {
      diasReposoTotal += row.dias_reposo || 0;
      const parsed = parseFechaStr(row.fecha_consulta);
      if (parsed && parsed.mes === mesActual && parsed.año === añoActual) consultasMes++;
      uniquePatients.add(row.pacientes?.nombre_completo);

      let age = 30;
      if (row.pacientes?.fecha_nacimiento) {
        const nacParts = row.pacientes.fecha_nacimiento.split('T')[0].split('-');
        if (nacParts.length === 3) age = añoActual - parseInt(nacParts[0]);
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
      const parsedFecha = parseFechaStr(row.fecha_consulta);
      const mName = parsedFecha ? monthNames[parsedFecha.mes] : null;
      if (mName && monthTrends[mName]) {
        if (row.categoria_reposo === 'ENFERMEDAD COMUN') monthTrends[mName].enf_comun++;
        if (row.categoria_reposo === 'ACCIDENTE LABORAL') monthTrends[mName].acc_laboral++;
        if (row.categoria_reposo === 'ENFERMEDAD OCUPACIONAL') monthTrends[mName].enf_ocupacional++;
        if (row.categoria_reposo === 'ACCIDENTE COMUN') monthTrends[mName].acc_comun++;
      }
    });

    setGenderData([{ name: 'Masculino', value: mCount, color: '#3b82f6' }, { name: 'Femenino', value: fCount, color: '#0bdada' }]);
    const cData = Object.keys(consulMap).map(k => ({ name: k, val: consulMap[k] })).sort((a, b) => b.val - a.val).slice(0, 5);
    setConsultationData(cData.length ? cData : [{ name: 'Sin Datos', val: 0 }]);
    const colorsArr = ['#ef4444', '#f59e0b', '#3b82f6', '#22d3ee'];
    const pData = Object.keys(patMap).map(k => ({ name: k, v: patMap[k] })).sort((a, b) => b.v - a.v).slice(0, 4).map((item, idx) => ({ ...item, c: colorsArr[idx % 4] }));
    setTopPathologies(pData);
    setTrendData(Object.values(monthTrends).slice(0, mesActual + 1));
    setDemographicStats(Object.values(demoMap));
    setAbsenteeismStats(Object.values(absentMap));
    setLatestConsultations(filtered.slice(0, 10));

    const totalPac = uniquePatients.size;
    const ausent = ((diasReposoTotal / ((totalPac || 1) * 20)) * 100).toFixed(1);

    setKpis({ total_pacientes: totalPac, consultas_mes: consultasMes, dias_reposo: diasReposoTotal, ausentismo: parseFloat(ausent) });
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
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') setShowResetPassword(true);
    });
    if (window.location.hash && window.location.hash.includes('type=recovery')) setShowResetPassword(true);
    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setResetError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setResetLoading(true);
    setResetError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setShowResetPassword(false);
      setNewPassword('');
      alert('Contraseña actualizada. Bienvenido.');
      window.history.replaceState(null, '', window.location.pathname);
    } catch (error: any) {
      setResetError(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase.from('perfiles_usuarios').select('rol').eq('id', userId).single();
    if (data) setUserRole(data.rol);
  };

  useEffect(() => {
    if (session) {
      fetchUserRole(session.user.id);
      fetchDashboardData();
      const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'consultas' }, () => { fetchDashboardData(); })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    } else {
      setUserRole(null);
    }
  }, [session]);

  useEffect(() => {
    if (allConsultations.length > 0) processAnalytics(allConsultations, selectedCompany);
  }, [selectedCompany]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  if (!session) return <Login />;

  const spinStyle = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .loader { width: 50px; height: 50px; border: 5px solid var(--corporate-blue); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
  `;

  return (
    <Suspense fallback={
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', gap: '20px' }}>
        <style>{spinStyle}</style>
        <div className="loader"></div>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '1px' }}>INICIANDO NÚCLEO...</span>
      </div>
    }>
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)' }}>
        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />

        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h1 className="brand-title">
              <Activity className="brand-icon" size={28} />
              {userRole === 'fisiatria' ? 'CONSULTA FISIATRICA' : 'Salud Laboral'}
            </h1>
          </div>
          <nav className="nav-links">
            {userRole === 'laboral' && (
              <>
                <button className="new-eval-btn-sidebar" onClick={() => { setShowForm(true); setIsSidebarOpen(false); }} style={{ marginBottom: '20px' }}>
                  <PlusCircle size={20} /> Nueva Evaluación
                </button>
                <button className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }}><Activity size={20} /> Dashboard</button>
                <button className={`nav-item ${activeView === 'patients' ? 'active' : ''}`} onClick={() => { setActiveView('patients'); setIsSidebarOpen(false); }}><Users size={20} /> Pacientes</button>
                <button className={`nav-item ${activeView === 'companies' ? 'active' : ''}`} onClick={() => { setActiveView('companies'); setIsSidebarOpen(false); }}><BriefcaseMedical size={20} /> Empresas</button>
                <button className={`nav-item ${activeView === 'surveillance' ? 'active' : ''}`} onClick={() => { setActiveView('surveillance'); setIsSidebarOpen(false); }}><FileText size={20} /> Vigilancia</button>
                <button className={`nav-item ${activeView === 'consultas' ? 'active' : ''}`} onClick={() => { setActiveView('consultas'); setIsSidebarOpen(false); }}><Printer size={20} /> Consultas</button>
                <button className={`nav-item ${activeView === 'reposo' ? 'active' : ''}`} onClick={() => { setActiveView('reposo'); setIsSidebarOpen(false); }}><CalendarDays size={20} /> Reposo</button>
                <button className={`nav-item ${activeView === 'bi_analytics' ? 'active' : ''}`} onClick={() => { setActiveView('bi_analytics'); setIsSidebarOpen(false); }}><Activity size={20} /> BI & Analytics</button>
              </>
            )}
            {userRole === 'fisiatria' && (
              <>
                <button className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }}><Activity size={20} /> Fisiatría</button>
                <button className={`nav-item ${activeView === 'vademecum' ? 'active' : ''}`} onClick={() => { setActiveView('vademecum'); setIsSidebarOpen(false); }}><BookOpen size={20} /> Vademécum</button>
                <button className={`nav-item ${activeView === 'reposo' ? 'active' : ''}`} onClick={() => { setActiveView('reposo'); setIsSidebarOpen(false); }}><CalendarDays size={20} /> Reposo</button>
              </>
            )}
            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <button className="nav-item" onClick={() => setShowResetPassword(true)} style={{ color: 'var(--text-primary)', width: '100%' }}><AlertTriangle size={20} /> Seguridad</button>
              <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--danger)', width: '100%' }}><LogOut size={20} /> Salir</button>
            </div>
          </nav>
        </aside>

        <main className="main-content">
          <header className="top-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div>
                <h2 className="page-title">{userRole === 'fisiatria' ? 'Gestión Fisiátrica' : 'Mando Epidemiológico'}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>LIC. CARLOS FUENTES | CORPORATIVO</p>
              </div>
              {userRole === 'laboral' && (
                <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600 }}>
                    <option value="GENERAL">📊 GLOBAL</option>
                    {availableCompanies.map(c => <option key={c} value={c}>🏢 {c}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="user-profile">
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Dra. Yadira Pino</div>
                <div style={{ color: 'var(--medical-turquoise)', fontSize: '0.7rem', fontWeight: 800 }}>MÉDICO ESPECIALISTA</div>
              </div>
              <div className="user-avatar" style={{ background: 'linear-gradient(135deg, var(--doctora-pink), var(--corporate-blue))' }}>YP</div>
            </div>
          </header>

          {loading ? (
            <div style={{ color: 'var(--corporate-blue)', textAlign: 'center', marginTop: '100px', fontWeight: 600 }}>Calculando BI...</div>
          ) : (
            <div className="view-transition-wrapper">
              {userRole === 'fisiatria' ? (
                <>
                  {(activeView === 'dashboard' || activeView === 'vademecum') && <FisiatriaDashboard initialView={activeView === 'vademecum' ? 'vademecum' : 'home'} />}
                  {activeView === 'reposo' && <ReposoModulo selectedCompany="GENERAL" />}
                </>
              ) : (
                <>
                  {activeView === 'dashboard' && (
                    <div className="dashboard-view fade-in">
                      <section className="kpi-grid">
                        <div className="kpi-card"><span>Población</span><div className="kpi-value">{kpis.total_pacientes}</div></div>
                        <div className="kpi-card"><span>Consultas</span><div className="kpi-value">{kpis.consultas_mes}</div></div>
                        <div className="kpi-card"><span>Días Médicos</span><div className="kpi-value">{kpis.dias_reposo}</div></div>
                        <div className="kpi-card"><span>% Ausentismo</span><div className="kpi-value">{kpis.ausentismo}%</div></div>
                      </section>
                      <section className="charts-grid">
                        <div className="chart-card"><h3 className="chart-title">Sexo</h3><div style={{ height: 200 }}><ResponsiveContainer><PieChart><Pie data={genderData} innerRadius={60} outerRadius={80} dataKey="value" stroke="none">{genderData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><RechartsTooltip /><Legend /></PieChart></ResponsiveContainer></div></div>
                        <div className="chart-card"><h3 className="chart-title">Consultas</h3><div style={{ height: 200 }}><ResponsiveContainer><BarChart data={consultationData}><XAxis dataKey="name" hide /><YAxis hide /><RechartsTooltip /><Bar dataKey="val" fill="var(--medical-turquoise)" radius={5} /></BarChart></ResponsiveContainer></div></div>
                      </section>
                      <section className="data-table-card">
                        <table className="data-table">
                          <thead><tr><th>Fecha</th><th>Paciente</th><th>Patología</th><th>Días</th></tr></thead>
                          <tbody>{latestConsultations.map(c => (<tr key={c.id}><td>{c.fecha_consulta.split('T')[0]}</td><td>{c.pacientes?.nombre_completo}</td><td>{c.tipo_patologia}</td><td>{c.dias_reposo}</td></tr>))}</tbody>
                        </table>
                      </section>
                    </div>
                  )}
                  {activeView === 'patients' && <PatientsList selectedCompany={selectedCompany} onNewConsultation={(c) => { setPrefilledCedula(c); setShowForm(true); }} />}
                  {activeView === 'companies' && <CompaniesModule onAudit={(n) => { setSelectedCompany(n); setActiveView('surveillance'); }} />}
                  {activeView === 'surveillance' && <SurveillanceModule selectedCompanyProp={selectedCompany} />}
                  {activeView === 'consultas' && <ConsultasModule selectedCompany={selectedCompany} />}
                  {activeView === 'reposo' && <ReposoModulo selectedCompany={selectedCompany} userRole={userRole} />}
                  {activeView === 'bi_analytics' && <BIAnalytics selectedCompany={selectedCompany} />}
                </>
              )}
            </div>
          )}
        </main>

        {showForm && <NewEvaluationForm onClose={() => { setShowForm(false); fetchDashboardData(); }} prefilledCedula={prefilledCedula} />}

        {showResetPassword && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ background: 'var(--bg-secondary)', padding: 30, borderRadius: 15, width: 400 }}>
              <h2 style={{ color: 'white', marginBottom: 20 }}>Cambiar Contraseña</h2>
              <form onSubmit={handleUpdatePassword}>
                <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 8, background: '#111', color: 'white', border: '1px solid #333' }} />
                {resetError && <p style={{ color: 'var(--danger)' }}>{resetError}</p>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setShowResetPassword(false)} style={{ flex: 1, padding: 12, borderRadius: 8, background: 'transparent', color: 'white', border: '1px solid #333' }}>Cerrar</button>
                  <button type="submit" disabled={resetLoading} style={{ flex: 1, padding: 12, borderRadius: 8, background: 'var(--corporate-blue)', color: 'white', border: 'none' }}>{resetLoading ? '...' : 'Actualizar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
}
