import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, History, FilePlus } from 'lucide-react';
import { generarReposoPDF } from '../services/pdfService';

export default function ReposoModulo({ selectedCompany = 'GENERAL', userRole = 'laboral' }: { selectedCompany?: string, userRole?: string | null }) {
    const [activeTab, setActiveTab] = useState<'nuevo' | 'historial'>('nuevo');
    const [historial, setHistorial] = useState<any[]>([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
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
    const [useDigitalSignature, setUseDigitalSignature] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // v6.7: PROTOCOLO DE CONSENTIMIENTO EXPLÍCITO (FIRMA)
        if (!useDigitalSignature) {
            const confirmManual = window.confirm("⚠️ Ud. no ha activado la Firma Digital. ¿Desea generar el documento para FIRMA MANUSCRITA y SELLO HÚMEDO?");
            if (!confirmManual) return;
        }

        setLoading(true);

        // v8.7: GUARDADO EN BASE DE DATOS (AUDITORÍA OFICIAL)
        try {
            const { error } = await supabase.from('historial_reposos').insert({
                nombre_paciente: paciente.nombre,
                cedula_paciente: paciente.cedula,
                diagnostico: paciente.diagnostico,
                fecha_desde: paciente.desde,
                fecha_hasta: paciente.hasta,
                dias_reposo: paciente.dias,
                tipo_documento: paciente.tipoDocumento,
                empresa: paciente.empresa,
                con_firma_digital: useDigitalSignature,
                emitido_por: userRole
            });

            if (error) {
                if (error.code === '42P01') {
                    alert('⚠️ ATENCIÓN CARLOS FUENTES: La tabla "historial_reposos" no existe en Supabase. El sistema generará el PDF pero no lo guardará en el historial hasta que se ejecute la migración SQL requerida.');
                } else {
                    console.error('Error insertando reposo:', error);
                }
            }
        } catch (e) {
            console.error('Crash guardando reposo:', e);
        }

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
                ci: 6871964,
                mpps: 41171,
                cmm: 13012
            },
            conFirmaDigital: useDigitalSignature
        });

        setLoading(false);
        if (activeTab === 'historial') fetchHistorial(); // Refrescar si estábamos allí
    };

    const fetchHistorial = async () => {
        setLoadingHistorial(true);
        try {
            let query = supabase.from('historial_reposos').select('*').order('created_at', { ascending: false });
            if (selectedCompany !== 'GENERAL') {
                query = query.eq('empresa', selectedCompany);
            }
            if (userRole === 'fisiatria') {
                query = query.eq('emitido_por', 'fisiatria');
            } else {
                query = query.neq('emitido_por', 'fisiatria'); // Laboral o nulo
            }

            const { data, error } = await query;
            if (error && error.code !== '42P01') throw error;
            if (data) setHistorial(data);
        } catch (e: any) {
            console.error('Error fetching historial:', e.message);
        }
        setLoadingHistorial(false);
    };

    useEffect(() => {
        if (activeTab === 'historial') {
            fetchHistorial();
        }
    }, [activeTab, selectedCompany]);

    return (
        <div style={{ padding: '20px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ marginBottom: '30px', borderLeft: `8px solid ${userRole === 'fisiatria' ? '#e91e63' : 'var(--corporate-blue)'}`, paddingLeft: '20px' }}>
                <h2 style={{ color: userRole === 'fisiatria' ? '#e91e63' : 'var(--corporate-blue)', fontSize: '1.8rem', fontWeight: 900 }}>
                    {userRole === 'fisiatria' ? 'REPOSO MÉDICO FISIÁTRICO' : 'REPOSO MÉDICO LABORAL'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Generación de justificativos oficiales con respaldo en Búnker</p>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                <button
                    onClick={() => setActiveTab('nuevo')}
                    style={{ flex: 1, padding: '15px', borderRadius: '15px', border: 'none', background: activeTab === 'nuevo' ? 'var(--corporate-blue)' : 'var(--bg-secondary)', color: activeTab === 'nuevo' ? 'white' : 'var(--text-secondary)', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                    <FilePlus size={20} /> NUEVO DOCUMENTO
                </button>
                <button
                    onClick={() => setActiveTab('historial')}
                    style={{ flex: 1, padding: '15px', borderRadius: '15px', border: 'none', background: activeTab === 'historial' ? (userRole === 'fisiatria' ? '#e91e63' : 'var(--corporate-blue)') : 'var(--bg-secondary)', color: activeTab === 'historial' ? 'white' : 'var(--text-secondary)', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                    <History size={20} /> VER HISTORIAL EXÁMENES
                </button>
            </div>

            {activeTab === 'nuevo' && (
                <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border-color)', maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.4s' }}>
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

                        {/* v6.4: Opción de Firma Digital */}
                        <div style={{ padding: '15px', background: 'var(--bg-secondary)', borderRadius: '15px', border: '1px solid var(--border-color)', marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: useDigitalSignature ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={20} color={useDigitalSignature ? '#10b981' : '#64748b'} />
                                </div>
                                <div>
                                    <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.95rem' }}>Incluir Firma Digital</h4>
                                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.8rem' }}>{useDigitalSignature ? 'El documento incluirá el sello y firma digital' : 'Documento para firma manuscrita y sello húmedo'}</p>
                                </div>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={useDigitalSignature}
                                    onChange={(e) => setUseDigitalSignature(e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', padding: '16px', borderRadius: '15px', border: 'none', background: 'linear-gradient(135deg, var(--corporate-blue), var(--medical-turquoise))', color: 'white', fontWeight: 800, fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(2, 132, 199, 0.2)', transition: 'all 0.3s' }}
                        >
                            {loading ? 'GENERANDO DOCUMENTO...' : 'GENERAR E IMPRIMIR DOCUMENTO'}
                        </button>
                        <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {useDigitalSignature
                                ? '✅ Firma Digital activada para emisión inmediata.'
                                : '⚠️ Firma Manuscrita requerida para validez oficial.'}
                        </p>
                    </form>
                </div>
            )}

            {activeTab === 'historial' && (
                <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border-color)', animation: 'fadeIn 0.4s' }}>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><History size={24} color="var(--corporate-blue)" /> Historial de Documentos Emitidos</h3>

                    {loadingHistorial ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Cargando registros oficiales...</p>
                    ) : historial.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '15px', border: '1px dashed var(--border-color)' }}>
                            <History size={48} color="#cbd5e1" style={{ margin: '0 auto 15px' }} />
                            <h4 style={{ color: 'var(--text-secondary)', margin: 0 }}>No hay reposos o constancias registrados.</h4>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '10px' }}>Si cree que esto es un error, contacte al desarrollador Carlos Fuentes para verificar la tabla 'historial_reposos'.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                <thead>
                                    <tr style={{ background: userRole === 'fisiatria' ? '#fdf2f8' : '#f0f9ff', borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 800 }}>Fecha de Emisión</th>
                                        <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 800 }}>Paciente</th>
                                        <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 800 }}>Días / Desde-Hasta</th>
                                        <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 800 }}>Diagnóstico</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 800 }}>Tipo</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 800 }}>Firma Ext.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historial.map((reg) => (
                                        <tr key={reg.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>{new Date(reg.created_at).toLocaleString('es-VE')}</td>
                                            <td style={{ padding: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{reg.nombre_paciente} <br /><span style={{ fontSize: '0.8rem', color: '#64748b' }}>V-{reg.cedula_paciente}</span></td>
                                            <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>
                                                {reg.tipo_documento === 'REPOSO' ? (
                                                    <><strong style={{ color: userRole === 'fisiatria' ? '#e91e63' : 'var(--corporate-blue)' }}>{reg.dias_reposo} días</strong><br /><span style={{ fontSize: '0.85rem' }}>{new Date(reg.fecha_desde + 'T12:00:00').toLocaleDateString()} ▸ {new Date(reg.fecha_hasta + 'T12:00:00').toLocaleDateString()}</span></>
                                                ) : (
                                                    <span style={{ color: 'var(--medical-turquoise)', fontWeight: 700 }}>CONSTANCIA</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '15px', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{reg.diagnostico}</td>
                                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                                <span style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, background: reg.tipo_documento === 'REPOSO' ? '#eff6ff' : '#ecfdf5', color: reg.tipo_documento === 'REPOSO' ? '#1d4ed8' : '#047857' }}>
                                                    {reg.tipo_documento}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                                {reg.con_firma_digital ? '✅ DIG' : '🖋️ MANUS'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
