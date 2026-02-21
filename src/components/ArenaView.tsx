import { useState, useEffect, useRef, useCallback } from 'react';
import type { User, DuelQuestion, BossFight } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getArenaProfile, updateArenaProfile, saveBossFight } from '../services/arena';
import { generateDuelQuestions, generateBossIntro, generateBossResponse } from '../services/gemini';
import { awardDuelWin, awardBossDefeat } from '../services/gamification';

type Tab = 'home' | 'duel' | 'duel_play' | 'boss' | 'boss_play';
type AiDifficulty = 'easy' | 'medium' | 'hard';

interface DuelState {
  topic: string;
  questions: DuelQuestion[];
  index: number;
  playerHp: number;
  aiHp: number;
  playerScore: number;
  aiScore: number;
  combo: number;
  maxCombo: number;
  aiName: string;
  aiAvatar: string;
  aiDifficulty: AiDifficulty;
  status: 'playing' | 'ai_turn' | 'finished';
}

const AI_OPPONENTS: Record<AiDifficulty, { accuracy: number }> = {
  easy: { accuracy: 0.4 },
  medium: { accuracy: 0.65 },
  hard: { accuracy: 0.85 },
};

function HpBar({ current, max, color, label }: { current: number; max: number; color: string; label: string }) {
  const pct = Math.max(0, (current / max) * 100);
  const low = pct < 30;
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: '700', color: low ? 'var(--error)' : 'var(--text-primary)' }}>{current}/{max}</span>
      </div>
      <div style={{
        width: '100%', height: '14px', background: 'var(--bg-tertiary)',
        borderRadius: '7px', overflow: 'hidden', position: 'relative',
        border: '1px solid var(--border-medium)',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: low ? 'linear-gradient(90deg, #ef4444, #f87171)' : color,
          borderRadius: '7px', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: low ? '0 0 10px rgba(239,68,68,0.5)' : 'none',
        }} />
        {low && <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.2), transparent)',
          animation: 'pulse 1s infinite',
        }} />}
      </div>
    </div>
  );
}

export default function ArenaView({ user }: { user: User }) {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState<Tab>('home');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const [duelTopic, setDuelTopic] = useState('');
  const [duelDifficulty, setDuelDifficulty] = useState<AiDifficulty>('medium');
  const [duel, setDuel] = useState<DuelState | null>(null);
  const [duelLoading, setDuelLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ player: string; ai: string; playerOk: boolean; aiOk: boolean } | null>(null);
  const [shakeTarget, setShakeTarget] = useState<'player' | 'ai' | null>(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [bossTopic, setBossTopic] = useState('');
  const [bossDiff, setBossDiff] = useState<'normal' | 'hard' | 'nightmare'>('normal');
  const [bossFight, setBossFight] = useState<BossFight | null>(null);
  const [bossLoading, setBossLoading] = useState(false);
  const [bossInput, setBossInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bossEndRef = useRef<HTMLDivElement>(null);

  const startTimer = useCallback(() => {
    setTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTimer(p => p + 100), 100);
  }, []);
  const stopTimer = useCallback((): number => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    return timer;
  }, [timer]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);
  useEffect(() => { bossEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [bossFight?.messages.length]);

  const TOPICS = language === 'ru' ? [
    { label: '💻 Программирование', value: 'Программирование и IT' },
    { label: '🧬 Наука', value: 'Наука и технологии' },
    { label: '📜 История', value: 'Мировая история' },
    { label: '🌍 География', value: 'География мира' },
    { label: '🎬 Кино', value: 'Кино и сериалы' },
    { label: '🎵 Музыка', value: 'Музыка' },
    { label: '⚽ Спорт', value: 'Спорт' },
    { label: '📚 Литература', value: 'Мировая литература' },
    { label: '🧮 Математика', value: 'Математика' },
    { label: '🚀 Космос', value: 'Космос и астрономия' },
    { label: '🎨 Искусство', value: 'Искусство и культура' },
    { label: '🧠 Психология', value: 'Психология' },
  ] : [
    { label: '💻 Programming', value: 'Programming & IT' },
    { label: '🧬 Science', value: 'Science & Technology' },
    { label: '📜 History', value: 'World History' },
    { label: '🌍 Geography', value: 'World Geography' },
    { label: '🎬 Movies', value: 'Movies & TV Shows' },
    { label: '🎵 Music', value: 'Music' },
    { label: '⚽ Sports', value: 'Sports' },
    { label: '📚 Literature', value: 'World Literature' },
    { label: '🧮 Math', value: 'Mathematics' },
    { label: '🚀 Space', value: 'Space & Astronomy' },
    { label: '🎨 Art', value: 'Art & Culture' },
    { label: '🧠 Psychology', value: 'Psychology' },
  ];

  const AI_NAMES: Record<AiDifficulty, { name: string; avatar: string }> = {
    easy: { name: language === 'ru' ? 'Новичок-бот' : 'Rookie Bot', avatar: '🤖' },
    medium: { name: language === 'ru' ? 'Умник 3000' : 'Smarty 3000', avatar: '🧠' },
    hard: { name: language === 'ru' ? 'Гений ИИ' : 'AI Genius', avatar: '👾' },
  };

  // ── AI DUEL ──
  const startDuel = async () => {
    if (!duelTopic.trim()) return;
    setDuelLoading(true);
    setError(null);
    try {
      const raw = await generateDuelQuestions(duelTopic, 7, language);
      const questions: DuelQuestion[] = raw.map((q: any, i: number) => ({
        id: `q-${i}`, question: q.question, options: q.options,
        correctAnswer: q.correctAnswer, difficulty: q.difficulty || 'medium',
      }));
      const ai = AI_NAMES[duelDifficulty];
      setDuel({
        topic: duelTopic, questions, index: 0,
        playerHp: 100, aiHp: 100, playerScore: 0, aiScore: 0,
        combo: 0, maxCombo: 0,
        aiName: ai.name, aiAvatar: ai.avatar, aiDifficulty: duelDifficulty,
        status: 'playing',
      });
      setError(null);
      setTab('duel_play');
      startTimer();
    } catch (e: any) {
      console.error('Duel start error:', e);
      setError(e?.message || (language === 'ru' ? 'Ошибка при генерации вопросов. Попробуйте ещё раз.' : 'Failed to generate questions. Try again.'));
    } finally {
      setDuelLoading(false);
    }
  };

  const handleDuelAnswer = (answer: string) => {
    if (!duel || duel.status !== 'playing' || feedback) return;
    const timeMs = stopTimer();
    const q = duel.questions[duel.index];
    const playerCorrect = answer === q.correctAnswer;

    duel.status = 'ai_turn';
    setDuel({ ...duel });

    const aiAccuracy = AI_OPPONENTS[duel.aiDifficulty].accuracy;
    const aiCorrect = Math.random() < aiAccuracy;
    const aiThinkMs = 800 + Math.random() * 600;

    setTimeout(() => {
      let playerText = '';
      let aiText = '';
      const dmg = 20;

      if (playerCorrect && !aiCorrect) {
        duel.aiHp = Math.max(0, duel.aiHp - dmg);
        duel.combo++;
        duel.maxCombo = Math.max(duel.maxCombo, duel.combo);
        const bonus = Math.max(0, 15 - Math.floor(timeMs / 1000));
        const pts = Math.round((10 + bonus) * (1 + duel.combo * 0.15));
        duel.playerScore += pts;
        playerText = `✅ +${pts} pts`;
        aiText = language === 'ru' ? '❌ Ошибся' : '❌ Wrong';
        setShakeTarget('ai');
      } else if (!playerCorrect && aiCorrect) {
        duel.playerHp = Math.max(0, duel.playerHp - dmg);
        duel.combo = 0;
        duel.aiScore += 10;
        playerText = language === 'ru' ? '❌ Неверно' : '❌ Wrong';
        aiText = language === 'ru' ? '✅ Верно' : '✅ Correct';
        setShakeTarget('player');
      } else if (playerCorrect && aiCorrect) {
        const bonus = Math.max(0, 10 - Math.floor(timeMs / 1000));
        duel.playerScore += 5 + bonus;
        duel.aiScore += 5;
        duel.combo++;
        duel.maxCombo = Math.max(duel.maxCombo, duel.combo);
        playerText = `✅ +${5 + bonus}`;
        aiText = language === 'ru' ? '✅ Тоже верно' : '✅ Also correct';
      } else {
        duel.playerHp = Math.max(0, duel.playerHp - 8);
        duel.aiHp = Math.max(0, duel.aiHp - 8);
        duel.combo = 0;
        playerText = language === 'ru' ? '❌ Оба ошиблись' : '❌ Both wrong';
        aiText = '❌';
      }

      setFeedback({ player: playerText, ai: aiText, playerOk: playerCorrect, aiOk: aiCorrect });

      setTimeout(() => {
        setFeedback(null);
        setShakeTarget(null);
        duel.index++;
        if (duel.index >= duel.questions.length || duel.playerHp <= 0 || duel.aiHp <= 0) {
          duel.status = 'finished';
          const prof = getArenaProfile(user.id);
          const won = duel.playerHp > duel.aiHp || (duel.playerHp === duel.aiHp && duel.playerScore > duel.aiScore);
          if (won) {
            prof.duelsWon++;
            prof.arenaRating += 20;
            prof.arenaTokens += 15;
            awardDuelWin(user.id);
          } else {
            prof.duelsLost++;
            prof.arenaRating = Math.max(0, prof.arenaRating - 10);
          }
          updateArenaProfile(prof);
        } else {
          duel.status = 'playing';
          startTimer();
        }
        setDuel({ ...duel });
      }, 1500);
    }, aiThinkMs);
  };

  // ── BOSS ──
  const BOSSES: Record<string, { name: string; avatar: string }> = {
    normal: { name: language === 'ru' ? 'Строгий Профессор' : 'Strict Professor', avatar: '👨‍🏫' },
    hard: { name: language === 'ru' ? 'Злой Эксперт' : 'Evil Expert', avatar: '😈' },
    nightmare: { name: language === 'ru' ? 'Мастер Знаний' : 'Knowledge Master', avatar: '🐉' },
  };

  const startBoss = async () => {
    if (!bossTopic.trim()) return;
    setBossLoading(true);
    setError(null);
    try {
      const boss = BOSSES[bossDiff];
      const hp = bossDiff === 'nightmare' ? 150 : bossDiff === 'hard' ? 120 : 100;
      const rounds = bossDiff === 'nightmare' ? 8 : bossDiff === 'hard' ? 7 : 6;
      const xp = bossDiff === 'nightmare' ? 300 : bossDiff === 'hard' ? 200 : 150;
      const intro = await generateBossIntro(bossTopic, bossDiff, boss.name, language);
      setBossFight({
        id: Date.now().toString(), topic: bossTopic, difficulty: bossDiff,
        status: 'in_progress', playerHp: 100, playerMaxHp: 100,
        bossHp: hp, bossMaxHp: hp, bossName: boss.name, bossAvatar: boss.avatar,
        messages: [{ role: 'boss', content: intro, timestamp: new Date().toISOString() }],
        round: 1, maxRounds: rounds, xpReward: xp, userId: user.id,
        createdAt: new Date().toISOString(),
      });
      setError(null);
      setTab('boss_play');
    } catch (e: any) {
      console.error('Boss start error:', e);
      setError(e?.message || (language === 'ru' ? 'Ошибка при запуске босса. Попробуйте ещё раз.' : 'Failed to start boss fight. Try again.'));
    } finally {
      setBossLoading(false);
    }
  };

  const sendBossMsg = async () => {
    if (!bossFight || !bossInput.trim() || bossLoading || bossFight.status !== 'in_progress') return;
    bossFight.messages.push({ role: 'player', content: bossInput, timestamp: new Date().toISOString() });
    setBossFight({ ...bossFight });
    const input = bossInput;
    setBossInput('');
    setBossLoading(true);
    try {
      const history = bossFight.messages.map(m => ({ role: m.role, content: m.content }));
      const res = await generateBossResponse(bossFight.topic, bossFight.difficulty, bossFight.bossName, history, input, language);
      bossFight.messages.push({ role: 'boss', content: res.response, damageDealt: res.playerDamage, timestamp: new Date().toISOString() });
      bossFight.playerHp = Math.max(0, bossFight.playerHp - res.playerDamage);
      bossFight.bossHp = Math.max(0, bossFight.bossHp - res.bossDamage);
      bossFight.round++;
      if (bossFight.bossHp <= 0) {
        bossFight.status = 'victory';
        const p = getArenaProfile(user.id); p.bossesDefeated++; updateArenaProfile(p);
        awardBossDefeat(user.id, bossFight.difficulty);
      } else if (bossFight.playerHp <= 0 || bossFight.round > bossFight.maxRounds) {
        bossFight.status = 'defeat';
      }
      saveBossFight(bossFight);
      setBossFight({ ...bossFight });
    } catch (e) { console.error(e); }
    finally { setBossLoading(false); }
  };

  // ── RENDER ──
  const back = (to: Tab = 'home') => (
    <button onClick={() => { setTab(to); setDuel(null); setBossFight(null); }} style={{
      background: 'none', border: 'none', color: 'var(--accent-primary)',
      cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '20px', padding: 0,
    }}>{t('arena.back')}</button>
  );

  const topicPicker = (value: string, onChange: (v: string) => void, accent: string) => (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        {TOPICS.map(t => (
          <button key={t.value} onClick={() => onChange(t.value)} style={{
            padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
            border: value === t.value ? `2px solid ${accent}` : '1px solid var(--border-medium)',
            background: value === t.value ? `${accent}15` : 'var(--bg-secondary)',
            color: value === t.value ? accent : 'var(--text-primary)',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}>{t.label}</button>
        ))}
      </div>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={language === 'ru' ? 'Или введите свою тему...' : 'Or type your own topic...'}
        style={{
          width: '100%', padding: '13px 16px', borderRadius: '12px',
          border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)',
          color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
        }}
      />
    </>
  );

  const renderHome = () => {
    const p = getArenaProfile(user.id);
    return (
      <div style={{ animation: 'fadeIn 0.5s ease' }}>
        <div style={{
          padding: isMobile ? '24px 18px' : '36px 32px', borderRadius: isMobile ? '18px' : '24px', marginBottom: isMobile ? '16px' : '24px',
          background: 'linear-gradient(135deg, #1a0533 0%, #0f172a 50%, #1e1b4b 100%)',
          position: 'relative', overflow: 'hidden', border: '1px solid rgba(139,92,246,0.3)',
        }}>
          <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '60%', height: '200%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '900', marginBottom: '6px', background: 'linear-gradient(135deg, #c084fc, #f472b6, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ⚔️ {t('arena.title')}
            </h1>
            <p style={{ color: '#a78bfa', fontSize: isMobile ? '13px' : '15px', fontWeight: '500', margin: 0 }}>{t('arena.subtitle')}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '8px' : '12px', marginBottom: isMobile ? '16px' : '24px' }}>
          {[
            { label: t('arena.rating'), value: p.arenaRating, icon: '🏆', color: '#f59e0b' },
            { label: t('arena.tokens'), value: p.arenaTokens, icon: '🪙', color: '#8b5cf6' },
            { label: t('arena.wins'), value: p.duelsWon, icon: '✅', color: '#10b981' },
            { label: language === 'ru' ? 'Боссы' : 'Bosses', value: p.bossesDefeated, icon: '🐉', color: '#ef4444' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '14px', borderRadius: '14px', textAlign: 'center',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', transition: 'all 0.3s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-medium)'; }}
            >
              <div style={{ fontSize: '24px', marginBottom: '2px' }}>{s.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { tab: 'duel' as Tab, icon: '🤖', gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)', glow: 'rgba(139,92,246,0.25)', title: language === 'ru' ? 'Дуэль с ИИ' : 'AI Duel', desc: language === 'ru' ? 'Соревнуйся с ИИ-ботом на любую тему' : 'Compete against AI bot on any topic' },
            { tab: 'boss' as Tab, icon: '🐉', gradient: 'linear-gradient(135deg, #ef4444, #f97316)', glow: 'rgba(239,68,68,0.25)', title: 'Boss Fight', desc: language === 'ru' ? 'Защити знания перед ИИ-экзаменатором' : 'Defend knowledge against AI examiner' },
          ].map(m => (
            <button key={m.tab} onClick={() => setTab(m.tab)} style={{
              padding: isMobile ? '20px 14px' : '32px 20px', borderRadius: isMobile ? '16px' : '20px', border: '1px solid var(--border-medium)',
              background: 'var(--bg-elevated)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 20px 40px ${m.glow}`; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-medium)'; }}
            >
              <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: isMobile ? '8px' : '12px' }}>{m.icon}</div>
              <div style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: '800', marginBottom: '6px', background: m.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{m.title}</div>
              <div style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text-tertiary)', lineHeight: '1.4' }}>{m.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderDuelSetup = () => (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {back()}
      <div style={{ padding: isMobile ? '20px 16px' : '32px', borderRadius: isMobile ? '16px' : '20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)' }}>
        <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>
          🤖 {language === 'ru' ? 'Дуэль с ИИ' : 'AI Duel'}
        </h2>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '24px' }}>
          {language === 'ru'
            ? 'Выбери любую тему — ИИ-бот тоже будет отвечать. Кто наберёт больше HP побеждает!'
            : 'Pick any topic — AI bot also answers. Whoever keeps more HP wins!'}
        </p>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
            {language === 'ru' ? 'Тема' : 'Topic'}
          </label>
          {topicPicker(duelTopic, setDuelTopic, '#8b5cf6')}
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>
            {language === 'ru' ? 'Соперник' : 'Opponent'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {(['easy', 'medium', 'hard'] as const).map(d => {
              const cfg = { easy: { c: '#10b981', l: language === 'ru' ? 'Лёгкий' : 'Easy' }, medium: { c: '#f59e0b', l: language === 'ru' ? 'Средний' : 'Medium' }, hard: { c: '#ef4444', l: language === 'ru' ? 'Сложный' : 'Hard' } };
              const ai = AI_NAMES[d];
              return (
                <button key={d} onClick={() => setDuelDifficulty(d)} style={{
                  padding: '14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                  border: duelDifficulty === d ? `2px solid ${cfg[d].c}` : '1px solid var(--border-medium)',
                  background: duelDifficulty === d ? `${cfg[d].c}15` : 'var(--bg-secondary)',
                  color: duelDifficulty === d ? cfg[d].c : 'var(--text-primary)',
                  fontSize: '13px', fontWeight: '600',
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>{ai.avatar}</div>
                  <div style={{ fontWeight: '700' }}>{ai.name}</div>
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>{cfg[d].l} ({Math.round(AI_OPPONENTS[d].accuracy * 100)}%)</div>
                </button>
              );
            })}
          </div>
        </div>

        {error && tab === 'duel' && (
          <div style={{
            padding: '12px 16px', borderRadius: '12px', marginBottom: '12px',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444', fontSize: '13px', fontWeight: '600',
          }}>
            ⚠️ {error}
          </div>
        )}
        <button onClick={startDuel} disabled={duelLoading || !duelTopic.trim()} style={{
          width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
          background: 'var(--accent-gradient)', color: 'white', fontSize: '16px', fontWeight: '700',
          cursor: 'pointer', opacity: duelLoading ? 0.7 : 1, boxShadow: '0 0 30px rgba(139,92,246,0.3)',
        }}>
          {duelLoading ? (language === 'ru' ? 'ИИ генерирует вопросы...' : 'AI generating...') : (language === 'ru' ? 'Начать дуэль!' : 'Start Duel!')}
        </button>
      </div>
    </div>
  );

  const renderDuelPlay = () => {
    if (!duel && duelLoading) {
      return (
        <div style={{ animation: 'fadeIn 0.4s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s ease infinite' }}>⚔️</div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {language === 'ru' ? 'Готовим новую дуэль...' : 'Preparing new duel...'}
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
            {language === 'ru' ? 'ИИ генерирует вопросы' : 'AI is generating questions'}
          </p>
        </div>
      );
    }
    if (!duel) return null;
    const done = duel.status === 'finished';
    const q = !done && duel.index < duel.questions.length ? duel.questions[duel.index] : null;
    const playerWon = duel.playerHp > duel.aiHp || (duel.playerHp === duel.aiHp && duel.playerScore > duel.aiScore);

    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        {/* VS Header */}
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px',
          padding: '14px 16px', borderRadius: '14px',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
        }}>
          <div className={shakeTarget === 'player' ? 'arena-hit' : ''} style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px' }}>{user.avatar || '🧑'}</span>
              <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>{user.name}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b', marginLeft: 'auto' }}>{duel.playerScore} pts</span>
            </div>
            <HpBar current={duel.playerHp} max={100} label="HP" color="linear-gradient(90deg, #8b5cf6, #6366f1)" />
          </div>

          <div style={{ textAlign: 'center', minWidth: '44px' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VS</div>
            {duel.combo > 1 && <div style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', marginTop: '2px' }}>x{duel.combo}</div>}
          </div>

          <div className={shakeTarget === 'ai' ? 'arena-hit' : ''} style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b', marginRight: 'auto' }}>{duel.aiScore} pts</span>
              <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>{duel.aiName}</span>
              <span style={{ fontSize: '18px' }}>{duel.aiAvatar}</span>
            </div>
            <HpBar current={duel.aiHp} max={100} label="HP" color="linear-gradient(90deg, #ef4444, #f97316)" />
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
            marginBottom: '14px', animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{
              padding: '10px', borderRadius: '10px', textAlign: 'center', fontWeight: '700', fontSize: '14px',
              background: feedback.playerOk ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: feedback.playerOk ? '#10b981' : '#ef4444',
              border: `1px solid ${feedback.playerOk ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>{feedback.player}</div>
            <div style={{
              padding: '10px', borderRadius: '10px', textAlign: 'center', fontWeight: '700', fontSize: '14px',
              background: feedback.aiOk ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: feedback.aiOk ? '#10b981' : '#ef4444',
              border: `1px solid ${feedback.aiOk ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>{duel.aiAvatar} {feedback.ai}</div>
          </div>
        )}

        {/* AI thinking indicator */}
        {duel.status === 'ai_turn' && !feedback && (
          <div style={{
            textAlign: 'center', padding: '12px', marginBottom: '14px', borderRadius: '12px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)',
            color: 'var(--text-tertiary)', fontSize: '14px', fontWeight: '600',
          }}>
            {duel.aiAvatar} {language === 'ru' ? `${duel.aiName} думает...` : `${duel.aiName} is thinking...`}
          </div>
        )}

        {/* Question */}
        {!done && q && (
          <div style={{ padding: isMobile ? '16px' : '28px', borderRadius: isMobile ? '14px' : '20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '600' }}>{duel.index + 1}/{duel.questions.length}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                  background: q.difficulty === 'hard' ? '#ef444420' : q.difficulty === 'medium' ? '#f59e0b20' : '#10b98120',
                  color: q.difficulty === 'hard' ? '#ef4444' : q.difficulty === 'medium' ? '#f59e0b' : '#10b981',
                }}>{q.difficulty}</span>
              </div>
              <span style={{ fontSize: '14px', color: 'var(--text-tertiary)', fontWeight: '600' }}>⏱ {(timer / 1000).toFixed(1)}s</span>
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '18px', lineHeight: '1.5' }}>{q.question}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => handleDuelAnswer(opt)} disabled={duel.status !== 'playing'}
                  style={{
                    padding: '14px 18px', borderRadius: '12px', textAlign: 'left',
                    border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500',
                    cursor: duel.status === 'playing' ? 'pointer' : 'default',
                    transition: 'all 0.15s ease', opacity: duel.status !== 'playing' ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}
                  onMouseEnter={e => { if (duel.status === 'playing') { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                >
                  <span style={{
                    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                    background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)',
                  }}>{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {done && (
          <div className={playerWon ? 'arena-victory' : 'arena-defeat'} style={{
            padding: isMobile ? '24px 16px' : '40px', borderRadius: isMobile ? '18px' : '24px', textAlign: 'center',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
          }}>
            <div style={{ fontSize: isMobile ? '48px' : '64px', marginBottom: '12px' }}>{playerWon ? '🏆' : '💀'}</div>
            <h2 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: '900', marginBottom: '14px', color: playerWon ? '#10b981' : '#ef4444' }}>
              {playerWon ? (language === 'ru' ? 'Победа!' : 'Victory!') : (language === 'ru' ? 'Поражение!' : 'Defeat!')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
              <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{user.name}</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#8b5cf6' }}>{duel.playerScore}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{duel.playerHp} HP</div>
              </div>
              <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-tertiary)' }}>vs</span>
              <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{duel.aiAvatar} {duel.aiName}</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#ef4444' }}>{duel.aiScore}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{duel.aiHp} HP</div>
              </div>
            </div>
            {duel.maxCombo > 1 && <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginBottom: '16px' }}>Max Combo: x{duel.maxCombo}</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
              <button onClick={() => { setFeedback(null); setShakeTarget(null); setDuel(null); startDuel(); }} style={{
                padding: isMobile ? '12px 20px' : '14px 28px', borderRadius: '14px', border: 'none',
                background: 'var(--accent-gradient)', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
              }}>{language === 'ru' ? 'Реванш!' : 'Rematch!'}</button>
              <button onClick={() => { setDuel(null); setTab('home'); }} style={{
                padding: '14px 28px', borderRadius: '14px', border: '1px solid var(--border-medium)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              }}>{t('arena.back')}</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBossSetup = () => (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {back()}
      <div style={{ padding: isMobile ? '20px 16px' : '32px', borderRadius: isMobile ? '16px' : '20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)' }}>
        <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>🐉 Boss Fight</h2>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '24px' }}>{t('arena.boss.subtitle')}</p>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>{language === 'ru' ? 'Тема' : 'Topic'}</label>
          {topicPicker(bossTopic, setBossTopic, '#ef4444')}
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>{t('arena.boss.difficulty')}</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {(['normal', 'hard', 'nightmare'] as const).map(d => {
              const cfg = { normal: { c: '#10b981', i: '👨‍🏫' }, hard: { c: '#f59e0b', i: '😈' }, nightmare: { c: '#ef4444', i: '🐉' } };
              return (
                <button key={d} onClick={() => setBossDiff(d)} style={{
                  padding: '14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                  border: bossDiff === d ? `2px solid ${cfg[d].c}` : '1px solid var(--border-medium)',
                  background: bossDiff === d ? `${cfg[d].c}15` : 'var(--bg-secondary)',
                  color: bossDiff === d ? cfg[d].c : 'var(--text-primary)', fontSize: '14px', fontWeight: '600',
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>{cfg[d].i}</div>
                  {t(`arena.boss.${d}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <span style={{ fontSize: '36px' }}>{BOSSES[bossDiff].avatar}</span>
          <div>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '15px' }}>{BOSSES[bossDiff].name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              HP: {bossDiff === 'nightmare' ? 150 : bossDiff === 'hard' ? 120 : 100} | XP: +{bossDiff === 'nightmare' ? 300 : bossDiff === 'hard' ? 200 : 150}
            </div>
          </div>
        </div>

        {error && tab === 'boss' && (
          <div style={{
            padding: '12px 16px', borderRadius: '12px', marginBottom: '12px',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444', fontSize: '13px', fontWeight: '600',
          }}>
            ⚠️ {error}
          </div>
        )}
        <button onClick={startBoss} disabled={bossLoading || !bossTopic.trim()} style={{
          width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
          background: 'linear-gradient(135deg, #ef4444, #f97316)', color: 'white',
          fontSize: '16px', fontWeight: '700', cursor: 'pointer', opacity: bossLoading ? 0.7 : 1,
        }}>
          {bossLoading ? t('arena.boss.generating') : t('arena.boss.start')}
        </button>
      </div>
    </div>
  );

  const renderBossPlay = () => {
    if (!bossFight) return null;
    const isOver = bossFight.status !== 'in_progress';
    return (
      <div style={{ animation: 'fadeIn 0.5s ease', display: 'flex', flexDirection: 'column', height: isMobile ? 'calc(100vh - 160px)' : 'calc(100vh - 120px)' }}>
        <div style={{ padding: '14px 18px', borderRadius: '14px', marginBottom: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px' }}>{user.avatar || '⚔️'}</span>
                <span style={{ fontWeight: '700', fontSize: '13px' }}>{user.name}</span>
              </div>
              <HpBar current={bossFight.playerHp} max={bossFight.playerMaxHp} label="HP" color="linear-gradient(90deg, #8b5cf6, #6366f1)" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--error)', padding: '6px 10px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px' }}>VS</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', justifyContent: 'flex-end' }}>
                <span style={{ fontWeight: '700', fontSize: '13px' }}>{bossFight.bossName}</span>
                <span style={{ fontSize: '20px' }}>{bossFight.bossAvatar}</span>
              </div>
              <HpBar current={bossFight.bossHp} max={bossFight.bossMaxHp} label="HP" color="linear-gradient(90deg, #ef4444, #f97316)" />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {t('arena.boss.round')} {bossFight.round}/{bossFight.maxRounds}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '12px', borderRadius: '14px', background: 'var(--bg-secondary)', marginBottom: '12px', border: '1px solid var(--border-medium)' }}>
          {bossFight.messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: '10px', display: 'flex', flexDirection: msg.role === 'player' ? 'row-reverse' : 'row', gap: '8px', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, background: msg.role === 'boss' ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                {msg.role === 'boss' ? bossFight.bossAvatar : (user.avatar || '⚔️')}
              </div>
              <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: '14px', background: msg.role === 'boss' ? 'var(--bg-elevated)' : 'var(--accent-gradient)', color: msg.role === 'boss' ? 'var(--text-primary)' : 'white', fontSize: '14px', lineHeight: '1.5', border: msg.role === 'boss' ? '1px solid var(--border-medium)' : 'none' }}>
                {msg.content}
                {msg.damageDealt !== undefined && msg.damageDealt > 0 && <div style={{ marginTop: '4px', fontSize: '11px', opacity: 0.7 }}>💥 -{msg.damageDealt} HP</div>}
              </div>
            </div>
          ))}
          <div ref={bossEndRef} />
        </div>

        {isOver && (
          <div className={bossFight.status === 'victory' ? 'arena-victory' : 'arena-defeat'} style={{
            padding: '20px', borderRadius: '14px', textAlign: 'center', marginBottom: '12px',
            background: bossFight.status === 'victory' ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))' : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))',
            border: `1px solid ${bossFight.status === 'victory' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>{bossFight.status === 'victory' ? '🏆' : '💀'}</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px', color: bossFight.status === 'victory' ? '#10b981' : '#ef4444' }}>
              {bossFight.status === 'victory' ? t('arena.boss.victory') : t('arena.boss.defeat')}
            </h3>
            {bossFight.status === 'victory' && <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>+{bossFight.xpReward} XP</p>}
            <button onClick={() => { setBossFight(null); setTab('boss'); }} style={{
              marginTop: '12px', padding: '10px 24px', borderRadius: '10px', border: 'none',
              background: 'var(--accent-gradient)', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            }}>{t('arena.boss.newFight')}</button>
          </div>
        )}

        {!isOver && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={bossInput} onChange={e => setBossInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendBossMsg()}
              placeholder={t('arena.boss.yourAnswer')} style={{
                flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-medium)',
                background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              }}
            />
            <button onClick={sendBossMsg} disabled={bossLoading || !bossInput.trim()} style={{
              padding: '12px 20px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #ef4444, #f97316)', color: 'white',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: bossLoading ? 0.5 : 1,
            }}>{bossLoading ? '...' : t('arena.boss.send')}</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: isMobile ? '16px 12px' : '24px', maxWidth: '800px', margin: '0 auto' }}>
      {tab === 'home' && renderHome()}
      {tab === 'duel' && renderDuelSetup()}
      {tab === 'duel_play' && renderDuelPlay()}
      {tab === 'boss' && renderBossSetup()}
      {tab === 'boss_play' && renderBossPlay()}
    </div>
  );
}
