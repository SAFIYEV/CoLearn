import type { Course, ChatMessage } from '../types';

const CHAT_KEY = 'chat_history';


export function saveCourse(course: Course, userId: string): void {
    const courses = getCourses(userId);
    const existingIndex = courses.findIndex(c => c.id === course.id);

    if (existingIndex !== -1) {
        courses[existingIndex] = course;
    } else {
        courses.push(course);
    }

    localStorage.setItem(`user_courses_${userId}`, JSON.stringify(courses));
}

export function getCourses(userId: string): Course[] {
    const coursesStr = localStorage.getItem(`user_courses_${userId}`);
    if (!coursesStr) return [];

    try {
        return JSON.parse(coursesStr);
    } catch {
        return [];
    }
}

export function getCourse(id: string, userId: string): Course | null {
    const courses = getCourses(userId);
    return courses.find(c => c.id === id) || null;
}

export function deleteCourse(id: string, userId: string): void {
    const courses = getCourses(userId).filter(c => c.id !== id);
    localStorage.setItem(`user_courses_${userId}`, JSON.stringify(courses));
}

export function updateCourseProgress(courseId: string, userId: string): void {
    const course = getCourse(courseId, userId);
    if (!course) return;

    const totalLessons = course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
    const completedLessons = course.modules.reduce(
        (sum, mod) => sum + mod.lessons.filter(l => l.completed).length,
        0
    );

    course.progress = Math.round((completedLessons / totalLessons) * 100);

    course.modules.forEach(mod => {
        mod.completed = mod.lessons.every(l => l.completed);
    });

    if (course.progress === 100) {
        course.status = 'completed';
    }

    saveCourse(course, userId);
}


export function saveChatMessage(message: ChatMessage): void {
    const messages = getChatHistory();
    messages.push(message);
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
}

export function getChatHistory(): ChatMessage[] {
    const messagesStr = localStorage.getItem(CHAT_KEY);
    if (!messagesStr) return [];

    try {
        return JSON.parse(messagesStr);
    } catch {
        return [];
    }
}

export function clearChatHistory(): void {
    localStorage.setItem(CHAT_KEY, JSON.stringify([]));
}
