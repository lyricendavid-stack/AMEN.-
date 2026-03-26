import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Shield, Sparkles, Eye, Coins, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotifications } from '../contexts/NotificationContext';
import { ABILITIES } from '../constants';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

interface Ability {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: any;
  color: string;
}

export default function AbilitiesPage() {
  const { profile } = useAuth();
  const { addNotification } = useNotifications();
  const [buying, setBuying] = useState<string | null>(null);

  const handleBuy = async (ability: Ability) => {
    if (!profile) return;
    if ((profile.coins || 0) < ability.cost) {
      addNotification(
        "Insufficient Points 🪙",
        "Not enough Heavenly Points! Keep studying to earn more.",
        'error'
      );
      return;
    }

    setBuying(ability.id);
    try {
      const userRef = doc(db, 'users', profile.uid);
      
      if (ability.id === 'manna-instant') {
        await updateDoc(userRef, {
          coins: increment(-ability.cost),
          totalXP: increment(100),
          level: Math.floor(((profile.totalXP || 0) + 100) / 100) + 1
        });
      } else {
        await updateDoc(userRef, {
          coins: increment(-ability.cost),
          abilities: arrayUnion(ability.id)
        });
      }

      await addNotification(
        "Ability Unlocked! ✨",
        `You've acquired ${ability.name}. Use it wisely!`,
        'success'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${profile.uid}`);
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="space-y-8 md:space-y-10 pb-24 md:pb-20 px-4 sm:px-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase font-display tracking-tight">Divine Shop</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Unlock special abilities with your Heavenly Points</p>
        </div>
        <div className="flex items-center justify-center gap-3 bg-yellow-50 px-5 py-3 md:px-6 md:py-3 rounded-[1.5rem] md:rounded-[2rem] border-2 border-yellow-200 shadow-sm">
          <Coins className="text-yellow-500 w-5 h-5 md:w-6 md:h-6" />
          <span className="text-xl md:text-2xl font-black text-yellow-700">{profile?.coins || 0}</span>
          <span className="text-[10px] md:text-xs font-black text-yellow-600 uppercase tracking-widest">Heavenly Points</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {ABILITIES.map((ability) => {
          const isOwned = profile?.abilities?.includes(ability.id);
          const canAfford = (profile?.coins || 0) >= ability.cost;

          return (
            <motion.div
              key={ability.id}
              whileHover={{ y: -5 }}
              className={cn(
                "bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all relative overflow-hidden group",
                isOwned ? "border-primary-100 bg-primary-50/30" : "border-slate-100 hover:border-slate-200"
              )}
            >
              <div className={cn(
                "w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-white mb-5 md:mb-6 shadow-lg",
                ability.color
              )}>
                <ability.icon size={28} className="md:w-8 md:h-8" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase font-display">{ability.name}</h3>
                  {isOwned && (
                    <div className="flex items-center gap-1 text-primary-600 bg-primary-100 px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shrink-0">
                      <CheckCircle2 size={10} className="md:w-3 md:h-3" /> Owned
                    </div>
                  )}
                </div>
                <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">{ability.description}</p>
              </div>

              <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins size={16} className="md:w-4.5 md:h-4.5 text-yellow-500" />
                  <span className="text-lg md:text-xl font-black text-slate-700">{ability.cost}</span>
                </div>
                
                <button
                  disabled={isOwned || !canAfford || buying === ability.id}
                  onClick={() => handleBuy(ability)}
                  className={cn(
                    "px-6 py-2.5 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm transition-all active:scale-95 shadow-lg",
                    isOwned 
                      ? "bg-slate-100 text-slate-400 cursor-default shadow-none" 
                      : !canAfford 
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                        : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
                  )}
                >
                  {buying === ability.id ? 'Processing...' : isOwned ? 'Unlocked' : 'Acquire'}
                </button>
              </div>

              {!canAfford && !isOwned && (
                <div className="absolute top-4 right-4 text-slate-300">
                  <Lock size={18} className="md:w-5 md:h-5" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-white relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-48 h-48 md:w-64 md:h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-5 md:space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-yellow-400 md:w-6 md:h-6" size={20} />
            <h2 className="text-xl md:text-2xl font-black uppercase font-display tracking-wider">How to earn points?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1 md:space-y-2">
              <div className="text-yellow-400 font-black text-lg md:text-xl">+10</div>
              <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Per Lesson</p>
            </div>
            <div className="space-y-1 md:space-y-2">
              <div className="text-yellow-400 font-black text-lg md:text-xl">+50</div>
              <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Level Up</p>
            </div>
            <div className="space-y-1 md:space-y-2">
              <div className="text-yellow-400 font-black text-lg md:text-xl">+25</div>
              <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Daily Streak</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
