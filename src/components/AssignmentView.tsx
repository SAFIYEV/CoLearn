import { useState } from 'react';
import type { Assignment, Question } from '../types';

interface AssignmentViewProps {
    assignment: Assignment;
    onComplete: (score: number) => void;
    onBack: () => void;
}

export default function AssignmentView({ assignment, onComplete, onBack }: AssignmentViewProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>(new Array(assignment.questions.length).fill(''));
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);

    const handleAnswer = (answer: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestion] = answer;
        setUserAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestion < assignment.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmit = () => {
        let correctCount = 0;
        assignment.questions.forEach((question, idx) => {
            if (question.correctAnswer === userAnswers[idx]) {
                correctCount++;
            }
        });

        const finalScore = Math.round((correctCount / assignment.questions.length) * 100);
        setScore(finalScore);
        setShowResults(true);
    };

    const handleFinish = () => {
        onComplete(score);
    };

    const question = assignment.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / assignment.questions.length) * 100;

    if (showResults) {
        return (
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '40px 20px'
            }}>
                <div style={{
                    background: score >= 70 ? '#e8f5e9' : '#fff3cd',
                    border: `2px solid ${score >= 70 ? '#4caf50' : '#ffc107'}`,
                    borderRadius: '16px',
                    padding: '40px',
                    textAlign: 'center',
                    marginBottom: '30px'
                }}>
                    <div style={{
                        fontSize: '64px',
                        marginBottom: '20px'
                    }}>
                        {score >= 90 ? '🏆' : score >= 70 ? '✅' : '📝'}
                    </div>
                    <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>
                        {score >= 90 ? 'Отлично!' : score >= 70 ? 'Хорошо!' : 'Можно лучше!'}
                    </h1>
                    <div style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        color: score >= 70 ? '#4caf50' : '#f57c00',
                        marginBottom: '20px'
                    }}>
                        {score}%
                    </div>
                    <p style={{ fontSize: '18px', color: '#666' }}>
                        Правильных ответов: {assignment.questions.filter((q, idx) => q.correctAnswer === userAnswers[idx]).length} из {assignment.questions.length}
                    </p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ marginBottom: '20px' }}>Разбор ответов</h2>
                    {assignment.questions.map((q, idx) => {
                        const isCorrect = q.correctAnswer === userAnswers[idx];
                        return (
                            <div
                                key={q.id}
                                style={{
                                    background: 'var(--bg-elevated)',
                                    border: `2px solid ${isCorrect ? '#4caf50' : '#f44336'}`,
                                    borderRadius: '12px',
                                    padding: '20px',
                                    marginBottom: '15px',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    marginBottom: '10px'
                                }}>
                                    <span style={{ fontSize: '24px' }}>
                                        {isCorrect ? '✅' : '❌'}
                                    </span>
                                    <div style={{ fontWeight: '600', fontSize: '16px' }}>
                                        Вопрос {idx + 1}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '15px', fontSize: '16px' }}>
                                    {q.question}
                                </div>

                                <div>
                                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                                        Ваш ответ: <span style={{ color: isCorrect ? '#4caf50' : '#f44336', fontWeight: '600' }}>
                                            {userAnswers[idx] || 'Не выбрано'}
                                        </span>
                                    </div>
                                    {!isCorrect && (
                                        <div style={{ fontSize: '14px', color: '#4caf50', fontWeight: '600' }}>
                                            Правильный ответ: {q.correctAnswer}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={handleFinish}
                    style={{
                        width: '100%',
                        padding: '18px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '18px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Завершить
                </button>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '40px 20px'
        }}>
            <button
                onClick={onBack}
                style={{
                    padding: '10px 16px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    color: 'var(--text-primary)'
                }}
            >
                ← Назад
            </button>

            <h1 style={{ fontSize: '28px', marginBottom: '10px', color: 'var(--text-primary)' }}>
                {assignment.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                {assignment.description}
            </p>

            {/* Progress bar */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    fontSize: '14px',
                    color: '#666'
                }}>
                    <span>Вопрос {currentQuestion + 1} из {assignment.questions.length}</span>
                    <span>{Math.round(progress)}% завершено</span>
                </div>
                <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                        transition: 'width 0.3s'
                    }} />
                </div>
            </div>

            {/* Question */}
            <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: '16px',
                padding: '30px',
                marginBottom: '30px',
                color: 'var(--text-primary)'
            }}>
                <div style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '25px',
                    lineHeight: '1.6'
                }}>
                    {question.question}
                </div>

                {question.type === 'multiple-choice' && question.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {question.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(option)}
                                style={{
                                    padding: '18px 20px',
                                    background: userAnswers[currentQuestion] === option
                                        ? 'var(--accent-gradient)'
                                        : 'var(--bg-secondary)',
                                    color: userAnswers[currentQuestion] === option ? 'white' : 'var(--text-primary)',
                                    border: userAnswers[currentQuestion] === option
                                        ? 'none'
                                        : '1px solid var(--border-medium)',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontWeight: userAnswers[currentQuestion] === option ? '600' : 'normal'
                                }}
                                onMouseEnter={(e) => {
                                    if (userAnswers[currentQuestion] !== option) {
                                        e.currentTarget.style.borderColor = 'var(--accent-color)';
                                        e.currentTarget.style.background = 'var(--bg-hover)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (userAnswers[currentQuestion] !== option) {
                                        e.currentTarget.style.borderColor = 'var(--border-medium)';
                                        e.currentTarget.style.background = 'var(--bg-secondary)';
                                    }
                                }}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}

                {question.type === 'text' && (
                    <textarea
                        value={userAnswers[currentQuestion] || ''}
                        onChange={(e) => handleAnswer(e.target.value)}
                        placeholder="Введите ваш ответ..."
                        style={{
                            width: '100%',
                            minHeight: '150px',
                            padding: '16px',
                            border: '1px solid var(--border-medium)',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                        }}
                    />
                )}
            </div>

            {/* Navigation */}
            <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'space-between'
            }}>
                <button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    style={{
                        padding: '14px 28px',
                        background: currentQuestion === 0 ? '#e0e0e0' : 'white',
                        color: currentQuestion === 0 ? '#999' : '#667eea',
                        border: '2px solid ' + (currentQuestion === 0 ? '#e0e0e0' : '#667eea'),
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer'
                    }}
                >
                    ← Назад
                </button>

                {currentQuestion < assignment.questions.length - 1 ? (
                    <button
                        onClick={handleNext}
                        disabled={!userAnswers[currentQuestion]}
                        style={{
                            padding: '14px 28px',
                            background: !userAnswers[currentQuestion]
                                ? '#e0e0e0'
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: !userAnswers[currentQuestion] ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Далее →
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={!userAnswers[currentQuestion]}
                        style={{
                            padding: '14px 28px',
                            background: !userAnswers[currentQuestion]
                                ? '#e0e0e0'
                                : 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: !userAnswers[currentQuestion] ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Завершить тест ✓
                    </button>
                )}
            </div>
        </div>
    );
}
