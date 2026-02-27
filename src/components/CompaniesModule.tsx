import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BriefcaseMedical, Search, Building2, Users, MapPin, Phone } from 'lucide-react';

export default function CompaniesModule() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('empresas')
            .select('*, pacientes(id)')
            .order('nombre', { ascending: true });

        if (!error && data) {
            // Contar pacientes por empresa
            const processed = data.map((emp: any) => ({
                ...emp,
                workerCount: emp.pacientes?.length || 0
            }));
            setCompanies(processed);
        }
        setLoading(false);
    };

    const filtered = companies.filter(c =>
        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.rif.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ padding: '20px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 700 }}>Gestión de Empresas</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Directorio corporativo y auditoría de personal</p>
                </div>

                <div style={{ position: 'relative', width: '350px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar empresa por nombre o RIF..."
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
                <div style={{ textAlign: 'center', padding: '50px', color: 'var(--corporate-blue)' }}>Sincronizando búnker corporativa...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {filtered.map(emp => (
                        <div key={emp.id} className="stat-card" style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '20px', border: '1px solid var(--border-color)', transition: 'all 0.3s ease', cursor: 'default' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '15px', color: 'var(--medical-turquoise)' }}>
                                    <Building2 size={24} />
                                </div>
                                <span style={{ padding: '5px 12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--corporate-blue)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>{emp.rif}</span>
                            </div>

                            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>{emp.nombre}</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <Users size={16} />
                                    <span>{emp.workerCount} Trabajadores Registrados</span>
                                </div>
                                {emp.sede && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <MapPin size={16} />
                                        <span>{emp.sede}</span>
                                    </div>
                                )}
                                {emp.telefono && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <Phone size={16} />
                                        <span>{emp.telefono}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                                <button style={{ background: 'transparent', border: 'none', color: 'var(--corporate-blue)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    Ver Auditoría <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px dashed var(--border-color)' }}>
                            <BriefcaseMedical size={50} style={{ marginBottom: '15px', opacity: 0.3 }} />
                            <p>No se encontraron empresas en el búnker.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Icono auxiliar interno
function ChevronRight({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
    )
}
