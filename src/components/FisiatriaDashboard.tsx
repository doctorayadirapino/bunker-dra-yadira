import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    Search,
    UserPlus,
    Pill,
    Activity,
    BookOpen
} from 'lucide-react';
import FisiatriaPatientModal from './FisiatriaPatientModal';
import FisiatriaHistoryModal from './FisiatriaHistoryModal';

export default function FisiatriaDashboard({ initialView }: { initialView?: 'home' | 'pacientes' | 'vademecum' }) {
    const [view, setView] = useState<'home' | 'pacientes' | 'vademecum'>(initialView || 'home');

    useEffect(() => {
        if (initialView) setView(initialView);
    }, [initialView]);
    const [patients, setPatients] = useState<any[]>([]);
    const [vademecum, setVademecum] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [vademecumSearch, setVademecumSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPatients();
        fetchVademecum();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('fisiatria_pacientes')
            .select('*')
            .order('nombre_completo', { ascending: true });
        if (data) setPatients(data);
        setLoading(false);
    };

    const fetchVademecum = async () => {
        const { data } = await supabase
            .from('fisiatria_vademecum')
            .select('*')
            .order('nombre_medicamento', { ascending: true });
        if (data) setVademecum(data);
    };

    const filteredPatients = patients.filter((p: any) =>
        p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cedula.includes(searchTerm)
    );

    const filteredVademecum = vademecum.filter((v: any) =>
        v.nombre_medicamento.toLowerCase().includes(vademecumSearch.toLowerCase())
    );

    return (
        <div className="fisiatria-container fade-in" style={{ padding: '20px' }}>
            {/* Cabecera Interna */}
            <div style={{ marginBottom: '40px', borderLeft: '8px solid #e91e63', paddingLeft: '25px' }}>
                <h2 style={{ color: '#e91e63', fontSize: '2.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>CONSULTA FISIATRICA</h2>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Gestión Inteligente de Rehabilitación y Medicina Física</p>
            </div>
            {/* v6.4: Unified sidebar navigation replaces internal pills */}
            <div style={{ display: 'none' }}>
                <button onClick={() => setView('home')} className={`nav-pill ${view === 'home' ? 'active' : ''}`}>
                    <Activity size={16} /> Resumen
                </button>
                <button onClick={() => setView('pacientes')} className={`nav-pill ${view === 'pacientes' ? 'active' : ''}`}>
                    <Users size={16} /> Pacientes
                </button>
                <button onClick={() => setView('vademecum')} className={`nav-pill ${view === 'vademecum' ? 'active' : ''}`}>
                    <BookOpen size={16} /> Vademécum
                </button>
            </div>

            {/* KPIs Rápidos */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card-fisiatria">
                    <Users className="icon" />
                    <div className="info">
                        <span className="label">Historias Clínicas</span>
                        <span className="value">{patients.length}</span>
                    </div>
                </div>
                <div className="stat-card-fisiatria" style={{ borderColor: '#10b981' }}>
                    <Pill className="icon" style={{ color: '#10b981', background: '#ecfdf5' }} />
                    <div className="info">
                        <span className="label">Vademécum (Base)</span>
                        <span className="value">{vademecum.length}</span>
                    </div>
                </div>
                <div className="stat-card-fisiatria" style={{ borderColor: '#e91e63' }}>
                    <Activity className="icon" style={{ color: '#e91e63', background: '#fff1f2' }} />
                    <div className="info">
                        <span className="label">Estado del Búnker</span>
                        <span className="value">ACTIVO</span>
                    </div>
                </div>
            </div>

            {/* VISTA: HOME / DASHBOARD */}
            {
                view === 'home' && (
                    <div className="history-section animate-slide-up">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', background: '#fff1f2', padding: '20px', borderRadius: '15px', border: '1px solid #fecdd3' }}>
                            <div>
                                <h3 style={{ color: '#e91e63', fontWeight: 800 }}>BÚSQUEDA RÁPIDA DE HISTORIAS</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Localice al paciente por Cédula o Nombre para iniciar consulta</p>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div className="search-box-large">
                                    <Search size={20} color="#e91e63" />
                                    <input
                                        placeholder="Cédula o Nombre del paciente..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button className="btn-brand-action" onClick={() => setIsPatientModalOpen(true)} style={{ background: '#e91e63', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(233, 30, 99, 0.2)' }}>
                                    <UserPlus size={20} /> NUEVA HISTORIA
                                </button>
                            </div>
                        </div>

                        <div className="patients-grid">
                            {loading ? (
                                <p style={{ textAlign: 'center', padding: '40px' }}>Sincronizando historias...</p>
                            ) : filteredPatients.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '20px', border: '1px dashed var(--border-color)' }}>
                                    <Users size={50} color="var(--text-muted)" style={{ marginBottom: '15px', opacity: 0.3 }} />
                                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No hay pacientes que coincidan con la búsqueda.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                                    {filteredPatients.map(p => (
                                        <div key={p.id} className="patient-card" onClick={() => { setSelectedPatient(p); setIsHistoryModalOpen(true); }}>
                                            <div className="avatar">{p.nombre_completo.charAt(0)}</div>
                                            <div className="details">
                                                <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>{p.nombre_completo}</h4>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>C.I: {p.cedula}</span>
                                            </div>
                                            <div className="action-tag">VER HISTORIA</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* VISTA: VADEMECUM (AUTO-LEARN VIEW) */}
            {
                view === 'vademecum' && (
                    <div className="vademecum-view animate-slide-up" style={{ background: 'white', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <div>
                                <h3 style={{ color: '#0284c7', fontWeight: 900, fontSize: '1.5rem' }}>BASE DE DATOS VADEMÉCUM</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>Medicamentos e indicaciones guardados por el sistema (Aprendizaje Automático)</p>
                            </div>
                            <div className="search-box-large">
                                <Search size={20} color="#0284c7" />
                                <input
                                    placeholder="Buscar medicamento..."
                                    value={vademecumSearch}
                                    onChange={(e) => setVademecumSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <table className="vademecum-table">
                            <thead>
                                <tr>
                                    <th>Medicamento</th>
                                    <th>Última Indicación Sugerida</th>
                                    <th>Aprendido en</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVademecum.map(v => (
                                    <tr key={v.id}>
                                        <td style={{ fontWeight: 800, color: '#065f46' }}>{v.nombre_medicamento}</td>
                                        <td style={{ color: 'var(--text-primary)' }}>{v.indicaciones_sugeridas || 'Sin sugerencia'}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {new Date(v.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            }

            {/* MODALS */}
            {
                isPatientModalOpen && (
                    <FisiatriaPatientModal
                        onClose={() => setIsPatientModalOpen(false)}
                        onSuccess={fetchPatients}
                    />
                )
            }

            {
                isHistoryModalOpen && selectedPatient && (
                    <FisiatriaHistoryModal
                        patient={selectedPatient}
                        onClose={() => setIsHistoryModalOpen(false)}
                    />
                )
            }

            <style>{`
                :root {
                    --fisiatria-pink: #e91e63;
                    --fisiatria-pink-light: #fff1f2;
                    --fisiatria-pink-border: #fecdd3;
                }
                .nav-pill {
                    padding: 10px 20px;
                    border-radius: 12px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s;
                }
                .nav-pill.active {
                    background: var(--fisiatria-pink);
                    color: white;
                    box-shadow: 0 4px 12px rgba(233, 30, 99, 0.2);
                }
                .stat-card-fisiatria {
                    background: white;
                    border: 1px solid var(--fisiatria-pink-border);
                    padding: 24px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }
                .stat-card-fisiatria .icon {
                    color: var(--fisiatria-pink);
                    background: var(--fisiatria-pink-light);
                    padding: 12px;
                    border-radius: 15px;
                    width: 50px;
                    height: 50px;
                }
                .stat-card-fisiatria .label {
                    display: block;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .stat-card-fisiatria .value {
                    font-size: 1.8rem;
                    font-weight: 900;
                    color: var(--text-primary);
                }
                .btn-brand-action {
                    background: var(--fisiatria-pink);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    font-weight: 900;
                    box-shadow: 0 4px 10px rgba(233, 30, 99, 0.3);
                }
                .search-box-large {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: white;
                    border: 2px solid var(--fisiatria-pink-border);
                    padding: 0 20px;
                    border-radius: 15px;
                    min-width: 350px;
                }
                .search-box-large input {
                    border: none;
                    outline: none;
                    padding: 14px 0;
                    font-size: 1rem;
                    width: 100%;
                }
                .patient-card {
                    background: white;
                    border: 1px solid var(--border-color);
                    padding: 20px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                .patient-card:hover {
                    border-color: var(--fisiatria-pink);
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(233, 30, 99, 0.1);
                }
                .patient-card .avatar {
                    width: 50px;
                    height: 50px;
                    background: var(--fisiatria-pink);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 15px;
                    font-weight: 900;
                    font-size: 1.5rem;
                }
                .action-tag {
                    position: absolute;
                    right: 20px;
                    font-size: 0.65rem;
                    font-weight: 900;
                    color: var(--fisiatria-pink);
                    background: var(--fisiatria-pink-light);
                    padding: 5px 10px;
                    border-radius: 8px;
                }
                .vademecum-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .vademecum-table th {
                    text-align: left;
                    padding: 15px;
                    background: #fdf2f8;
                    border-bottom: 2px solid #fbcfe8;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    color: #be185d;
                }
                .vademecum-table td {
                    padding: 15px;
                    border-bottom: 1px solid #f1f5f9;
                }
                .animate-slide-up {
                    animation: slideUp 0.4s ease-out;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div >
    );
}
