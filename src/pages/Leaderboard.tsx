import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Shrub, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  totalXP: number;
  streak: number;
  level: number;
}

export default function Leaderboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);

  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;

    const q = query(collection(db, 'users'), orderBy('totalXP', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return unsubscribe;
  }, [profile]);

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-20 px-4 sm:px-0">
      <header className="text-center space-y-3 md:space-y-4">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase font-display">Leaderboard</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">See how you rank among fellow travelers.</p>
      </header>

      <div className="bg-white rounded-2xl md:rounded-3xl border-2 border-slate-100 overflow-hidden shadow-xl shadow-slate-100">
        {users.map((user, index) => (
          <div
            key={user.uid}
            className={cn(
              "flex items-center gap-3 md:gap-4 p-4 md:p-6 transition-all hover:bg-slate-50 border-b border-slate-50 last:border-0",
              index === 0 && "bg-primary-50/50"
            )}
          >
            <div className={cn(
              "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-base md:text-lg shrink-0",
              index === 0 ? "bg-primary-500 text-white" : 
              index === 1 ? "bg-slate-400 text-white" : 
              index === 2 ? "bg-orange-400 text-white" : 
              "text-slate-400"
            )}>
              {index + 1}
            </div>
            
            <img
              src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`}
              alt={user.displayName}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-slate-200 shrink-0"
              referrerPolicy="no-referrer"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-bold text-slate-800 text-sm md:text-base truncate">{user.displayName}</div>
                <div className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] md:text-[10px] font-black rounded-full border border-blue-100 shrink-0">
                  LVL {user.level || 1}
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <Shrub size={10} fill="currentColor" className="md:w-3 md:h-3 text-orange-500" />
                  {user.streak}d
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-primary-600 font-black text-sm md:text-base">
                <Star size={14} className="md:w-4 md:h-4" fill="currentColor" />
                <span>{user.totalXP}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
