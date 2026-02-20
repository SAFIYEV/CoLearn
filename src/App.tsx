
import { useState, useEffect } from 'react';
import { getCurrentUser } from './services/auth';
import { getCourses } from './services/storage';
import { getUserGamification, getLevel, recordDailyLogin } from './services/gamification';
import type { User, Course } from './types';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import CourseGenerator from './components/CourseGenerator';
import CourseView from './components/CourseView';
import AIChat from './components/AIChat';
import Profile from './components/Profile';
import ClassView from './components/ClassView';
import { useLanguage } from './contexts/LanguageContext';

type View = 'dashboard' | 'generator' | 'course' | 'chat' | 'profile' | 'class';

function App() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowMobileSidebar(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadCourses(currentUser.id);
    }
  }, []);

  const loadCourses = (userId?: string) => {
    const currentUserId = userId || user?.id;
    if (!currentUserId) return;
    const userCourses = getCourses(currentUserId);
    setCourses(userCourses);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    loadCourses(loggedInUser.id);
    recordDailyLogin(loggedInUser.id);
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
    setCourses([]);
    if (isMobile) setShowMobileSidebar(false);
  };

  const handleCourseCreated = (course: Course) => {
    loadCourses();
    setSelectedCourse(course);
    setView('course');
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setView('course');
  };

  const handleBackToDashboard = () => {
    loadCourses();
    setView('dashboard');
    setSelectedCourse(null);
  };

  const handleNavClick = (newView: View) => {
    setView(newView);
    if (isMobile) setShowMobileSidebar(false);
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const showSidebar = !isMobile || showMobileSidebar;

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', flexDirection: 'column' }}>

      {/* Mobile Header */}
      {isMobile && view !== 'course' && (
        <div style={{
          padding: '16px 20px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setShowMobileSidebar(true)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                color: 'var(--text-primary)',
                padding: '4px'
              }}
            >
              ☰
            </button>
            <span style={{
              fontWeight: '800',
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '20px'
            }}>CoLearn</span>
          </div>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: 'white'
          }}>
            {user.avatar || '👤'}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Sidebar Overlay for Mobile */}
        {isMobile && showMobileSidebar && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 90,
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Sidebar */}
        {(showSidebar && view !== 'course') && (
          <div style={{
            width: isMobile ? '280px' : '300px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRight: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
            padding: '28px 20px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-xl)',
            position: isMobile ? 'absolute' : 'relative',
            height: '100%',
            zIndex: 100,
            left: 0,
            top: 0,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'var(--gradient-cosmic)',
              opacity: 0.08,
              pointerEvents: 'none',
              animation: 'backgroundFloat 25s ease-in-out infinite',
              filter: 'blur(60px)'
            }} />

            <div style={{
              marginBottom: '36px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border-medium)',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start'
            }}>
              <div>
                <h1 style={{
                  fontSize: '32px',
                  marginBottom: '6px',
                  fontWeight: '900',
                  letterSpacing: '-0.03em',
                  background: 'var(--accent-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 2px 8px rgba(139, 92, 246, 0.3))'
                }}>CoLearn</h1>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {t('nav.subtitle')}
                </p>
              </div>
              {isMobile && (
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* XP Widget */}
            {user && (() => {
              const gam = getUserGamification(user.id);
              const lvl = getLevel(gam.xp);
              return (
                <div style={{
                  marginBottom: '20px', padding: '14px 16px',
                  background: 'var(--bg-secondary)', borderRadius: '14px',
                  border: '1px solid var(--border-medium)',
                  position: 'relative', zIndex: 1
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>⭐</span>
                      <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>{gam.xp} XP</span>
                    </div>
                    <div style={{
                      padding: '3px 10px', borderRadius: '12px',
                      background: 'var(--accent-gradient)', color: 'white',
                      fontSize: '12px', fontWeight: '700'
                    }}>
                      {t(lvl.nameKey)}
                    </div>
                  </div>
                  {/* XP Progress bar */}
                  <div style={{
                    width: '100%', height: '6px', background: 'var(--bg-tertiary)',
                    borderRadius: '3px', overflow: 'hidden', marginBottom: '8px'
                  }}>
                    <div style={{
                      width: `${lvl.progress}%`, height: '100%',
                      background: 'var(--accent-gradient)',
                      borderRadius: '3px', transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <span>🔥 {t('gamification.streak')}: {gam.streak} {t('gamification.days')}</span>
                    <span>🏅 {gam.badges.length}</span>
                  </div>
                </div>
              );
            })()}

            <nav style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <NavButton
                active={view === 'dashboard'}
                onClick={() => handleNavClick('dashboard')}
                icon="📚"
                label={t('nav.courses')}
              />
              <NavButton
                active={view === 'generator'}
                onClick={() => handleNavClick('generator')}
                icon="✨"
                label={t('nav.create')}
              />
              <NavButton
                active={view === 'chat'}
                onClick={() => handleNavClick('chat')}
                icon="💬"
                label={t('nav.ai')}
              />
              <NavButton
                active={view === 'class'}
                onClick={() => handleNavClick('class')}
                icon="👥"
                label={t('nav.class')}
              />
              <NavButton
                active={view === 'profile'}
                onClick={() => handleNavClick('profile')}
                icon="👤"
                label={t('nav.profile')}
              />
            </nav>

            {!isMobile && (
              <div style={{
                paddingTop: '20px',
                borderTop: '1px solid var(--border-medium)',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                  }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: 'var(--glow-primary)'
                  }}>
                    {user.avatar || '👤'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-tertiary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user.email}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--bg-primary)',
          position: 'relative'
        }}>
          {view === 'dashboard' && user && (
            <Dashboard
              user={user}
              courses={courses}
              onSelectCourse={handleSelectCourse}
              onCreateNew={() => setView('generator')}
              onCourseDeleted={loadCourses}
            />
          )}

          {view === 'generator' && user && (
            <CourseGenerator user={user} onCourseCreated={handleCourseCreated} />
          )}

          {view === 'course' && selectedCourse && user && (
            <CourseView
              user={user}
              course={selectedCourse}
              onBack={handleBackToDashboard}
            />
          )}

          {view === 'chat' && <AIChat />}

          {view === 'class' && <ClassView />}

          {view === 'profile' && (
            <Profile
              user={user}
              courses={courses}
              onUpdate={setUser}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

function NavButton({ active, onClick, icon, label }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '16px 18px',
        background: active ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
        color: active ? 'white' : 'var(--text-primary)',
        border: active ? 'none' : '1px solid var(--border-medium)',
        borderRadius: '16px',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: '600',
        textAlign: 'left',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: active ? 'var(--glow-primary)' : 'var(--shadow-sm)',
        transform: active ? 'translateX(4px)' : 'translateX(0)'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-elevated)';
          e.currentTarget.style.transform = 'translateX(4px)';
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-secondary)';
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.borderColor = 'var(--border-medium)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
    >
      {active && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: 'white',
          borderRadius: '0 4px 4px 0',
          boxShadow: '0 0 12px rgba(255,255,255,0.8)'
        }} />
      )}

      <span style={{
        fontSize: '22px',
        filter: active ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' : 'none',
        transition: 'filter 0.3s ease'
      }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>


      <div style={{
        position: 'absolute',
        top: 0,
        left: active ? '100%' : '-100%',
        width: '50%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
        transition: 'left 0.6s ease',
        pointerEvents: 'none'
      }} />
    </button>
  );
}

export default App;
