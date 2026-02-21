import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Course } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const TUTOR_API_KEY = import.meta.env.VITE_GEMINI_TUTOR_API_KEY || API_KEY;
const BACKUP_API_KEY = import.meta.env.VITE_GEMINI_BACKUP_API_KEY || API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const tutorAI = new GoogleGenerativeAI(TUTOR_API_KEY);
const backupAI = new GoogleGenerativeAI(BACKUP_API_KEY);

const ARENA_KEYS = [
  import.meta.env.VITE_GEMINI_ARENA_KEY_1,
  import.meta.env.VITE_GEMINI_ARENA_KEY_2,
  import.meta.env.VITE_GEMINI_ARENA_KEY_3,
  import.meta.env.VITE_GEMINI_ARENA_KEY_4,
].filter(Boolean);
const arenaAIs = ARENA_KEYS.map(k => new GoogleGenerativeAI(k));


export async function generateCourse(goal: string, duration: number): Promise<Course> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `
Создай ПОДРОБНЫЙ и ИНТЕРЕСНЫЙ образовательный курс для следующей цели: "${goal}"
Длительность курса: ${duration} дней

Создай структуру курса в формате JSON со следующей структурой:
{
  "title": "Название курса",
  "description": "Описание курса",
  "modules": [
    {
      "title": "Название модуля",
      "description": "Описание модуля",
      "lessons": [
        {
          "title": "Название урока",
          "content": "ПОДРОБНОЕ содержание урока",
          "duration": 45
        }
      ]
    }
  ],
  "assignments": [
    {
      "moduleId": "0",
      "title": "Название задания",
      "description": "Описание задания",
      "questions": [
        {
          "question": "Текст вопроса",
          "type": "multiple-choice",
          "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
          "correctAnswer": "Вариант 1"
        }
      ]
    }
  ]
}

ВАЖНЫЕ ТРЕБОВАНИЯ К КОНТЕНТУ УРОКОВ:
1. Каждый урок должен быть ПОДРОБНЫМ (минимум 800-1500 слов)
2. Используй форматирование markdown:
   - **жирный текст** для важных терминов
   - *курсив* для акцентов
   - ### Заголовки для разделов урока
   - • Списки для перечислений
   - > Цитаты для важных замечаний
3. Структура каждого урока:
   - Введение (что изучим)
   - Теоретический блок (подробное объяснение)
   - Практические примеры (минимум 2-3 примера)
   - Упражнения для самопроверки
   - Резюме (краткие выводы)
4. Добавляй КОНКРЕТНЫЕ примеры, диалоги, ситуации
5. Делай контент ИНТЕРЕСНЫМ и мотивирующим
6. Длительность урока должна быть 30-60 минут

ТРЕБОВАНИЯ К СТРУКТУРЕ:
- Создай ${Math.max(4, Math.min(8, Math.ceil(duration / 30)))} модулей
- Каждый модуль должен содержать 4-6 уроков
- Добавь проверочное задание с 5-8 вопросами после каждого модуля
- Вопросы должны быть практическими и проверять понимание

Верни ТОЛЬКО JSON без дополнительного текста.

ВАЖНОЕ ПРИМЕЧАНИЕ ПО ЯЗЫКУ:
Если цель (goal) пользователя написана на английском языке, весь контент курса (заголовки, описания, уроки, вопросы) ДОЛЖЕН быть на английском языке.
Если цель на русском - на русском.
Всегда адаптируй язык контента под язык запроса пользователя.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();


  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Ответ API:', text);
    throw new Error('Не удалось получить корректный JSON от API. Проверьте консоль для деталей.');
  }

  let courseData;
  try {
    courseData = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('Ошибка парсинга JSON:', parseError);
    console.error('JSON строка:', jsonMatch[0]);
    throw new Error('Не удалось распарсить JSON от API: ' + (parseError as Error).message);
  }


  if (!courseData.modules || !Array.isArray(courseData.modules)) {
    throw new Error('API вернул некорректную структуру: отсутствует массив modules');
  }

  const course: Course = {
    id: Date.now().toString(),
    title: courseData.title || 'Новый курс',
    description: courseData.description || '',
    goal,
    duration,
    modules: (courseData.modules || []).map((mod: any, idx: number) => ({
      id: idx.toString(),
      title: mod.title || `Модуль ${idx + 1}`,
      description: mod.description || '',
      lessons: (mod.lessons || []).map((lesson: any, lessonIdx: number) => ({
        id: `${idx}-${lessonIdx}`,
        title: lesson.title || `Урок ${lessonIdx + 1}`,
        content: lesson.content || '',
        duration: lesson.duration || 30,
        completed: false
      })),
      completed: false
    })),
    assignments: (courseData.assignments || []).map((assignment: any, idx: number) => ({
      id: `assignment-${idx}`,
      moduleId: assignment.moduleId || '0',
      title: assignment.title || `Задание ${idx + 1}`,
      description: assignment.description || '',
      questions: (assignment.questions || []).map((q: any, qIdx: number) => ({
        id: `q-${idx}-${qIdx}`,
        ...q
      })),
      completed: false
    })),
    progress: 0,
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  return course;
}


export async function sendChatMessage(message: string, context?: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = context
    ? `Контекст: ${context}\n\nВопрос пользователя: ${message}\n\nОтвет (отвечай на языке вопроса пользователя):`
    : `${message}\n\n(Отвечай на языке вопроса пользователя)`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}


export async function askTutor(lessonContent: string, userQuestion: string): Promise<string> {
  const prompt = `You are an AI tutor on the CoLearn platform. A student is reading a lesson and asked a question.

LESSON CONTENT:
${lessonContent.slice(0, 3000)}

STUDENT'S QUESTION: ${userQuestion}

STRICT RULES:
1. ALWAYS respond in the SAME language as the student's question.
2. Keep your answer SHORT — maximum 3-5 sentences. Be concise and precise.
3. Give ONE clear example if needed, not multiple.
4. NEVER use any markdown: no **, no *, no ###, no bullet points, no lists. Plain text only.
5. Use simple line breaks to separate thoughts.
6. Be friendly but brief.`;

  const keys = [tutorAI, genAI, backupAI];
  for (let i = 0; i < keys.length; i++) {
    try {
      const model = keys[i].getGenerativeModel({ model: 'gemini-3-flash-preview' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      console.error(`Tutor key ${i + 1} failed:`, err);
    }
  }
  throw new Error('All API keys failed');
}

export async function checkAssignment(userAnswers: any[], questions: any[]): Promise<number> {
  let score = 0;
  questions.forEach((question, idx) => {
    if (question.correctAnswer === userAnswers[idx]) {
      score++;
    }
  });
  return Math.round((score / questions.length) * 100);
}

export async function generateDuelQuestions(topic: string, count: number = 5, lang: string = 'ru'): Promise<any[]> {
  const prompt = `Generate ${count} unique, challenging quiz questions about "${topic}" for a competitive knowledge duel.
Each question must have exactly 4 options with one correct answer.
Mix difficulty: 2 easy, 2 medium, 1 hard.

Return ONLY a JSON array:
[
  {
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "difficulty": "easy"
  }
]

IMPORTANT: "correctAnswer" must be EXACTLY one of the strings in the "options" array.
${lang === 'ru' ? 'All content MUST be in Russian.' : 'All content MUST be in English.'}
Return ONLY the JSON array, no extra text.`;

  const pools = arenaAIs.length > 0 ? arenaAIs : [genAI, tutorAI, backupAI];
  for (let i = 0; i < pools.length; i++) {
    try {
      const model = pools[i].getGenerativeModel({ model: 'gemini-3-flash-preview' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array in response');
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error(`Arena duel key ${i + 1} failed:`, err);
      if (i === pools.length - 1) throw err;
    }
  }
  throw new Error('All API keys failed for duel questions');
}

export async function generateBossResponse(
  topic: string,
  difficulty: string,
  bossName: string,
  conversationHistory: { role: string; content: string }[],
  playerMessage: string,
  lang: string = 'ru'
): Promise<{ response: string; playerDamage: number; bossDamage: number }> {
  const historyText = conversationHistory
    .slice(-6)
    .map(m => `${m.role === 'boss' ? bossName : 'Player'}: ${m.content}`)
    .join('\n');

  const prompt = `You are ${bossName}, an extremely tough examiner in a Boss Fight knowledge game.
Topic: "${topic}". Difficulty: ${difficulty}.

Your personality: You are sarcastic, demanding, and deeply knowledgeable. You challenge every answer, ask follow-up questions, and try to find gaps in knowledge. You're like a final boss in an RPG.

Conversation so far:
${historyText}

Player's latest answer: "${playerMessage}"

RULES:
1. Evaluate the player's answer quality (0-100 scale).
2. If answer is good (70+): acknowledge briefly, then ask a HARDER follow-up. Player deals damage to you.
3. If answer is weak (<70): point out the flaw aggressively, deal damage to player.
4. Keep responses SHORT (2-4 sentences max).
5. Always end with a new challenging question or statement.

Return JSON:
{
  "response": "Your response as ${bossName}",
  "playerDamage": 0-25,
  "bossDamage": 0-20
}

playerDamage = damage TO the player (when answer is bad).
bossDamage = damage TO the boss (when answer is good).

${lang === 'ru' ? 'Respond in Russian.' : 'Respond in English.'}
Return ONLY JSON.`;

  const pools = arenaAIs.length > 0 ? arenaAIs : [genAI, tutorAI, backupAI];
  for (let i = 0; i < pools.length; i++) {
    try {
      const model = pools[i].getGenerativeModel({ model: 'gemini-3-flash-preview' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error(`Boss response key ${i + 1} failed:`, err);
      if (i === pools.length - 1) throw err;
    }
  }
  throw new Error('All API keys failed');
}

export async function generateBossIntro(
  topic: string,
  difficulty: string,
  bossName: string,
  lang: string = 'ru'
): Promise<string> {
  const prompt = `You are ${bossName}, a legendary tough examiner in a Boss Fight knowledge game.
Topic: "${topic}". Difficulty: ${difficulty}.

Generate a dramatic, intimidating introduction (2-3 sentences). Then ask your first challenging question about the topic. Be theatrical and RPG-like.

${lang === 'ru' ? 'Respond in Russian.' : 'Respond in English.'}
Return plain text only, no JSON.`;

  const pools = arenaAIs.length > 0 ? arenaAIs : [genAI, tutorAI, backupAI];
  for (let i = 0; i < pools.length; i++) {
    try {
      const model = pools[i].getGenerativeModel({ model: 'gemini-3-flash-preview' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.error(`Boss intro key ${i + 1} failed:`, err);
      if (i === pools.length - 1) throw err;
    }
  }
  throw new Error('All API keys failed');
}

export async function generateHeistChallenges(topic: string, count: number = 4, lang: string = 'ru'): Promise<any[]> {
  const prompt = `Generate ${count} challenges for a "Knowledge Heist" game about "${topic}".
Mix types: quiz questions with 4 options and logic puzzles.
Each challenge should be progressively harder ("locks" to crack).

Return JSON array:
[
  {
    "type": "quiz",
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "timeLimit": 30,
    "points": 100
  }
]

timeLimit in seconds (20-60). points from 50 to 200 based on difficulty.
${lang === 'ru' ? 'All content in Russian.' : 'All content in English.'}
Return ONLY JSON array.`;

  const pools = arenaAIs.length > 0 ? arenaAIs : [genAI, tutorAI, backupAI];
  for (let i = 0; i < pools.length; i++) {
    try {
      const model = pools[i].getGenerativeModel({ model: 'gemini-3-flash-preview' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Failed to parse heist challenges');
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error(`Heist key ${i + 1} failed:`, err);
      if (i === pools.length - 1) throw err;
    }
  }
  throw new Error('All API keys failed for heist challenges');
}
