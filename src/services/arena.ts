import type { ArenaProfile, Duel, DuelPlayer, BossFight, KnowledgeHeist } from '../types';

const ARENA_PROFILES_KEY = 'arena_profiles';
const DUELS_KEY = 'arena_duels';
const BOSS_FIGHTS_KEY = 'arena_bossfights';
const HEISTS_KEY = 'arena_heists';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getArenaProfile(userId: string): ArenaProfile {
  const profiles = loadJSON<ArenaProfile[]>(ARENA_PROFILES_KEY, []);
  const existing = profiles.find(p => p.userId === userId);
  if (existing) return existing;
  const fresh: ArenaProfile = {
    userId,
    arenaRating: 1000,
    duelsWon: 0,
    duelsLost: 0,
    bossesDefeated: 0,
    heistsWon: 0,
    heistsLost: 0,
    arenaTokens: 100,
    winStreak: 0,
    bestWinStreak: 0,
  };
  saveJSON(ARENA_PROFILES_KEY, [...profiles, fresh]);
  return fresh;
}

export function updateArenaProfile(profile: ArenaProfile): void {
  const profiles = loadJSON<ArenaProfile[]>(ARENA_PROFILES_KEY, []);
  const idx = profiles.findIndex(p => p.userId === profile.userId);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push(profile);
  saveJSON(ARENA_PROFILES_KEY, profiles);
}

export function createDuelPlayer(userId: string, name: string, avatar?: string): DuelPlayer {
  return {
    userId,
    name,
    avatar,
    hp: 100,
    maxHp: 100,
    answers: [],
    totalScore: 0,
  };
}

export function saveDuel(duel: Duel): void {
  const duels = loadJSON<Duel[]>(DUELS_KEY, []);
  const idx = duels.findIndex(d => d.id === duel.id);
  if (idx >= 0) duels[idx] = duel;
  else duels.push(duel);
  saveJSON(DUELS_KEY, duels);
}

export function getDuelHistory(userId: string): Duel[] {
  const duels = loadJSON<Duel[]>(DUELS_KEY, []);
  return duels
    .filter(d => d.player1.userId === userId || d.player2.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function processDuelAnswer(
  duel: Duel,
  player: 'player1' | 'player2',
  answer: string,
  timeMs: number
): { correct: boolean; damage: number } {
  const question = duel.questions[duel.currentQuestionIndex];
  const correct = answer === question.correctAnswer;
  const damage = correct ? Math.max(15, 35 - Math.floor(timeMs / 1000)) : 0;

  duel[player].answers.push({
    questionId: question.id,
    answer,
    correct,
    timeMs,
  });

  if (correct) {
    duel[player].totalScore += damage;
    const opponent = player === 'player1' ? 'player2' : 'player1';
    duel[opponent].hp = Math.max(0, duel[opponent].hp - damage);
  } else {
    duel[player].hp = Math.max(0, duel[player].hp - 10);
  }

  return { correct, damage };
}

export function advanceDuelTurn(duel: Duel): void {
  if (duel.currentTurn === 'player2') {
    duel.currentQuestionIndex++;
  }
  duel.currentTurn = duel.currentTurn === 'player1' ? 'player2' : 'player1';

  if (
    duel.currentQuestionIndex >= duel.questions.length ||
    duel.player1.hp <= 0 ||
    duel.player2.hp <= 0
  ) {
    duel.status = 'finished';
    if (duel.player1.hp > duel.player2.hp) {
      duel.winnerId = duel.player1.userId;
    } else if (duel.player2.hp > duel.player1.hp) {
      duel.winnerId = duel.player2.userId;
    }
  }
}

export function finalizeDuel(duel: Duel, profile1: ArenaProfile, profile2: ArenaProfile): void {
  if (duel.winnerId === profile1.userId) {
    profile1.duelsWon++;
    profile1.arenaRating += 25;
    profile1.arenaTokens += duel.xpStake;
    profile1.winStreak++;
    profile1.bestWinStreak = Math.max(profile1.bestWinStreak, profile1.winStreak);
    profile2.duelsLost++;
    profile2.arenaRating = Math.max(0, profile2.arenaRating - 15);
    profile2.arenaTokens = Math.max(0, profile2.arenaTokens - duel.xpStake);
    profile2.winStreak = 0;
  } else if (duel.winnerId === profile2.userId) {
    profile2.duelsWon++;
    profile2.arenaRating += 25;
    profile2.arenaTokens += duel.xpStake;
    profile2.winStreak++;
    profile2.bestWinStreak = Math.max(profile2.bestWinStreak, profile2.winStreak);
    profile1.duelsLost++;
    profile1.arenaRating = Math.max(0, profile1.arenaRating - 15);
    profile1.arenaTokens = Math.max(0, profile1.arenaTokens - duel.xpStake);
    profile1.winStreak = 0;
  }
  updateArenaProfile(profile1);
  updateArenaProfile(profile2);
  saveDuel(duel);
}

export function saveBossFight(fight: BossFight): void {
  const fights = loadJSON<BossFight[]>(BOSS_FIGHTS_KEY, []);
  const idx = fights.findIndex(f => f.id === fight.id);
  if (idx >= 0) fights[idx] = fight;
  else fights.push(fight);
  saveJSON(BOSS_FIGHTS_KEY, fights);
}

export function getBossFightHistory(userId: string): BossFight[] {
  const fights = loadJSON<BossFight[]>(BOSS_FIGHTS_KEY, []);
  return fights
    .filter(f => f.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function saveHeist(heist: KnowledgeHeist): void {
  const heists = loadJSON<KnowledgeHeist[]>(HEISTS_KEY, []);
  const idx = heists.findIndex(h => h.id === heist.id);
  if (idx >= 0) heists[idx] = heist;
  else heists.push(heist);
  saveJSON(HEISTS_KEY, heists);
}

export function getArenaLeaderboard(): ArenaProfile[] {
  return loadJSON<ArenaProfile[]>(ARENA_PROFILES_KEY, [])
    .sort((a, b) => b.arenaRating - a.arenaRating)
    .slice(0, 20);
}
