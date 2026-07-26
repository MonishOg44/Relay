import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogIn, UserPlus, AlertCircle, KeyRound, Check, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AuthScreen() {
  const { login, signup, resetPassword } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [identifier, setIdentifier] = useState(''); // Email or Username for Sign In / Email for Sign Up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (isSignUp) {
      if (!username.trim()) {
        errors.username = 'Username is required';
      }
      if (!email.trim()) {
        errors.email = 'Email address is required';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        errors.email = 'Enter a valid email address';
      }
    } else if (!isForgotPassword) {
      if (!identifier.trim()) {
        errors.identifier = 'Username or email is required';
      }
    }

    if (!isForgotPassword) {
      if (!password) {
        errors.password = 'Password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const targetEmail = isSignUp ? email : identifier;
    if (!targetEmail.trim() || !/\S+@\S+\.\S+/.test(targetEmail)) {
      setValidationErrors({ identifier: 'Enter your valid email address to reset password' });
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(targetEmail);
      setResetSent(true);
    } catch (err) {
      setError(err.message || 'Password reset request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isForgotPassword) return handleResetSubmit(e);

    setError('');
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signup(email, password, username);
      } else {
        await login(identifier, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting && !isForgotPassword) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999999,
          background: isDark ? '#000000' : '#ffffff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: isDark ? '#ffffff' : '#000000'
        }}
      >
        <Loader2 size={36} className="animate-spin" style={{ marginBottom: '16px', color: '#00a884' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px' }}>Signing in...</h2>
      </div>
    );
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card animate-fade-in-up">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img
            src="/quality_restoration_20260724180021934.JPEG"
            alt="Relay Logo"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              objectFit: 'cover',
              margin: '0 auto 16px',
              display: 'block',
              boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
              border: '1px solid var(--border-color)',
            }}
          />
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>
            {isForgotPassword
              ? 'Reset Password'
              : isSignUp
              ? 'Create Account'
              : 'Welcome to Relay'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            {isForgotPassword
              ? 'Enter your email to receive a password reset link'
              : 'Real-Time Encrypted Messaging'}
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="futuristic-alert animate-fade-in-up" style={{ marginBottom: '16px' }}>
            <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Reset Success Message */}
        {resetSent ? (
          <div className="animate-fade-in-up" style={{
            padding: '16px', background: 'rgba(0, 168, 132, 0.12)', border: '1px solid rgba(0, 168, 132, 0.3)',
            borderRadius: '10px', textAlign: 'center', color: '#00a884', fontSize: '13.5px'
          }}>
            <Check size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
            Password reset link sent to <strong>{identifier || email}</strong>! Check your inbox.
            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setResetSent(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* SIGN UP: USERNAME & EMAIL */}
            {isSignUp && !isForgotPassword && (
              <>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    USERNAME
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (validationErrors.username) setValidationErrors((p) => ({ ...p, username: null }));
                    }}
                    placeholder="e.g. alex"
                    className={validationErrors.username ? 'shake-input' : ''}
                    style={{
                      borderColor: validationErrors.username ? '#ff4757' : undefined,
                      boxShadow: validationErrors.username ? '0 0 8px rgba(255, 71, 87, 0.3)' : undefined
                    }}
                  />
                  {validationErrors.username && (
                    <div className="futuristic-error-badge animate-fade-in-up">
                      <AlertCircle size={13} color="#ff4757" style={{ flexShrink: 0 }} />
                      <span>{validationErrors.username}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (validationErrors.email) setValidationErrors((p) => ({ ...p, email: null }));
                    }}
                    placeholder="name@example.com"
                    className={validationErrors.email ? 'shake-input' : ''}
                    style={{
                      borderColor: validationErrors.email ? '#ff4757' : undefined,
                      boxShadow: validationErrors.email ? '0 0 8px rgba(255, 71, 87, 0.3)' : undefined
                    }}
                  />
                  {validationErrors.email && (
                    <div className="futuristic-error-badge animate-fade-in-up">
                      <AlertCircle size={13} color="#ff4757" style={{ flexShrink: 0 }} />
                      <span>{validationErrors.email}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* SIGN IN / FORGOT PASSWORD: USERNAME OR EMAIL */}
            {!isSignUp && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isForgotPassword ? 'EMAIL ADDRESS' : 'USERNAME OR EMAIL ADDRESS'}
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (validationErrors.identifier) setValidationErrors((p) => ({ ...p, identifier: null }));
                  }}
                  placeholder={isForgotPassword ? "name@example.com" : "e.g. alex or name@example.com"}
                  className={validationErrors.identifier ? 'shake-input' : ''}
                  style={{
                    borderColor: validationErrors.identifier ? '#ff4757' : undefined,
                    boxShadow: validationErrors.identifier ? '0 0 8px rgba(255, 71, 87, 0.3)' : undefined
                  }}
                />
                {validationErrors.identifier && (
                  <div className="futuristic-error-badge animate-fade-in-up">
                    <AlertCircle size={13} color="#ff4757" style={{ flexShrink: 0 }} />
                    <span>{validationErrors.identifier}</span>
                  </div>
                )}
              </div>
            )}

            {/* PASSWORD INPUT WITH EYE TOGGLE */}
            {!isForgotPassword && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    PASSWORD
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setError(''); setValidationErrors({}); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (validationErrors.password) setValidationErrors((p) => ({ ...p, password: null }));
                    }}
                    placeholder="••••••••"
                    className={validationErrors.password ? 'shake-input' : ''}
                    style={{
                      width: '100%',
                      paddingRight: '42px',
                      borderColor: validationErrors.password ? '#ff4757' : undefined,
                      boxShadow: validationErrors.password ? '0 0 8px rgba(255, 71, 87, 0.3)' : undefined
                    }}
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
                      color: 'var(--icon-default)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {validationErrors.password && (
                  <div className="futuristic-error-badge animate-fade-in-up">
                    <AlertCircle size={13} color="#ff4757" style={{ flexShrink: 0 }} />
                    <span>{validationErrors.password}</span>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={submitting} style={{ marginTop: '6px' }}>
              {isForgotPassword ? (
                <KeyRound size={16} />
              ) : isSignUp ? (
                <UserPlus size={16} />
              ) : (
                <LogIn size={16} />
              )}
              {submitting
                ? 'Please wait...'
                : isForgotPassword
                ? 'Send Reset Link'
                : isSignUp
                ? 'Sign Up'
                : 'Sign In'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          {isForgotPassword ? (
            <button
              type="button"
              onClick={() => { setIsForgotPassword(false); setError(''); setValidationErrors({}); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-green)', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
            >
              Back to Sign In
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setValidationErrors({});
                setError('');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-green)', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
