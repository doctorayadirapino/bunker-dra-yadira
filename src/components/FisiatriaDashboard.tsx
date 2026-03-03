import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    PlusCircle,
    Search
} from 'lucide-react';

export default function FisiatriaDashboard() {
    const [view, setView] = useState<'home' | 'pacientes' | 'vademecum'>('home');
    const [patients, setPatients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        const { data } = await supabase
            .from('fisiatria_pacientes')
            .select('*')
            .order('nombre_completo', { ascending: true });
        if (data) setPatients(data);
    };

    const filteredPatients = patients.filter(p =>
        p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cedula.includes(searchTerm)
    );

    return (
        <div className="fisiatria-container fade-in" style={{ padding: '20px' }}>
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ color: 'var(--fisiatria-purple)', fontSize: '2rem', fontWeight: 800 }}>BÚNKER FISIATRÍA</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Especialidad en Rehabilitación y Medicina Física</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setView('home')} className={`nav-pill ${view === 'home' ? 'active' : ''}`}>Dashboard</button>
                    <button onClick={() => setView('pacientes')} className={`nav-pill ${view === 'pacientes' ? 'active' : ''}`}>Pacientes</button>
                    <button onClick={() => setView('vademecum')} className={`nav-pill ${view === 'vademecum' ? 'active' : ''}`}>Vademécum</button>
                </div>
            </header>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card-purple">
                    <Users className="icon" />
                    <div className="info">
                        <span className="label">Pacientes</span>
                        <span className="value">{patients.length}</span>
                    </div>
                </div>
            </div>

            {view === 'home' && (
                <div className="history-section">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3>Módulo de Historias Clínicas</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div className="search-box">
                                <Search size={16} />
                                <input
                                    placeholder="Buscar paciente por cédula..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="btn-purple-action" onClick={() => { }}>
                                <PlusCircle size={18} /> Nueva Historia
                            </button>
                        </div>
                    </div>

                    <div className="patients-mini-list">
                        {filteredPatients.length === 0 ? (
                            <p>No se encontraron pacientes.</p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Cédula</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatients.map(p => (
                                        <tr key={p.id}>
                                            <td>{p.nombre_completo}</td>
                                            <td>{p.cedula}</td>
                                            <td>
                                                <button className="nav-pill" style={{ fontSize: '0.8rem' }}>Ver Historia</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                :root {
                    --fisiatria-purple: #8b5cf6;
                    --fisiatria-purple-light: #f5f3ff;
                    --fisiatria-purple-border: #ddd6fe;
                }
                .fisiatria-container {
                    background: #fdfbff;
                    min-height: 80vh;
                }
                .nav-pill {
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 1px solid var(--fisiatria-purple-border);
                    background: white;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s;
                }
                .nav-pill.active {
                    background: var(--fisiatria-purple);
                    color: white;
                    border-color: var(--fisiatria-purple);
                }
                .stat-card-purple {
                    background: white;
                    border: 1px solid var(--fisiatria-purple-border);
                    padding: 20px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .stat-card-purple .icon {
                    color: var(--fisiatria-purple);
                    background: var(--fisiatria-purple-light);
                    padding: 10px;
                    border-radius: 12px;
                    width: 45px;
                    height: 45px;
                }
                .btn-purple-action {
                    background: var(--fisiatria-purple);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-weight: bold;
                }
                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: white;
                    border: 1px solid var(--fisiatria-purple-border);
                    padding: 0 15px;
                    border-radius: 12px;
                }
                .search-box input {
                    border: none;
                    outline: none;
                    padding: 10px 0;
                    font-size: 0.9rem;
                    background: transparent;
                }
            `}</style>
        </div>
    );
}
