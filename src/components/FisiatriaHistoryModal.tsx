import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, History, PlusCircle, Calendar, MessageSquare } from 'lucide-react';
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
            .select('*')
            .eq('paciente_id', patient.id)
            .order('fecha_consulta', { ascending: false });

        if (data) setConsultations(data);
        setLoading(false);
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal-content" style={{ maxWidth: '900px', width: '95%' }}>
                <div className="modal-header">
                    <h2 style={{ color: 'var(--fisiatria-purple)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <History size={24} />
                        Historia Clínica: {patient.nombre_completo}
                    </h2>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                <div className="modal-body" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
                    {/* Lateral: Datos del Paciente */}
                    <aside style={{ background: 'var(--fisiatria-purple-light)', padding: '20px', borderRadius: '15px', border: '1px solid var(--fisiatria-purple-border)', height: 'fit-content' }}>
                        <h4 style={{ color: 'var(--fisiatria-purple)', marginBottom: '15px', borderBottom: '1px solid var(--fisiatria-purple-border)', paddingBottom: '8px' }}>DATOS PERSONALES</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <small style={{ color: 'var(--text-secondary)', display: 'block' }}>Cédula</small>
                                <strong style={{ color: 'var(--text-primary)' }}>{patient.cedula}</strong>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-secondary)', display: 'block' }}>Edad</small>
                                <strong style={{ color: 'var(--text-primary)' }}>{patient.edad} años</strong>
                            </div>
                            <div>
                                <small style={{ color: 'var(--text-secondary)', display: 'block' }}>Teléfono</small>
                                <strong style={{ color: 'var(--text-primary)' }}>{patient.telefono || 'No registrado'}</strong>
                            </div>
                        </div>

                        <button
                            className="btn-purple-action"
                            style={{ width: '100%', marginTop: '30px', justifyContent: 'center' }}
                            onClick={() => setShowNewConsultation(true)}
                        >
                            <PlusCircle size={18} /> Nueva Consulta
                        </button>
                    </aside>

                    {/* Principal: Historial de Consultas */}
                    <main>
                        <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={20} color="var(--fisiatria-purple)" />
                            Registro de Evolución
                        </h3>

                        {loading ? (
                            <p style={{ color: 'var(--text-secondary)' }}>Cargando historial...</p>
                        ) : consultations.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '15px', border: '1px dashed var(--border-color)' }}>
                                <MessageSquare size={40} color="var(--text-muted)" style={{ marginBottom: '15px' }} />
                                <p style={{ color: 'var(--text-muted)' }}>No hay consultas registradas para este paciente.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {consultations.map((c: any) => (
                                    <div key={c.id} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '15px', overflow: 'hidden' }}>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--fisiatria-purple)' }}>
                                                {new Date(c.fecha_consulta).toLocaleDateString()}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                Ref: {c.referido_por || 'Directo'}
                                            </span>
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            <div style={{ marginBottom: '15px' }}>
                                                <small style={{ color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>Motivo:</small>
                                                <p style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{c.motivo_consulta}</p>
                                            </div>
                                            <div style={{ marginBottom: '15px' }}>
                                                <small style={{ color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>Examen / Evaluación:</small>
                                                <p style={{ color: 'var(--text-primary)', marginTop: '4px', fontSize: '0.9rem' }}>{c.examen_fisico}</p>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <div>
                                                    <small style={{ color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>Diagnóstico:</small>
                                                    <p style={{ color: 'var(--text-primary)', marginTop: '4px', fontWeight: '600' }}>{c.diagnostico}</p>
                                                </div>
                                                <div>
                                                    <small style={{ color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>Plan Terapéutico:</small>
                                                    <p style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{c.plan_sugerencia}</p>
                                                </div>
                                            </div>
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
