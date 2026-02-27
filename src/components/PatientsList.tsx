import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, Briefcase, ChevronRight } from 'lucide-react';

export default function PatientsList() {
    const [patients, setPatients] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('pacientes')
            .select('*, empresas(nombre), consultas(aptitud_medica, created_at)')
            .order('nombre_completo', { ascending: true });

        if (!error && data) {
            setPatients(data);
        }
        setLoading(false);
    };

    const filteredPatients = patients.filter(p =>
        (p.nombre_completo || '').toString().toLowerCase().includes(search.toLowerCase()) ||
        (p.cedula || '').toString().includes(search)
    );

    return (
        <div style={{ padding: '20px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 700 }}>Directorio de Pacientes</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Base de datos histórica de personal evaluado</p>
                </div>

                <div style={{ position: 'relative', width: '350px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o cédula..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px', color: 'var(--corporate-blue)' }}>Consultando archivos del búnker...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                    {filteredPatients.map(p => {
                        const lastConsultation = p.consultas?.[0];
                        return (
                            <div
                                key={p.id}
                                className="patient-list-card"
                                onClick={() => setSelectedPatient(p)}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    padding: '20px',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '12px',
                                        background: 'var(--bg-tertiary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--corporate-blue)'
                                    }}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem' }}>{p.nombre_completo}</h4>
                                        <div style={{ display: 'flex', gap: '15px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                🆔 {p.cedula}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Briefcase size={14} /> {p.empresas?.nombre || 'Particular'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            background: lastConsultation?.aptitud_medica === 'APTO' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: lastConsultation?.aptitud_medica === 'APTO' ? 'var(--success)' : 'var(--warning)',
                                            border: `1px solid ${lastConsultation?.aptitud_medica === 'APTO' ? 'var(--success)' : 'var(--warning)'}`
                                        }}>
                                            {lastConsultation?.aptitud_medica || 'SIN EVALUACIÓN'}
                                        </span>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Último Dictamen</p>
                                    </div>
                                    <ChevronRight size={20} color="var(--text-muted)" />
                                </div>
                            </div>
                        );
                    })}

                    {filteredPatients.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            No se encontraron pacientes con esos criterios.
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE DETALLES Y EVOLUCIÓN */}
            {selectedPatient && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }} onClick={() => setSelectedPatient(null)}>
                    <div style={{ background: 'var(--bg-primary)', width: '100%', maxWidth: '700px', borderRadius: '24px', padding: '30px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>Expediente: {selectedPatient.nombre_completo}</h3>
                            <button onClick={() => setSelectedPatient(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <Briefcase size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Cédula</small>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPatient.cedula}</span>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Empresa Actual</small>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPatient.empresas?.nombre || 'Particular'}</span>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Sexo</small>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPatient.sexo}</span>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Fecha de Nacimiento</small>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPatient.fecha_nacimiento || 'No registrada'}</span>
                            </div>
                        </div>

                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '15px', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px' }}>Evolución de Aptitud Médica</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {selectedPatient.consultas?.length > 0 ? (
                                [...(selectedPatient.consultas || [])].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((c: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                        <div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.aptitud_medica}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.aptitud_medica === 'APTO' ? 'var(--success)' : (c.aptitud_medica === 'NO APTO' ? 'var(--danger)' : 'var(--warning)') }}></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No hay consultas previas registradas.</p>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedPatient(null)}
                            style={{ width: '100%', marginTop: '30px', padding: '15px', borderRadius: '12px', background: 'var(--corporate-blue)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Cerrar Expediente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
