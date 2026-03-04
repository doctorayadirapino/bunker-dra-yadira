import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, ClipboardList, Save } from 'lucide-react';

interface Props {
    patientId: string;
    patientName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function FisiatriaConsultationModal({ patientId, patientName, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        referido_por: '',
        motivo_consulta: '',
        examen_fisico: '',
        diagnostico: '',
        plan_sugerencia: '',
        referencia: '',
        fecha_consulta: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('fisiatria_consultas')
                .insert([
                    {
                        paciente_id: patientId,
                        ...formData
                    }
                ]);

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (error: any) {
            alert("Error al registrar consulta: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <h2 style={{ color: 'var(--fisiatria-purple)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ClipboardList size={24} />
                        Nueva Consulta: {patientName}
                    </h2>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="label">Referido por</label>
                            <input
                                className="eval-input"
                                value={formData.referido_por}
                                onChange={(e) => setFormData({ ...formData, referido_por: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="label">Fecha de Consulta</label>
                            <input
                                type="date"
                                className="eval-input"
                                value={formData.fecha_consulta}
                                onChange={(e) => setFormData({ ...formData, fecha_consulta: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="label">Motivo de Consulta</label>
                        <textarea
                            required
                            className="eval-input"
                            rows={2}
                            value={formData.motivo_consulta}
                            onChange={(e) => setFormData({ ...formData, motivo_consulta: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="label">Examen Físico / Evaluación Funcional</label>
                        <textarea
                            className="eval-input"
                            rows={3}
                            value={formData.examen_fisico}
                            onChange={(e) => setFormData({ ...formData, examen_fisico: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="label">Impresión Diagnóstica</label>
                        <textarea
                            className="eval-input"
                            rows={2}
                            value={formData.diagnostico}
                            onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="label">Plan de Tratamiento / Sugerencia Terapéutica</label>
                        <textarea
                            className="eval-input"
                            rows={3}
                            value={formData.plan_sugerencia}
                            onChange={(e) => setFormData({ ...formData, plan_sugerencia: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="label">Referencia / Otros</label>
                        <input
                            className="eval-input"
                            value={formData.referencia}
                            onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingBottom: '10px' }}>
                        <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
                        <button type="submit" className="btn-purple-action" disabled={loading} style={{ background: 'var(--fisiatria-purple)' }}>
                            <Save size={18} /> {loading ? 'Guardando Consulta...' : 'Registrar Consulta'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .eval-input {
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid var(--fisiatria-purple-border);
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    font-size: 0.95rem;
                    outline: none;
                    resize: vertical;
                }
                .label {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
}
