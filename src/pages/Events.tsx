import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Gift, Sparkles, BookOpen, Zap, Star, Sun, Moon, Clock, ArrowRight, ChevronRight, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // MM-DD format
  type: 'discount' | 'lesson' | 'update' | 'special';
  icon: any;
  color: string;
}

const EVENTS: Event[] = [
  {
    id: 'new-year',
    title: 'New Year Blessing',
    description: 'Fresh start with 10 new lessons and a 2x XP weekend!',
    date: '01-01',
    type: 'special',
    icon: Sparkles,
    color: 'text-blue-500 bg-blue-50',
  },
  {
    id: 'spring-renewal',
    title: 'Spring Renewal',
    description: 'New "Growth in Faith" category launch.',
    date: '03-20',
    type: 'lesson',
    icon: Sun,
    color: 'text-primary-500 bg-primary-50',
  },
  {
    id: 'easter-special',
    title: 'Easter Celebration',
    description: 'Limited edition "Resurrection" badge and special trivia.',
    date: '04-12',
    type: 'special',
    icon: Star,
    color: 'text-purple-500 bg-purple-50',
  },
  {
    id: 'pentecost-update',
    title: 'Pentecost Update',
    description: 'Major app update with new community features.',
    date: '05-31',
    type: 'update',
    icon: Zap,
    color: 'text-orange-500 bg-orange-50',
  },
  {
    id: 'summer-camp',
    title: 'Summer Bible Camp',
    description: 'Daily challenges with massive coin rewards.',
    date: '07-15',
    type: 'special',
    icon: Moon,
    color: 'text-indigo-500 bg-indigo-50',
  },
  {
    id: 'back-to-school',
    title: 'Back to School Sale',
    description: '50% off all abilities in the shop!',
    date: '09-01',
    type: 'discount',
    icon: Gift,
    color: 'text-rose-500 bg-rose-50',
  },
  {
    id: 'harvest-fest',
    title: 'Harvest Festival',
    description: 'New "Parables of the Harvest" lesson series.',
    date: '10-31',
    type: 'lesson',
    icon: BookOpen,
    color: 'text-amber-500 bg-amber-50',
  },
  {
    id: 'christmas',
    title: 'Christmas Celebration',
    description: 'The ultimate Christmas quiz and festive profile themes.',
    date: '12-25',
    type: 'special',
    icon: Calendar,
    color: 'text-red-500 bg-red-50',
  },
];

export default function Events() {
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const newTimeLeft: { [key: string]: string } = {};

      EVENTS.forEach((event) => {
        const [month, day] = event.date.split('-').map(Number);
        let eventDate = new Date(currentYear, month - 1, day);

        // If the event has already passed this year, set it for next year
        if (now > eventDate) {
          eventDate = new Date(currentYear + 1, month - 1, day);
        }

        const difference = eventDate.getTime() - now.getTime();

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        newTimeLeft[event.id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      });

      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 pb-24 md:pb-20 px-4 sm:px-0">
      <header className="text-center space-y-4">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-500 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-primary-200 mx-auto rotate-3">
          <Calendar size={32} className="md:w-10 md:h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase font-display tracking-tight">Upcoming Events</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base max-w-md mx-auto">
            Stay tuned for seasonal specials, new content, and divine rewards.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {EVENTS.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white rounded-[2rem] border-2 border-slate-100 p-6 md:p-8 hover:border-primary-500/30 hover:shadow-xl hover:shadow-primary-500/5 transition-all relative overflow-hidden"
          >
            {/* Background Decorative Element */}
            <div className={cn(
              "absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl transition-all group-hover:opacity-20",
              event.color.split(' ')[1]
            )} />

            <div className="flex items-start gap-4 md:gap-6 relative z-10">
              <div className={cn(
                "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                event.color
              )}>
                <event.icon size={24} className="md:w-7 md:h-7" />
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                    event.type === 'discount' ? "bg-rose-100 text-rose-600" :
                    event.type === 'lesson' ? "bg-primary-100 text-primary-600" :
                    event.type === 'update' ? "bg-blue-100 text-blue-600" :
                    "bg-amber-100 text-amber-600"
                  )}>
                    {event.type}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] md:text-xs">
                    <Clock size={12} />
                    <span>Countdown</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight leading-tight">
                    {event.title}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 font-medium mt-1 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="pt-2">
                  <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Starts In</div>
                    <div className="text-xs md:text-sm font-black text-slate-700 font-mono">
                      {timeLeft[event.id] || 'Calculating...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hover Action */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Info size={12} />
                <span>Mark your calendar</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                <ChevronRight size={16} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <footer className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 space-y-4">
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase font-display">Never Miss a Blessing</h2>
          <p className="text-slate-400 font-medium text-sm md:text-base max-w-md mx-auto">
            Enable notifications to get reminded when these special events go live!
          </p>
          <button className="px-8 py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-600 transition-all active:scale-95 flex items-center justify-center gap-3 mx-auto">
            Enable Notifications
            <ArrowRight size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}
