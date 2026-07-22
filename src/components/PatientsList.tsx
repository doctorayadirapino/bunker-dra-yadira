import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, Briefcase, ChevronRight, Trash2, PlusCircle, FilePlus, Edit, X, Building2 } from 'lucide-react';

export default function PatientsList({ selectedCompany = 'GENERAL', onNewConsultation }: { selectedCompany?: string, onNewConsultation?: (cedula: string) => void }) {
    const [patients, setPatients] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [editingPatient, setEditingPatient] = useState<any>(null);
    const [empresasLista, setEmpresasLista] = useState<any[]>([]);

    useEffect(() => {
        fetchPatients();
        fetchEmpresas();
    }, [selectedCompany]);

    const fetchEmpresas = async () => {
        const { data } = await supabase.from('empresas').select('id, nombre').order('nombre');
        if (data) setEmpresasLista(data);
    };

    const fetchPatients = async () => {
        setLoading(true);
        let query = supabase
            .from('pacientes')
            .select('*, empresas(nombre), consultas(aptitud_medica, created_at)')
            .order('nombre_completo', { ascending: true });

        if (selectedCompany !== 'GENERAL') {
            // Buscamos las empresas que tengan ese nombre para filtrar el ID
            const { data: comp } = await supabase.from('empresas').select('id').eq('nombre', selectedCompany).single();
            if (comp) {
                query = query.eq('empresa_id', comp.id);
            }
        }

        const { data, error } = await query;
        if (!error && data) {
            setPatients(data);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string, nombre: string) => {
        const confirmed = window.confirm(`⚠️ ADVERTENCIA DE SEGURIDAD ⚠️\n\n¿Carlos Fuentes, está totalmente seguro de eliminar el EXPEDIENTE COMPLETO de ${nombre}?\n\nEsta acción borrará permanentemente sus datos personales y TODAS sus consultas médicas del sistema de forma irreversible.`);

        if (confirmed) {
            try {
                setLoading(true);
                const { error } = await supabase
                    .from('pacientes')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                alert("Expediente médico eliminado definitivamente.");
                setSelectedPatient(null);
                fetchPatients();
            } catch (err: any) {
                console.error(err);
                alert("Error al eliminar el expediente: " + err.message);
                setLoading(false);
            }
        }
    };

    const handleSavePatient = async () => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('pacientes')
                .update({
                    nombre_completo: editingPatient.nombre_completo.toUpperCase(),
                    cedula: editingPatient.cedula,
                    fecha_nacimiento: editingPatient.fecha_nacimiento || null,
                    sexo: editingPatient.sexo,
                    empresa_id: editingPatient.empresa_id
                })
                .eq('id', editingPatient.id);

            if (error) throw error;
            
            alert("Datos del paciente actualizados exitosamente.");
            setEditingPatient(null);
            if (selectedPatient && selectedPatient.id === editingPatient.id) {
                setSelectedPatient(null); // Refrescar modal si estaba abierto
            }
            fetchPatients();
        } catch (err: any) {
            console.error(err);
            alert("Error al actualizar el paciente: " + err.message);
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
            p.cedula.includes(search);

        // SEGURIDAD CARLOS FUENTES: Doble validación de empresa
        const matchesCompany = selectedCompany === 'GENERAL' || p.empresas?.nombre === selectedCompany;

        return matchesSearch && matchesCompany;
    });

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
                <div style={{ textAlign: 'center', padding: '50px', color: 'var(--corporate-blue)' }}>Consultando archivos del sistema...</div>
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

                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                                        {onNewConsultation && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNewConsultation(p.cedula);
                                                }}
                                                className="btn-new-consultation-mini"
                                                title="Nueva Consulta"
                                                style={{
                                                    background: 'rgba(11, 218, 218, 0.1)',
                                                    color: 'var(--medical-turquoise)',
                                                    border: '1px solid var(--medical-turquoise)',
                                                    borderRadius: '10px',
                                                    padding: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(11, 218, 218, 0.2)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(11, 218, 218, 0.1)'}
                                            >
                                                <FilePlus size={18} />
                                            </button>
                                        )}
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
                <div className="modal-overlay" style={{ zIndex: 3000, padding: '20px' }} onClick={() => setSelectedPatient(null)}>
                    <div className="modal-content" style={{ maxWidth: '700px', borderRadius: '24px', padding: '30px', background: 'var(--bg-primary)' }} onClick={e => e.stopPropagation()}>
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
                                [...selectedPatient.consultas].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((c: any, i: number) => (
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

                        <div style={{ display: 'flex', gap: '15px', marginTop: '30px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => {
                                    if (onNewConsultation) {
                                        onNewConsultation(selectedPatient.cedula);
                                        setSelectedPatient(null);
                                    }
                                }}
                                style={{ flex: 1, padding: '15px', borderRadius: '12px', background: 'var(--corporate-blue)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                <PlusCircle size={20} /> Nueva Consulta
                            </button>
                            <button
                                onClick={() => setEditingPatient({...selectedPatient})}
                                style={{ padding: '15px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--medical-turquoise)', border: '1px solid var(--border-color)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Edit size={20} /> Editar Datos
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete(selectedPatient.id, selectedPatient.nombre_completo);
                                }}
                                style={{ padding: '15px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                title="Eliminar definitivamente"
                            >
                                <Trash2 size={20} /> Eliminar
                            </button>
                            <button
                                onClick={() => setSelectedPatient(null)}
                                style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingPatient && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: 'var(--bg-primary)', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Edit size={20} color="var(--medical-turquoise)" />
                                Editar Datos del Paciente
                            </h3>
                            <button onClick={() => setEditingPatient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Cédula</label>
                                <input
                                    type="text"
                                    value={editingPatient.cedula}
                                    onChange={e => setEditingPatient({...editingPatient, cedula: e.target.value.replace(/\D/g, '')})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Nombre Completo</label>
                                <input
                                    type="text"
                                    value={editingPatient.nombre_completo}
                                    onChange={e => setEditingPatient({...editingPatient, nombre_completo: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Sexo</label>
                                    <select
                                        value={editingPatient.sexo}
                                        onChange={e => setEditingPatient({...editingPatient, sexo: e.target.value})}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                                    >
                                        <option value="M">Masculino</option>
                                        <option value="F">Femenino</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Fecha Nacimiento</label>
                                    <input
                                        type="date"
                                        value={editingPatient.fecha_nacimiento || ''}
                                        onChange={e => setEditingPatient({...editingPatient, fecha_nacimiento: e.target.value})}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Empresa Actual</label>
                                <select
                                    value={editingPatient.empresa_id || ''}
                                    onChange={e => setEditingPatient({...editingPatient, empresa_id: e.target.value || null})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                                >
                                    <option value="">Particular / Sin Empresa</option>
                                    {empresasLista.map(e => (
                                        <option key={e.id} value={e.id}>{e.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <button
                                onClick={handleSavePatient}
                                style={{ width: '100%', padding: '15px', background: 'var(--corporate-blue)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: '10px' }}
                            >
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
