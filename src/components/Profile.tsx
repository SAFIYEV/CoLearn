
import { useState } from 'react';
import type { User } from '../types';
import { updateProfile, logout as authLogout } from '../services/auth';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface ProfileProps {
    user: User;
    onUpdate: (user: User) => void;
    onLogout: () => void;
}

export default function Profile({ user, onUpdate, onLogout }: ProfileProps) {
    const { t, language, setLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState(user.avatar || '');
    const [editing, setEditing] = useState(false);
    const [message, setMessage] = useState('');

    const handleSave = () => {
        try {
            const updatedUser = updateProfile({ name, avatar: avatar || undefined });
            onUpdate(updatedUser);
            setEditing(false);
            setMessage(t('profile.success'));
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            setMessage('Error: ' + error.message);
        }
    };

    const handleLogout = () => {
        authLogout();
        onLogout();
    };



    // Стандартные аватарки
    const defaultAvatars = [
        '😊', '🎓', '📚', '🚀', '💡', '🌟',
        '🎯', '💪', '🧠', '👨‍💻', '👩‍💻', '🦄'
    ];

    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '40px 20px'
        }}>
            <h1 style={{
                fontSize: '36px',
                marginBottom: '10px',
                color: 'var(--text-primary)',
                fontWeight: '800'
            }}>{t('profile.title')}</h1>
            <p style={{
                color: 'var(--text-secondary)',
                marginBottom: '40px',
                fontSize: '18px'
            }}>
                {t('profile.subtitle')}
            </p>

            {message && (
                <div style={{
                    padding: '16px',
                    background: message.includes('Error') ? 'var(--error)' : 'var(--success)',
                    color: 'white',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    fontWeight: '500',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    {message}
                </div>
            )}

            {/* Theme Toggle */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <h3 style={{
                    fontSize: '18px',
                    marginBottom: '15px',
                    color: 'var(--text-primary)',
                    fontWeight: '600'
                }}>🎨 Тема</h3>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <span style={{
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        {theme === 'light' ? '☀️ Светлая' : '🌙 Тёмная'}
                    </span>
                    <button
                        onClick={toggleTheme}
                        style={{
                            width: '60px',
                            height: '32px',
                            background: theme === 'dark' ? 'var(--accent-gradient)' : 'var(--border-dark)',
                            border: 'none',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            boxShadow: theme === 'dark' ? 'var(--glow-primary)' : 'var(--shadow-sm)'
                        }}
                    >
                        <div style={{
                            width: '24px',
                            height: '24px',
                            background: theme === 'dark' ? '#f3f4f6' : '#ffffff',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '4px',
                            left: theme === 'dark' ? '32px' : '4px',
                            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px'
                        }}>
                            {theme === 'dark' ? '🌙' : '☀️'}
                        </div>
                    </button>
                </div>
            </div>

            {/* Language Settings */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <h3 style={{
                    fontSize: '18px',
                    marginBottom: '15px',
                    color: 'var(--text-primary)',
                    fontWeight: '600'
                }}>🌍 {t('profile.language')}</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setLanguage('ru')}
                        style={{
                            padding: '10px 20px',
                            background: language === 'ru' ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                            color: language === 'ru' ? 'white' : 'var(--text-primary)',
                            border: language === 'ru' ? 'none' : '1px solid var(--border-medium)',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: language === 'ru' ? 'var(--shadow-md)' : 'none'
                        }}
                    >
                        Русский
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        style={{
                            padding: '10px 20px',
                            background: language === 'en' ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                            color: language === 'en' ? 'white' : 'var(--text-primary)',
                            border: language === 'en' ? 'none' : '1px solid var(--border-medium)',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: language === 'en' ? 'var(--shadow-md)' : 'none'
                        }}
                    >
                        English
                    </button>
                </div>
            </div>

            {/* Аватар */}
            <div style={{
                textAlign: 'center',
                marginBottom: '40px'
            }}>
                <div style={{
                    width: '140px',
                    height: '140px',
                    margin: '0 auto 20px',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '70px',
                    color: 'white',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-xl)',
                    border: '4px solid var(--bg-elevated)'
                }}>
                    {avatar || user.avatar ? (
                        (avatar || user.avatar!).startsWith('data:') ?
                            <img src={avatar || user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (avatar || user.avatar)
                    ) : '👤'}
                </div>

                {editing && (
                    <div style={{
                        marginTop: '20px'
                    }}>
                        <div style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            marginBottom: '15px',
                            fontWeight: '500',
                            textAlign: 'center'
                        }}>
                            {t('profile.orChooseEmoji')}
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '12px',
                            justifyContent: 'center',
                            maxWidth: '400px',
                            margin: '0 auto'
                        }}>
                            {defaultAvatars.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => setAvatar(emoji)}
                                    className="card"
                                    style={{
                                        width: '55px',
                                        height: '55px',
                                        fontSize: '28px',
                                        border: avatar === emoji ? '2px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        background: avatar === emoji ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s ease',
                                        transform: avatar === emoji ? 'scale(1.1)' : 'scale(1)',
                                        boxShadow: avatar === emoji ? 'var(--glow-primary)' : 'var(--shadow-sm)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (avatar !== emoji) {
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (avatar !== emoji) {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.borderColor = 'var(--border-medium)';
                                        }
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Информация */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                    }}>
                        {t('auth.name')}
                    </label>
                    {editing ? (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid var(--border-medium)',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    ) : (
                        <div style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: '500' }}>{user.name}</div>
                    )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                    }}>
                        {t('auth.email')}
                    </label>
                    <div style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: '500' }}>{user.email}</div>
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                    }}>
                        {t('profile.registration')}
                    </label>
                    <div style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {new Date(user.createdAt).toLocaleDateString(language)}
                    </div>
                </div>
            </div>

            {/* Кнопки */}
            <div style={{ display: 'flex', gap: '12px' }}>
                {editing ? (
                    <>
                        <button
                            onClick={handleSave}
                            className="btn btn-primary"
                            style={{
                                flex: 1,
                                fontSize: '16px'
                            }}
                        >
                            {t('profile.save')}
                        </button>
                        <button
                            onClick={() => {
                                setEditing(false);
                                setName(user.name);
                                setAvatar(user.avatar || '');
                            }}
                            className="btn btn-secondary"
                            style={{
                                flex: 1,
                                fontSize: '16px'
                            }}
                        >
                            {t('profile.cancel')}
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setEditing(true)}
                        className="btn btn-primary"
                        style={{
                            flex: 1,
                            fontSize: '16px'
                        }}
                    >
                        {t('profile.edit')}
                    </button>
                )}
            </div>

            <button
                onClick={handleLogout}
                style={{
                    width: '100%',
                    padding: '14px',
                    background: 'transparent',
                    color: 'var(--error)',
                    border: '2px solid var(--error)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginTop: '20px',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--error)';
                    e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--error)';
                }}
            >
                🚪 {t('profile.logout')}
            </button>
        </div>
    );
}
