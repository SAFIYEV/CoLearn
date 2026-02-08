
import { useState, useEffect, useRef } from 'react';
import type { User, ClassGroup, ClassInvite, ClassChatMessage } from '../types';
import {
    createClass,
    getUserClass,
    getClassMembers,
    searchUsers,
    inviteUserToClass,
    getIncomingInvites,
    acceptInvite,
    rejectInvite,
    leaveClass,
    getClassMessages,
    sendClassMessage,
    renameClass
} from '../services/class';
import { getCurrentUser } from '../services/auth';
import { useLanguage } from '../contexts/LanguageContext';

export default function ClassView() {
    const { t } = useLanguage();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userClass, setUserClass] = useState<ClassGroup | null>(null);
    const [classMembers, setClassMembers] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState<'my-class' | 'search' | 'requests' | 'chat'>('my-class');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [invites, setInvites] = useState<(ClassInvite & { className: string, fromUserName: string })[]>([]);
    const [newClassName, setNewClassName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Chat state
    const [chatMessages, setChatMessages] = useState<ClassChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            setCurrentUser(user);
            loadClassData(user.id);
            loadInvites(user.id);
        }
    }, []);

    // Poll for chat messages
    useEffect(() => {
        if (!userClass || activeTab !== 'chat') return;

        const loadMessages = () => {
            const msgs = getClassMessages(userClass.id);
            setChatMessages(msgs);
        };

        loadMessages();
        const interval = setInterval(loadMessages, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, [userClass, activeTab]);

    useEffect(() => {
        if (activeTab === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, activeTab]);

    const loadClassData = (userId: string) => {
        const cls = getUserClass(userId);
        if (cls) {
            // Hotfix for 'Крутые' class name
            if (cls.name === 'Крутые') {
                renameClass(cls.id, 'Участники');
                cls.name = 'Участники';
            }
            setUserClass(cls);
            const members = getClassMembers(cls.id);
            setClassMembers(members);
        } else {
            setUserClass(null);
        }
    };

    const loadInvites = (userId: string) => {
        const incoming = getIncomingInvites(userId);
        setInvites(incoming);
    };

    const handleCreateClass = () => {
        if (!currentUser || !newClassName.trim()) return;
        try {
            const newClass = createClass(newClassName, currentUser);
            setUserClass(newClass);
            setClassMembers([currentUser]);
            setSuccess(t('class.success.create'));
            setError('');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.length > 0 && currentUser) {
            const results = searchUsers(query, currentUser.id);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const handleInvite = (userId: string) => {
        if (!userClass || !currentUser) {
            setError(t('class.error.create'));
            return;
        }
        try {
            inviteUserToClass(userClass.id, currentUser.id, userId);
            setSuccess(t('class.success.invite'));
            setError('');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleAcceptInvite = (inviteId: string) => {
        if (!currentUser) return;
        try {
            acceptInvite(inviteId);
            loadClassData(currentUser.id);
            loadInvites(currentUser.id);
            setSuccess(t('class.success.join'));
            setActiveTab('my-class');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleRejectInvite = (inviteId: string) => {
        if (!currentUser) return;
        rejectInvite(inviteId);
        loadInvites(currentUser.id);
    };

    const handleLeaveClass = () => {
        if (!currentUser) return;
        leaveClass(currentUser.id);
        setUserClass(null);
        setClassMembers([]);
        setActiveTab('my-class');
    };

    const handleSendChatMessage = () => {
        if (!userClass || !currentUser || !chatInput.trim()) return;
        sendClassMessage(userClass.id, currentUser, chatInput);
        setChatInput('');
        // Instant update
        setChatMessages(getClassMessages(userClass.id));
    };

    // Styles
    const cardStyle = {
        background: 'var(--bg-elevated)',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '20px',
        height: activeTab === 'chat' ? 'calc(100vh - 200px)' : 'auto',
        display: activeTab === 'chat' ? 'flex' : 'block',
        flexDirection: activeTab === 'chat' ? 'column' as const : 'row' as const,
        border: '1px solid var(--border-medium)'
    };

    const btnStyle = {
        padding: '12px 24px',
        background: 'var(--accent-gradient)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '600' as const,
        fontSize: '14px',
        boxShadow: 'var(--shadow-md)',
        transition: 'all 0.3s ease'
    };

    const inputStyle = {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid var(--border-medium)',
        marginBottom: '10px',
        outline: 'none',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        transition: 'all 0.2s ease'
    };

    const tabBtnStyle = (tabName: typeof activeTab) => ({
        ...btnStyle,
        background: activeTab === tabName ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
        color: activeTab === tabName ? 'white' : 'var(--text-primary)',
        border: activeTab === tabName ? 'none' : '1px solid var(--border-medium)'
    });

    return (
        <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', height: '100%' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '36px', marginBottom: '10px', fontWeight: '800', color: 'var(--text-primary)' }}>{t('class.title')}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>{t('class.subtitle')}</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setActiveTab('my-class')}
                    style={tabBtnStyle('my-class')}
                >
                    {t('class.tab.my')}
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    style={tabBtnStyle('search')}
                >
                    {t('class.tab.search')}
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    style={{
                        ...tabBtnStyle('requests'),
                        position: 'relative'
                    }}
                >
                    {t('class.tab.requests')}
                    {invites.length > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#e53e3e',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px'
                        }}>
                            {invites.length}
                        </span>
                    )}
                </button>
                {userClass && (
                    <button
                        onClick={() => setActiveTab('chat')}
                        style={tabBtnStyle('chat')}
                    >
                        {t('class.tab.chat')}
                    </button>
                )}
            </div>

            {error && (
                <div style={{ padding: '12px', background: '#fed7d7', color: '#c53030', borderRadius: '8px', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{ padding: '12px', background: '#c6f6d5', color: '#2f855a', borderRadius: '8px', marginBottom: '20px' }}>
                    {success}
                </div>
            )}

            {/* My Class Tab */}
            {activeTab === 'my-class' && (
                <div>
                    {userClass ? (
                        <div style={{ ...cardStyle, display: 'block', height: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '24px', fontWeight: '700' }}>{userClass.name}</h2>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>
                                    {t('class.members')} {classMembers.length} / 50
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                {classMembers.map(member => (
                                    <div key={member.id} style={{
                                        padding: '12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{ fontSize: '24px' }}>{member.avatar || '👤'}</div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{member.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.email}</div>
                                            {member.username && <div style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>{member.username}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                <button
                                    onClick={handleLeaveClass}
                                    style={{ ...btnStyle, background: '#e53e3e' }}
                                >
                                    {t('class.leave')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px', display: 'block', height: 'auto' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏫</div>
                            <h2 style={{ marginBottom: '10px' }}>{t('class.emptyTitle')}</h2>
                            <p style={{ color: '#718096', marginBottom: '30px' }}>
                                {t('class.emptySubtitle')}
                            </p>

                            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                                <input
                                    type="text"
                                    placeholder={t('class.namePlaceholder')}
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    style={inputStyle}
                                />
                                <button
                                    onClick={handleCreateClass}
                                    disabled={!newClassName.trim()}
                                    style={{
                                        ...btnStyle,
                                        width: '100%',
                                        opacity: !newClassName.trim() ? 0.5 : 1
                                    }}
                                >
                                    {t('class.create')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
                <div style={{ ...cardStyle, display: 'block', height: 'auto' }}>
                    <h2 style={{ marginBottom: '20px' }}>{t('class.searchTitle')}</h2>
                    <input
                        type="text"
                        placeholder={t('class.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={inputStyle}
                    />

                    <div style={{ marginTop: '20px' }}>
                        {searchResults.length === 0 && searchQuery && (
                            <p style={{ color: '#718096', textAlign: 'center' }}>{t('class.notFound')}</p>
                        )}

                        {searchResults.map(user => (
                            <div key={user.id} style={{
                                padding: '16px',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontSize: '24px' }}>{user.avatar || '👤'}</div>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{user.name}</div>
                                        <div style={{ fontSize: '12px', color: '#718096' }}>{user.email}</div>
                                        {user.username && <div style={{ fontSize: '12px', color: '#667eea' }}>{user.username}</div>}
                                    </div>
                                </div>
                                {userClass && userClass.members.length < 50 && (
                                    <button
                                        onClick={() => handleInvite(user.id)}
                                        style={{ ...btnStyle, fontSize: '12px', padding: '8px 16px' }}
                                    >
                                        {t('class.invite')}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
                <div style={{ ...cardStyle, display: 'block', height: 'auto' }}>
                    <h2 style={{ marginBottom: '20px' }}>{t('class.requestsTitle')}</h2>
                    {invites.length === 0 ? (
                        <p style={{ color: '#718096', textAlign: 'center' }}>{t('class.noRequests')}</p>
                    ) : (
                        <div>
                            {invites.map(invite => (
                                <div key={invite.id} style={{
                                    padding: '16px',
                                    borderBottom: '1px solid #e2e8f0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                            {t('class.inviteFrom', { name: invite.className })}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {t('class.from', { user: invite.fromUserName })} • {new Date(invite.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleAcceptInvite(invite.id)}
                                            style={{ ...btnStyle, background: '#48bb78', fontSize: '12px', padding: '8px 16px' }}
                                        >
                                            {t('class.accept')}
                                        </button>
                                        <button
                                            onClick={() => handleRejectInvite(invite.id)}
                                            style={{ ...btnStyle, background: '#e53e3e', fontSize: '12px', padding: '8px 16px' }}
                                        >
                                            {t('class.reject')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && userClass && (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={{ margin: 0 }}>{t('class.tab.chat')} - {userClass.name}</h2>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '15px',
                        marginBottom: '15px',
                        background: '#f8fafc'
                    }}>
                        {chatMessages.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#a0aec0', marginTop: '40px' }}>
                                {t('chat.empty')}
                            </div>
                        ) : (
                            chatMessages.map(msg => {
                                const isMe = msg.userId === currentUser?.id;
                                return (
                                    <div key={msg.id} style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: isMe ? 'flex-end' : 'flex-start',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#718096',
                                            marginBottom: '2px',
                                            marginLeft: isMe ? 0 : '4px',
                                            marginRight: isMe ? '4px' : 0
                                        }}>
                                            {msg.userName}
                                        </div>
                                        <div style={{
                                            padding: '10px 14px',
                                            borderRadius: '12px',
                                            background: isMe ? '#667eea' : 'white',
                                            color: isMe ? 'white' : '#2d3748',
                                            border: isMe ? 'none' : '1px solid #e2e8f0',
                                            maxWidth: '70%',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            borderTopRightRadius: isMe ? '2px' : '12px',
                                            borderTopLeftRadius: !isMe ? '2px' : '12px'
                                        }}>
                                            {msg.content}
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            color: '#a0aec0',
                                            marginTop: '4px',
                                            marginLeft: isMe ? 0 : '4px',
                                            marginRight: isMe ? '4px' : 0
                                        }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                            placeholder={t('chat.placeholder')}
                            style={{ ...inputStyle, marginBottom: 0 }}
                        />
                        <button
                            onClick={handleSendChatMessage}
                            disabled={!chatInput.trim()}
                            style={{
                                ...btnStyle,
                                opacity: !chatInput.trim() ? 0.6 : 1,
                                height: 'auto'
                            }}
                        >
                            {t('chat.send')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
