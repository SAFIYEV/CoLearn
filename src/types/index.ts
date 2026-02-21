// User types
export interface User {
  id: string;
  email: string;
  username: string; // New field
  name: string;
  avatar?: string;
  createdAt: string;
}

// Course types
export interface Lesson {
  id: string;
  title: string;
  content: string;
  duration: number; // в минутах
  completed: boolean;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  completed: boolean;
}

export interface Assignment {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  questions: Question[];
  completed: boolean;
  score?: number;
}

export interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'text' | 'code';
  options?: string[];
  correctAnswer?: string;
  userAnswer?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  goal: string;
  duration: number; // в днях
  modules: Module[];
  assignments: Assignment[];
  progress: number; // 0-100
  createdAt: string;
  status: 'active' | 'completed' | 'paused';
}

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ClassChatMessage {
  id: string;
  classId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

// Class types
export interface ClassGroup {
  id: string;
  name: string;
  creatorId: string;
  members: string[]; // User IDs
  createdAt: string;
}

export interface ClassInvite {
  id: string;
  classId: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// Arena types
export interface DuelQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DuelPlayer {
  userId: string;
  name: string;
  avatar?: string;
  hp: number;
  maxHp: number;
  answers: { questionId: string; answer: string; correct: boolean; timeMs: number }[];
  totalScore: number;
}

export interface Duel {
  id: string;
  topic: string;
  status: 'waiting' | 'in_progress' | 'finished';
  player1: DuelPlayer;
  player2: DuelPlayer;
  questions: DuelQuestion[];
  currentQuestionIndex: number;
  currentTurn: 'player1' | 'player2';
  winnerId?: string;
  xpStake: number;
  createdAt: string;
}

export interface BossFightMessage {
  role: 'boss' | 'player';
  content: string;
  damageDealt?: number;
  timestamp: string;
}

export interface BossFight {
  id: string;
  topic: string;
  difficulty: 'normal' | 'hard' | 'nightmare';
  status: 'in_progress' | 'victory' | 'defeat';
  playerHp: number;
  playerMaxHp: number;
  bossHp: number;
  bossMaxHp: number;
  bossName: string;
  bossAvatar: string;
  messages: BossFightMessage[];
  round: number;
  maxRounds: number;
  xpReward: number;
  userId: string;
  createdAt: string;
}

export interface HeistChallenge {
  id: string;
  type: 'code' | 'quiz' | 'logic';
  question: string;
  options?: string[];
  correctAnswer: string;
  timeLimit: number;
  points: number;
}

export interface KnowledgeHeist {
  id: string;
  topic: string;
  status: 'setup' | 'in_progress' | 'finished';
  creatorId: string;
  invaderId: string;
  creatorName: string;
  invaderName: string;
  challenges: HeistChallenge[];
  currentChallengeIndex: number;
  creatorScore: number;
  invaderScore: number;
  tokenStake: number;
  winnerId?: string;
  createdAt: string;
}

export interface ArenaProfile {
  userId: string;
  arenaRating: number;
  duelsWon: number;
  duelsLost: number;
  bossesDefeated: number;
  heistsWon: number;
  heistsLost: number;
  arenaTokens: number;
  winStreak: number;
  bestWinStreak: number;
}
