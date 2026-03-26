import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'reminder';
  createdAt: any;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (title: string, message: string, type?: Notification['type']) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const FUNNY_REMINDERS = [
  "Moses didn't wander for 40 years just for you to skip your lesson today. 🏜️",
  "Don't let the devil win, read your Bible! 📖🔥",
  "Your streak is looking lonelier than Noah before the rain. 🌧️🚢",
  "Even the walls of Jericho fell faster than your motivation today. 🧱🎺",
  "A lesson a day keeps the locusts away! 🦗🌾",
  "You've got more potential than a mustard seed. Let's grow! 🌱✨",
  "Don't be like Jonah, don't run away from your studies! 🐋🌊",
  "The burning bush is waiting... and it's not for a BBQ. 🔥🌳",
  "Goliath was big, but your procrastination is bigger. Grab your sling! 🪨🎯",
  "Even the ants are studying harder than you right now. 🐜📖"
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!profile?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    // Random funny reminder every 30 minutes if the user is active
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every check
        const randomReminder = FUNNY_REMINDERS[Math.floor(Math.random() * FUNNY_REMINDERS.length)];
        addNotification("Spiritual Nudge", randomReminder, 'reminder');
      }
    }, 1000 * 60 * 30);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [profile?.uid]);

  const addNotification = async (title: string, message: string, type: Notification['type'] = 'info') => {
    if (!profile?.uid) return;
    await addDoc(collection(db, 'notifications'), {
      userId: profile.uid,
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp()
    });
  };

  const markAsRead = async (id: string) => {
    await deleteDoc(doc(db, 'notifications', id)); // For simplicity, we just delete or we could update read: true
  };

  const clearAll = async () => {
    for (const n of notifications) {
      await deleteDoc(doc(db, 'notifications', n.id));
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
