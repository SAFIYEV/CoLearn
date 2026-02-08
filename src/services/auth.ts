import type { User } from '../types';

const STORAGE_KEY = 'learning_platform_user';


export function register(email: string, password: string, name: string, username: string): User {
    const existingUsers = getAllUsers();

    if (existingUsers.find(u => u.email === email)) {
        throw new Error('Пользователь с таким email уже существует');
    }

    if (existingUsers.find(u => u.username === username)) {
        throw new Error('Пользователь с таким username уже существует');
    }

    const user: User = {
        id: Date.now().toString(),
        email,
        name,
        username,
        createdAt: new Date().toISOString()
    };

    // Сохраняем пользователя
    const users = [...existingUsers, user];
    localStorage.setItem('all_users', JSON.stringify(users));

    // Сохраняем пароль (в реальном проекте нужно хешировать!)
    localStorage.setItem(`password_${user.id}`, password);

    // Логиним пользователя
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

    return user;
}


export function login(email: string, password: string): User {
    const users = getAllUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        throw new Error('Пользователь не найден');
    }

    const storedPassword = localStorage.getItem(`password_${user.id}`);
    if (storedPassword !== password) {
        throw new Error('Неверный пароль');
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
}

export function logout(): void {
    localStorage.removeItem(STORAGE_KEY);
}


export function getCurrentUser(): User | null {
    const userStr = localStorage.getItem(STORAGE_KEY);
    if (!userStr) return null;

    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}


export function updateProfile(updates: Partial<User>): User {
    const user = getCurrentUser();
    if (!user) throw new Error('Пользователь не авторизован');

    const updatedUser = { ...user, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

    // Обновляем в списке всех пользователей
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('all_users', JSON.stringify(users));
    }

    return updatedUser;
}


export function getAllUsers(): User[] {
    const usersStr = localStorage.getItem('all_users');
    if (!usersStr) return [];

    try {
        return JSON.parse(usersStr);
    } catch {
        return [];
    }
}
