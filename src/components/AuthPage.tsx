
import { useState } from 'react';
import type { FormEvent } from 'react';
import { login, register } from '../services/auth';
import type { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthPageProps {
    onLogin: (user: User) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
    const { t } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                const user = login(email, password);
                onLogin(user);
            } else {
                if (!name.trim()) {
                    setError(t('auth.error.fillAll'));
                    return;
                }
                if (!username.trim().startsWith('@')) {
                    setError('Username must start with @'); // TODO add translation key if needed
                    return;
                }
                const user = register(email, password, name, username);
                onLogin(user);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{ marginBottom: '10px', color: '#333' }}>
                    {isLogin ? t('auth.signin') : t('auth.register')}
                </h1>
                <p style={{ color: '#666', marginBottom: '30px' }}>
                    {t('nav.subtitle')}
                </p>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                                {t('auth.name')}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    boxSizing: 'border-box'
                                }}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    {!isLogin && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                                {t('auth.username')}
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="@username"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    boxSizing: 'border-box'
                                }}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                            {t('auth.email')}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                            {t('auth.password')}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            background: '#fee',
                            color: '#c33',
                            borderRadius: '8px',
                            marginBottom: '20px'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginBottom: '15px'
                        }}
                    >
                        {isLogin ? t('auth.signin') : t('auth.signup')}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: 'transparent',
                            color: '#667eea',
                            border: '2px solid #667eea',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
                    </button>
                </form>
            </div>
        </div>
    );
}
