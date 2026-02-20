
export interface UserGamification {
    userId: string;
    xp: number;
    streak: number;
    lastActiveDate: string;
    badges: string[];
    lessonsToday: number;
    totalLessons: number;
    totalCourses: number;
    totalAssignments: number;
}

export interface Badge {
    id: string;
    icon: string;
    nameKey: string;
    descKey: string;
}

export const ALL_BADGES: Badge[] = [
    { id: 'first_lesson', icon: '🎯', nameKey: 'badge.first_lesson', descKey: 'badge.first_lesson.desc' },
    { id: 'first_course', icon: '🏆', nameKey: 'badge.first_course', descKey: 'badge.first_course.desc' },
    { id: 'streak_3', icon: '🔥', nameKey: 'badge.streak_3', descKey: 'badge.streak_3.desc' },
    { id: 'streak_7', icon: '⚡', nameKey: 'badge.streak_7', descKey: 'badge.streak_7.desc' },
    { id: 'streak_30', icon: '💎', nameKey: 'badge.streak_30', descKey: 'badge.streak_30.desc' },
    { id: 'perfect_score', icon: '💯', nameKey: 'badge.perfect_score', descKey: 'badge.perfect_score.desc' },
    { id: 'module_master', icon: '📦', nameKey: 'badge.module_master', descKey: 'badge.module_master.desc' },
    { id: 'speed_learner', icon: '⚡', nameKey: 'badge.speed_learner', descKey: 'badge.speed_learner.desc' },
    { id: 'social', icon: '👥', nameKey: 'badge.social', descKey: 'badge.social.desc' },
    { id: 'ten_lessons', icon: '📚', nameKey: 'badge.ten_lessons', descKey: 'badge.ten_lessons.desc' },
];

export const LEVELS = [
    { level: 1, xp: 0, nameKey: 'level.1' },
    { level: 2, xp: 100, nameKey: 'level.2' },
    { level: 3, xp: 300, nameKey: 'level.3' },
    { level: 4, xp: 600, nameKey: 'level.4' },
    { level: 5, xp: 1000, nameKey: 'level.5' },
    { level: 6, xp: 1500, nameKey: 'level.6' },
    { level: 7, xp: 2500, nameKey: 'level.7' },
];

const GAMIFICATION_KEY = 'gamification';

function getAllData(): UserGamification[] {
    try {
        return JSON.parse(localStorage.getItem(GAMIFICATION_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveAllData(data: UserGamification[]) {
    localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data));
}

function getToday(): string {
    return new Date().toISOString().slice(0, 10);
}

function getYesterday(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

export function getUserGamification(userId: string): UserGamification {
    const all = getAllData();
    const existing = all.find(g => g.userId === userId);
    if (existing) return existing;
    const fresh: UserGamification = {
        userId, xp: 0, streak: 0, lastActiveDate: '',
        badges: [], lessonsToday: 0,
        totalLessons: 0, totalCourses: 0, totalAssignments: 0
    };
    saveAllData([...all, fresh]);
    return fresh;
}

function save(g: UserGamification) {
    const all = getAllData();
    const idx = all.findIndex(d => d.userId === g.userId);
    if (idx >= 0) all[idx] = g; else all.push(g);
    saveAllData(all);
}

function updateStreak(g: UserGamification): void {
    const today = getToday();
    if (g.lastActiveDate === today) return;
    if (g.lastActiveDate === getYesterday()) {
        g.streak += 1;
    } else {
        g.streak = 1;
    }
    g.lastActiveDate = today;
    if (today !== g.lastActiveDate) g.lessonsToday = 0;
}

function checkBadges(g: UserGamification): string[] {
    const newBadges: string[] = [];
    const tryAward = (id: string, condition: boolean) => {
        if (condition && !g.badges.includes(id)) {
            g.badges.push(id);
            newBadges.push(id);
        }
    };
    tryAward('first_lesson', g.totalLessons >= 1);
    tryAward('ten_lessons', g.totalLessons >= 10);
    tryAward('first_course', g.totalCourses >= 1);
    tryAward('streak_3', g.streak >= 3);
    tryAward('streak_7', g.streak >= 7);
    tryAward('streak_30', g.streak >= 30);
    tryAward('speed_learner', g.lessonsToday >= 5);
    return newBadges;
}

export function getLevel(xp: number): { level: number; nameKey: string; currentXp: number; nextLevelXp: number; progress: number } {
    let current = LEVELS[0];
    for (const l of LEVELS) {
        if (xp >= l.xp) current = l;
    }
    const nextIdx = LEVELS.findIndex(l => l.level === current.level) + 1;
    const next = nextIdx < LEVELS.length ? LEVELS[nextIdx] : null;
    const nextXp = next ? next.xp : current.xp;
    const progress = next ? Math.min(100, Math.round(((xp - current.xp) / (next.xp - current.xp)) * 100)) : 100;
    return { level: current.level, nameKey: current.nameKey, currentXp: xp, nextLevelXp: nextXp, progress };
}

export interface XpEvent {
    xpGained: number;
    newBadges: string[];
    leveledUp: boolean;
    oldLevel: number;
    newLevel: number;
}

export function awardLessonComplete(userId: string): XpEvent {
    const g = getUserGamification(userId);
    const oldLevel = getLevel(g.xp).level;
    updateStreak(g);
    g.xp += 25;
    g.totalLessons += 1;
    g.lessonsToday += 1;
    const newBadges = checkBadges(g);
    save(g);
    const newLevel = getLevel(g.xp).level;
    return { xpGained: 25, newBadges, leveledUp: newLevel > oldLevel, oldLevel, newLevel };
}

export function awardAssignmentComplete(userId: string, score: number): XpEvent {
    const g = getUserGamification(userId);
    const oldLevel = getLevel(g.xp).level;
    updateStreak(g);
    const xp = score === 100 ? 100 : score >= 80 ? 75 : 50;
    g.xp += xp;
    g.totalAssignments += 1;
    if (score === 100 && !g.badges.includes('perfect_score')) {
        g.badges.push('perfect_score');
    }
    const newBadges = checkBadges(g);
    if (score === 100 && !newBadges.includes('perfect_score')) newBadges.push('perfect_score');
    save(g);
    const newLevel = getLevel(g.xp).level;
    return { xpGained: xp, newBadges, leveledUp: newLevel > oldLevel, oldLevel, newLevel };
}

export function awardModuleComplete(userId: string): XpEvent {
    const g = getUserGamification(userId);
    const oldLevel = getLevel(g.xp).level;
    g.xp += 200;
    if (!g.badges.includes('module_master')) {
        g.badges.push('module_master');
    }
    const newBadges = checkBadges(g);
    save(g);
    const newLevel = getLevel(g.xp).level;
    return { xpGained: 200, newBadges, leveledUp: newLevel > oldLevel, oldLevel, newLevel };
}

export function awardCourseComplete(userId: string): XpEvent {
    const g = getUserGamification(userId);
    const oldLevel = getLevel(g.xp).level;
    g.xp += 500;
    g.totalCourses += 1;
    const newBadges = checkBadges(g);
    save(g);
    const newLevel = getLevel(g.xp).level;
    return { xpGained: 500, newBadges, leveledUp: newLevel > oldLevel, oldLevel, newLevel };
}

export function awardSocialBadge(userId: string): void {
    const g = getUserGamification(userId);
    if (!g.badges.includes('social')) {
        g.badges.push('social');
    }
    save(g);
}

export function recordDailyLogin(userId: string): void {
    const g = getUserGamification(userId);
    const today = getToday();
    if (g.lastActiveDate !== today) {
        updateStreak(g);
        g.xp += 10;
        g.lessonsToday = 0;
        save(g);
    }
}

export function getClassLeaderboard(memberIds: string[]): { userId: string; xp: number; level: number; streak: number }[] {
    return memberIds
        .map(id => {
            const g = getUserGamification(id);
            return { userId: id, xp: g.xp, level: getLevel(g.xp).level, streak: g.streak };
        })
        .sort((a, b) => b.xp - a.xp);
}
