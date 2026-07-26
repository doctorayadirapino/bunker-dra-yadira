import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Calendar, Printer } from 'lucide-react';
import './NewEvaluationForm.css';
import { generarCertificadoPDF, generarReposoPDF, generarExamenFisicoPDF, generarInformeINPSASELPDF } from '../services/pdfService';

interface FormProps {
    onClose: () => void;
    editConsultaId?: string;
    prefilledCedula?: string;
}

export default function NewEvaluationForm({ onClose, editConsultaId, prefilledCedula }: FormProps) {
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(!!editConsultaId);
    const [error, setError] = useState<string | null>(null);
    const [useDigitalSignature, setUseDigitalSignature] = useState(false);
    const [printOptions, setPrintOptions] = useState({
        certificado: true,
        examenFisico: false,
        inpsasel: false
    });

    const [paciente, setPaciente] = useState({ 
        nombre_completo: '', 
        cedula: '', 
        sexo: 'Femenino', 
        alergias: '', 
        patologias_previas: '', 
        fecha_nacimiento: '', 
        telefono: '',
        cargo: ''
    });
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
        causa_reposo: '',
        fecha_consulta: new Date().toISOString().split('T')[0]
    });
    const [antecedentes, setAntecedentes] = useState([
        { empresa: '', cargo: '', tiempo_servicio: '', riesgos_expuestos: '' },
        { empresa: '', cargo: '', tiempo_servicio: '', riesgos_expuestos: '' },
        { empresa: '', cargo: '', tiempo_servicio: '', riesgos_expuestos: '' }
    ]);
    const [companiesList, setCompaniesList] = useState<{nombre: string, rif: string}[]>([]);

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
                    telefono: pacData.telefono || '',
                    cargo: '' // No se carga de la BD para evitar problemas de esquema antiguo
                });

                if (pacData.empresas) {
                    setEmpresa({
                        nombre: pacData.empresas.nombre,
                        rif: pacData.empresas.rif
                    });
                }

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

                const { data: antData } = await supabase
                    .from('antecedentes_laborales')
                    .select('*')
                    .eq('paciente_id', pacData.id)
                    .order('orden', { ascending: true });

                if (antData && antData.length > 0) {
                    const mappedAnts = antData.map(a => ({
                        empresa: a.empresa_anterior || '',
                        cargo: a.cargo_ocupado || '',
                        tiempo_servicio: a.tiempo_servicio || '',
                        riesgos_expuestos: a.riesgos_expuestos || ''
                    }));
                    while (mappedAnts.length < 3) mappedAnts.push({ empresa: '', cargo: '', tiempo_servicio: '', riesgos_expuestos: '' });
                    setAntecedentes(mappedAnts.slice(0, 3));
                }
            } else {
                setReturningPatient(false);
                setLastAptitud(null);
            }
        }
    };

    const loadEditData = async () => {
        if (!editConsultaId) return;
        setLoading(true);
        try {
            const { data: c, error: errC } = await supabase
                .from('consultas')
                .select(`
                    *,
                    pacientes (*),
                    empresas (*)
                `)
                .eq('id', editConsultaId)
                .single();

            if (errC) throw errC;

            setPaciente({
                nombre_completo: c.pacientes.nombre_completo || '',
                cedula: c.pacientes.cedula || '',
                sexo: c.pacientes.sexo || 'Femenino',
                alergias: c.pacientes.alergias || '',
                patologias_previas: c.pacientes.patologias_previas || '',
                fecha_nacimiento: c.pacientes.fecha_nacimiento || '',
                telefono: c.pacientes.telefono || '',
                cargo: c.pacientes.cargo || ''
            });

            setEmpresa({
                nombre: c.empresas?.nombre || '',
                rif: c.empresas?.rif || ''
            });

            setConsulta({
                tipo_consulta: c.tipo_consulta,
                tipo_patologia: c.tipo_patologia,
                categoria_reposo: c.categoria_reposo || 'NINGUNO',
                dias_reposo: c.dias_reposo || 0,
                observaciones: c.observaciones || '',
                discapacidad_detectada: c.discapacidad_detectada || false,
                referencia_centro_especializado: c.referencia_centro_especializado || '',
                aptitud_medica: c.aptitud_medica || 'APTO',
                examen_fisico: c.examen_fisico || '',
                riesgos_ocupacionales: c.riesgos_ocupacionales || '',
                fecha_inicio_reposo: c.fecha_inicio_reposo || '',
                fecha_fin_reposo: c.fecha_fin_reposo || '',
                causa_reposo: c.causa_reposo || '',
                fecha_consulta: c.fecha_consulta ? c.fecha_consulta.split('T')[0] : new Date().toISOString().split('T')[0]
            });

            const { data: antData } = await supabase
                .from('antecedentes_laborales')
                .select('*')
                .eq('paciente_id', c.paciente_id)
                .order('orden', { ascending: true });

            if (antData && antData.length > 0) {
                const mappedAnts = antData.map(a => ({
                    empresa: a.empresa_anterior || '',
                    cargo: a.cargo_ocupado || '',
                    tiempo_servicio: a.tiempo_servicio || '',
                    riesgos_expuestos: a.riesgos_expuestos || ''
                }));
                while (mappedAnts.length < 3) mappedAnts.push({ empresa: '', cargo: '', tiempo_servicio: '', riesgos_expuestos: '' });
                setAntecedentes(mappedAnts.slice(0, 3));
            }
        } catch (err: any) {
            console.error(err);
            setError("Error al cargar los datos para edición: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const [isDraftLoaded, setIsDraftLoaded] = useState(false);

    useEffect(() => {
        const fetchDraft = async () => {
            if (editConsultaId) {
                setIsEditing(true);
                await loadEditData();
                await supabase.from('borradores_clinicos')
                    .delete()
                    .eq('paciente_identificador', prefilledCedula || 'nuevo')
                    .eq('tipo_formulario', 'ocupacional');
                setIsDraftLoaded(true);
            } else {
                if (prefilledCedula) {
                    await handleCedulaChange(prefilledCedula);
                }
                
                try {
                    const { data: draftData } = await supabase
                        .from('borradores_clinicos')
                        .select('datos_borrador')
                        .eq('paciente_identificador', prefilledCedula || 'nuevo')
                        .eq('tipo_formulario', 'ocupacional')
                        .single();

                    if (draftData && draftData.datos_borrador) {
                        const parsedDraft = draftData.datos_borrador;
                        if (parsedDraft.paciente) setPaciente(parsedDraft.paciente);
                        if (parsedDraft.empresa) setEmpresa(parsedDraft.empresa);
                        if (parsedDraft.consulta) setConsulta(parsedDraft.consulta);
                        if (parsedDraft.antecedentes) setAntecedentes(parsedDraft.antecedentes);
                    }
                } catch (e) {
                    console.error('Borrador en la nube no encontrado o error:', e);
                }
                setIsDraftLoaded(true);
            }
        };
        fetchDraft();

        // Cargar lista de empresas para el datalist
        const fetchCompaniesList = async () => {
            const { data } = await supabase.from('empresas').select('nombre, rif').order('nombre', { ascending: true });
            if (data) setCompaniesList(data);
        };
        fetchCompaniesList();
    }, [editConsultaId, prefilledCedula]);

    // EFECTO AUTO-GUARDADO DEBOUNCED EN LA NUBE
    useEffect(() => {
        if (!editConsultaId && isDraftLoaded) {
            const draftToSave = { paciente, empresa, consulta, antecedentes };
            
            const timer = setTimeout(async () => {
                try {
                    const payload = {
                        paciente_identificador: prefilledCedula || 'nuevo',
                        tipo_formulario: 'ocupacional',
                        datos_borrador: draftToSave,
                        updated_at: new Date().toISOString()
                    };
                    
                    const { data: existing } = await supabase
                        .from('borradores_clinicos')
                        .select('id')
                        .eq('paciente_identificador', payload.paciente_identificador)
                        .eq('tipo_formulario', payload.tipo_formulario)
                        .single();
                        
                    if (existing) {
                        await supabase.from('borradores_clinicos').update(payload).eq('id', existing.id);
                    } else {
                        await supabase.from('borradores_clinicos').insert([payload]);
                    }
                } catch (e) {
                    console.error('Error guardando borrador en la nube:', e);
                }
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [paciente, empresa, consulta, antecedentes, editConsultaId, isDraftLoaded, prefilledCedula]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Empresa
            let empId = null;
            let { data: empData } = await supabase.from('empresas').select('id, nombre').eq('rif', empresa.rif).single();
            if (!empData) {
                const { data: newEmp, error: errEmp } = await supabase.from('empresas').insert([{ nombre: empresa.nombre, rif: empresa.rif }]).select().single();
                if (errEmp) throw errEmp;
                empId = newEmp.id;
            } else {
                empId = empData.id;
                if (empData.nombre !== empresa.nombre) {
                    const { error: updErr } = await supabase.from('empresas').update({ nombre: empresa.nombre }).eq('id', empId);
                    if (updErr) console.error("Error actualizando nombre de empresa:", updErr);
                }
            }

            // 2. Paciente
            let pacId = null;
            let { data: pacData } = await supabase.from('pacientes').select('id').eq('cedula', paciente.cedula).single();
            const payloadPaciente = { ...paciente, fecha_nacimiento: paciente.fecha_nacimiento || null, empresa_id: empId };
            if (!pacData) {
                const { data: newPac, error: errPac } = await supabase.from('pacientes').insert([payloadPaciente]).select().single();
                if (errPac) throw errPac;
                pacId = newPac.id;
            } else {
                pacId = pacData.id;
                const { error: errPacUpd } = await supabase.from('pacientes').update(payloadPaciente).eq('id', pacId);
                if (errPacUpd) throw errPacUpd;
            }

            // 3. Antecedentes
            const antecedentesValidos = antecedentes.filter(a => a.empresa && a.cargo);
            await supabase.from('antecedentes_laborales').delete().eq('paciente_id', pacId);
            if (antecedentesValidos.length > 0) {
                const { error: errAnt } = await supabase.from('antecedentes_laborales').insert(
                    antecedentesValidos.map((a, index) => ({
                        paciente_id: pacId,
                        orden: index + 1,
                        empresa_anterior: a.empresa,
                        cargo_ocupado: a.cargo,
                        tiempo_servicio: a.tiempo_servicio,
                        riesgos_expuestos: a.riesgos_expuestos
                    }))
                );
                if (errAnt) throw errAnt;
            }

            // 4. Consulta
            const consultaPayload = {
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
                causa_reposo: consulta.causa_reposo || null,
                fecha_consulta: consulta.fecha_consulta
            };

            if (isEditing && editConsultaId) {
                // v17.4: Ensure we detect silent update failures on consultas
                const { error: errUpd } = await supabase.from('consultas').update(consultaPayload).eq('id', editConsultaId).select().single();
                if (errUpd) throw errUpd;
            } else {
                const { error: errCons } = await supabase.from('consultas').insert([consultaPayload]);
                if (errCons) throw errCons;
            }

            alert(isEditing ? "¡EVALUACIÓN ACTUALIZADA EXITOSAMENTE!" : "¡EVALUACIÓN REGISTRADA EXITOSAMENTE!");

            let ciudadFinal = "GUARENAS";
            if (printOptions.certificado || printOptions.examenFisico || printOptions.inpsasel) {
                const ciudadPersonalizada = window.prompt("Ingrese la ciudad de emisión de los reportes:", ciudadFinal);
                if (ciudadPersonalizada) ciudadFinal = ciudadPersonalizada.toUpperCase();
            }

            const calcularEdad = (fechaNac: string) => {
                if (!fechaNac) return '';
                const diff = Date.now() - new Date(fechaNac).getTime();
                return Math.abs(new Date(diff).getUTCFullYear() - 1970).toString();
            };

            const pdfData = {
                paciente: { nombre: paciente.nombre_completo, cedula: paciente.cedula, edad: calcularEdad(paciente.fecha_nacimiento), sexo: paciente.sexo, cargo: paciente.cargo },
                empresa: { nombre: empresa.nombre, rif: empresa.rif },
                consulta: {
                    tipo: consulta.tipo_consulta,
                    aptitud: consulta.aptitud_medica,
                    observaciones: consulta.observaciones,
                    examen_fisico: consulta.examen_fisico,
                    causa_reposo: consulta.causa_reposo,
                    dias_reposo: consulta.dias_reposo,
                    riesgos_ocupacionales: consulta.riesgos_ocupacionales,
                    ciudad: ciudadFinal,
                    fecha: consulta.fecha_consulta
                },
                conFirmaDigital: useDigitalSignature
            };

            // REPORTE 1: CERTIFICADO DE APTITUD MÉDICA (Opcional por Checkbox)
            if (printOptions.certificado) {
                generarCertificadoPDF({
                    ...pdfData,
                    doctora: { nombre: "YADIRA PINO", especialidad: "Fisiatra", ci: "6.871.964", mpps: "41.171", cmm: "13.012" }
                });
            }

            // REPORTE 2: EXAMEN FÍSICO
            if (printOptions.examenFisico) {
                generarExamenFisicoPDF(pdfData);
            }

            // REPORTE 3: INPSASEL
            if (printOptions.inpsasel) {
                generarInformeINPSASELPDF(pdfData);
            }

            // REPORTE 4: CONSTANCIA DE REPOSO O ASISTENCIA (Solo si amerita reposo o según criterio)
            if (consulta.dias_reposo > 0 || consulta.categoria_reposo !== 'NINGUNO') {
                generarReposoPDF({
                    paciente: { nombre: paciente.nombre_completo, cedula: paciente.cedula },
                    reposo: { 
                        tipo: consulta.dias_reposo > 0 ? 'REPOSO' : 'CONSTANCIA',
                        condicion: 'Paciente',
                        ameritaReposo: consulta.dias_reposo > 0,
                        dias: consulta.dias_reposo,
                        desde: consulta.fecha_inicio_reposo,
                        hasta: consulta.fecha_fin_reposo,
                        diagnostico: consulta.causa_reposo || consulta.observaciones || "REPOSO MÉDICO LABORAL",
                        ciudad: ciudadFinal
                    },
                    doctora: { 
                        nombre: "YADIRA PINO", 
                        ci: 6871964, 
                        mpps: 41171, 
                        cmm: 13012, 
                        especialidad: "FISIATRA" 
                    },
                    conFirmaDigital: useDigitalSignature
                });
            }

            // LIMPIAR BORRADOR EN LA NUBE TRAS ÉXITO
            await supabase.from('borradores_clinicos')
                .delete()
                .eq('paciente_identificador', prefilledCedula || 'nuevo')
                .eq('tipo_formulario', 'ocupacional');

            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error desconocido al guardar en el sistema.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ margin: 0 }}>{isEditing ? 'Editar Evaluación Médica' : 'Nueva Evaluación Médica'}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                            <Calendar size={16} color="var(--medical-turquoise)" />
                            <span style={{ fontSize: '0.8rem', color: 'var(--medical-turquoise)', fontWeight: 'bold' }}>FECHA DE EMISIÓN:</span>
                            <input 
                                type="date" 
                                value={consulta.fecha_consulta} 
                                onChange={e => setConsulta({...consulta, fecha_consulta: e.target.value})}
                                style={{ 
                                    padding: '2px 8px', 
                                    borderRadius: '6px', 
                                    border: '1px solid var(--medical-turquoise)',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    background: 'rgba(14, 165, 233, 0.05)',
                                    color: 'var(--medical-turquoise)'
                                }}
                            />
                        </div>
                    </div>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="eval-form">
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
                                disabled={isEditing || returningPatient}
                                style={{ opacity: (isEditing || returningPatient) ? 0.7 : 1 }}
                            />
                            <input 
                                required 
                                placeholder="Nombre Completo" 
                                value={paciente.nombre_completo} 
                                onChange={e => setPaciente({ ...paciente, nombre_completo: e.target.value })} 
                                disabled={isEditing || returningPatient}
                                style={{ opacity: (isEditing || returningPatient) ? 0.7 : 1 }}
                            />
                            <select 
                                value={paciente.sexo} 
                                onChange={e => setPaciente({ ...paciente, sexo: e.target.value })}
                                disabled={isEditing || returningPatient}
                                style={{ opacity: (isEditing || returningPatient) ? 0.7 : 1 }}
                            >
                                <option value="Femenino">Femenino</option>
                                <option value="Masculino">Masculino</option>
                            </select>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <small style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Fecha Nacimiento</small>
                                <input 
                                    type="date" 
                                    value={paciente.fecha_nacimiento} 
                                    onChange={e => setPaciente({ ...paciente, fecha_nacimiento: e.target.value })} 
                                    disabled={isEditing || returningPatient}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', opacity: (isEditing || returningPatient) ? 0.7 : 1 }} 
                                />
                            </div>
                        </div>
                        {(isEditing || returningPatient) && (
                            <small style={{ color: 'var(--warning)', display: 'block', marginTop: '5px' }}>
                                ⚠️ Los datos personales están bloqueados por seguridad. Para corregirlos, utilice la opción "Editar Datos" en el Directorio de Pacientes.
                            </small>
                        )}
                        <div className="form-grid">
                            <input type="text" placeholder="Cargo del Trabajador" required value={paciente.cargo} onChange={e => setPaciente({ ...paciente, cargo: e.target.value.toUpperCase() })} />
                            <input type="text" placeholder="Alergias (Opcional)" value={paciente.alergias} onChange={e => setPaciente({ ...paciente, alergias: e.target.value })} />
                            <input type="text" placeholder="Patologías Previas" value={paciente.patologias_previas} onChange={e => setPaciente({ ...paciente, patologias_previas: e.target.value })} />
                            <input type="text" placeholder="Número de Teléfono" value={paciente.telefono} onChange={e => setPaciente({ ...paciente, telefono: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>2. Datos Laborales Actuales</h3>
                        <div className="form-grid">
                            <div>
                                <input 
                                    required 
                                    list="empresas-list"
                                    placeholder="Nombre de la Empresa" 
                                    value={empresa.nombre} 
                                    onChange={e => {
                                        const val = e.target.value.toUpperCase();
                                        const found = companiesList.find(c => c.nombre === val);
                                        if (found) {
                                            setEmpresa({ nombre: val, rif: found.rif });
                                        } else {
                                            setEmpresa({ ...empresa, nombre: val });
                                        }
                                    }} 
                                    autoComplete="off" 
                                />
                                <datalist id="empresas-list">
                                    {companiesList.map((c, i) => (
                                        <option key={i} value={c.nombre} />
                                    ))}
                                </datalist>
                            </div>
                            <input required placeholder="RIF de la Empresa" value={empresa.rif} onChange={e => setEmpresa({ ...empresa, rif: e.target.value.toUpperCase() })} autoComplete="off" />
                            <input placeholder="Riesgos a los que está expuesto (Actual)" value={consulta.riesgos_ocupacionales} onChange={e => setConsulta({ ...consulta, riesgos_ocupacionales: e.target.value })} />
                        </div>
                    </div>

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
                                    <input placeholder="Tiempo Servicio" value={ant.tiempo_servicio} onChange={e => {
                                        const newAnts = [...antecedentes]; newAnts[index].tiempo_servicio = e.target.value; setAntecedentes(newAnts);
                                    }} />
                                    <input placeholder="Riesgos" value={ant.riesgos_expuestos} onChange={e => {
                                        const newAnts = [...antecedentes]; newAnts[index].riesgos_expuestos = e.target.value; setAntecedentes(newAnts);
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>

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
                                <option value="Cardiovasculares">Cardiovascular</option>
                                <option value="Dermatológicas">Dermatológicas</option>
                                <option value="Gastrointestinales">Gastrointestinal</option>
                                <option value="ORL">ORL</option>
                                <option value="Oftalmológicas">Oftalmológicas</option>
                                <option value="Osteomiarticulares">Osteomiarticulares</option>
                                <option value="Neurológicas">Neurológicas</option>
                                <option value="Traumatológicas">Traumatológicas</option>
                                <option value="Accidentes Laborales">Accidentes Laborales</option>
                                <option value="Accidentes In itinere">Accidentes In itinere</option>
                                <option value="Obstétricas">Obstétricas</option>
                                <option value="Respiratorias">Respiratoria</option>
                            </select>
                        </div>
                        <div className="form-grid">
                            <select value={consulta.categoria_reposo} onChange={e => setConsulta({ ...consulta, categoria_reposo: e.target.value })}>
                                <option value="NINGUNO">Sin Reposo</option>
                                <option value="ENFERMEDAD COMUN">ENFERMEDAD COMÚN</option>
                                <option value="ENFERMEDAD OCUPACIONAL">ENFERMEDAD OCUPACIONAL</option>
                            </select>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="number" value={consulta.dias_reposo} onChange={e => setConsulta({ ...consulta, dias_reposo: parseInt(e.target.value) || 0 })} disabled={consulta.categoria_reposo === 'NINGUNO'} style={{ width: '100px' }} />
                                <span style={{ display: 'flex', alignItems: 'center' }}>Días</span>
                            </div>
                        </div>

                        {consulta.categoria_reposo !== 'NINGUNO' && (
                            <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px', border: '1px solid var(--warning)', marginBottom: '16px' }}>
                                <div className="form-grid">
                                    <input type="date" value={consulta.fecha_inicio_reposo} onChange={e => setConsulta({ ...consulta, fecha_inicio_reposo: e.target.value })} />
                                    <input type="date" value={consulta.fecha_fin_reposo} onChange={e => setConsulta({ ...consulta, fecha_fin_reposo: e.target.value })} />
                                </div>
                                <input placeholder="Causa del reposo" value={consulta.causa_reposo} onChange={e => setConsulta({ ...consulta, causa_reposo: e.target.value })} style={{ width: '100%', marginTop: '10px', padding: '10px' }} />
                            </div>
                        )}

                        <textarea placeholder="Examen Físico" rows={3} value={consulta.examen_fisico} onChange={e => setConsulta({ ...consulta, examen_fisico: e.target.value })} style={{ width: '100%', marginBottom: '10px', padding: '10px' }} />
                        <textarea placeholder="Observaciones" rows={3} value={consulta.observaciones} onChange={e => setConsulta({ ...consulta, observaciones: e.target.value })} style={{ width: '100%', padding: '10px' }} />

                        <div style={{ padding: '16px', background: 'rgba(11, 218, 218, 0.05)', borderRadius: '8px', border: '1px solid var(--medical-turquoise)', marginTop: '20px' }}>
                            <select value={consulta.aptitud_medica} onChange={e => setConsulta({ ...consulta, aptitud_medica: e.target.value })} style={{ width: '100%', padding: '12px', fontWeight: 'bold' }}>
                                <option value="APTO">APTO</option>
                                <option value="APTO CON LIMITACIONES">APTO CON LIMITACIONES</option>
                                <option value="NO APTO">NO APTO</option>
                                <option value="EN EVALUACION">EN EVALUACIÓN</option>
                            </select>
                            
                            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', color: 'var(--corporate-blue)', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={printOptions.certificado} onChange={e => setPrintOptions({...printOptions, certificado: e.target.checked})} />
                                    <Printer size={16} /> Imprimir Certificado de Aptitud
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', color: 'var(--corporate-blue)', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={printOptions.examenFisico} onChange={e => setPrintOptions({...printOptions, examenFisico: e.target.checked})} />
                                    <Printer size={16} /> Imprimir Examen Físico
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', color: 'var(--corporate-blue)', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={printOptions.inpsasel} onChange={e => setPrintOptions({...printOptions, inpsasel: e.target.checked})} />
                                    <Printer size={16} /> Imprimir Informe INPSASEL
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px', borderTop: '1px dashed var(--medical-turquoise)', paddingTop: '10px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={useDigitalSignature} onChange={e => setUseDigitalSignature(e.target.checked)} />
                                    <Mail size={16} /> Incluir Firma Digital en los Reportes
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Procesando...' : isEditing ? 'Guardar Cambios' : 'Registrar Evaluación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
