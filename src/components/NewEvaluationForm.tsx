import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Printer, Mail } from 'lucide-react';
import './NewEvaluationForm.css';
import { generarCertificadoPDF } from '../services/pdfService';

interface FormProps {
    onClose: () => void;
}

export default function NewEvaluationForm({ onClose }: FormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useDigitalSignature, setUseDigitalSignature] = useState(false);

    // Form State
    const [paciente, setPaciente] = useState({ nombre_completo: '', cedula: '', sexo: 'Femenino', alergias: '', patologias_previas: '', fecha_nacimiento: '', telefono: '' });
    const [empresa, setEmpresa] = useState({ nombre: '', rif: '' });
    const [lastAptitud, setLastAptitud] = useState<string | null>(null);
    const [returningPatient, setReturningPatient] = useState(false);
    const [consulta, setConsulta] = useState({
        tipo_consulta: 'PRE-EMPLEO',
        tipo_patologia: 'Adulto sano',
        categoria_reposo: 'NINGUNO',
        dias_reposo: 0,
        observaciones: '',
        discapacidad_detectada: false,
        referencia_centro_especializado: '',
        aptitud_medica: 'APTO',
        examen_fisico: '',
        riesgos_ocupacionales: '',
        fecha_inicio_reposo: '',
        fecha_fin_reposo: '',
        causa_reposo: ''
    });
    const [antecedentes, setAntecedentes] = useState([
        { empresa: '', cargo: '', tiempo_servicio: '', riesgos_expuestos: '' },
        { empresa: '', cargo: '', tiempo_servicio: '', riesgos_expuestos: '' },
        { empresa: '', cargo: '', tiempo_servicio: '', riesgos_expuestos: '' }
    ]);

    // Lógica de búsqueda de paciente recurrente
    const handleCedulaChange = async (cedula: string) => {
        setPaciente(prev => ({ ...prev, cedula }));
        if (cedula.length > 5) {
            const { data: pacData } = await supabase
                .from('pacientes')
                .select('*, empresas(nombre, rif)')
                .eq('cedula', cedula)
                .single();

            if (pacData) {
                setReturningPatient(true);
                setPaciente({
                    nombre_completo: pacData.nombre_completo,
                    cedula: pacData.cedula,
                    sexo: pacData.sexo,
                    alergias: pacData.alergias || '',
                    patologias_previas: pacData.patologias_previas || '',
                    fecha_nacimiento: pacData.fecha_nacimiento || '',
                    telefono: pacData.telefono || ''
                });

                if (pacData.empresas) {
                    setEmpresa({
                        nombre: pacData.empresas.nombre,
                        rif: pacData.empresas.rif
                    });
                }

                // Buscar última aptitud
                const { data: lastCons } = await supabase
                    .from('consultas')
                    .select('aptitud_medica')
                    .eq('paciente_id', pacData.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (lastCons) {
                    setLastAptitud(lastCons.aptitud_medica);
                }
            } else {
                setReturningPatient(false);
                setLastAptitud(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Insertar o buscar Empresa
            let empId = null;
            let { data: empData } = await supabase.from('empresas').select('id').eq('rif', empresa.rif).single();

            if (!empData) {
                const { data: newEmp, error: errEmp } = await supabase.from('empresas').insert([{ nombre: empresa.nombre, rif: empresa.rif }]).select().single();
                if (errEmp) throw errEmp;
                empId = newEmp.id;
            } else {
                empId = empData.id;
            }

            // 2. Insertar o actualizar Paciente
            let pacId = null;
            let { data: pacData } = await supabase.from('pacientes').select('id').eq('cedula', paciente.cedula).single();

            const payloadPaciente = {
                ...paciente,
                fecha_nacimiento: paciente.fecha_nacimiento || null,
                empresa_id: empId
            };

            if (!pacData) {
                const { data: newPac, error: errPac } = await supabase.from('pacientes').insert([payloadPaciente]).select().single();
                if (errPac) throw errPac;
                pacId = newPac.id;
            } else {
                pacId = pacData.id;
                // Upsert simple de actualización si aplica
            }

            // 2.5 Insertar Antecedentes Laborales si existen
            const antecedentesValidos = antecedentes.filter(a => a.empresa && a.cargo);
            if (antecedentesValidos.length > 0) {
                const { error: errAnt } = await supabase.from('antecedentes_laborales').insert(
                    antecedentesValidos.map((a, index) => ({
                        paciente_id: pacId,
                        orden: index + 1,
                        empresa_anterior: a.empresa,
                        cargo_desempenado: a.cargo,
                        tiempo_servicio: a.tiempo_servicio,
                        riesgos_expuestos: a.riesgos_expuestos
                    }))
                );
                if (errAnt) throw errAnt;
            }

            // 3. Insertar Consulta Epidemiologica
            const { error: errCons } = await supabase.from('consultas').insert([{
                paciente_id: pacId,
                empresa_id: empId,
                tipo_consulta: consulta.tipo_consulta,
                tipo_patologia: consulta.tipo_patologia,
                categoria_reposo: consulta.categoria_reposo,
                tiene_reposo: consulta.dias_reposo > 0,
                dias_reposo: consulta.dias_reposo,
                observaciones: consulta.observaciones,
                discapacidad_detectada: consulta.discapacidad_detectada,
                referencia_centro_especializado: consulta.referencia_centro_especializado,
                aptitud_medica: consulta.aptitud_medica,
                examen_fisico: consulta.examen_fisico,
                riesgos_ocupacionales: consulta.riesgos_ocupacionales,
                fecha_inicio_reposo: consulta.fecha_inicio_reposo || null,
                fecha_fin_reposo: consulta.fecha_fin_reposo || null,
                causa_reposo: consulta.causa_reposo || null
            }]);

            if (errCons) throw errCons;

            alert("¡EVALUACIÓN REGISTRADA EN EL BÚNKER DE FORMA EXITOSA!");

            // Generar PDF automáticamente tras el éxito
            generarCertificadoPDF({
                paciente: {
                    nombre: paciente.nombre_completo,
                    cedula: paciente.cedula
                },
                empresa: {
                    nombre: empresa.nombre,
                    rif: empresa.rif
                },
                consulta: {
                    tipo: consulta.tipo_consulta,
                    aptitud: consulta.aptitud_medica,
                    observaciones: consulta.observaciones,
                    examen_fisico: consulta.examen_fisico,
                    causa_reposo: consulta.causa_reposo,
                    dias_reposo: consulta.dias_reposo
                },
                doctora: {
                    nombre: "YADIRA PINO",
                    mpps: "42.123",
                    cmm: "MIR-12345"
                },
                conFirmaDigital: useDigitalSignature
            });

            onClose();

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error desconocido al guardar en el búnker.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Nueva Evaluación Médica</h2>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="eval-form">
                    {/* SECCIÓN: PACIENTE */}
                    <div className="form-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3>1. Identificación del Paciente</h3>
                            {returningPatient && (
                                <span style={{ background: 'var(--bg-tertiary)', color: 'var(--corporate-blue)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid var(--border-color)', animation: 'pulse 2s infinite' }}>
                                    ✨ PACIENTE RECURRENTE DETECTADO
                                </span>
                            )}
                        </div>

                        {lastAptitud && (
                            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '10px 15px', borderRadius: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: lastAptitud === 'APTO' ? 'var(--success)' : 'var(--warning)' }}></div>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Última Aptitud Registrada: <strong>{lastAptitud}</strong>
                                </span>
                            </div>
                        )}

                        <div className="form-grid">
                            <input
                                required
                                placeholder="Cédula de Identidad"
                                value={paciente.cedula}
                                onChange={e => handleCedulaChange(e.target.value)}
                            />
                            <input required placeholder="Nombre Completo" value={paciente.nombre_completo} onChange={e => setPaciente({ ...paciente, nombre_completo: e.target.value })} />
                            <select value={paciente.sexo} onChange={e => setPaciente({ ...paciente, sexo: e.target.value })}>
                                <option value="Femenino">Femenino</option>
                                <option value="Masculino">Masculino</option>
                            </select>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <small style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Fecha Nacimiento</small>
                                <input type="date" value={paciente.fecha_nacimiento} onChange={e => setPaciente({ ...paciente, fecha_nacimiento: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                            </div>
                        </div>
                        <div className="form-grid">
                            <input placeholder="Alergias Conocidas" value={paciente.alergias} onChange={e => setPaciente({ ...paciente, alergias: e.target.value })} />
                            <input placeholder="Patologías Previas" value={paciente.patologias_previas} onChange={e => setPaciente({ ...paciente, patologias_previas: e.target.value })} />
                            <input placeholder="Número de Teléfono" value={paciente.telefono} onChange={e => setPaciente({ ...paciente, telefono: e.target.value })} />
                        </div>
                    </div>

                    {/* SECCIÓN: EMPRESA */}
                    <div className="form-section">
                        <h3>2. Datos Laborales Actuales</h3>
                        <div className="form-grid">
                            <input required placeholder="Nombre de la Empresa" value={empresa.nombre} onChange={e => setEmpresa({ ...empresa, nombre: e.target.value })} />
                            <input required placeholder="RIF de la Empresa" value={empresa.rif} onChange={e => setEmpresa({ ...empresa, rif: e.target.value })} />
                            <input placeholder="Riesgos a los que está expuesto (Actual)" value={consulta.riesgos_ocupacionales} onChange={e => setConsulta({ ...consulta, riesgos_ocupacionales: e.target.value })} />
                        </div>
                    </div>

                    {/* SECCIÓN: ANTECEDENTES LABORALES */}
                    <div className="form-section">
                        <h3>2.5. Trabajos Anteriores (Historial Ocupacional)</h3>
                        {antecedentes.map((ant, index) => (
                            <div key={index} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: index < 2 ? '1px dashed var(--border-color)' : 'none' }}>
                                <small style={{ color: 'var(--medical-turquoise)', display: 'block', marginBottom: '8px' }}>Trabajo Anterior #{index + 1}</small>
                                <div className="form-grid">
                                    <input placeholder="Empresa Anterior" value={ant.empresa} onChange={e => {
                                        const newAnts = [...antecedentes]; newAnts[index].empresa = e.target.value; setAntecedentes(newAnts);
                                    }} />
                                    <input placeholder="Cargo Desempeñado" value={ant.cargo} onChange={e => {
                                        const newAnts = [...antecedentes]; newAnts[index].cargo = e.target.value; setAntecedentes(newAnts);
                                    }} />
                                    <input placeholder="Tiempo Servicio (Ej: 2 años)" value={ant.tiempo_servicio} onChange={e => {
                                        const newAnts = [...antecedentes]; newAnts[index].tiempo_servicio = e.target.value; setAntecedentes(newAnts);
                                    }} />
                                    <input placeholder="Riesgos (Físicos, Químicos...)" value={ant.riesgos_expuestos} onChange={e => {
                                        const newAnts = [...antecedentes]; newAnts[index].riesgos_expuestos = e.target.value; setAntecedentes(newAnts);
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* SECCIÓN: VIGILANCIA (EXCEL LOPCYMAT) */}
                    <div className="form-section">
                        <h3>3. Vigilancia Epidemiológica</h3>
                        <div className="form-grid">
                            <select value={consulta.tipo_consulta} onChange={e => setConsulta({ ...consulta, tipo_consulta: e.target.value })}>
                                <option value="PRE-EMPLEO">1. Pre-empleo</option>
                                <option value="PRE-VACACIONAL">2. Pre-vacacionales</option>
                                <option value="POST-VACACIONAL">3. Post-vacacional</option>
                                <option value="EGRESO">4. Egreso</option>
                                <option value="REINTEGRO REPOSO">5. Reintegro de reposo</option>
                                <option value="CONSULTA">6. Consulta</option>
                                <option value="LIMITACION">7. Limitación</option>
                                <option value="CERTIFICADO SALUD">8. Certificado de Salud</option>
                            </select>

                            <select value={consulta.tipo_patologia} onChange={e => setConsulta({ ...consulta, tipo_patologia: e.target.value })}>
                                <option value="Adulto sano">Adulto sano</option>
                                <option value="ORL">ORL</option>
                                <option value="Oftalmológicas">Oftalmológicas</option>
                                <option value="Respiratorias">Respiratorias</option>
                                <option value="Cardiovasculares">Cardiovasculares</option>
                                <option value="Gastrointestinales">Gastrointestinales</option>
                                <option value="Genitourinarias">Genitourinarias</option>
                                <option value="Osteomiarticulares">Osteomiarticulares</option>
                                <option value="Neurológicas">Neurológicas</option>
                                <option value="Dermatológicas">Dermatológicas</option>
                                <option value="Endocrinológicas">Endocrinológicas</option>
                                <option value="Infectocontagiosas">Infectocontagiosas</option>
                                <option value="Obstétricas">Obstétricas</option>
                                <option value="Dislipidemia">Dislipidemia</option>
                                <option value="Traumatológicas">Traumatológicas</option>
                            </select>
                        </div>

                        <div className="form-grid">
                            <select value={consulta.categoria_reposo} onChange={e => setConsulta({ ...consulta, categoria_reposo: e.target.value })}>
                                <option value="NINGUNO">Sin Reposo</option>
                                <option value="ENFERMEDAD COMUN">ENFERMEDAD COMÚN</option>
                                <option value="ENFERMEDAD OCUPACIONAL">ENFERMEDAD OCUPACIONAL</option>
                                <option value="ACCIDENTE COMUN">ACCIDENTE COMÚN</option>
                                <option value="ACCIDENTE LABORAL">ACCIDENTE LABORAL</option>
                            </select>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="number" min="0" placeholder="Total Días" value={consulta.dias_reposo} onChange={e => setConsulta({ ...consulta, dias_reposo: parseInt(e.target.value) || 0 })} disabled={consulta.categoria_reposo === 'NINGUNO'} style={{ width: '100px' }} />
                                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Días de reposo</span>
                            </div>
                        </div>

                        {consulta.categoria_reposo !== 'NINGUNO' && (
                            <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px', border: '1px solid var(--warning)', marginBottom: '16px', animation: 'fadeIn 0.3s ease' }}>
                                <label style={{ display: 'block', color: 'var(--warning)', fontWeight: 'bold', marginBottom: '12px', fontSize: '0.9rem' }}>
                                    DETALLES DEL REPOSO (Formato Oficial)
                                </label>
                                <div className="form-grid" style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <small style={{ color: 'var(--text-secondary)' }}>Fecha Inicio</small>
                                        <input type="date" value={consulta.fecha_inicio_reposo} onChange={e => setConsulta({ ...consulta, fecha_inicio_reposo: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <small style={{ color: 'var(--text-secondary)' }}>Fecha Fin</small>
                                        <input type="date" value={consulta.fecha_fin_reposo} onChange={e => setConsulta({ ...consulta, fecha_fin_reposo: e.target.value })} />
                                    </div>
                                </div>
                                <input placeholder="Causa justificativa del reposo (Para el certificado)" value={consulta.causa_reposo} onChange={e => setConsulta({ ...consulta, causa_reposo: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                            </div>
                        )}

                        <div className="form-grid" style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <input type="checkbox" checked={consulta.discapacidad_detectada} style={{ width: '20px', height: '20px' }} onChange={e => setConsulta({ ...consulta, discapacidad_detectada: e.target.checked })} />
                                ¿Discapacidad Detectada? (Art. 34)
                            </label>
                            <input placeholder="Referenciado a Centro Especializado (Ej: Traumatología Clínica San Antonio)" value={consulta.referencia_centro_especializado} onChange={e => setConsulta({ ...consulta, referencia_centro_especializado: e.target.value })} />
                        </div>

                        <textarea placeholder="Examen Físico (Transcripción libre)" rows={4} value={consulta.examen_fisico} onChange={e => setConsulta({ ...consulta, examen_fisico: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', resize: 'vertical', marginBottom: '16px' }} />

                        <textarea placeholder="Observaciones y Diagnóstico Clínico" rows={3} value={consulta.observaciones} onChange={e => setConsulta({ ...consulta, observaciones: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', resize: 'vertical', marginBottom: '16px' }} />

                        {/* SECCIÓN: APTITUD MÉDICA (CERTIFICADO DE APTITUD) */}
                        <div style={{ padding: '16px', background: 'rgba(11, 218, 218, 0.05)', borderRadius: '8px', border: '1px solid var(--medical-turquoise)', marginBottom: '16px' }}>
                            <label style={{ display: 'block', color: 'var(--medical-turquoise)', fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem' }}>
                                DICTAMEN FINAL: CERTIFICADO DE APTITUD
                            </label>
                            <select
                                value={consulta.aptitud_medica}
                                onChange={e => setConsulta({ ...consulta, aptitud_medica: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--medical-turquoise)', border: '2px solid var(--medical-turquoise)', fontWeight: 'bold', marginBottom: '12px' }}
                            >
                                <option value="APTO">APTO (Capaz para el cargo)</option>
                                <option value="APTO CON LIMITACIONES">APTO CON LIMITACIONES (Requiere adecuación)</option>
                                <option value="NO APTO">NO APTO (Estado de salud no compatible)</option>
                                <option value="EN EVALUACION">EN EVALUACIÓN (Pendiente paraclinicos)</option>
                            </select>

                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={useDigitalSignature}
                                        onChange={e => setUseDigitalSignature(e.target.checked)}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    {useDigitalSignature ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--corporate-blue)', fontWeight: 600 }}>
                                            <Mail size={16} /> Incluir Firma/Sello Digital (Para E-mail)
                                        </span>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Printer size={16} /> Sin Firma Digital (Para Firma Humana/Sello Húmedo)
                                        </span>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Guardando en Búnker...' : 'Registrar Evaluación'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
