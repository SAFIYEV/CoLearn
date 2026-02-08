
import type { Course, User } from '../types';
import { deleteCourse } from '../services/storage';
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
    user: User;
    courses: Course[];
    onSelectCourse: (course: Course) => void;
    onCreateNew: () => void;
    onCourseDeleted: () => void;
}

export default function Dashboard({ user, courses, onSelectCourse, onCreateNew, onCourseDeleted }: DashboardProps) {
    const { t } = useLanguage();
    const activeCourses = courses.filter(c => c.status === 'active');
    const completedCourses = courses.filter(c => c.status === 'completed');

    return (
        <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="fade-in" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{
                        marginBottom: '10px',
                        fontSize: '36px',
                        color: 'var(--text-primary)',
                        fontWeight: '800'
                    }}>{t('dashboard.title')}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
                        {t('dashboard.subtitle')}
                    </p>
                </div>
                <button
                    onClick={onCreateNew}
                    className="btn btn-primary"
                    style={{
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    ✨ {t('dashboard.createBtn')}
                </button>
            </div>

            {courses.length === 0 && (
                <div className="card" style={{
                    textAlign: 'center',
                    padding: '80px 20px'
                }}>
                    <div style={{ fontSize: '80px', marginBottom: '20px' }}>📚</div>
                    <h2 style={{
                        marginBottom: '15px',
                        color: 'var(--text-primary)',
                        fontWeight: '700',
                        fontSize: '28px'
                    }}>
                        {t('dashboard.emptyTitle')}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '18px' }}>
                        {t('dashboard.emptySubtitle')}
                    </p>
                    <button
                        onClick={onCreateNew}
                        className="btn btn-primary"
                        style={{
                            fontSize: '18px'
                        }}
                    >
                        ✨ {t('dashboard.createFirst')}
                    </button>
                </div>
            )}

            {activeCourses.length > 0 && (
                <div className="fade-in" style={{ marginBottom: '40px' }}>
                    <h2 style={{
                        marginBottom: '20px',
                        fontSize: '24px',
                        color: 'var(--text-primary)',
                        fontWeight: '700'
                    }}>🚀 {t('dashboard.active')}</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '20px'
                    }}>
                        {activeCourses.map(course => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                onClick={() => onSelectCourse(course)}
                                onDelete={() => {
                                    deleteCourse(course.id, user.id);
                                    onCourseDeleted();
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {completedCourses.length > 0 && (
                <div className="fade-in">
                    <h2 style={{
                        marginBottom: '20px',
                        fontSize: '24px',
                        color: 'var(--text-primary)',
                        fontWeight: '700'
                    }}>✅ {t('dashboard.completed')}</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '20px'
                    }}>
                        {completedCourses.map(course => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                onClick={() => onSelectCourse(course)}
                                onDelete={() => {
                                    deleteCourse(course.id, user.id);
                                    onCourseDeleted();
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function CourseCard({ course, onClick, onDelete }: { course: Course; onClick: () => void; onDelete: () => void }) {
    const { t } = useLanguage();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const confirmDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(false);
    };

    if (showDeleteConfirm) {
        return (
            <div
                className="card"
                style={{
                    border: '2px solid var(--error)',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
            >
                <h3 style={{
                    marginBottom: '10px',
                    fontSize: '18px',
                    color: 'var(--text-primary)',
                    fontWeight: '600'
                }}>
                    ⚠️ {t('dashboard.deleteTitle')}
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
                    {t('dashboard.deleteConfirm', { title: course.title })}
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={confirmDelete}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'var(--error)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {t('dashboard.delete')}
                    </button>
                    <button
                        onClick={cancelDelete}
                        className="btn btn-secondary"
                        style={{
                            flex: 1,
                            fontSize: '14px'
                        }}
                    >
                        {t('dashboard.cancel')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className="card"
            style={{
                cursor: 'pointer',
                position: 'relative'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Кнопка удаления */}
            <button
                onClick={handleDelete}
                style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '36px',
                    height: '36px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    zIndex: 10,
                    opacity: 0.7
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--error)';
                    e.currentTarget.style.borderColor = 'var(--error)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.opacity = '0.7';
                }}
                title={t('dashboard.delete')}
            >
                🗑️
            </button>

            <h3 style={{
                marginBottom: '10px',
                fontSize: '20px',
                color: 'var(--text-primary)',
                paddingRight: '40px',
                fontWeight: '700'
            }}>
                {course.title}
            </h3>
            <p style={{
                color: 'var(--text-secondary)',
                marginBottom: '20px',
                fontSize: '14px',
                lineHeight: '1.6'
            }}>
                {course.description}
            </p>

            <div style={{ marginBottom: '16px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '14px'
                }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{t('dashboard.progress')}</span>
                    <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{course.progress}%</span>
                </div>
                <div style={{
                    width: '100%',
                    height: '10px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        width: `${course.progress}%`,
                        height: '100%',
                        background: 'var(--accent-gradient)',
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)'
                    }} />
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                color: 'var(--text-tertiary)',
                fontWeight: '500'
            }}>
                <span>📚 {course.modules.length} {t('dashboard.modules')}</span>
                <span>⏱️ {course.duration} {t('dashboard.days')}</span>
            </div>
        </div>
    );
}
