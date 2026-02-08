
import { useState, useEffect } from 'react';
import { getCurrentUser } from './services/auth';
import { getCourses } from './services/storage';
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
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
    setCourses([]);
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

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
      {view !== 'course' && (
        <div style={{
          width: '300px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid var(--glass-border)',
          color: 'var(--text-primary)',
          padding: '28px 20px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden'
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
            zIndex: 1
          }}>
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

          <nav style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <NavButton
              active={view === 'dashboard'}
              onClick={() => setView('dashboard')}
              icon="📚"
              label={t('nav.courses')}
            />
            <NavButton
              active={view === 'generator'}
              onClick={() => setView('generator')}
              icon="✨"
              label={t('nav.create')}
            />
            <NavButton
              active={view === 'chat'}
              onClick={() => setView('chat')}
              icon="💬"
              label={t('nav.ai')}
            />
            <NavButton
              active={view === 'class'}
              onClick={() => setView('class')}
              icon="👥"
              label={t('nav.class')}
            />
            <NavButton
              active={view === 'profile'}
              onClick={() => setView('profile')}
              icon="👤"
              label={t('nav.profile')}
            />
          </nav>

          <div style={{
            paddingTop: '20px',
            borderTop: '1px solid var(--border-medium)',
            position: 'relative',
            zIndex: 1
          }}>
            <div className="card" style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--border-medium)',
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
        </div>
      )}

      <div style={{
        flex: 1,
        overflow: 'auto',
        background: 'var(--bg-primary)'
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
            onUpdate={setUser}
            onLogout={handleLogout}
          />
        )}
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
      className="card"
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
