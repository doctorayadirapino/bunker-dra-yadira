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

        // Mapeo Maestro de Usuarios de Grado Corporativo
        let internalEmail = username;
        if (username === 'yadira_laboral') internalEmail = 'yadirapinorujano288@gmail.com';
        if (username === 'yadira_fisiatra') internalEmail = 'doctora.fisiatria@bunker.com';

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

        try {
            const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(username, {
                redirectTo: window.location.origin,
            });

            if (recoveryError) throw recoveryError;
            setMessage("Se ha enviado un enlace de recuperación al correo asociado.");
        } catch (err: any) {
            setError('Error al procesar la recuperación. Verifique el usuario.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Fondo con esferas decorativas dinámicas */}
            <div className="decorative-sphere sphere-1"></div>
            <div className="decorative-sphere sphere-2"></div>

            <div className="login-card-wrapper fade-in">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo-container">
                            <Activity size={40} className="pulse-icon" />
                        </div>
                        <h1 className="login-title">Dra. Yadira Pino</h1>
                        {recoveryMode && (
                            <p className="login-subtitle">Recuperación de Acceso</p>
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
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Ingrese su usuario"
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
                                        ¿Olvidó su clave?
                                    </button>
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && <div className="login-error-alert">⚠️ {error}</div>}

                            <button type="submit" className="login-submit-btn" disabled={loading}>
                                {loading ? <span className="loader">Verificando...</span> : <>Ingresar al Sistema <ChevronRight size={20} /></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRecovery} className="login-form">
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '10px' }}>
                                Ingrese su usuario para recibir instrucciones de recuperación.
                            </p>
                            <div className="input-group">
                                <label><User size={18} /> Nombre de Usuario</label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Ingrese su usuario"
                                />
                            </div>

                            {error && <div className="login-error-alert">⚠️ {error}</div>}
                            {message && <div className="login-success-alert">✅ {message}</div>}

                            <button type="submit" className="login-submit-btn" disabled={loading}>
                                {loading ? <span className="loader">Procesando...</span> : <>Enviar Recuperación <ChevronRight size={20} /></>}
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
                        <div className="developer-badge" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Shield size={14} color="var(--medical-turquoise)" /> Desarrollador: LIC CARLOS FUENTES | 04129581040
                        </div>
                        <p>© {new Date().getFullYear()} Syntax Software Corp Venezolana.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
