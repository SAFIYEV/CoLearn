
import { useState, useEffect } from 'react';
import type { User, Course } from '../types';
import { updateProfile, logout as authLogout } from '../services/auth';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getUserGamification, getLevel, ALL_BADGES } from '../services/gamification';
import { downloadCertificateImage } from '../services/certificate';

interface ProfileProps {
    user: User;
    courses: Course[];
    onUpdate: (user: User) => void;
    onLogout: () => void;
}

export default function Profile({ user, courses, onUpdate, onLogout }: ProfileProps) {
    const { t, language, setLanguage } = useLanguage();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);
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
                }}>🎨 {t('profile.theme')}</h3>
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
                        {theme === 'light' ? `☀️ ${t('profile.themeLight')}` : `🌙 ${t('profile.themeDark')}`}
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

            {/* Stats */}
            {(() => {
                const gam = getUserGamification(user.id);
                const lvl = getLevel(gam.xp);
                return (
                    <>
                        <div className="card" style={{ marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--text-primary)', fontWeight: '600' }}>
                                📊 {t('profile.stats')}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '16px', marginBottom: '20px' }}>
                                {[
                                    { icon: '⭐', value: gam.xp, label: 'XP' },
                                    { icon: '🔥', value: gam.streak, label: t('gamification.streak') },
                                    { icon: '📚', value: gam.totalLessons, label: t('profile.lessonsCount') },
                                    { icon: '🏆', value: gam.totalCourses, label: t('profile.coursesCount') }
                                ].map((s, i) => (
                                    <div key={i} style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-medium)' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{s.icon}</div>
                                        <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{s.value}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '500' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{t(lvl.nameKey)}</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{gam.xp} / {lvl.nextLevelXp} XP</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${lvl.progress}%`, height: '100%', background: 'var(--accent-gradient)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--text-primary)', fontWeight: '600' }}>
                                🏅 {t('profile.badges')}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: isMobile ? '8px' : '12px' }}>
                                {ALL_BADGES.map(badge => {
                                    const earned = gam.badges.includes(badge.id);
                                    return (
                                        <div key={badge.id} title={t(badge.descKey)} style={{
                                            textAlign: 'center', padding: '12px 4px',
                                            background: earned ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                                            borderRadius: '12px',
                                            border: earned ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                                            opacity: earned ? 1 : 0.35,
                                            transition: 'all 0.2s'
                                        }}>
                                            <div style={{ fontSize: '28px', marginBottom: '4px' }}>{badge.icon}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>{t(badge.nameKey)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                );
            })()}

            {/* Certificates */}
            {(() => {
                const completed = courses.filter(c => c.status === 'completed');
                if (completed.length === 0) return null;

                const handleDownload = (c: Course) => {
                    downloadCertificateImage(
                        {
                            userName: user.name,
                            courseTitle: c.title,
                            modulesCount: c.modules.length,
                            lessonsCount: c.modules.reduce((s, m) => s + m.lessons.length, 0),
                        },
                        {
                            label: t('cert.label'),
                            title: t('cert.title'),
                            awardedTo: t('cert.awardedTo'),
                            forCourse: t('cert.forCourse'),
                            date: t('cert.date'),
                            modules: t('cert.modules'),
                            lessons: t('cert.lessons'),
                        }
                    );
                };

                return (
                    <div className="card" style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--text-primary)', fontWeight: '600' }}>
                            🏆 {t('profile.certificates')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {completed.map(c => (
                                <div key={c.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    padding: '16px', borderRadius: '14px',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-medium)',
                                    transition: 'all 0.2s ease'
                                }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #1a1028, #0d0d1a)',
                                        border: '1px solid rgba(139,92,246,0.3)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '24px', flexShrink: 0
                                    }}>
                                        🏆
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontWeight: '600', fontSize: '15px',
                                            color: 'var(--text-primary)',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}>
                                            {c.title}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                            {c.modules.length} {t('cert.modules')} · {c.modules.reduce((s, m) => s + m.lessons.length, 0)} {t('cert.lessons')}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(c)}
                                        style={{
                                            padding: '10px 18px',
                                            background: 'transparent',
                                            color: '#a78bfa',
                                            border: '1px solid rgba(139,92,246,0.4)',
                                            borderRadius: '10px',
                                            fontSize: '13px', fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(139,92,246,0.1)';
                                            e.currentTarget.style.borderColor = '#8b5cf6';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                                        }}
                                    >
                                        📥 {t('cert.download')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

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
