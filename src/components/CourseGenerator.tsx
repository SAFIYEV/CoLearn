
import { useState } from 'react';
import type { FormEvent } from 'react';
import { generateCourse } from '../services/gemini';
import { saveCourse } from '../services/storage';
import type { Course, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface CourseGeneratorProps {
    user: User;
    onCourseCreated: (course: Course) => void;
}

type TimeUnit = 'hours' | 'days' | 'weeks' | 'months';

export default function CourseGenerator({ user, onCourseCreated }: CourseGeneratorProps) {
    const { t } = useLanguage();
    const [goal, setGoal] = useState('');
    const [timeValue, setTimeValue] = useState(30);
    const [timeUnit, setTimeUnit] = useState<TimeUnit>('days');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Конвертация времени в дни
    const convertToDays = (value: number, unit: TimeUnit): number => {
        switch (unit) {
            case 'hours':
                return Math.max(1, Math.round(value / 24)); // минимум 1 день
            case 'days':
                return value;
            case 'weeks':
                return value * 7;
            case 'months':
                return value * 30;
        }
    };

    // Получить диапазон для слайдера
    const getRange = () => {
        switch (timeUnit) {
            case 'hours':
                return { min: 1, max: 720, step: 1 }; // 1 час - 30 дней
            case 'days':
                return { min: 1, max: 365, step: 1 };
            case 'weeks':
                return { min: 1, max: 52, step: 1 };
            case 'months':
                return { min: 1, max: 12, step: 1 };
        }
    };

    // Форматированное отображение времени
    const getDisplayText = () => {
        // Simplified for i18n
        return `${timeValue}`;
    };

    const getUnitLabel = (unit: TimeUnit) => {
        return t(`generator.units.${unit}`);
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const durationInDays = convertToDays(timeValue, timeUnit);
            const course = await generateCourse(goal, durationInDays);
            saveCourse(course, user.id);
            onCourseCreated(course);
        } catch (err: any) {
            setError(t('generator.error') + err.message);
        } finally {
            setLoading(false);
        }
    };

    const range = getRange();

    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '40px 20px'
        }}>
            <h1 style={{ marginBottom: '10px', fontSize: '36px' }}>
                {t('generator.title')}
            </h1>
            <p style={{ color: '#666', marginBottom: '40px', fontSize: '18px' }}>
                {t('generator.subtitle')}
            </p>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '30px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '12px',
                        fontSize: '16px',
                        fontWeight: '600'
                    }}>
                        {t('generator.goalLabel')}
                    </label>
                    <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder={t('generator.goalPlaceholder')}
                        style={{
                            width: '100%',
                            minHeight: '120px',
                            padding: '16px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '12px',
                            fontSize: '16px',
                            boxSizing: 'border-box',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '12px',
                        fontSize: '16px',
                        fontWeight: '600'
                    }}>
                        {t('generator.durationLabel')} {getDisplayText()} {getUnitLabel(timeUnit)}
                    </label>

                    {/* Выбор единицы времени */}
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '20px'
                    }}>
                        {(['hours', 'days', 'weeks', 'months'] as TimeUnit[]).map((unit) => (
                            <button
                                key={unit}
                                type="button"
                                onClick={() => {
                                    setTimeUnit(unit);
                                    // Set reasonable defaults
                                    if (unit === 'hours') setTimeValue(24);
                                    else if (unit === 'days') setTimeValue(30);
                                    else if (unit === 'weeks') setTimeValue(4);
                                    else if (unit === 'months') setTimeValue(3);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: timeUnit === unit
                                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                        : 'white',
                                    color: timeUnit === unit ? 'white' : '#666',
                                    border: timeUnit === unit ? 'none' : '2px solid #e0e0e0',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {getUnitLabel(unit)}
                            </button>
                        ))}
                    </div>

                    <input
                        type="range"
                        min={range.min}
                        max={range.max}
                        step={range.step}
                        value={timeValue}
                        onChange={(e) => setTimeValue(Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: '#666',
                        fontSize: '14px',
                        marginTop: '8px'
                    }}>
                        <span>
                            {range.min} {getUnitLabel(timeUnit)}
                        </span>
                        <span style={{ fontWeight: '600', color: '#667eea' }}>
                            {(() => {
                                const days = convertToDays(timeValue, timeUnit);
                                if (timeUnit === 'days') {
                                    if (days >= 30) return `≈ ${Math.round(days / 30)} ${t('generator.units.months')}`;
                                    if (days >= 7) return `≈ ${Math.round(days / 7)} ${t('generator.units.weeks')}`;
                                    return '';
                                } else if (timeUnit === 'hours') {
                                    if (days >= 30) return `≈ ${Math.round(days / 30)} ${t('generator.units.months')}`;
                                    if (days >= 7) return `≈ ${Math.round(days / 7)} ${t('generator.units.weeks')}`;
                                    return `≈ ${days} ${t('generator.units.days')}`;
                                } else if (timeUnit === 'weeks') {
                                    if (days >= 30) return `≈ ${Math.round(days / 30)} ${t('generator.units.months')}`;
                                    return `≈ ${days} ${t('generator.units.days')}`;
                                } else if (timeUnit === 'months') {
                                    if (days >= 30) return `≈ ${days} ${t('generator.units.days')}`;
                                    return '';
                                }
                                return '';
                            })()}
                        </span>
                        <span>
                            {range.max} {getUnitLabel(timeUnit)}
                        </span>
                    </div>
                </div>

                {error && (
                    <div style={{
                        padding: '16px',
                        background: '#fee',
                        color: '#c33',
                        borderRadius: '12px',
                        marginBottom: '20px'
                    }}>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '18px',
                        background: loading
                            ? '#ccc'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '18px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? t('generator.generating') : t('generator.create')}
                </button>
            </form>

            {loading && (
                <div style={{
                    marginTop: '30px',
                    padding: '20px',
                    background: '#f0f0f0',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #667eea',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        margin: '0 auto 15px',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: '#666' }}>
                        {t('generator.loading')}
                    </p>
                </div>
            )}

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
