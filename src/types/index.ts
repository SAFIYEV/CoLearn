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
