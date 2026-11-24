/* © 2026 MSc. Carlos Fuentes. Todos los derechos reservados. Uso Propietario. */
import { useState, useEffect, Suspense, lazy } from 'react';
import { supabase } from './lib/supabase';
import {
  Activity, Users, FileText, CalendarDays, AlertTriangle,
  PlusCircle, BriefcaseMedical, Printer, LogOut, BookOpen,
  Menu, X, Search, ArrowUpRight
} from 'lucide-react';
import {
  Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, Cell
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

  const fetchUserRole = async (userId: string, userEmail?: string) => {
    const normalizedEmail = (userEmail || '').trim().toLowerCase();
    if (normalizedEmail === 'doctora.fisiatria@bunker.com') {
      setUserRole('fisiatria');
      return;
    }
    if (normalizedEmail === 'yadirapinorujano288@gmail.com') {
      setUserRole('laboral');
      return;
    }

    const { data } = await supabase.from('perfiles_usuarios').select('rol').eq('id', userId).single();
    if (data && (data.rol === 'laboral' || data.rol === 'fisiatria')) {
      setUserRole(data.rol);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      const isFisiatria = (session.user.email || '').trim().toLowerCase() === 'doctora.fisiatria@bunker.com';
      fetchUserRole(session.user.id, session.user.email);
      if (isFisiatria) {
        setLoading(false);
      } else {
        fetchDashboardData();
      }
      const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'consultas' }, () => {
          if (!isFisiatria) fetchDashboardData();
        })
        .subscribe();

      // AUTO-LOGOUT POR INACTIVIDAD (45 MINUTOS - PROTOCOLO ZERO TRUST CARLOS FUENTES)
      let inactivityTimer: ReturnType<typeof setTimeout>;
      const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(async () => {
          await supabase.auth.signOut();
        }, 45 * 60 * 1000);
      };

      const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
      activityEvents.forEach(evt => window.addEventListener(evt, resetInactivityTimer, { passive: true }));
      resetInactivityTimer();

      return () => {
        supabase.removeChannel(channel);
        clearTimeout(inactivityTimer);
        activityEvents.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
      };
    } else {
      setUserRole(null);
    }
  }, [session?.user?.id]);

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
      <div className="cd-app-shell">
        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />

        {/* RIEL VERTICAL FLOTANTE ESTILO SCROLLTIDE CLIENT DESK */}
        <aside className={`cd-icon-rail ${isSidebarOpen ? 'open' : ''}`}>
          <div className="cd-rail-top">
            {userRole === 'laboral' ? (
              <>
                <button
                  className={`cd-rail-btn ${activeView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }}
                  title="Dashboard"
                >
                  <Activity size={19} />
                </button>
                <button
                  className={`cd-rail-btn ${activeView === 'patients' ? 'active' : ''}`}
                  onClick={() => { setActiveView('patients'); setIsSidebarOpen(false); }}
                  title="Pacientes"
                >
                  <Users size={19} />
                </button>
                <button
                  className={`cd-rail-btn ${activeView === 'companies' ? 'active' : ''}`}
                  onClick={() => { setActiveView('companies'); setIsSidebarOpen(false); }}
                  title="Empresas"
                >
                  <BriefcaseMedical size={19} />
                </button>
                <button
                  className={`cd-rail-btn ${activeView === 'surveillance' ? 'active' : ''}`}
                  onClick={() => { setActiveView('surveillance'); setIsSidebarOpen(false); }}
                  title="Vigilancia Epidemiológica"
                >
                  <FileText size={19} />
                </button>
                <button
                  className={`cd-rail-btn ${activeView === 'consultas' ? 'active' : ''}`}
                  onClick={() => { setActiveView('consultas'); setIsSidebarOpen(false); }}
                  title="Historial de Consultas"
                >
                  <Printer size={19} />
                </button>
                <button
                  className={`cd-rail-btn ${activeView === 'reposo' ? 'active' : ''}`}
                  onClick={() => { setActiveView('reposo'); setIsSidebarOpen(false); }}
                  title="Reposo Médico"
                >
                  <CalendarDays size={19} />
                </button>
                <button
                  className={`cd-rail-btn ${activeView === 'bi_analytics' ? 'active' : ''}`}
                  onClick={() => { setActiveView('bi_analytics'); setIsSidebarOpen(false); }}
                  title="BI & Analytics"
                >
                  <ArrowUpRight size={19} />
                </button>
              </>
            ) : (
              <>
                <button
                  className={`cd-rail-btn ${activeView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }}
                  title="Fisiatría"
                >
                  <Activity size={19} />
                </button>
                <button
                  className={`cd-rail-btn ${activeView === 'vademecum' ? 'active' : ''}`}
                  onClick={() => { setActiveView('vademecum'); setIsSidebarOpen(false); }}
                  title="Vademécum"
                >
                  <BookOpen size={19} />
                </button>
                <button
                  className={`cd-rail-btn ${activeView === 'reposo' ? 'active' : ''}`}
                  onClick={() => { setActiveView('reposo'); setIsSidebarOpen(false); }}
                  title="Reposo"
                >
                  <CalendarDays size={19} />
                </button>
              </>
            )}
          </div>

          <div className="cd-rail-bottom">
            <button className="cd-rail-btn" onClick={() => setShowResetPassword(true)} title="Seguridad / Contraseña">
              <AlertTriangle size={18} />
            </button>
            <button className="cd-rail-btn cd-rail-logout" onClick={handleLogout} title="Salir del Sistema">
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* LIENZO PRINCIPAL ESTILO CLIENT DESK */}
        <main className="cd-workspace">
          {/* BARRA SUPERIOR CON PÍLDORAS DE NAVEGACIÓN */}
          <header className="cd-topbar">
            <div className="cd-topbar-left">
              <div className="cd-logo-mark" onClick={() => setActiveView('dashboard')}>
                <img src="/pwa-512x512.png" alt="Logo" />
              </div>

              <nav className="cd-top-pills">
                {userRole === 'laboral' ? (
                  <>
                    <button className={`cd-nav-pill ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>Dashboard</button>
                    <button className={`cd-nav-pill ${activeView === 'patients' ? 'active' : ''}`} onClick={() => setActiveView('patients')}>Pacientes</button>
                    <button className={`cd-nav-pill ${activeView === 'companies' ? 'active' : ''}`} onClick={() => setActiveView('companies')}>Empresas</button>
                    <button className={`cd-nav-pill ${activeView === 'surveillance' ? 'active' : ''}`} onClick={() => setActiveView('surveillance')}>Vigilancia</button>
                    <button className={`cd-nav-pill ${activeView === 'consultas' ? 'active' : ''}`} onClick={() => setActiveView('consultas')}>Consultas</button>
                    <button className={`cd-nav-pill ${activeView === 'reposo' ? 'active' : ''}`} onClick={() => setActiveView('reposo')}>Reposo</button>
                    <button className={`cd-nav-pill ${activeView === 'bi_analytics' ? 'active' : ''}`} onClick={() => setActiveView('bi_analytics')}>BI & Analytics</button>
                  </>
                ) : (
                  <>
                    <button className={`cd-nav-pill ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>Consulta Fisiátrica</button>
                    <button className={`cd-nav-pill ${activeView === 'vademecum' ? 'active' : ''}`} onClick={() => setActiveView('vademecum')}>Vademécum</button>
                    <button className={`cd-nav-pill ${activeView === 'reposo' ? 'active' : ''}`} onClick={() => setActiveView('reposo')}>Reposo Fisiátrico</button>
                  </>
                )}
              </nav>
            </div>

            <div className="cd-topbar-right">
              {/* GRUPO DE AVATARES ESTILO CLIENT DESK */}
              <div className="cd-avatar-cluster">
                <span style={{ background: '#e07a5f' }}>YP</span>
                <span style={{ background: '#4a7c9b' }}>SO</span>
                <span style={{ background: '#5b9a6f' }}>MF</span>
                <span style={{ background: '#111827' }}>+{availableCompanies.length || 3}</span>
              </div>

              {userRole === 'laboral' && (
                <div className="cd-company-pill">
                  <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
                    <option value="GENERAL">+ Filtro: Global</option>
                    {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {userRole === 'laboral' && (
                <button className="cd-add-manager-btn" onClick={() => { setPrefilledCedula(undefined); setShowForm(true); }}>
                  <PlusCircle size={15} /> Nueva evaluación
                </button>
              )}

              <div className="cd-user-badge" title="Dra. Yadira Pino - Médico Fisiatra y Ocupacional">
                <div className="cd-user-info">
                  <strong>Dra. Yadira Pino</strong>
                  <small>MSc. Carlos Fuentes</small>
                </div>
                <div className="cd-user-circle">YP</div>
              </div>
            </div>
          </header>

          {loading ? (
            <div style={{ color: 'var(--corporate-blue)', textAlign: 'center', marginTop: '100px', fontWeight: 600 }}>Calculando BI...</div>
          ) : (
            <div className="view-transition-wrapper">
              {!userRole ? (
                <div style={{ color: 'var(--corporate-blue)', textAlign: 'center', marginTop: '100px', fontWeight: 600 }}>Verificando credenciales Zero-Trust...</div>
              ) : userRole === 'fisiatria' ? (
                <>
                  {(activeView === 'dashboard' || activeView === 'vademecum') && <FisiatriaDashboard initialView={activeView === 'vademecum' ? 'vademecum' : 'home'} />}
                  {activeView === 'reposo' && <ReposoModulo selectedCompany="GENERAL" />}
                </>
              ) : (
                <>
                  {activeView === 'dashboard' && (
                    <div className="cd-bento-wrapper fade-in">
                      {/* ENCABEZADO ESTILO CLIENT DESK */}
                      <div className="cd-header-row">
                        <div>
                          <div className="cd-breadcrumb">
                            <span>Inicio</span> <span>→</span> <span>Dashboard Clínico</span>
                          </div>
                          <h2 className="cd-main-title">Panel Clínico Ocupacional</h2>
                        </div>
                        <div className="cd-header-actions">
                          <button className="cd-circle-btn" onClick={() => setActiveView('patients')} title="Buscar Paciente">
                            <Search size={17} />
                          </button>
                          <div className="cd-pill-select">
                            <CalendarDays size={15} />
                            <span>{new Date().toLocaleDateString('es-VE', { month: 'short', year: 'numeric' }).toUpperCase()}</span>
                          </div>
                          <button className="cd-pill-light" onClick={() => setActiveView('surveillance')}>
                            + Vigilancia
                          </button>
                          <button className="cd-pill-dark" onClick={() => { setPrefilledCedula(undefined); setShowForm(true); }}>
                            Nueva evaluación
                          </button>
                        </div>
                      </div>

                      {/* BENTO GRID 4 COLUMNAS ESTILO SCROLLTIDE CLIENT DESK */}
                      <div className="cd-bento-grid">
                        {/* 1. TARJETA VERTICAL LAVANDA (IZQUIERDA, 2 FILAS DE ALTO) */}
                        <div className="cd-card cd-card-lavender">
                          <div className="cd-card-top">
                            <span className="cd-card-label">Búnker Clínico</span>
                            <span className="cd-mini-close">✦</span>
                          </div>

                          <div className="cd-crystal-stage">
                            <div className="cd-crystal-diamond">
                              <div className="cd-crystal-facet-left" />
                              <div className="cd-crystal-facet-right" />
                            </div>
                            <div className="cd-crystal-pedestal" />
                          </div>

                          <div className="cd-lavender-inner">
                            <div className="cd-inner-header">
                              <strong>Salud Ocupacional</strong>
                              <span className="cd-lime-badge">● Activo</span>
                            </div>
                            <p className="cd-inner-sub">Control integral INPSASEL, aptitud médica y vigilancia epidemiológica.</p>
                            <div className="cd-dashed-wave" />
                            <button className="cd-learn-btn" onClick={() => { setPrefilledCedula(undefined); setShowForm(true); }}>
                              <span>Evaluar paciente</span>
                              <span className="cd-arrow-dot"><ArrowUpRight size={13} /></span>
                            </button>
                          </div>
                        </div>

                        {/* 2. TARJETA ACTIVIDAD / HISTOGRAMA CON BARRA LIMA */}
                        <div className="cd-card cd-card-white">
                          <div className="cd-card-top">
                            <span className="cd-card-title">Actividad</span>
                            <button className="cd-icon-chip" onClick={() => setActiveView('consultas')}><ArrowUpRight size={14} /></button>
                          </div>
                          <span className="cd-card-sub">Consultas registradas</span>
                          <div className="cd-big-metric">
                            {allConsultations.length}<span className="cd-metric-unit">.total</span>
                          </div>

                          <div style={{ width: '100%', height: 175, marginTop: '8px' }}>
                            <ResponsiveContainer>
                              <BarChart data={consultationData}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                                <Bar dataKey="val" radius={[12, 12, 12, 12]} barSize={32}>
                                  {consultationData.map((_, idx) => (
                                    <Cell key={idx} fill={idx === 0 ? '#c3f53c' : '#f1f3f7'} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* 3. TARJETA POBLACIÓN Y BARRAS DE DISTRIBUCIÓN */}
                        <div className="cd-card cd-card-white">
                          <div className="cd-card-top">
                            <span className="cd-card-title">Población evaluada</span>
                            <button className="cd-icon-chip" onClick={() => setActiveView('patients')}><ArrowUpRight size={14} /></button>
                          </div>
                          <span className="cd-card-sub">Pacientes únicos en nómina</span>
                          <div className="cd-big-metric">
                            {kpis.total_pacientes}<span className="cd-metric-muted">.pac</span>
                          </div>
                          <div className="cd-positive-tag">↗ +{kpis.consultas_mes} este mes</div>

                          <div className="cd-alloc-bars">
                            {(() => {
                              const fem = genderData.find(g => g.name === 'Femenino')?.value || 0;
                              const masc = genderData.find(g => g.name === 'Masculino')?.value || 0;
                              const tot = Math.max(1, fem + masc);
                              const femPct = Math.round((fem / tot) * 100);
                              const mascPct = 100 - femPct;
                              return (
                                <>
                                  <div className="cd-alloc-row" style={{ width: '100%' }}>
                                    <span>Femenino</span>
                                    <strong>{femPct}%</strong>
                                  </div>
                                  <div className="cd-alloc-row" style={{ width: `${Math.max(48, mascPct)}%` }}>
                                    <span>Masculino</span>
                                    <strong>{mascPct}%</strong>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* 4. TARJETA VERDE SALVIA (VIRTUAL MEDICAL CARD) */}
                        <div className="cd-card cd-card-sage" onClick={() => setActiveView('reposo')} style={{ cursor: 'pointer' }}>
                          <div className="cd-card-top">
                            <span className="cd-sage-chip">LOPCYMAT</span>
                            <div className="cd-double-circle">
                              <span /><span />
                            </div>
                          </div>

                          <div className="cd-floating-arrow">
                            <ArrowUpRight size={15} />
                          </div>

                          <div className="cd-sage-bottom">
                            <div className="cd-big-metric">
                              {kpis.dias_reposo}<span className="cd-metric-sage-muted">.días</span>
                            </div>
                            <div className="cd-sage-footer">
                              <span>••• Reposos</span>
                              <span>{kpis.ausentismo}% Ausent.</span>
                            </div>
                          </div>
                        </div>

                        {/* 5. TARJETA ANCHA CENTRAL INFERIOR (CURVA + PÍLDORAS) */}
                        <div className="cd-card cd-card-white cd-span-2">
                          <div className="cd-card-top">
                            <span className="cd-card-title">Evolución de consultas recientes</span>
                            <button className="cd-icon-chip" onClick={() => setActiveView('bi_analytics')}><ArrowUpRight size={14} /></button>
                          </div>
                          <span className="cd-card-sub">Actividad clínica del período</span>

                          <div className="cd-spent-body">
                            <div className="cd-spent-left">
                              <div className="cd-big-metric">
                                {kpis.consultas_mes}<span className="cd-metric-muted">.mes</span>
                              </div>
                              <div className="cd-negative-tag">↘ {kpis.ausentismo}% tasa ausentismo</div>

                              <div className="cd-pill-stats">
                                <div className="cd-stat-pill" onClick={() => setActiveView('companies')} style={{ cursor: 'pointer' }}>
                                  <strong>{availableCompanies.length}</strong> <span>Empresas</span>
                                </div>
                                <div className="cd-stat-pill" onClick={() => setActiveView('patients')} style={{ cursor: 'pointer' }}>
                                  <strong>{kpis.total_pacientes}</strong> <span>Pacientes</span>
                                </div>
                              </div>
                            </div>

                            <div className="cd-spent-chart">
                              <ResponsiveContainer width="100%" height={150}>
                                <AreaChart data={consultationData}>
                                  <defs>
                                    <linearGradient id="cdCurveGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#111827" stopOpacity={0.16} />
                                      <stop offset="100%" stopColor="#111827" stopOpacity={0.0} />
                                    </linearGradient>
                                  </defs>
                                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                  <YAxis hide />
                                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                                  <Area type="monotone" dataKey="val" stroke="#111827" strokeWidth={2.2} fill="url(#cdCurveGrad)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        {/* 6. TARJETA BURBUJAS TURQUESA (DERECHA INFERIOR) */}
                        <div className="cd-card cd-card-white">
                          <div className="cd-card-top">
                            <span className="cd-card-title">Distribución clínica</span>
                            <button className="cd-icon-chip" onClick={() => setActiveView('surveillance')}><ArrowUpRight size={14} /></button>
                          </div>
                          <span className="cd-card-sub">Balance operativo</span>

                          <div className="cd-bubbles-stage">
                            <div className="cd-bubble cd-bubble-sm">
                              <strong>{kpis.ausentismo}%</strong>
                            </div>
                            <div className="cd-bubble cd-bubble-lg">
                              <strong>{Math.max(1, 100 - Math.round(kpis.ausentismo))}%</strong>
                            </div>
                            <div className="cd-bubble cd-bubble-md">
                              <strong>{availableCompanies.length}</strong>
                            </div>
                          </div>

                          <div className="cd-contract-metrics">
                            <div>
                              <strong>{allConsultations.length}</strong>
                              <span>Consultas</span>
                            </div>
                            <div>
                              <strong>{kpis.total_pacientes}</strong>
                              <span>Pacientes</span>
                            </div>
                            <div>
                              <strong>{kpis.dias_reposo}</strong>
                              <span>Días Rep.</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* TABLA COMPACTA DE ÚLTIMAS EVALUACIONES */}
                      <section className="cd-card cd-card-white" style={{ marginTop: '20px' }}>
                        <div className="cd-card-top" style={{ marginBottom: '12px' }}>
                          <span className="cd-card-title">Últimas evaluaciones registradas</span>
                          <button className="cd-pill-light" onClick={() => setActiveView('consultas')}>Ver historial completo →</button>
                        </div>
                        <table className="data-table">
                          <thead><tr><th>Fecha</th><th>Paciente</th><th>Empresa</th><th>Patología</th><th>Días</th></tr></thead>
                          <tbody>
                            {latestConsultations.map(c => (
                              <tr key={c.id}>
                                <td>{c.fecha_consulta.split('T')[0]}</td>
                                <td style={{ fontWeight: 600 }}>{c.pacientes?.nombre_completo}</td>
                                <td>{c.empresas?.nombre || 'Particular'}</td>
                                <td>{c.tipo_patologia}</td>
                                <td>{c.dias_reposo}</td>
                              </tr>
                            ))}
                          </tbody>
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

        {showForm && <NewEvaluationForm onClose={() => { setShowForm(false); setPrefilledCedula(undefined); fetchDashboardData(); }} prefilledCedula={prefilledCedula} />}

        {showResetPassword && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ background: '#ffffff', padding: '32px', borderRadius: '28px', width: '90%', maxWidth: '420px', border: '1px solid #e5e7eb', boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)' }}>
              <h2 style={{ color: '#111827', fontSize: '1.35rem', fontWeight: 700, marginBottom: '6px' }}>Cambiar Contraseña</h2>
              <p style={{ color: '#6b7280', fontSize: '0.84rem', marginBottom: '20px' }}>Ingrese su nueva clave de seguridad (mínimo 6 caracteres)</p>
              <form onSubmit={handleUpdatePassword}>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Nueva contraseña..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '13px 16px', marginBottom: '16px', borderRadius: '14px', background: '#f8f9fb', color: '#111827', border: '1px solid #e5e7eb', outline: 'none', fontSize: '0.95rem' }}
                />
                {resetError && <p style={{ color: 'var(--danger)', fontSize: '0.84rem', marginBottom: '12px' }}>{resetError}</p>}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowResetPassword(false)} style={{ flex: 1, padding: '12px', borderRadius: '999px', background: '#ffffff', color: '#4b5563', border: '1px solid #e5e7eb', fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
                  <button type="submit" disabled={resetLoading} style={{ flex: 1, padding: '12px', borderRadius: '999px', background: '#111827', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>{resetLoading ? 'Actualizando...' : 'Actualizar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
}
