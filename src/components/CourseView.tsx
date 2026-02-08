
import { useState } from 'react';
import type { Course, User } from '../types';
import { saveCourse, updateCourseProgress } from '../services/storage';
import AssignmentView from './AssignmentView';
import { useLanguage } from '../contexts/LanguageContext';

interface CourseViewProps {
    user: User;
    course: Course;
    onBack: () => void;
}

// Простой парсер markdown для отображения
function renderMarkdown(text: string) {
    let html = text.replace(/### (.*?)\n/g, '<h3 style="font-size: 20px; font-weight: 600; margin: 20px 0 10px 0; color: var(--text-primary);">$1</h3>');

    // Жирный текст
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #667eea;">$1</strong>');

    // Курсив
    html = html.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');

    // Цитаты
    html = html.replace(/^> (.*?)$/gm, '<blockquote style="border-left: 4px solid var(--accent-primary); padding-left: 16px; margin: 16px 0; color: var(--text-secondary); font-style: italic;">$1</blockquote>');

    // Списки
    html = html.replace(/^• (.*?)$/gm, '<li style="margin: 8px 0;">$1</li>');
    html = html.replace(/(<li.*?<\/li>\n?)+/g, '<ul style="padding-left: 24px; margin: 16px 0;">$&</ul>');

    // Параграфы
    html = html.replace(/\n\n/g, '</p><p style="margin: 16px 0; line-height: 1.8;">');
    html = '<p style="margin: 16px 0; line-height: 1.8;">' + html + '</p>';

    return html;
}

export default function CourseView({ user, course: initialCourse, onBack }: CourseViewProps) {
    const { t } = useLanguage();
    const [course, setCourse] = useState(initialCourse);
    const [selectedModule, setSelectedModule] = useState(0);
    const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);

    const currentModule = course.modules[selectedModule];

    const completeLesson = (lessonId: string) => {
        const updatedCourse = { ...course };
        updatedCourse.modules.forEach(mod => {
            mod.lessons.forEach(lesson => {
                if (lesson.id === lessonId) {
                    lesson.completed = true;
                }
            });
        });

        setCourse(updatedCourse);
        saveCourse(updatedCourse, user.id);
        updateCourseProgress(updatedCourse.id, user.id);
    };

    const completeAssignment = (assignmentId: string, score: number) => {
        const updatedCourse = { ...course };
        updatedCourse.assignments.forEach(assignment => {
            if (assignment.id === assignmentId) {
                assignment.completed = true;
                assignment.score = score;
            }
        });

        setCourse(updatedCourse);
        saveCourse(updatedCourse, user.id);
        updateCourseProgress(updatedCourse.id, user.id);
        setSelectedAssignment(null);
    };

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

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Sidebar */}
            <div style={{
                width: '300px',
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-medium)',
                overflowY: 'auto',
                padding: '20px'
            }}>
                <button
                    onClick={onBack}
                    style={{
                        padding: '10px 16px',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginBottom: '20px',
                        width: '100%',
                        fontSize: '14px'
                    }}
                >
                    {t('course.back')}
                </button>

                <h2 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)' }}>{course.title}</h2>
                <div style={{
                    marginBottom: '20px',
                    padding: '12px',
                    background: 'var(--bg-elevated)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)'
                }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                        {course.progress}%
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('course.progress')}</div>
                </div>

                {course.modules.map((module, idx) => (
                    <div key={module.id} style={{ marginBottom: '12px' }}>
                        <button
                            onClick={() => {
                                setSelectedModule(idx);
                                setSelectedLesson(null);
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: selectedModule === idx ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                color: selectedModule === idx ? 'white' : 'var(--text-primary)',
                                border: selectedModule === idx ? 'none' : '1px solid var(--border-medium)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            {module.completed && '✓ '}
                            {t('course.module')} {idx + 1}: {module.title}
                        </button>
                    </div>
                ))}
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

                        <div style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>{t('course.lessons')}</h2>
                            {currentModule.lessons.map((lesson, idx) => (
                                <div
                                    key={lesson.id}
                                    onClick={() => setSelectedLesson(idx)}
                                    style={{
                                        padding: '20px',
                                        background: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-medium)',
                                        borderRadius: '16px',
                                        marginBottom: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-medium)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '4px', color: 'var(--text-primary)' }}>
                                            {lesson.completed && '✓ '}
                                            {lesson.title}
                                        </div>
                                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            ⏱️ {lesson.duration} {t('course.mins')}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '24px', color: 'var(--accent-primary)' }}>→</div>
                                </div>
                            ))}
                        </div>

                        {course.assignments.filter(a => a.moduleId === selectedModule.toString()).length > 0 && (
                            <div>
                                <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>{t('course.assignments')}</h2>
                                {course.assignments
                                    .filter(a => a.moduleId === selectedModule.toString())
                                    .map((assignment, idx) => (
                                        <div
                                            key={assignment.id}
                                            onClick={() => setSelectedAssignment(idx)}
                                            style={{
                                                padding: '20px',
                                                background: assignment.completed ? 'var(--bg-secondary)' : 'var(--bg-elevated)',
                                                border: '1px solid ' + (assignment.completed ? '#4caf50' : 'var(--border-medium)'),
                                                borderRadius: '16px',
                                                cursor: 'pointer',
                                                marginBottom: '12px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!assignment.completed) {
                                                    e.currentTarget.style.borderColor = '#667eea';
                                                    e.currentTarget.style.transform = 'translateX(4px)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!assignment.completed) {
                                                    e.currentTarget.style.borderColor = '#e0e0e0';
                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                }
                                            }}
                                        >
                                            <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '4px', color: 'var(--text-primary)' }}>
                                                {assignment.completed && '✓ '}
                                                {assignment.title}
                                            </div>
                                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                                {assignment.description}
                                            </div>
                                            {assignment.score !== undefined && (
                                                <div style={{ marginTop: '8px', fontWeight: '600', color: '#4caf50' }}>
                                                    {t('course.result')} {assignment.score}%
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {selectedLesson !== null && (
                    <div>
                        <button
                            onClick={() => setSelectedLesson(null)}
                            style={{
                                padding: '10px 16px',
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-medium)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                marginBottom: '20px'
                            }}
                        >
                            {t('course.backToModule')}
                        </button>

                        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>
                            {currentModule.lessons[selectedLesson].title}
                        </h1>

                        <div style={{
                            background: 'var(--bg-elevated)',
                            padding: '40px',
                            borderRadius: '16px',
                            border: '1px solid var(--border-medium)',
                            marginBottom: '30px',
                            fontSize: '17px',
                            lineHeight: '1.8',
                            color: 'var(--text-primary)'
                        }}
                            dangerouslySetInnerHTML={{
                                __html: renderMarkdown(currentModule.lessons[selectedLesson].content)
                            }}
                        />

                        <button
                            onClick={() => {
                                completeLesson(currentModule.lessons[selectedLesson].id);
                                setSelectedLesson(null);
                            }}
                            style={{
                                padding: '16px 32px',
                                background: 'var(--accent-gradient)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            {currentModule.lessons[selectedLesson].completed
                                ? t('course.completedLesson')
                                : t('course.completeLesson')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
