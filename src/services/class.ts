
import type { User, ClassGroup, ClassInvite } from '../types';
import { getAllUsers } from './auth';

const CLASSES_KEY = 'all_classes';
const INVITES_KEY = 'all_invites';

function getClasses(): ClassGroup[] {
    const classesStr = localStorage.getItem(CLASSES_KEY);
    if (!classesStr) return [];
    try {
        return JSON.parse(classesStr);
    } catch {
        return [];
    }
}

function saveClasses(classes: ClassGroup[]) {
    localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
}

function getInvites(): ClassInvite[] {
    const invitesStr = localStorage.getItem(INVITES_KEY);
    if (!invitesStr) return [];
    try {
        return JSON.parse(invitesStr);
    } catch {
        return [];
    }
}

function saveInvites(invites: ClassInvite[]) {
    localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
}

export function createClass(name: string, creator: User): ClassGroup {
    // Check if user is already in a class
    const existingClasses = getClasses();
    const userClass = existingClasses.find(c => c.members.includes(creator.id));
    if (userClass) {
        throw new Error('Вы уже состоите в классе');
    }

    const newClass: ClassGroup = {
        id: Date.now().toString(),
        name,
        creatorId: creator.id,
        members: [creator.id],
        createdAt: new Date().toISOString()
    };

    saveClasses([...existingClasses, newClass]);
    return newClass;
}

export function getUserClass(userId: string): ClassGroup | null {
    const classes = getClasses();
    return classes.find(c => c.members.includes(userId)) || null;
}

export function renameClass(classId: string, newName: string): void {
    const classes = getClasses();
    const classIndex = classes.findIndex(c => c.id === classId);
    if (classIndex !== -1) {
        classes[classIndex].name = newName;
        saveClasses(classes);
    }
}

export function getClassMembers(classId: string): User[] {
    const classes = getClasses();
    const currentClass = classes.find(c => c.id === classId);
    if (!currentClass) return [];

    const allUsers = getAllUsers();
    return allUsers.filter(u => currentClass.members.includes(u.id));
}

export function searchUsers(query: string, excludeUserId: string): User[] {
    const users = getAllUsers();
    return users.filter(u =>
        u.id !== excludeUserId &&
        (u.name.toLowerCase().includes(query.toLowerCase()) ||
            u.email.toLowerCase().includes(query.toLowerCase()) ||
            (u.username && u.username.toLowerCase().includes(query.toLowerCase())))
    );
}

export function inviteUserToClass(classId: string, fromUserId: string, toUserId: string): void {
    const classes = getClasses();
    const currentClass = classes.find(c => c.id === classId);

    if (!currentClass) throw new Error('Класс не найден');
    if (currentClass.members.length >= 50) throw new Error('В классе уже 50 человек');
    if (currentClass.members.includes(toUserId)) throw new Error('Пользователь уже в этом классе');

    // Check if user is already in another class? Assuming yes, they adhere to one class policy.
    const userClass = classes.find(c => c.members.includes(toUserId));
    if (userClass) throw new Error('Пользователь уже состоит в другом классе');

    const invites = getInvites();
    // Check pending invites
    if (invites.some(i => i.classId === classId && i.toUserId === toUserId && i.status === 'pending')) {
        throw new Error('Приглашение уже отправлено');
    }

    const newInvite: ClassInvite = {
        id: Date.now().toString(),
        classId,
        fromUserId,
        toUserId,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    saveInvites([...invites, newInvite]);
}

export function getIncomingInvites(userId: string): (ClassInvite & { className: string, fromUserName: string })[] {
    const invites = getInvites();
    const classes = getClasses();
    const users = getAllUsers();

    return invites
        .filter(i => i.toUserId === userId && i.status === 'pending')
        .map(invite => {
            const cls = classes.find(c => c.id === invite.classId);
            const fromUser = users.find(u => u.id === invite.fromUserId);
            return {
                ...invite,
                className: cls?.name || 'Неизвестный класс',
                fromUserName: fromUser?.name || 'Неизвестный пользователь'
            };
        });
}

export function acceptInvite(inviteId: string): void {
    const invites = getInvites();
    const inviteIndex = invites.findIndex(i => i.id === inviteId);
    if (inviteIndex === -1) throw new Error('Приглашение не найдено');

    const invite = invites[inviteIndex];

    // Verify class still exists and has space
    const classes = getClasses();
    const classIndex = classes.findIndex(c => c.id === invite.classId);
    if (classIndex === -1) {
        // Remove invalid invite
        invites.splice(inviteIndex, 1);
        saveInvites(invites);
        throw new Error('Класс больше не существует');
    }

    const currentClass = classes[classIndex];
    if (currentClass.members.length >= 50) throw new Error('В классе уже 50 человек');

    // Add user to class
    currentClass.members.push(invite.toUserId);
    classes[classIndex] = currentClass;
    saveClasses(classes);

    // Update invite status
    invite.status = 'accepted';
    invites[inviteIndex] = invite;
    saveInvites(invites); // Or delete invite? Keeping for history might be nice but let's just mark accepted.

    // Remove other pending invites for this user to other classes?
    // If user can only be in one class, we should cancel other invites or just let them fail on accept.
}

export function rejectInvite(inviteId: string): void {
    const invites = getInvites();
    const inviteIndex = invites.findIndex(i => i.id === inviteId);
    if (inviteIndex !== -1) {
        invites[inviteIndex].status = 'rejected';
        saveInvites(invites);
    }
}

export function leaveClass(userId: string): void {
    const classes = getClasses();
    const classIndex = classes.findIndex(c => c.members.includes(userId));

    if (classIndex !== -1) {
        const currentClass = classes[classIndex];
        currentClass.members = currentClass.members.filter(id => id !== userId);

        // If no members left, delete class? Or if creator leaves?
        if (currentClass.members.length === 0) {
            classes.splice(classIndex, 1);
        } else {
            // If creator leaves, assign new creator? Not critical for MVP.
            classes[classIndex] = currentClass;
        }
        saveClasses(classes);
    }
}

export function getClassMessages(classId: string): import('../types').ClassChatMessage[] {
    const key = `class_messages_${classId}`;
    const msgsStr = localStorage.getItem(key);
    if (!msgsStr) return [];
    try {
        return JSON.parse(msgsStr);
    } catch {
        return [];
    }
}

export function sendClassMessage(classId: string, user: User, content: string): import('../types').ClassChatMessage {
    const messages = getClassMessages(classId);

    const newMessage: import('../types').ClassChatMessage = {
        id: Date.now().toString(),
        classId,
        userId: user.id,
        userName: user.username || user.name,
        content,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem(`class_messages_${classId}`, JSON.stringify([...messages, newMessage]));
    return newMessage;
}
