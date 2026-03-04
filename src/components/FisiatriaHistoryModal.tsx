import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, History, PlusCircle, Calendar, MessageSquare, Pill, FileText, Printer } from 'lucide-react';
import FisiatriaConsultationModal from './FisiatriaConsultationModal';
import FisiatriaPatientModal from './FisiatriaPatientModal';
import { generarConsultaFisiatriaPDF, generarRecipeFisiatriaPDF } from '../services/pdfService';

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
                reposo_constancia: c.reposo_constancia
            },
            recipes: c.fisiatria_recipes || [],
            conFirmaDigital: conFirma
        };
        generarConsultaFisiatriaPDF(payload);
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

                <div className="modal-body" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '25px', maxHeight: '85vh', overflowY: 'auto' }}>
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
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handlePrintConsultation(c)} className="btn-print-fisiatria"><Printer size={14} /> Informe</button>
                                                {c.fisiatria_recipes?.length > 0 && (
                                                    <button onClick={() => handlePrintRecipe(c)} className="btn-print-fisiatria" style={{ background: '#10b981' }}><Pill size={14} /> Récipe</button>
                                                )}
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
                    background: var(--fisiatria-purple);
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-print-fisiatria:hover { opacity: 0.9; transform: translateY(-1px); }
            `}</style>
        </div>
    );
}
