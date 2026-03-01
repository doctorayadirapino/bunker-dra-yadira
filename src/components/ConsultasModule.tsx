import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Printer, Calendar, Filter, Trash2, Edit } from 'lucide-react';
import { generarCertificadoPDF } from '../services/pdfService';
import NewEvaluationForm from './NewEvaluationForm';

export default function ConsultasModule() {
    const [loading, setLoading] = useState(true);
    const [consultas, setConsultas] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('TODOS');
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchConsultas();
    }, []);

    const fetchConsultas = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('consultas')
            .select(`
                *,
                pacientes (nombre_completo, cedula),
                empresas (nombre, rif)
            `)
            .order('fecha_consulta', { ascending: false });

        if (data) setConsultas(data);
        setLoading(false);
    };

    const handlePrint = (c: any) => {
        const conFirma = window.confirm("¿Desea incluir la FIRMA DIGITAL en el certificado?\n\n• [Aceptar]: Para enviar por correo electrónico.\n• [Cancelar]: Para imprimir y sellar físicamente.");

        generarCertificadoPDF({
            paciente: {
                nombre: c.pacientes.nombre_completo,
                cedula: c.pacientes.cedula
            },
            empresa: {
                nombre: c.empresas?.nombre || 'Independiente',
                rif: c.empresas?.rif || 'N/A'
            },
            consulta: {
                tipo: c.tipo_consulta,
                aptitud: c.aptitud_medica,
                observaciones: c.observaciones,
                examen_fisico: c.examen_fisico,
                causa_reposo: c.causa_reposo,
                dias_reposo: c.dias_reposo
            },
            doctora: {
                nombre: "YADIRA PINO",
                especialidad: "Fisiatra",
                ci: "6.871.964",
                mpps: "41.171",
                cmm: "13.012"
            },
            conFirmaDigital: conFirma
        });
    };

    const handleDelete = async (id: string, paciente: string) => {
        const confirmed = window.confirm(`⚠️ ADVERTENCIA DE SEGURIDAD ⚠️\n\n¿Carlos Fuentes, está seguro de eliminar DEFINITIVAMENTE la historia médica de ${paciente}?\n\nEsta acción es irreversible y se eliminará de la base de datos.`);

        if (confirmed) {
            try {
                setLoading(true);
                const { error } = await supabase
                    .from('consultas')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                alert("Registro eliminado exitosamente del sistema.");
                fetchConsultas();
            } catch (err: any) {
                console.error(err);
                alert("Error al eliminar el registro: " + err.message);
                setLoading(false);
            }
        }
    };

    const filtered = consultas.filter(c => {
        const matchesSearch = c.pacientes.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.pacientes.cedula.includes(searchTerm);
        const matchesTipo = filterTipo === 'TODOS' || c.tipo_consulta === filterTipo;
        return matchesSearch && matchesTipo;
    });

    return (
        <div style={{ padding: '20px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 700 }}>Historial de Consultas</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Gestión y reimpresión de certificados médicos</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                    <input
                        placeholder="Buscar por nombre o cédula..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-secondary)', padding: '0 15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <Filter size={18} color="var(--corporate-blue)" />
                    <select
                        value={filterTipo}
                        onChange={e => setFilterTipo(e.target.value)}
                        style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, outline: 'none', padding: '12px 0' }}
                    >
                        <option value="TODOS">Todos los tipos</option>
                        <option value="PRE-EMPLEO">Pre-empleo</option>
                        <option value="PRE-VACACIONAL">Pre-vacacional</option>
                        <option value="POST-VACACIONAL">Post-vacacional</option>
                        <option value="EGRESO">Egreso</option>
                        <option value="CERTIFICADO SALUD">Certificado Salud</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: 'var(--corporate-blue)' }}>Accediendo a los registros...</div>
            ) : (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                                <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>FECHA</th>
                                <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>PACIENTE</th>
                                <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>EMPRESA</th>
                                <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>TIPO / APTITUD</th>
                                <th style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="table-row-hover">
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                                            <Calendar size={14} color="var(--corporate-blue)" />
                                            {new Date(c.fecha_consulta).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.pacientes.nombre_completo}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>V-{c.pacientes.cedula}</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{c.empresas?.nombre || 'Independiente'}</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{c.tipo_consulta}</div>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            background: c.aptitud_medica === 'APTO' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: c.aptitud_medica === 'APTO' ? 'var(--success)' : 'var(--warning)'
                                        }}>
                                            {c.aptitud_medica}
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => handlePrint(c)}
                                                style={{ background: 'var(--corporate-blue)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Printer size={16} /> Imprimir
                                            </button>
                                            <button
                                                onClick={() => setEditingId(c.id)}
                                                style={{ background: 'var(--medical-turquoise)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Edit size={16} /> Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c.id, c.pacientes.nombre_completo)}
                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                title="Eliminar permanentemente"
                                            >
                                                <Trash2 size={16} /> Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editingId && (
                <NewEvaluationForm
                    editConsultaId={editingId}
                    onClose={() => {
                        setEditingId(null);
                        fetchConsultas();
                    }}
                />
            )}
        </div>
    );
}
