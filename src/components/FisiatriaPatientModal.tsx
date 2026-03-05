import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, UserPlus, Save } from 'lucide-react';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
    patientToEdit?: any;
}

export default function FisiatriaPatientModal({ onClose, onSuccess, patientToEdit }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre_completo: '',
        cedula: '',
        edad: '',
        telefono: ''
    });

    useEffect(() => {
        if (patientToEdit) {
            setFormData({
                nombre_completo: patientToEdit.nombre_completo || '',
                cedula: patientToEdit.cedula || '',
                edad: patientToEdit.edad?.toString() || '',
                telefono: patientToEdit.telefono || ''
            });
        }
    }, [patientToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                nombre_completo: formData.nombre_completo.toUpperCase(),
                cedula: formData.cedula,
                edad: formData.edad ? parseInt(formData.edad) : null,
                telefono: formData.telefono
            };

            if (patientToEdit) {
                const { error } = await supabase
                    .from('fisiatria_pacientes')
                    .update(payload)
                    .eq('id', patientToEdit.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('fisiatria_pacientes')
                    .insert([payload]);
                if (error) throw error;
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            alert("Error al guardar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2 style={{ color: 'var(--fisiatria-purple)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <UserPlus size={24} />
                        {patientToEdit ? 'Editar Paciente' : 'Nueva Historia Clínica (Fisiatría)'}
                    </h2>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="label">Nombre Completo</label>
                        <input
                            required
                            className="eval-input"
                            value={formData.nombre_completo}
                            onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                            placeholder="EJ: JUAN PÉREZ"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="label">Cédula</label>
                            <input
                                required
                                className="eval-input"
                                value={formData.cedula}
                                onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                                placeholder="V-12345678"
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="label">Edad</label>
                            <input
                                type="number"
                                className="eval-input"
                                value={formData.edad}
                                onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                                placeholder="Años"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="label">Teléfono</label>
                        <input
                            className="eval-input"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            placeholder="0412-0000000"
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
                        <button type="submit" className="btn-purple-action" disabled={loading} style={{ background: 'var(--fisiatria-purple)' }}>
                            <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Paciente'}
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
                    font-size: 1rem;
                    outline: none;
                    transition: border-color 0.3s;
                }
                .eval-input:focus {
                    border-color: var(--fisiatria-purple);
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
