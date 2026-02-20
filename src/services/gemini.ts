import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Course } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);


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
  const prompt = `Ты — AI-репетитор на платформе CoLearn. Ученик читает урок и задал вопрос.

СОДЕРЖАНИЕ УРОКА:
${lessonContent.slice(0, 3000)}

ВОПРОС УЧЕНИКА: ${userQuestion}

Правила ответа:
1. Отвечай простым, понятным языком
2. Используй примеры из урока
3. Если вопрос про конкретный термин — объясни его другими словами
4. Будь дружелюбным и мотивирующим
5. Ответ не должен быть длиннее 300 слов
6. Отвечай на языке вопроса ученика`;

  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
  
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      console.warn(`Tutor model ${modelName} failed:`, err);
      continue;
    }
  }
  
  throw new Error('All tutor models failed');
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
