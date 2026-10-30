import type { AppNotification } from '@/types';
import { db } from '@/lib/mock/db';
import { request, write } from './api';

export async function listNotifications(): Promise<AppNotification[]> {
  return request(() => [...db.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function markRead(id: string) {
  return write(() => {
    const item = db.notifications.find((n) => n.id === id);
    if (item) item.read = true;
    return item;
  });
}

export async function markAllRead() {
  return write(() => {
    db.notifications.forEach((n) => {
      n.read = true;
    });
    return db.notifications;
  });
}

export async function unreadCount() {
  return request(() => db.notifications.filter((n) => !n.read).length, 20);
}
