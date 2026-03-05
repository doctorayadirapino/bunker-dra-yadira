import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, History, PlusCircle, Calendar, Pill, Printer, Edit, Trash2, AlertTriangle } from 'lucide-react';
import FisiatriaConsultationModal from './FisiatriaConsultationModal';
import FisiatriaPatientModal from './FisiatriaPatientModal';
import { generarConsultaFisiatriaPDF, generarRecipeFisiatriaPDF, generarReferenciaFisiatriaPDF, generarRadiodiagnosticoFisiatriaPDF } from '../services/pdfService';

interface Props {
    patient: any;
    onClose: () => void;
}

export default function FisiatriaHistoryModal({ patient, onClose }: Props) {
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewConsultation, setShowNewConsultation] = useState(false);
    const [showEditPatient, setShowEditPatient] = useState(false);
    const [patientData, setPatientData] = useState(patient);

    // v8.6: Estado para Edición
    const [editingConsultation, setEditingConsultation] = useState<any>(null);

    useEffect(() => {
        fetchConsultations();
    }, [patient.id]);

    const fetchConsultations = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('fisiatria_consultas')
            .select('*, fisiatria_recipes(*)')
            .eq('paciente_id', patient.id)
            .order('fecha_consulta', { ascending: false });

        if (data) setConsultations(data);
        setLoading(false);
    };

    const handlePrintConsultation = (c: any) => {
        const conFirma = window.confirm("¿Desea incluir su FIRMA DIGITAL en este reporte?");
        const payload = {
            paciente: {
                nombre: patientData.nombre_completo,
                cedula: patientData.cedula,
                edad: patientData.edad?.toString() || '',
                telefono: patientData.telefono
            },
            consulta: {
                fecha: c.fecha_consulta,
                referido_por: c.referido_por || 'PACIENTE DIRECTO',
                motivo_consulta: c.motivo_consulta,
                examen_fisico: c.examen_fisico,
                diagnostico: c.diagnostico,
                plan_sugerencia: c.plan_sugerencia,
                referencia: c.referencia,
                reposo_constancia: c.reposo_constancia,
                referencia_medico: c.referencia_medico,
                referencia_especialidad: c.referencia_especialidad,
                referencia_motivo: c.referencia_motivo,
                radiodiagnostico_detalle: c.radiodiagnostico_detalle
            },
            recipes: c.fisiatria_recipes || [],
            conFirmaDigital: conFirma
        };
        generarConsultaFisiatriaPDF(payload as any);
    };

    const handlePrintRadiodiagnostico = (c: any) => {
        const conFirma = window.confirm("¿Desea incluir su FIRMA DIGITAL en la Orden de Radiodiagnóstico?");
        const payload = {
            paciente: { nombre: patientData.nombre_completo, cedula: patientData.cedula, edad: patientData.edad?.toString() || '', telefono: patientData.telefono },
            consulta: { radiodiagnostico_detalle: c.radiodiagnostico_detalle },
            recipes: [],
            conFirmaDigital: conFirma
        };
        generarRadiodiagnosticoFisiatriaPDF(payload as any);
    };

    const handlePrintReferencia = (c: any) => {
        const conFirma = window.confirm("¿Desea incluir su FIRMA DIGITAL en la Hoja de Referencia?");
        const payload = {
            paciente: { nombre: patientData.nombre_completo, cedula: patientData.cedula, edad: patientData.edad?.toString() || '', telefono: patientData.telefono },
            consulta: {
                referencia_medico: c.referencia_medico,
                referencia_especialidad: c.referencia_especialidad,
                referencia_motivo: c.referencia_motivo
            },
            recipes: [],
            conFirmaDigital: conFirma
        };
        generarReferenciaFisiatriaPDF(payload as any);
    };

    const handlePrintRecipe = (c: any) => {
        if (!c.fisiatria_recipes || c.fisiatria_recipes.length === 0) {
            alert("Esta consulta no tiene medicamentos registrados.");
            return;
        }
        const conFirma = window.confirm("¿Desea incluir su FIRMA DIGITAL en el récipe?");
        const payload = {
            paciente: {
                nombre: patientData.nombre_completo,
                cedula: patientData.cedula,
                edad: patientData.edad?.toString() || ''
            },
            consulta: {
                fecha: c.fecha_consulta,
                referido_por: '',
                motivo_consulta: '',
                examen_fisico: '',
                diagnostico: '',
                plan_sugerencia: ''
            },
            recipes: c.fisiatria_recipes,
            conFirmaDigital: conFirma
        };
        generarRecipeFisiatriaPDF(payload);
    };

    // --- ACCIONES CRUD (EDICIÓN Y ELIMINACIÓN) v8.6 ---
    const handleDeleteConsultation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("⚠️ ADVERTENCIA: ¿Está segura que desea ELIMINAR esta consulta fisiátrica y sus récipes internos de manera permanente? Esta acción no se puede deshacer.")) {
            // Se borran las recetas primero por si acaso (aunque haya ON DELETE CASCADE)
            await supabase.from('fisiatria_recipes').delete().eq('consulta_id', id);
            const { error } = await supabase.from('fisiatria_consultas').delete().eq('id', id);
            if (error) {
                alert("Error al eliminar la consulta: " + error.message);
            } else {
                fetchConsultations(); // Refrescar vista
            }
        }
    };

    const handleDeleteHistory = async () => {
        if (window.prompt("PELIGRO DE PÉRDIDA DE DATOS\n\nEstá a punto de borrar TODA LA HISTORIA CLÍNICA FISIÁTRICA de este paciente.\n\nEscriba la palabra ELIMINAR para confirmar:") === "ELIMINAR") {
            setLoading(true);
            const { error } = await supabase.from('fisiatria_consultas').delete().eq('paciente_id', patient.id);
            if (error) {
                alert("Error crítico al eliminar historial: " + error.message);
                setLoading(false);
            } else {
                alert("La Historia Clínica ha sido purgada exitosamente de la base de datos.");
                onClose(); // Cerrar el modal principal porque ya no hay historia
            }
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal-content" style={{ maxWidth: '1000px', width: '95%' }}>
                <div className="modal-header">
                    <h2 style={{ color: 'var(--fisiatria-purple)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <History size={24} />
                        Historia Clínica: {patientData.nombre_completo}
                    </h2>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                <div className="modal-body responsive-grid" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '25px', maxHeight: '85vh', overflowY: 'auto' }}>
                    <aside style={{ height: 'fit-content', position: 'sticky', top: 0 }}>
                        <div style={{ background: 'var(--fisiatria-purple-light)', padding: '20px', borderRadius: '15px', border: '1px solid var(--fisiatria-purple-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid var(--fisiatria-purple-border)', paddingBottom: '8px' }}>
                                <h4 style={{ color: 'var(--fisiatria-purple)', margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>DATOS DEL PACIENTE</h4>
                                <button onClick={() => setShowEditPatient(true)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>EDITAR</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <small style={{ color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}>Cédula</small>
                                    <strong style={{ color: 'var(--text-primary)' }}>{patientData.cedula}</strong>
                                </div>
                                <div>
                                    <small style={{ color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}>Edad</small>
                                    <strong style={{ color: 'var(--text-primary)' }}>{patientData.edad} AÑOS</strong>
                                </div>
                                <div>
                                    <small style={{ color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}>Teléfono</small>
                                    <strong style={{ color: 'var(--text-primary)' }}>{patientData.telefono || 'N/A'}</strong>
                                </div>
                            </div>

                            <button className="btn-purple-action" style={{ width: '100%', marginTop: '30px', justifyContent: 'center', padding: '12px' }} onClick={() => setShowNewConsultation(true)}>
                                <PlusCircle size={20} /> Nueva Consulta
                            </button>

                            {/* v8.6 Botón de Purga Total */}
                            {consultations.length > 0 && (
                                <button
                                    onClick={handleDeleteHistory}
                                    style={{
                                        width: '100%',
                                        marginTop: '15px',
                                        background: '#fff1f2',
                                        color: '#e11d48',
                                        border: '1px solid #fda4af',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontWeight: 800,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = '#ffe4e6'; e.currentTarget.style.transform = 'scale(1.02)' }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.transform = 'scale(1)' }}
                                >
                                    <AlertTriangle size={18} /> PURGAR HISTORIA CLÍNICA
                                </button>
                            )}
                        </div>
                    </aside>

                    <main>
                        <h3 style={{ marginBottom: '25px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 800 }}>
                            <Calendar size={22} color="var(--fisiatria-purple)" />
                            EVOLUCIÓN MÉDICA
                        </h3>

                        {loading ? (
                            <p>Cargando historia...</p>
                        ) : consultations.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed #ddd', borderRadius: '15px' }}>
                                <p>No hay consultas registradas.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {consultations.map((c: any) => (
                                    <div key={c.id} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <div style={{ background: '#f5f3ff', padding: '12px 20px', borderBottom: '1px solid #ddd6fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 800, color: 'var(--fisiatria-purple)' }}>{new Date(c.fecha_consulta).toLocaleDateString()}</span>
                                                <span style={{ fontSize: '0.8rem', color: '#666' }}>REF: {c.referido_por || 'DIRECTO'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <button
                                                    onClick={() => handlePrintConsultation(c)}
                                                    style={{
                                                        background: '#0284c7',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '10px 20px',
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 900,
                                                        textTransform: 'uppercase',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <Printer size={18} /> IMPRIMIR INFORME
                                                </button>
                                                {c.fisiatria_recipes?.length > 0 && (
                                                    <button
                                                        onClick={() => handlePrintRecipe(c)}
                                                        style={{
                                                            background: '#e91e63',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '10px 20px',
                                                            borderRadius: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: 900,
                                                            textTransform: 'uppercase',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 4px 10px rgba(233, 30, 99, 0.3)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                    >
                                                        <Pill size={18} /> IMPRIMIR RÉCIPE
                                                    </button>
                                                )}
                                                {c.radiodiagnostico_detalle && (
                                                    <button
                                                        onClick={() => handlePrintRadiodiagnostico(c)}
                                                        style={{
                                                            background: '#f59e0b',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '10px 20px',
                                                            borderRadius: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: 900,
                                                            textTransform: 'uppercase',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                    >
                                                        RADIODIAGNÓSTICO
                                                    </button>
                                                )}
                                                {c.referencia_medico && (
                                                    <button
                                                        onClick={() => handlePrintReferencia(c)}
                                                        style={{
                                                            background: '#8b5cf6',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '10px 20px',
                                                            borderRadius: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: 900,
                                                            textTransform: 'uppercase',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                    >
                                                        REFERENCIA
                                                    </button>
                                                )}

                                                {/* Controles CRUD */}
                                                <div style={{ display: 'flex', gap: '5px', marginLeft: '10px', borderLeft: '2px solid #ddd6fe', paddingLeft: '15px' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingConsultation(c); }}
                                                        style={{ background: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '5px' }}
                                                        title="Editar Consulta"
                                                    >
                                                        <Edit size={20} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteConsultation(c.id, e)}
                                                        style={{ background: 'transparent', border: 'none', color: '#e11d48', cursor: 'pointer', padding: '5px' }}
                                                        title="Eliminar Consulta"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ padding: '15px' }}>
                                            <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}><strong>Motivo:</strong> {c.motivo_consulta}</p>
                                            <p style={{ fontSize: '0.85rem', color: '#444' }}><strong>Diagnóstico:</strong> {c.diagnostico}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {showNewConsultation && (
                <FisiatriaConsultationModal
                    patientId={patientData.id}
                    patientName={patientData.nombre_completo}
                    patientCedula={patientData.cedula}
                    patientEdad={patientData.edad}
                    patientTelefono={patientData.telefono}
                    onClose={() => setShowNewConsultation(false)}
                    onSuccess={() => { fetchConsultations(); setShowNewConsultation(false); }}
                />
            )}

            {editingConsultation && (
                <FisiatriaConsultationModal
                    patientId={patientData.id}
                    patientName={patientData.nombre_completo}
                    patientCedula={patientData.cedula}
                    patientEdad={patientData.edad}
                    patientTelefono={patientData.telefono}
                    initialData={editingConsultation}
                    onClose={() => setEditingConsultation(null)}
                    onSuccess={() => { fetchConsultations(); setEditingConsultation(null); }}
                />
            )}

            {showEditPatient && (
                <FisiatriaPatientModal
                    patientToEdit={patientData}
                    onClose={() => setShowEditPatient(false)}
                    onSuccess={() => {
                        supabase.from('fisiatria_pacientes').select('*').eq('id', patient.id).single().then(({ data }) => {
                            if (data) setPatientData(data);
                        });
                        setShowEditPatient(false);
                    }}
                />
            )}

            <style>{`
                .btn-print-fisiatria {
                    background: #0284c7;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.95rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px rgba(2, 132, 199, 0.1);
                }
                .btn-print-fisiatria:hover { 
                    opacity: 0.95; 
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(2, 132, 199, 0.2);
                }
                .btn-print-recipe {
                    background: #e91e63;
                }
            `}</style>
        </div>
    );
}
