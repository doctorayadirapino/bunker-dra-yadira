import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText } from 'lucide-react';
import { generarReposoPDF } from '../services/pdfService';

export default function ReposoModulo({ selectedCompany = 'GENERAL' }: { selectedCompany?: string }) {
    const [loading, setLoading] = useState(false);
    const [paciente, setPaciente] = useState({
        nombre: '',
        cedula: '',
        empresa: selectedCompany !== 'GENERAL' ? selectedCompany : '',
        diagnostico: '',
        dias: 1,
        desde: new Date().toISOString().split('T')[0],
        hasta: new Date().toISOString().split('T')[0],
        indicaciones: '',
        ciudadEnvio: 'Guarenas',
        tipoDocumento: 'REPOSO' as 'REPOSO' | 'CONSTANCIA',
        condicionAsistente: 'Paciente' as 'Paciente' | 'Familiar',
        ameritaReposo: true
    });

    // Actualizar empresa si cambia el filtro global
    useEffect(() => {
        if (selectedCompany !== 'GENERAL') {
            setPaciente(prev => ({ ...prev, empresa: selectedCompany }));
        }
    }, [selectedCompany]);

    // --- AUTOMATIZACIÓN DE FECHAS DE REPOSO ---
    useEffect(() => {
        if (paciente.desde && paciente.dias > 0) {
            const startDate = new Date(paciente.desde + 'T12:00:00');
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + (paciente.dias - 1));

            const hastaStr = endDate.toISOString().split('T')[0];
            if (paciente.hasta !== hastaStr) {
                setPaciente(prev => ({ ...prev, hasta: hastaStr }));
            }
        }
    }, [paciente.desde, paciente.dias]);

    const handleCedulaSearch = async (cedula: string) => {
        setPaciente(prev => ({ ...prev, cedula }));
        if (cedula.length > 5) {
            let query = supabase
                .from('pacientes')
                .select('nombre_completo, empresas(nombre)')
                .eq('cedula', cedula);

            const { data } = await query.single();

            if (data) {
                const empresaPaciente = (data.empresas as any)?.nombre || '';

                // Si hay filtro de empresa y el paciente no coincide, avisamos
                if (selectedCompany !== 'GENERAL' && empresaPaciente !== selectedCompany) {
                    alert(`⚠️ ATENCIÓN CARLOS FUENTES: El paciente ${data.nombre_completo} pertenece a la empresa "${empresaPaciente}", pero usted tiene seleccionada "${selectedCompany}" en el panel central.`);
                }

                setPaciente(prev => ({
                    ...prev,
                    nombre: data.nombre_completo,
                    empresa: empresaPaciente
                }));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        generarReposoPDF({
            paciente: {
                nombre: paciente.nombre,
                cedula: paciente.cedula,
                empresa: paciente.empresa
            },
            reposo: {
                diagnostico: paciente.diagnostico,
                dias: paciente.dias,
                desde: paciente.desde,
                hasta: paciente.hasta,
                indicaciones: paciente.indicaciones,
                ciudad: paciente.ciudadEnvio,
                tipo: paciente.tipoDocumento,
                condicion: paciente.condicionAsistente,
                ameritaReposo: paciente.ameritaReposo
            },
            doctora: {
                nombre: "YADIRA PINO",
                especialidad: "Fisiatra",
                ci: "6.871.964",
                mpps: "41.171",
                cmm: "13.012"
            }
        });

        setLoading(false);
    };

    return (
        <div style={{ padding: '20px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 700 }}>Emisión de Reposo Médico</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Generación de justificativo para firma y sello húmedo (Sin Firma Digital)</p>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border-color)', maxWidth: '800px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', background: 'var(--bg-primary)', padding: '10px', borderRadius: '15px', border: '1px solid var(--border-color)' }}>
                        <button
                            type="button"
                            onClick={() => setPaciente({ ...paciente, tipoDocumento: 'REPOSO' })}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: paciente.tipoDocumento === 'REPOSO' ? 'var(--corporate-blue)' : 'transparent', color: paciente.tipoDocumento === 'REPOSO' ? 'white' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            REPOSO MÉDICO
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaciente({ ...paciente, tipoDocumento: 'CONSTANCIA' })}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: paciente.tipoDocumento === 'CONSTANCIA' ? 'var(--medical-turquoise)' : 'transparent', color: paciente.tipoDocumento === 'CONSTANCIA' ? 'white' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            CONSTANCIA DE ASISTENCIA
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Cédula del Paciente</label>
                            <input
                                required
                                value={paciente.cedula}
                                onChange={e => handleCedulaSearch(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                placeholder="V-00.000.000"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Condición de Asistencia</label>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                    <input type="radio" checked={paciente.condicionAsistente === 'Paciente'} onChange={() => setPaciente({ ...paciente, condicionAsistente: 'Paciente' })} /> Paciente
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                    <input type="radio" checked={paciente.condicionAsistente === 'Familiar'} onChange={() => setPaciente({ ...paciente, condicionAsistente: 'Familiar' })} /> Familiar
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Nombre Completo</label>
                            <input
                                required
                                value={paciente.nombre}
                                onChange={e => setPaciente({ ...paciente, nombre: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>¿Amerita Reposo Médico?</label>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                    <input type="radio" checked={paciente.ameritaReposo === true} onChange={() => setPaciente({ ...paciente, ameritaReposo: true })} /> Sí
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                    <input type="radio" checked={paciente.ameritaReposo === false} onChange={() => setPaciente({ ...paciente, ameritaReposo: false })} /> No (Solo Asistencia)
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Empresa (Opcional)</label>
                        <input
                            value={paciente.empresa}
                            onChange={e => setPaciente({ ...paciente, empresa: e.target.value })}
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    {paciente.tipoDocumento === 'REPOSO' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Días de Reposo</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={paciente.dias}
                                    onChange={e => setPaciente({ ...paciente, dias: parseInt(e.target.value) })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Desde</label>
                                <input
                                    type="date"
                                    value={paciente.desde}
                                    onChange={e => setPaciente({ ...paciente, desde: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Hasta</label>
                                <input
                                    readOnly
                                    type="date"
                                    value={paciente.hasta}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Diagnóstico / Causa</label>
                        <input
                            required
                            value={paciente.diagnostico}
                            onChange={e => setPaciente({ ...paciente, diagnostico: e.target.value })}
                            placeholder="Ej: Lumbalgia Mecánica, Síndrome Febril..."
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Ciudad de Expedición</label>
                        <input
                            value={paciente.ciudadEnvio}
                            onChange={e => setPaciente({ ...paciente, ciudadEnvio: e.target.value })}
                            placeholder="Ej: Guarenas, Los Teques, Caracas..."
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Indicaciones Adicionales</label>
                        <textarea
                            rows={3}
                            value={paciente.indicaciones}
                            onChange={e => setPaciente({ ...paciente, indicaciones: e.target.value })}
                            placeholder="Reposo absoluto, tratamiento médico..."
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'none' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', background: 'var(--corporate-blue)', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        <FileText size={20} /> Generar Reposo para Firma Húmeda
                    </button>
                    <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        ⚠️ Este documento NO incluye firma digital para permitir el sello húmedo oficial.
                    </p>
                </form>
            </div>
        </div>
    );
}
