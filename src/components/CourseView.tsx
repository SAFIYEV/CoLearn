
import { useState, useEffect, useRef } from 'react';
import type { Course, User } from '../types';
import { saveCourse } from '../services/storage';
import AssignmentView from './AssignmentView';
import { useLanguage } from '../contexts/LanguageContext';
import { awardLessonComplete, awardAssignmentComplete, awardModuleComplete, awardCourseComplete, type XpEvent, ALL_BADGES } from '../services/gamification';
import { askTutor } from '../services/gemini';
import { downloadCertificateImage } from '../services/certificate';

interface CourseViewProps {
    user: User;
    course: Course;
    onBack: () => void;
}

function renderMarkdown(text: string) {
    let html = text.replace(/### (.*?)\n/g, '<h3 style="font-size: 20px; font-weight: 600; margin: 20px 0 10px 0; color: var(--text-primary);">$1</h3>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #667eea;">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');
    html = html.replace(/^> (.*?)$/gm, '<blockquote style="border-left: 4px solid var(--accent-primary); padding-left: 16px; margin: 16px 0; color: var(--text-secondary); font-style: italic;">$1</blockquote>');
    html = html.replace(/^• (.*?)$/gm, '<li style="margin: 8px 0;">$1</li>');
    html = html.replace(/(<li.*?<\/li>\n?)+/g, '<ul style="padding-left: 24px; margin: 16px 0;">$&</ul>');
    html = html.replace(/\n\n/g, '</p><p style="margin: 16px 0; line-height: 1.8;">');
    html = '<p style="margin: 16px 0; line-height: 1.8;">' + html + '</p>';
    return html;
}

function AnimatedProgress({ progress, label, completeLabel }: { progress: number; label: string; completeLabel: string }) {
    const [displayProgress, setDisplayProgress] = useState(progress);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const prevProgressRef = useRef(progress);
    const animFrameRef = useRef<number>(0);

    useEffect(() => {
        const prev = prevProgressRef.current;
        if (progress !== prev) {
            setIsAnimating(true);
            if (progress > prev) {
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 1200);
            }
            const duration = 900;
            const startTime = performance.now();
            const animate = (now: number) => {
                const elapsed = now - startTime;
                const t = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - t, 3);
                setDisplayProgress(Math.round(prev + (progress - prev) * eased));
                if (t < 1) {
                    animFrameRef.current = requestAnimationFrame(animate);
                } else {
                    prevProgressRef.current = progress;
                    setTimeout(() => setIsAnimating(false), 400);
                }
            };
            animFrameRef.current = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(animFrameRef.current);
        }
    }, [progress]);

    const circ = 2 * Math.PI * 42;
    const offset = circ * (1 - displayProgress / 100);

    return (
        <div style={{
            marginBottom: '20px', padding: '20px 12px', background: 'var(--bg-elevated)',
            borderRadius: '16px',
            border: `1px solid ${isAnimating ? 'var(--accent-primary)' : 'var(--border-medium)'}`,
            transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
            boxShadow: isAnimating ? '0 0 24px rgba(139, 92, 246, 0.3)' : 'none',
            textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
            {showCelebration && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at center, rgba(139,92,246,0.15) 0%, transparent 70%)',
                    animation: 'celebrationPulse 1.2s ease-out forwards',
                    pointerEvents: 'none', zIndex: 0
                }} />
            )}
            <div style={{ position: 'relative', width: '110px', height: '110px', margin: '0 auto 12px', zIndex: 1 }}>
                <svg width="110" height="110" viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="50%" stopColor="#d946ef" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-secondary)" strokeWidth="7" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="url(#progressGrad)"
                        strokeWidth="7" strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={offset}
                        transform="rotate(-90 50 50)"
                        style={{
                            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                            filter: isAnimating ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))' : 'none'
                        }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: `translate(-50%, -50%) scale(${isAnimating ? 1.15 : 1})`,
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    fontSize: '26px', fontWeight: '800',
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>
                    {displayProgress}%
                </div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>{label}</div>
            {displayProgress === 100 && (
                <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    ✅ {completeLabel}
                </div>
            )}
        </div>
    );
}

export default function CourseView({ user, course: initialCourse, onBack }: CourseViewProps) {
    const { t } = useLanguage();
    const [course, setCourse] = useState(initialCourse);
    const [selectedModule, setSelectedModule] = useState(0);
    const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
    const [showCertificate, setShowCertificate] = useState(false);
    const certRef = useRef<HTMLDivElement>(null);

    // XP notification
    const [xpPopup, setXpPopup] = useState<{ xp: number; badges: string[] } | null>(null);

    // AI Tutor
    const [tutorOpen, setTutorOpen] = useState(false);
    const [tutorQuestion, setTutorQuestion] = useState('');
    const [tutorMessages, setTutorMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
    const [tutorLoading, setTutorLoading] = useState(false);

    const currentModule = course.modules[selectedModule];

    // --- Sequential access helpers ---
    const isModuleUnlocked = (idx: number): boolean => {
        if (idx === 0) return true;
        return course.modules.slice(0, idx).every(m => m.completed);
    };

    const isLessonUnlocked = (lessonIdx: number): boolean => {
        if (lessonIdx === 0) return true;
        return currentModule.lessons.slice(0, lessonIdx).every(l => l.completed);
    };

    const allLessonsInModuleDone = (moduleIdx: number): boolean => {
        return course.modules[moduleIdx].lessons.every(l => l.completed);
    };

    // --- First unlocked module on load ---
    useEffect(() => {
        for (let i = 0; i < course.modules.length; i++) {
            if (!course.modules[i].completed) {
                setSelectedModule(isModuleUnlocked(i) ? i : Math.max(0, i - 1));
                return;
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // --- Progress ---
    const recalcProgress = (c: Course): Course => {
        const totalLessons = c.modules.reduce((s, m) => s + m.lessons.length, 0);
        const completedLessons = c.modules.reduce((s, m) => s + m.lessons.filter(l => l.completed).length, 0);
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        const modules = c.modules.map(mod => ({ ...mod, completed: mod.lessons.every(l => l.completed) }));
        return { ...c, modules, progress, status: progress === 100 ? 'completed' as const : c.status };
    };

    const showXpReward = (event: XpEvent) => {
        setXpPopup({ xp: event.xpGained, badges: event.newBadges });
        setTimeout(() => setXpPopup(null), 3000);
    };

    const completeLesson = (lessonId: string) => {
        const withLesson: Course = {
            ...course,
            modules: course.modules.map(mod => ({
                ...mod,
                lessons: mod.lessons.map(lesson =>
                    lesson.id === lessonId ? { ...lesson, completed: true } : lesson
                )
            }))
        };
        const updated = recalcProgress(withLesson);
        setCourse(updated);
        saveCourse(updated, user.id);

        const xpEvent = awardLessonComplete(user.id);
        const oldModuleComplete = course.modules[selectedModule].completed;
        const newModuleComplete = updated.modules[selectedModule].completed;
        if (!oldModuleComplete && newModuleComplete) {
            const modEvent = awardModuleComplete(user.id);
            xpEvent.xpGained += modEvent.xpGained;
            xpEvent.newBadges.push(...modEvent.newBadges);
        }
        if (updated.progress === 100 && course.progress < 100) {
            const courseEvent = awardCourseComplete(user.id);
            xpEvent.xpGained += courseEvent.xpGained;
            xpEvent.newBadges.push(...courseEvent.newBadges);
            setTimeout(() => setShowCertificate(true), 3500);
        }
        showXpReward(xpEvent);
    };

    const completeAssignment = (assignmentId: string, score: number) => {
        const withAssignment: Course = {
            ...course,
            assignments: course.assignments.map(a =>
                a.id === assignmentId ? { ...a, completed: true, score } : a
            )
        };
        const updated = recalcProgress(withAssignment);
        setCourse(updated);
        saveCourse(updated, user.id);
        setSelectedAssignment(null);

        const xpEvent = awardAssignmentComplete(user.id, score);
        if (updated.progress === 100 && course.progress < 100) {
            const courseEvent = awardCourseComplete(user.id);
            xpEvent.xpGained += courseEvent.xpGained;
            xpEvent.newBadges.push(...courseEvent.newBadges);
            setTimeout(() => setShowCertificate(true), 3500);
        }
        showXpReward(xpEvent);
    };

    const handleTutorSend = async () => {
        if (!tutorQuestion.trim() || !selectedLesson) return;
        const q = tutorQuestion;
        setTutorQuestion('');
        setTutorMessages(prev => [...prev, { role: 'user', text: q }]);
        setTutorLoading(true);
        try {
            const answer = await askTutor(currentModule.lessons[selectedLesson].content, q);
            setTutorMessages(prev => [...prev, { role: 'ai', text: answer }]);
        } catch {
            setTutorMessages(prev => [...prev, { role: 'ai', text: t('tutor.error') }]);
        }
        setTutorLoading(false);
    };

    const downloadCertificate = () => {
        downloadCertificateImage(
            {
                userName: user.name,
                courseTitle: course.title,
                modulesCount: course.modules.length,
                lessonsCount: course.modules.reduce((s, m) => s + m.lessons.length, 0),
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

    // --- Assignment view ---
    if (selectedAssignment !== null) {
        const assignment = course.assignments.filter(a => a.moduleId === selectedModule.toString())[selectedAssignment];
        return (
            <AssignmentView
                assignment={assignment}
                onComplete={(score) => completeAssignment(assignment.id, score)}
                onBack={() => setSelectedAssignment(null)}
            />
        );
    }

    const moduleAssignments = course.assignments.filter(a => a.moduleId === selectedModule.toString());
    const lessonsAllDone = allLessonsInModuleDone(selectedModule);

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Certificate Modal */}
            {showCertificate && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                        animation: 'fadeIn 0.5s ease'
                    }}
                    onClick={() => setShowCertificate(false)}
                >
                    <div onClick={(e) => e.stopPropagation()} style={{
                        width: '600px', maxWidth: '90vw',
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                        borderRadius: '24px', padding: '4px',
                        animation: 'certificateAppear 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        boxShadow: '0 0 60px rgba(139, 92, 246, 0.4), 0 0 120px rgba(139, 92, 246, 0.2)'
                    }}>
                        <div ref={certRef} style={{
                            background: 'linear-gradient(160deg, #0d0d1a 0%, #1a1028 40%, #0d0d1a 100%)',
                            borderRadius: '22px', padding: '48px 40px',
                            textAlign: 'center', position: 'relative', overflow: 'hidden'
                        }}>
                            {/* Corners */}
                            {[
                                { top: '16px', left: '16px', borderTop: '2px solid rgba(139,92,246,0.5)', borderLeft: '2px solid rgba(139,92,246,0.5)', borderRadius: '4px 0 0 0' },
                                { top: '16px', right: '16px', borderTop: '2px solid rgba(139,92,246,0.5)', borderRight: '2px solid rgba(139,92,246,0.5)', borderRadius: '0 4px 0 0' },
                                { bottom: '16px', left: '16px', borderBottom: '2px solid rgba(139,92,246,0.5)', borderLeft: '2px solid rgba(139,92,246,0.5)', borderRadius: '0 0 0 4px' },
                                { bottom: '16px', right: '16px', borderBottom: '2px solid rgba(139,92,246,0.5)', borderRight: '2px solid rgba(139,92,246,0.5)', borderRadius: '0 0 4px 0' }
                            ].map((s, i) => (
                                <div key={i} style={{ position: 'absolute', width: '40px', height: '40px', ...s } as React.CSSProperties} />
                            ))}

                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

                            <div style={{ fontSize: '48px', marginBottom: '8px', filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.5))', animation: 'pulse 2s ease-in-out infinite' }}>🏆</div>
                            <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(139,92,246,0.8)', marginBottom: '8px' }}>{t('cert.label')}</div>
                            <h2 style={{ fontSize: '28px', fontWeight: '800', background: 'linear-gradient(135deg, #a78bfa, #f0abfc, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '24px', lineHeight: 1.3 }}>{t('cert.title')}</h2>
                            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>{t('cert.awardedTo')}</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', marginBottom: '24px' }}>{user.name}</div>
                            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>{t('cert.forCourse')}</div>
                            <div style={{ fontSize: '20px', fontWeight: '600', color: '#e0d0ff', marginBottom: '32px', padding: '0 20px' }}>«{course.title}»</div>
                            <div style={{ width: '80px', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)', margin: '0 auto 24px' }} />

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '32px', fontSize: '13px' }}>
                                <div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{t('cert.date')}</div>
                                    <div style={{ color: '#ffffff', fontWeight: '600' }}>{new Date().toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{t('cert.modules')}</div>
                                    <div style={{ color: '#ffffff', fontWeight: '600' }}>{course.modules.length}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{t('cert.lessons')}</div>
                                    <div style={{ color: '#ffffff', fontWeight: '600' }}>{course.modules.reduce((s, m) => s + m.lessons.length, 0)}</div>
                                </div>
                            </div>

                            <div style={{ fontSize: '11px', color: 'rgba(139,92,246,0.6)', fontWeight: '600', letterSpacing: '0.15em', marginBottom: '24px' }}>CoLearn • AI-Powered Learning</div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button
                                    onClick={downloadCertificate}
                                    style={{
                                        padding: '14px 32px', background: 'transparent',
                                        color: '#a78bfa', border: '1px solid rgba(139,92,246,0.4)',
                                        borderRadius: '12px', fontSize: '15px', fontWeight: '700',
                                        cursor: 'pointer', transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; e.currentTarget.style.borderColor = '#8b5cf6'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; }}
                                >
                                    📥 {t('cert.download')}
                                </button>
                                <button
                                    onClick={() => setShowCertificate(false)}
                                    style={{
                                        padding: '14px 32px', background: 'var(--accent-gradient)',
                                        color: 'white', border: 'none', borderRadius: '12px',
                                        fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.5)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.3)'; }}
                                >
                                    {t('cert.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* XP Popup */}
            {xpPopup && (
                <div style={{
                    position: 'fixed', top: '30px', right: '30px', zIndex: 10000,
                    background: 'linear-gradient(135deg, #1a1028, #0d0d1a)',
                    border: '1px solid rgba(139,92,246,0.4)',
                    borderRadius: '16px', padding: '20px 28px',
                    animation: 'certificateAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: '0 0 40px rgba(139,92,246,0.3)',
                    display: 'flex', alignItems: 'center', gap: '16px', minWidth: '200px'
                }}>
                    <div style={{ fontSize: '36px' }}>⭐</div>
                    <div>
                        <div style={{
                            fontSize: '22px', fontWeight: '800',
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>
                            +{xpPopup.xp} XP
                        </div>
                        {xpPopup.badges.length > 0 && (
                            <div style={{ fontSize: '14px', color: '#a78bfa', fontWeight: '600', marginTop: '4px' }}>
                                {xpPopup.badges.map(b => {
                                    const badge = ALL_BADGES.find(ab => ab.id === b);
                                    return badge ? `${badge.icon} ${t(badge.nameKey)}` : '';
                                }).filter(Boolean).join(', ')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <div style={{
                width: '300px', background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-medium)',
                overflowY: 'auto', padding: '20px'
            }}>
                <button onClick={onBack} style={{
                    padding: '10px 16px', background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-medium)', borderRadius: '8px',
                    cursor: 'pointer', marginBottom: '20px', width: '100%', fontSize: '14px'
                }}>
                    {t('course.back')}
                </button>

                <h2 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)' }}>{course.title}</h2>
                <AnimatedProgress progress={course.progress} label={t('course.progress')} completeLabel={t('course.progressComplete')} />

                {course.modules.map((module, idx) => {
                    const unlocked = isModuleUnlocked(idx);
                    const isSelected = selectedModule === idx;
                    return (
                        <div key={module.id} style={{ marginBottom: '12px' }}>
                            <button
                                onClick={() => {
                                    if (!unlocked) return;
                                    setSelectedModule(idx);
                                    setSelectedLesson(null);
                                }}
                                style={{
                                    width: '100%', padding: '12px',
                                    background: isSelected ? 'var(--accent-primary)' : unlocked ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
                                    color: isSelected ? 'white' : unlocked ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                    border: isSelected ? 'none' : '1px solid var(--border-medium)',
                                    borderRadius: '8px',
                                    cursor: unlocked ? 'pointer' : 'not-allowed',
                                    textAlign: 'left', fontSize: '14px', fontWeight: '500',
                                    opacity: unlocked ? 1 : 0.6,
                                    transition: 'all 0.2s ease',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                {!unlocked && <span>🔒</span>}
                                {module.completed && unlocked && <span>✅</span>}
                                <span style={{ flex: 1 }}>
                                    {t('course.module')} {idx + 1}: {module.title}
                                </span>
                            </button>
                        </div>
                    );
                })}

                {course.progress === 100 && (
                    <button
                        onClick={() => setShowCertificate(true)}
                        style={{
                            width: '100%', padding: '14px', marginTop: '8px',
                            background: 'linear-gradient(135deg, #1a1028, #0d0d1a)',
                            color: '#a78bfa', border: '1px solid rgba(139,92,246,0.4)',
                            borderRadius: '12px', fontSize: '14px', fontWeight: '700',
                            cursor: 'pointer', transition: 'all 0.3s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(139,92,246,0.15)';
                            e.currentTarget.style.borderColor = '#8b5cf6';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #1a1028, #0d0d1a)';
                            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        🏆 {t('cert.view')}
                    </button>
                )}
            </div>

            {/* Main content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                {selectedLesson === null && (
                    <div>
                        <h1 style={{ fontSize: '32px', marginBottom: '10px', color: 'var(--text-primary)' }}>
                            {currentModule.title}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '18px' }}>
                            {currentModule.description}
                        </p>

                        {/* Lessons */}
                        <div style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>{t('course.lessons')}</h2>
                            {currentModule.lessons.map((lesson, idx) => {
                                const unlocked = isLessonUnlocked(idx);
                                return (
                                    <div
                                        key={lesson.id}
                                        onClick={() => unlocked && setSelectedLesson(idx)}
                                        style={{
                                            padding: '20px',
                                            background: !unlocked ? 'var(--bg-tertiary)' : 'var(--bg-elevated)',
                                            border: `1px solid ${lesson.completed ? 'var(--success)' : 'var(--border-medium)'}`,
                                            borderRadius: '16px', marginBottom: '12px',
                                            cursor: unlocked ? 'pointer' : 'not-allowed',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            transition: 'all 0.2s',
                                            opacity: unlocked ? 1 : 0.55
                                        }}
                                        onMouseEnter={(e) => {
                                            if (unlocked && !lesson.completed) {
                                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (unlocked && !lesson.completed) {
                                                e.currentTarget.style.borderColor = 'var(--border-medium)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {!unlocked && <span style={{ fontSize: '18px' }}>🔒</span>}
                                            {lesson.completed && <span style={{ fontSize: '18px' }}>✅</span>}
                                            {unlocked && !lesson.completed && (
                                                <span style={{
                                                    width: '28px', height: '28px', borderRadius: '50%',
                                                    border: '2px solid var(--accent-primary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)'
                                                }}>
                                                    {idx + 1}
                                                </span>
                                            )}
                                            <div>
                                                <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '4px', color: unlocked ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                                    {lesson.title}
                                                </div>
                                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                                    ⏱️ {lesson.duration} {t('course.mins')}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '24px', color: unlocked ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                                            {unlocked ? '→' : ''}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Assignments */}
                        {moduleAssignments.length > 0 && (
                            <div>
                                <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>{t('course.assignments')}</h2>

                                {!lessonsAllDone && (
                                    <div style={{
                                        padding: '20px', borderRadius: '16px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px dashed var(--border-medium)',
                                        textAlign: 'center', marginBottom: '16px',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                                    }}>
                                        <span style={{ fontSize: '28px' }}>🔒</span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '500' }}>
                                            {t('course.assignmentsLocked')}
                                        </span>
                                    </div>
                                )}

                                {lessonsAllDone && moduleAssignments.map((assignment, idx) => (
                                    <div
                                        key={assignment.id}
                                        onClick={() => setSelectedAssignment(idx)}
                                        style={{
                                            padding: '20px',
                                            background: assignment.completed ? 'var(--bg-secondary)' : 'var(--bg-elevated)',
                                            border: '1px solid ' + (assignment.completed ? 'var(--success)' : 'var(--border-medium)'),
                                            borderRadius: '16px', cursor: 'pointer',
                                            marginBottom: '12px', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!assignment.completed) {
                                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                                e.currentTarget.style.transform = 'translateX(4px)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!assignment.completed) {
                                                e.currentTarget.style.borderColor = 'var(--border-medium)';
                                                e.currentTarget.style.transform = 'translateX(0)';
                                            }
                                        }}
                                    >
                                        <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '4px', color: 'var(--text-primary)' }}>
                                            {assignment.completed && '✅ '}
                                            {assignment.title}
                                        </div>
                                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            {assignment.description}
                                        </div>
                                        {assignment.score !== undefined && (
                                            <div style={{ marginTop: '8px', fontWeight: '600', color: 'var(--success)' }}>
                                                {t('course.result')} {assignment.score}%
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Lesson view */}
                {selectedLesson !== null && (
                    <div>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => { setSelectedLesson(null); setTutorOpen(false); setTutorMessages([]); }}
                                style={{
                                    padding: '10px 16px', background: 'var(--bg-elevated)',
                                    color: 'var(--text-primary)', border: '1px solid var(--border-medium)',
                                    borderRadius: '8px', cursor: 'pointer'
                                }}
                            >
                                {t('course.backToModule')}
                            </button>
                            <button
                                onClick={() => setTutorOpen(!tutorOpen)}
                                style={{
                                    padding: '10px 16px',
                                    background: tutorOpen ? 'var(--accent-gradient)' : 'var(--bg-elevated)',
                                    color: tutorOpen ? 'white' : 'var(--accent-primary)',
                                    border: tutorOpen ? 'none' : '1px solid var(--accent-primary)',
                                    borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    transition: 'all 0.2s ease',
                                    boxShadow: tutorOpen ? '0 0 16px rgba(139,92,246,0.3)' : 'none'
                                }}
                            >
                                🤖 {t('tutor.button')}
                            </button>
                        </div>

                        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>
                            {currentModule.lessons[selectedLesson].title}
                        </h1>

                        <div style={{ display: 'flex', gap: '20px' }}>
                            {/* Lesson content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    background: 'var(--bg-elevated)', padding: '40px',
                                    borderRadius: '16px', border: '1px solid var(--border-medium)',
                                    marginBottom: '30px', fontSize: '17px', lineHeight: '1.8',
                                    color: 'var(--text-primary)'
                                }}
                                    dangerouslySetInnerHTML={{
                                        __html: renderMarkdown(currentModule.lessons[selectedLesson].content)
                                    }}
                                />

                                {!currentModule.lessons[selectedLesson].completed ? (
                                    <button
                                        onClick={() => {
                                            completeLesson(currentModule.lessons[selectedLesson].id);
                                            setSelectedLesson(null);
                                            setTutorOpen(false);
                                            setTutorMessages([]);
                                        }}
                                        style={{
                                            padding: '16px 32px', background: 'var(--accent-gradient)',
                                            color: 'white', border: 'none', borderRadius: '12px',
                                            fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 0 16px rgba(139,92,246,0.2)'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.4)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(139,92,246,0.2)'; }}
                                    >
                                        {t('course.completeLesson')} (+25 XP ⭐)
                                    </button>
                                ) : (
                                    <div style={{
                                        padding: '16px 32px', background: 'var(--bg-secondary)',
                                        borderRadius: '12px', fontSize: '16px', fontWeight: '600',
                                        color: 'var(--success)', display: 'inline-flex',
                                        alignItems: 'center', gap: '8px',
                                        border: '1px solid var(--success)'
                                    }}>
                                        ✅ {t('course.completedLesson')}
                                    </div>
                                )}
                            </div>

                            {/* AI Tutor Panel */}
                            {tutorOpen && (
                                <div style={{
                                    width: '350px', flexShrink: 0,
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--accent-primary)',
                                    borderRadius: '16px', display: 'flex', flexDirection: 'column',
                                    height: 'fit-content', maxHeight: '70vh',
                                    boxShadow: '0 0 20px rgba(139,92,246,0.15)',
                                    position: 'sticky', top: '20px'
                                }}>
                                    <div style={{
                                        padding: '16px 20px',
                                        borderBottom: '1px solid var(--border-medium)',
                                        display: 'flex', alignItems: 'center', gap: '10px'
                                    }}>
                                        <span style={{ fontSize: '22px' }}>🤖</span>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{t('tutor.title')}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t('tutor.subtitle')}</div>
                                        </div>
                                    </div>

                                    <div style={{
                                        flex: 1, overflowY: 'auto', padding: '16px',
                                        minHeight: '200px', maxHeight: '400px'
                                    }}>
                                        {tutorMessages.length === 0 && (
                                            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px', marginTop: '40px' }}>
                                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💡</div>
                                                {t('tutor.empty')}
                                            </div>
                                        )}
                                        {tutorMessages.map((msg, i) => (
                                            <div key={i} style={{
                                                marginBottom: '12px',
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                                            }}>
                                                <div style={{
                                                    padding: '10px 14px', borderRadius: '12px',
                                                    maxWidth: '90%', fontSize: '14px', lineHeight: '1.5',
                                                    background: msg.role === 'user' ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                                                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                                    border: msg.role === 'ai' ? '1px solid var(--border-medium)' : 'none'
                                                }}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        {tutorLoading && (
                                            <div style={{ color: 'var(--text-tertiary)', fontSize: '14px', fontStyle: 'italic' }}>
                                                {t('tutor.thinking')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick actions */}
                                    <div style={{ padding: '8px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {[t('tutor.q1'), t('tutor.q2'), t('tutor.q3')].map((q, i) => (
                                            <button key={i} onClick={() => { setTutorQuestion(q); }}
                                                style={{
                                                    padding: '6px 12px', fontSize: '12px',
                                                    background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                                                    border: '1px solid var(--border-medium)', borderRadius: '20px',
                                                    cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >{q}</button>
                                        ))}
                                    </div>

                                    <div style={{
                                        padding: '12px 16px', borderTop: '1px solid var(--border-medium)',
                                        display: 'flex', gap: '8px'
                                    }}>
                                        <input
                                            value={tutorQuestion}
                                            onChange={(e) => setTutorQuestion(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleTutorSend()}
                                            placeholder={t('tutor.placeholder')}
                                            style={{
                                                flex: 1, padding: '10px 14px', borderRadius: '10px',
                                                border: '1px solid var(--border-medium)', outline: 'none',
                                                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                                fontSize: '14px'
                                            }}
                                        />
                                        <button
                                            onClick={handleTutorSend}
                                            disabled={!tutorQuestion.trim() || tutorLoading}
                                            style={{
                                                padding: '10px 16px', background: 'var(--accent-gradient)',
                                                color: 'white', border: 'none', borderRadius: '10px',
                                                cursor: tutorQuestion.trim() && !tutorLoading ? 'pointer' : 'not-allowed',
                                                fontWeight: '600', fontSize: '14px',
                                                opacity: tutorQuestion.trim() && !tutorLoading ? 1 : 0.5
                                            }}
                                        >→</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
