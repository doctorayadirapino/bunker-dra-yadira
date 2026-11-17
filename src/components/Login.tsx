/* © 2026 MSc. Carlos Fuentes. Todos los derechos reservados. Uso Propietario. */
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, User, ChevronRight, Shield, Eye, EyeOff } from 'lucide-react';
import './Login.css';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // PROTECCIÓN ANTI-FUERZA BRUTA (ZERO TRUST)
        if (lockoutUntil && Date.now() < lockoutUntil) {
            const remainingSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
            setError(`Acceso bloqueado temporalmente por seguridad. Intente en ${remainingSec}s.`);
            return;
        }

        setLoading(true);
        setError(null);

        // LISTA BLANCA ESTRICTA DE IDENTIDADES CORPORATIVAS (CERO PUERTAS TRASERAS)
        let internalEmail = '';
        const normalizedUsername = username.trim().toLowerCase();

        if (normalizedUsername === 'yadira_laboral') {
            internalEmail = 'yadirapinorujano288@gmail.com';
        } else if (normalizedUsername === 'yadira_fisiatra') {
            internalEmail = 'doctora.fisiatria@bunker.com';
        } else {
            const nextAttempts = failedAttempts + 1;
            setFailedAttempts(nextAttempts);
            if (nextAttempts >= 5) {
                setLockoutUntil(Date.now() + 30000);
                setError('Demasiados intentos fallidos. Sistema bloqueado por 30 segundos.');
            } else {
                setError('Credenciales inválidas. Acceso restringido a personal autorizado.');
            }
            setLoading(false);
            return;
        }

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: internalEmail,
                password,
            });

            if (signInError) throw signInError;
            setFailedAttempts(0);
            setLockoutUntil(null);
        } catch {
            const nextAttempts = failedAttempts + 1;
            setFailedAttempts(nextAttempts);
            if (nextAttempts >= 5) {
                setLockoutUntil(Date.now() + 30000);
                setError('Demasiados intentos fallidos. Sistema bloqueado por 30 segundos.');
            } else {
                setError('Credenciales inválidas. Verifique su usuario y contraseña.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="aurora-medical-login">
            {/* FONDO MÉDICO CINEMÁTICO ESTILO AURORA */}
            <div className="aurora-bg-canvas">
                <div className="aurora-glow aurora-glow-emerald" />
                <div className="aurora-glow aurora-glow-cyan" />
                <div className="aurora-glow aurora-glow-blue" />
                <div className="aurora-medical-grid" />

                {/* ONDAS BIOMÉDICAS Y PULSO ECG VECTORIAL EN TIEMPO REAL */}
                <svg className="aurora-ecg-wave" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(11, 218, 218, 0)" />
                            <stop offset="35%" stopColor="rgba(11, 218, 218, 0.35)" />
                            <stop offset="50%" stopColor="rgba(16, 185, 129, 0.7)" />
                            <stop offset="65%" stopColor="rgba(59, 130, 246, 0.35)" />
                            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                        </linearGradient>
                    </defs>
                    <path
                        className="ecg-path-anim"
                        fill="none"
                        stroke="url(#ecgGrad)"
                        strokeWidth="2.2"
                        d="M0,180 L280,180 L310,165 L330,195 L355,180 L410,180 L430,180 L448,85 L468,255 L488,135 L508,205 L525,180 L760,180 L790,165 L810,195 L835,180 L920,180 L940,75 L960,260 L980,130 L1000,200 L1020,180 L1440,180"
                    />
                </svg>

                {/* VIÑETAS CINEMÁTICAS EXACTAS PROYECTO AURORA */}
                <div className="aurora-vignette-base" />
                <div className="aurora-vignette-vertical" />
                <div className="aurora-vignette-horizontal" />
            </div>

            {/* CONTENIDO CENTRAL DIVIDIDO (HERO + LOGIN CARD) */}
            <div className="aurora-main-layout">
                {/* COLUMNA IZQUIERDA: IDENTIDAD MÉDICA ESTILO AURORA */}
                <div className="aurora-hero-column fade-in">
                    <h1 className="aurora-hero-title">
                        <span>MÉDICO FISIATRA Y OCUPACIONAL</span>
                    </h1>

                    <p className="aurora-hero-description">
                        Gestión clínica inteligente de rehabilitación física, evaluaciones ocupacionales y vigilancia epidemiológica bajo arquitectura de máxima seguridad.
                    </p>
                </div>

                {/* COLUMNA DERECHA: TARJETA DE ACCESO GLASSMORPHISM */}
                <div className="login-card-wrapper fade-in">
                    <div className="login-card">
                        <div className="login-header">
                            <div className="login-logo-container">
                                <img src="/pwa-512x512.png" alt="Logo Consultorio Dra. Yadira Pino" className="login-brand-logo" />
                            </div>
                            <h2 className="login-title">DRA. YADIRA PINO</h2>
                        </div>

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="input-group">
                                <label><User size={17} /> Nombre de Usuario</label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    autoComplete="username"
                                    placeholder="Usuario médico"
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={17} /> Contraseña</span>
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
                                            right: '14px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            padding: '4px',
                                            opacity: 0.75,
                                            transition: 'opacity 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.75'}
                                        title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                    >
                                        {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                                    </button>
                                </div>
                            </div>

                            {error && <div className="login-error-alert">⚠️ {error}</div>}

                            <button type="submit" className="login-submit-btn" disabled={loading}>
                                {loading ? <span className="loader">Validando...</span> : <>Entrar al Sistema <ChevronRight size={19} /></>}
                            </button>
                        </form>

                        <div className="login-footer">
                            <div className="developer-badge">
                                <div className="dev-title">
                                    <Shield size={13} color="#0bdada" /> DESARROLLADOR: LIC. CARLOS FUENTES
                                </div>
                                <span className="dev-phone">
                                    0412-9581040
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
