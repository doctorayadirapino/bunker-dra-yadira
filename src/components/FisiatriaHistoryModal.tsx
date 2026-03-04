import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, History, PlusCircle, Calendar, MessageSquare, Pill, FileText } from 'lucide-react';
import FisiatriaConsultationModal from './FisiatriaConsultationModal';

interface Props {
    patient: any;
    onClose: () => void;
}

export default function FisiatriaHistoryModal({ patient, onClose }: Props) {
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewConsultation, setShowNewConsultation] = useState(false);

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

    return (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal-content" style={{ maxWidth: '1000px', width: '95%' }}>
                <div className="modal-header">
                    <h2 style={{ color: 'var(--fisiatria-purple)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <History size={24} />
                        Historia Clínica Completa: {patient.nombre_completo}
                    </h2>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                <div className="modal-body" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '25px', maxHeight: '85vh', overflowY: 'auto' }}>
                    {/* Lateral: Perfil del Paciente */}
                    <aside style={{ height: 'fit-content', position: 'sticky', top: 0 }}>
                        <div style={{ background: 'var(--fisiatria-purple-light)', padding: '20px', borderRadius: '15px', border: '1px solid var(--fisiatria-purple-border)' }}>
                            <h4 style={{ color: 'var(--fisiatria-purple)', marginBottom: '15px', borderBottom: '2px solid var(--fisiatria-purple-border)', paddingBottom: '8px', fontSize: '0.85rem', fontWeight: 800 }}>DATOS DEL PACIENTE</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <small style={{ color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}>Cédula</small>
                                    <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{patient.cedula}</strong>
                                </div>
                                <div>
                                    <small style={{ color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}>Edad</small>
                                    <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{patient.edad} AÑOS</strong>
                                </div>
                                <div>
                                    <small style={{ color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}>Teléfono</small>
                                    <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{patient.telefono || 'NO REGISTRADO'}</strong>
                                </div>
                            </div>

                            <button
                                className="btn-purple-action"
                                style={{ width: '100%', marginTop: '30px', justifyContent: 'center', padding: '12px' }}
                                onClick={() => setShowNewConsultation(true)}
                            >
                                <PlusCircle size={20} /> Nueva Consulta
                            </button>
                        </div>
                    </aside>

                    {/* Principal: Timeline de Evolución */}
                    <main>
                        <h3 style={{ marginBottom: '25px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 800 }}>
                            <Calendar size={22} color="var(--fisiatria-purple)" />
                            CRONOLOGÍA DE EVOLUCIÓN MÉDICA
                        </h3>

                        {loading ? (
                            <p style={{ color: 'var(--text-secondary)' }}>Sincronizando con el servidor...</p>
                        ) : consultations.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-secondary)', borderRadius: '15px', border: '2px dashed var(--border-color)' }}>
                                <MessageSquare size={50} color="var(--text-muted)" style={{ marginBottom: '15px', opacity: 0.5 }} />
                                <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No hay antecedentes de consulta en esta historia.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                {consultations.map((c: any) => (
                                    <div key={c.id} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        {/* Header de Consulta */}
                                        <div style={{ background: 'var(--fisiatria-purple-light)', padding: '15px 25px', borderBottom: '1px solid var(--fisiatria-purple-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ background: 'var(--fisiatria-purple)', color: 'white', padding: '5px 12px', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem' }}>
                                                    {new Date(c.fecha_consulta).toLocaleDateString()}
                                                </div>
                                                <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                    REFERIDO POR: {c.referido_por || 'PACIENTE DIRECTO'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Cuerpo de Historia */}
                                        <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div>
                                                <small style={{ color: 'var(--fisiatria-purple)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>Motivo de Consulta:</small>
                                                <p style={{ color: 'var(--text-primary)', marginTop: '6px', fontSize: '1rem', fontWeight: 500 }}>{c.motivo_consulta}</p>
                                            </div>

                                            <div>
                                                <small style={{ color: 'var(--fisiatria-purple)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>Evaluación / Examen Físico:</small>
                                                <p style={{ color: 'var(--text-primary)', marginTop: '6px', fontSize: '0.95rem', lineHeight: '1.6', background: 'var(--bg-secondary)', padding: '15px', borderRadius: '12px' }}>{c.examen_fisico}</p>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                                                <div style={{ borderLeft: '3px solid var(--fisiatria-purple)', paddingLeft: '15px' }}>
                                                    <small style={{ color: 'var(--fisiatria-purple)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>Impresión Diagnóstica:</small>
                                                    <p style={{ color: 'var(--text-primary)', marginTop: '6px', fontWeight: 700, fontSize: '1.05rem' }}>{c.diagnostico}</p>
                                                </div>
                                                <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '15px' }}>
                                                    <small style={{ color: '#10b981', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>Plan Terapéutico:</small>
                                                    <p style={{ color: 'var(--text-primary)', marginTop: '6px', fontSize: '0.95rem' }}>{c.plan_sugerencia}</p>
                                                </div>
                                            </div>

                                            {/* Reposo y Referencias */}
                                            {(c.reposo_constancia || c.referencia) && (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    {c.reposo_constancia && (
                                                        <div>
                                                            <small style={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <FileText size={12} /> Reposo / Constancia:
                                                            </small>
                                                            <p style={{ color: 'var(--text-primary)', marginTop: '4px', fontSize: '0.85rem' }}>{c.reposo_constancia}</p>
                                                        </div>
                                                    )}
                                                    {c.referencia && (
                                                        <div>
                                                            <small style={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <History size={12} /> Referencia:
                                                            </small>
                                                            <p style={{ color: 'var(--text-primary)', marginTop: '4px', fontSize: '0.85rem' }}>{c.referencia}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* RÉCIPE / MEDICAMENTOS */}
                                            {c.fisiatria_recipes && c.fisiatria_recipes.length > 0 && (
                                                <div style={{ marginTop: '10px' }}>
                                                    <small style={{ color: 'var(--fisiatria-purple)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                        <Pill size={16} /> Récipe e Indicaciones Médicas:
                                                    </small>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {c.fisiatria_recipes.map((r: any) => (
                                                            <div key={r.id} style={{ background: '#fdfbff', border: '1px solid var(--fisiatria-purple-border)', padding: '10px 15px', borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                                                                <strong style={{ color: 'var(--fisiatria-purple)', fontSize: '0.9rem' }}>{r.medicamento}</strong>
                                                                <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{r.indicaciones}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
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
                    patientId={patient.id}
                    patientName={patient.nombre_completo}
                    onClose={() => setShowNewConsultation(false)}
                    onSuccess={() => {
                        fetchConsultations();
                        setShowNewConsultation(false);
                    }}
                />
            )}
        </div>
    );
}
