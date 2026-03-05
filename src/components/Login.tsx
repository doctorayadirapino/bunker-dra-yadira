import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Lock, User, ChevronRight, Shield } from 'lucide-react';
import './Login.css';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [recoveryMode, setRecoveryMode] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        // Mapeo Maestro de Identidades Corporativas (Exclusivo)
        let internalEmail = '';
        const normalizedUsername = username.trim().toLowerCase();

        if (normalizedUsername === 'yadira_laboral') {
            internalEmail = 'yadirapinorujano288@gmail.com';
        } else if (normalizedUsername === 'yadira_fisiatra') {
            internalEmail = 'doctora.fisiatria@sistema.com';
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

    const handleRecovery = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        // Solo permitir recuperación por alias conocidos
        let targetEmail = username;
        if (username === 'yadira_laboral') targetEmail = 'yadirapinorujano288@gmail.com';
        if (username === 'yadira_fisiatra') targetEmail = 'doctora.fisiatria@sistema.com';

        try {
            const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
                redirectTo: window.location.origin,
            });

            if (recoveryError) throw recoveryError;
            setMessage("Instrucciones de seguridad enviadas al usuario.");
        } catch (err: any) {
            setError('No se pudo procesar la recuperación. Contacte al administrador.');
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
                        {recoveryMode && (
                            <p className="login-subtitle">Rescate de Acceso</p>
                        )}
                    </div>

                    {!recoveryMode ? (
                        <form onSubmit={handleLogin} className="login-form">
                            <div className="input-group">
                                <label><User size={18} /> Nombre de Usuario</label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    autoComplete="username"
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="yadira_laboral / yadira_fisiatra"
                                />
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={18} /> Contraseña</span>
                                    <button
                                        type="button"
                                        onClick={() => setRecoveryMode(true)}
                                        className="forgot-password-link"
                                    >
                                        ¿Nueva clave?
                                    </button>
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    autoComplete="current-password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && <div className="login-error-alert">⚠️ {error}</div>}

                            <button type="submit" className="login-submit-btn" disabled={loading}>
                                {loading ? <span className="loader">Validando...</span> : <>Entrar al Sistema <ChevronRight size={20} /></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRecovery} className="login-form">
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '15px' }}>
                                Introduzca su nombre de usuario para el rescate.
                            </p>
                            <div className="input-group">
                                <label><User size={18} /> Usuario</label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Ej: yadira_laboral"
                                />
                            </div>

                            {error && <div className="login-error-alert">⚠️ {error}</div>}
                            {message && <div className="login-success-alert">✅ {message}</div>}

                            <button type="submit" className="login-submit-btn" disabled={loading}>
                                {loading ? <span className="loader">Enviando...</span> : <>Confirmar Rescate <ChevronRight size={20} /></>}
                            </button>

                            <button
                                type="button"
                                onClick={() => setRecoveryMode(false)}
                                className="back-to-login-btn"
                            >
                                Volver al Ingreso
                            </button>
                        </form>
                    )}

                    <div className="login-footer">
                        <div className="developer-badge" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Shield size={14} color="var(--medical-turquoise)" /> DESARROLLADOR: LIC. CARLOS FUENTES
                        </div>
                        <p>© {new Date().getFullYear()} Syntax Software Venezolana.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
