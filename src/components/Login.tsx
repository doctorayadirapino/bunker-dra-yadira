import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Lock, User, ChevronRight, Shield, Eye, EyeOff } from 'lucide-react';
import './Login.css';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Mapeo Maestro de Identidades Corporativas (Exclusivo)
        let internalEmail = '';
        const normalizedUsername = username.trim().toLowerCase();

        if (normalizedUsername === 'yadira_laboral') {
            internalEmail = 'yadirapinorujano288@gmail.com';
        } else if (normalizedUsername === 'yadira_fisiatra') {
            internalEmail = 'doctora.fisiatria@bunker.com'; // Este es el ID real de supabase, no se puede cambiar a sistema
        } else {
            // Si no es un alias, verificamos si es un correo directo (solo para soporte)
            if (normalizedUsername.includes('@')) {
                internalEmail = normalizedUsername;
            } else {
                setError('El usuario ingresado no existe en el registro del sistema.');
                setLoading(false);
                return;
            }
        }

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: internalEmail,
                password,
            });

            if (signInError) throw signInError;
        } catch (err: any) {
            setError('Credenciales inválidas. Verifique su usuario y contraseña.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="login-container">
            <div className="decorative-sphere sphere-1"></div>
            <div className="decorative-sphere sphere-2"></div>

            <div className="login-card-wrapper fade-in">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo-container">
                            <Activity size={40} className="pulse-icon" />
                        </div>
                        <h1 className="login-title">Dra. Yadira Pino</h1>
                        <div style={{
                            background: 'var(--medical-turquoise)',
                            color: 'white',
                            fontSize: '0.7rem',
                            padding: '2px 10px',
                            borderRadius: '20px',
                            display: 'inline-block',
                            marginBottom: '15px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Plataforma Médica
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="input-group">
                            <label><User size={18} /> Nombre de Usuario</label>
                            <input
                                type="text"
                                required
                                value={username}
                                autoComplete="username"
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={18} /> Contraseña</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    autoComplete="current-password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        padding: '4px',
                                        opacity: 0.7,
                                        transition: 'opacity 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                                    title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {error && <div className="login-error-alert">⚠️ {error}</div>}

                        <button type="submit" className="login-submit-btn" disabled={loading}>
                            {loading ? <span className="loader">Validando...</span> : <>Entrar al Sistema <ChevronRight size={20} /></>}
                        </button>
                    </form>

                    <div className="login-footer">
                        <div className="developer-badge" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={14} color="var(--medical-turquoise)" /> DESARROLLADOR: LIC. CARLOS FUENTES
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>04129581040</span>
                        </div>
                        <p>© {new Date().getFullYear()} Syntax Software Venezolana.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
