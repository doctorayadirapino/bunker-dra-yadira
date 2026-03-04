import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, ClipboardList, Save, Plus, Trash2, Printer, Mail } from 'lucide-react';
import { generarConsultaFisiatriaPDF } from '../services/pdfService';

interface Props {
    patientId: string;
    patientName: string;
    patientCedula?: string;
    patientEdad?: string | number;
    patientTelefono?: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface RecipeItem {
    medicamento: string;
    indicaciones: string;
}

export default function FisiatriaConsultationModal({ patientId, patientName, patientCedula, patientEdad, patientTelefono, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [useDigitalSignature, setUseDigitalSignature] = useState(false);
    const [vademecumList, setVademecumList] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        referido_por: '',
        motivo_consulta: '',
        examen_fisico: '',
        diagnostico: '',
        plan_sugerencia: '',
        referencia: '',
        reposo_constancia: '',
        fecha_consulta: new Date().toISOString().split('T')[0]
    });

    const [recipes, setRecipes] = useState<RecipeItem[]>([
        { medicamento: '', indicaciones: '' }
    ]);

    useEffect(() => {
        fetchVademecum();
    }, []);

    const fetchVademecum = async () => {
        const { data } = await supabase
            .from('fisiatria_vademecum')
            .select('nombre_medicamento');
        if (data) {
            setVademecumList(data.map(i => i.nombre_medicamento));
        }
    };

    const addRecipeRow = () => {
        setRecipes([...recipes, { medicamento: '', indicaciones: '' }]);
    };

    const removeRecipeRow = (index: number) => {
        const newRecipes = [...recipes];
        newRecipes.splice(index, 1);
        setRecipes(newRecipes);
    };

    const handleRecipeChange = (index: number, field: keyof RecipeItem, value: string) => {
        const newRecipes = [...recipes];
        newRecipes[index][field] = value.toUpperCase();
        setRecipes(newRecipes);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Insertar Consulta
            const { data: consultaData, error: consultaError } = await supabase
                .from('fisiatria_consultas')
                .insert([
                    {
                        paciente_id: patientId,
                        ...formData
                    }
                ])
                .select()
                .single();

            if (consultaError) throw consultaError;

            // 2. Insertar Récipes
            const validRecipes = recipes.filter(r => r.medicamento.trim() !== '');
            if (validRecipes.length > 0) {
                const { error: recipesError } = await supabase
                    .from('fisiatria_recipes')
                    .insert(
                        validRecipes.map(r => ({
                            consulta_id: consultaData.id,
                            medicamento: r.medicamento,
                            indicaciones: r.indicaciones
                        }))
                    );
                if (recipesError) throw recipesError;

                // 3. AUTO-LEARNING VADEMECUM
                for (const r of validRecipes) {
                    const medUpper = r.medicamento.trim().toUpperCase();
                    if (!vademecumList.includes(medUpper)) {
                        await supabase
                            .from('fisiatria_vademecum')
                            .insert([{
                                nombre_medicamento: medUpper,
                                indicaciones_sugeridas: r.indicaciones
                            }]);
                    }
                }
            }

            alert("¡CONSULTA Y RÉCIPE REGISTRADOS EXITOSAMENTE EN EL BÚNKER!");

            // 4. Preguntar por Impresión de Informe
            if (window.confirm("¿Desea generar e imprimir el INFORME MÉDICO ahora?")) {
                const payload = {
                    paciente: {
                        nombre: patientName,
                        cedula: patientCedula || '',
                        edad: patientEdad?.toString() || '',
                        telefono: patientTelefono || '',
                    },
                    consulta: {
                        fecha: formData.fecha_consulta,
                        referido_por: formData.referido_por || 'PACIENTE DIRECTO',
                        motivo_consulta: formData.motivo_consulta,
                        examen_fisico: formData.examen_fisico,
                        diagnostico: formData.diagnostico,
                        plan_sugerencia: formData.plan_sugerencia,
                        referencia: formData.referencia,
                        reposo_constancia: formData.reposo_constancia
                    },
                    recipes: validRecipes,
                    conFirmaDigital: useDigitalSignature
                };
                generarConsultaFisiatriaPDF(payload);
            }

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
            <div className="modal-content" style={{ maxWidth: '800px', width: '95%' }}>
                <div className="modal-header">
                    <h2 style={{ color: 'var(--fisiatria-purple)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ClipboardList size={24} />
                        Consulta Médica Fisiátrica: {patientName}
                    </h2>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', maxHeight: '85vh', overflowY: 'auto' }}>

                    {/* SECCIÓN 1: DATOS GENERALES */}
                    <div className="form-section-fisiatria">
                        <h3 className="section-title">1. Evolución Clínica</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label className="label">Referido por</label>
                                <input
                                    className="eval-input"
                                    value={formData.referido_por}
                                    onChange={(e) => setFormData({ ...formData, referido_por: e.target.value.toUpperCase() })}
                                    placeholder="EJ: TRAUMATOLOGÍA / PEDIATRÍA"
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                            <label className="label">Motivo de Consulta</label>
                            <textarea
                                required
                                className="eval-input"
                                rows={2}
                                value={formData.motivo_consulta}
                                onChange={(e) => setFormData({ ...formData, motivo_consulta: e.target.value.toUpperCase() })}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                            <label className="label">Examen Físico / Evaluación Funcional</label>
                            <textarea
                                className="eval-input"
                                rows={3}
                                value={formData.examen_fisico}
                                onChange={(e) => setFormData({ ...formData, examen_fisico: e.target.value.toUpperCase() })}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                            <label className="label">Impresión Diagnóstica</label>
                            <textarea
                                className="eval-input"
                                rows={2}
                                value={formData.diagnostico}
                                onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value.toUpperCase() })}
                            />
                        </div>
                    </div>

                    {/* SECCIÓN 2: PLAN Y REFERENCIAS */}
                    <div className="form-section-fisiatria">
                        <h3 className="section-title">2. Plan y Conducta Médica</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                            <label className="label">Plan de Tratamiento / Sugerencia Terapéutica</label>
                            <textarea
                                className="eval-input"
                                rows={3}
                                value={formData.plan_sugerencia}
                                onChange={(e) => setFormData({ ...formData, plan_sugerencia: e.target.value.toUpperCase() })}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label className="label">Reposo o Constancia</label>
                                <input
                                    className="eval-input"
                                    value={formData.reposo_constancia}
                                    onChange={(e) => setFormData({ ...formData, reposo_constancia: e.target.value.toUpperCase() })}
                                    placeholder="DETALLES DE REPOSO O TIPO DE CONSTANCIA"
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label className="label">Referencia / Otros</label>
                                <input
                                    className="eval-input"
                                    value={formData.referencia}
                                    onChange={(e) => setFormData({ ...formData, referencia: e.target.value.toUpperCase() })}
                                    placeholder="REFERENCIA A OTRO ESPECIALISTA"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: RÉCIPE / VADEMÉCUM (INTELIGENTE) */}
                    <div className="form-section-fisiatria" style={{ background: 'var(--fisiatria-purple-light)', border: '1px solid var(--fisiatria-purple-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 className="section-title" style={{ marginBottom: 0 }}>3. Récipe Médico (Vademécum Inteligente)</h3>
                            <button type="button" onClick={addRecipeRow} className="btn-purple-pill">
                                <Plus size={16} /> Añadir Medicamento
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recipes.map((r, index) => (
                                <div key={index} className="recipe-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 40px', gap: '10px', alignItems: 'flex-start' }}>
                                    <div>
                                        <input
                                            className="eval-input"
                                            list="vademecum-opts"
                                            placeholder="Medicamento"
                                            value={r.medicamento}
                                            onChange={(e) => handleRecipeChange(index, 'medicamento', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            className="eval-input"
                                            placeholder="Indicaciones (Dosis, frecuencia, duración)"
                                            value={r.indicaciones}
                                            onChange={(e) => handleRecipeChange(index, 'indicaciones', e.target.value)}
                                        />
                                    </div>
                                    <button type="button" onClick={() => removeRecipeRow(index)} className="btn-delete-row">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <datalist id="vademecum-opts">
                            {vademecumList.map(v => <option key={v} value={v} />)}
                        </datalist>
                    </div>

                    {/* SECCIÓN 4: FIRMA Y SELLO */}
                    <div className="form-section-fisiatria" style={{ background: 'var(--bg-secondary)' }}>
                        <h3 className="section-title">4. Formalización de Documentos</h3>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 15px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'white' }}>
                                <input
                                    type="checkbox"
                                    checked={useDigitalSignature}
                                    onChange={e => setUseDigitalSignature(e.target.checked)}
                                    style={{ width: '20px', height: '20px' }}
                                />
                                {useDigitalSignature ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--corporate-blue)', fontWeight: 700 }}>
                                        <Mail size={18} /> INCLUIR FIRMA Y SELLO DIGITAL
                                    </span>
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                                        <Printer size={18} /> FIRMA Y SELLO MANUAL (PARA IMPRESIÓN)
                                    </span>
                                )}
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingBottom: '20px' }}>
                        <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
                        <button type="submit" className="btn-purple-action" disabled={loading} style={{ background: 'var(--fisiatria-purple)', padding: '15px 30px', fontSize: '1.1rem' }}>
                            <Save size={22} /> {loading ? 'Sincronizando con Búnker...' : 'GUARDAR CONSULTA Y RÉCIPE'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .section-title {
                    font-size: 0.9rem;
                    color: var(--fisiatria-purple);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 800;
                    margin-bottom: 20px;
                    border-bottom: 2px solid var(--fisiatria-purple-border);
                    padding-bottom: 5px;
                    display: inline-block;
                }
                .form-section-fisiatria {
                    background: white;
                    padding: 20px;
                    border-radius: 15px;
                    border: 1px solid var(--border-color);
                }
                .eval-input {
                    width: 100%;
                    padding: 12px;
                    border-radius: 10px;
                    border: 1px solid var(--fisiatria-purple-border);
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    font-size: 0.95rem;
                    outline: none;
                    transition: all 0.3s;
                }
                .eval-input:focus {
                    border-color: var(--fisiatria-purple);
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                    background: white;
                }
                .label {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .btn-purple-pill {
                    background: var(--fisiatria-purple-light);
                    color: var(--fisiatria-purple);
                    border: 1px solid var(--fisiatria-purple-border);
                    padding: 6px 15px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .btn-purple-pill:hover {
                    background: var(--fisiatria-purple);
                    color: white;
                }
                .btn-delete-row {
                    background: #fee2e2;
                    color: #ef4444;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-delete-row:hover {
                    background: #ef4444;
                    color: white;
                }
            `}</style>
        </div>
    );
}
