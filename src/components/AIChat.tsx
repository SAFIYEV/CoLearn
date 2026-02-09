import { useState, useRef, useLayoutEffect } from 'react';
import { sendChatMessage } from '../services/gemini';
import { saveChatMessage, getChatHistory } from '../services/storage';
import type { ChatMessage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

// Простой парсер markdown для отображения
function renderMarkdown(text: string) {
    // Заголовки
    let html = text.replace(/### (.*?)\n/g, '<h3 style="font-size: 18px; font-weight: 600; margin: 16px 0 8px 0; color: #333;">$1</h3>');

    // Жирный текст
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #667eea;">$1</strong>');

    // Курсив
    html = html.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');

    // Списки
    html = html.replace(/^[\*\-] (.*?)$/gm, '<li style="margin: 4px 0;">$1</li>');
    html = html.replace(/(<li.*?<\/li>\n?)+/g, '<ul style="padding-left: 20px; margin: 12px 0;">$&</ul>');

    // Параграфы
    html = html.replace(/\n\n/g, '</p><p style="margin: 8px 0; line-height: 1.6;">');
    html = '<p style="margin: 8px 0; line-height: 1.6;">' + html + '</p>';

    return html;
}

export default function AIChat() {
    const { t } = useLanguage();
    // Initialize with history immediately to avoid empty render -> populate cycle
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            return getChatHistory();
        } catch (e) {
            console.error(e);
            return [];
        }
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const isFirstRun = useRef(true);

    useLayoutEffect(() => {
        if (!chatContainerRef.current) return;

        // Use internal scrollTop for precise control
        if (isFirstRun.current) {
            // Instant jump to bottom on mount
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            isFirstRun.current = false;
        } else {
            // Smooth scroll for new messages
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        saveChatMessage(userMessage);
        setInput('');
        setLoading(true);

        try {
            const response = await sendChatMessage(input);

            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, aiMessage]);
            saveChatMessage(aiMessage);
        } catch (error: any) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: t('generator.error') + error.message,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#f8f8f8'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                background: 'white',
                borderBottom: '1px solid #e0e0e0'
            }}>
                <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>{t('ai.title')}</h1>
                <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                    {t('ai.subtitle')}
                </p>
            </div>

            {/* Messages */}
            <div
                ref={chatContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px'
                }}
            >
                {messages.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: '#999'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>💬</div>
                        <h2 style={{ marginBottom: '10px', color: '#666' }}>{t('ai.startTitle')}</h2>
                        <p>{t('ai.startSubtitle')}</p>
                    </div>
                )}

                {messages.map(message => (
                    <div
                        key={message.id}
                        style={{
                            marginBottom: '20px',
                            display: 'flex',
                            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                        }}
                    >
                        {message.role === 'user' ? (
                            <div style={{
                                maxWidth: '70%',
                                padding: '16px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {message.content}
                            </div>
                        ) : (
                            <div
                                style={{
                                    maxWidth: '70%',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'white',
                                    color: '#333',
                                    border: '1px solid #e0e0e0',
                                    wordBreak: 'break-word',
                                    fontSize: '15px'
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: renderMarkdown(message.content)
                                }}
                            />
                        )}
                    </div>
                ))}

                {loading && (
                    <div style={{
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'flex-start'
                    }}>
                        <div style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: 'white',
                            border: '1px solid #e0e0e0'
                        }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#667eea',
                                    animation: 'bounce 1.4s infinite ease-in-out both',
                                    animationDelay: '-0.32s'
                                }} />
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#667eea',
                                    animation: 'bounce 1.4s infinite ease-in-out both',
                                    animationDelay: '-0.16s'
                                }} />
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#667eea',
                                    animation: 'bounce 1.4s infinite ease-in-out both'
                                }} />
                            </div>
                        </div>
                    </div>
                )}

                <div />
            </div>

            {/* Input */}
            <div style={{
                padding: '20px',
                background: 'white',
                borderTop: '1px solid #e0e0e0'
            }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('ai.placeholder')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '12px',
                            fontSize: '16px',
                            resize: 'none',
                            fontFamily: 'inherit',
                            minHeight: '50px',
                            maxHeight: '150px'
                        }}
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        style={{
                            padding: '12px 24px',
                            background: loading || !input.trim()
                                ? '#ccc'
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {t('chat.send')}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          } 
          40% { 
            transform: scale(1.0);
          }
        }
      `}</style>
        </div>
    );
}
