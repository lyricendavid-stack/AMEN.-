import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, User, LogOut, BookOpen, Shrub, ShieldCheck, Bell, Zap, Coins, X, HelpCircle, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const { notifications, markAsRead, clearAll } = useNotifications();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    if (profile?.theme?.primaryColor) {
      document.documentElement.style.setProperty('--primary', profile.theme.primaryColor);
    }
  }, [profile?.theme?.primaryColor]);

  const allNavItems = [
    { id: 'home', icon: Home, label: 'Learn', path: '/' },
    { id: 'bible', icon: BookOpen, label: 'Bible', path: '/bible' },
    { id: 'events', icon: Calendar, label: 'Events', path: '/events' },
    { id: 'leaderboard', icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  const visibleTabIds = profile?.theme?.visibleTabs || ['home', 'leaderboard', 'events', 'profile'];
  const navItems = allNavItems.filter(item => visibleTabIds.includes(item.id));

  const moreItems = [
    { id: 'trivia', icon: HelpCircle, label: 'Trivia', path: '/trivia' },
    { id: 'abilities', icon: Zap, label: 'Abilities', path: '/abilities' },
  ].filter(item => visibleTabIds.includes(item.id));

  if (profile?.role === 'admin' && visibleTabIds.includes('admin')) {
    moreItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin', path: '/admin' });
  }

  const [showMore, setShowMore] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-white text-slate-900 font-sans">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 p-6 flex-col fixed h-full">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <BookOpen size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-primary font-display">AMEN.</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-bold uppercase text-sm tracking-wider",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary border-2 border-primary/20"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
          {moreItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-bold uppercase text-sm tracking-wider",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary border-2 border-primary/20"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={logout}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-bold uppercase text-sm tracking-wider"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Bottom Nav - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 flex justify-around items-center z-50">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200",
              location.pathname === item.path
                ? "text-primary"
                : "text-slate-400"
            )}
          >
            <item.icon size={20} className={cn(location.pathname === item.path && "fill-primary/10")} />
            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
        {moreItems.length > 0 && (
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 relative",
              showMore ? "text-primary" : "text-slate-400"
            )}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 bg-current rounded-full" />
                <div className="w-1 h-1 bg-current rounded-full" />
                <div className="w-1 h-1 bg-current rounded-full" />
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">More</span>
            
            <AnimatePresence>
              {showMore && (
                <>
                  <div className="fixed inset-0 z-[-1]" onClick={() => setShowMore(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute bottom-full right-0 mb-4 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-2"
                  >
                    {moreItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setShowMore(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold uppercase text-[10px] tracking-wider",
                          location.pathname === item.path
                            ? "bg-primary/10 text-primary"
                            : "text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        <item.icon size={16} />
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </button>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 md:p-8 max-w-4xl mx-auto w-full pb-24 lg:pb-8">
        {/* Header Stats */}
        <div className="flex justify-between lg:justify-end items-center gap-4 md:gap-6 mb-8 sticky top-0 bg-white/80 backdrop-blur-sm py-4 z-40 border-b border-slate-100">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <BookOpen size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary font-display">AMEN.</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-1 md:gap-2 text-orange-500 font-bold text-[10px] sm:text-sm md:text-base">
              <Shrub size={14} className="md:w-5 md:h-5" fill="currentColor" />
              <span>{profile?.streak || 0}</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2 text-yellow-500 font-bold text-[10px] sm:text-sm md:text-base">
              <Coins size={14} className="md:w-5 md:h-5" fill="currentColor" />
              <span>{profile?.coins || 0} HP</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2 text-primary font-bold text-[10px] sm:text-sm md:text-base">
              <Trophy size={14} className="md:w-5 md:h-5" fill="currentColor" />
              <span>{profile?.totalXP || 0} XP</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-slate-600 relative transition-colors"
              >
                <Bell size={18} className="md:w-5 md:h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 md:w-2.5 md:h-2.5 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Notifications</h4>
                      <button 
                        onClick={clearAll}
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm font-medium">
                          No new messages from the heavens.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group relative"
                          >
                            <div className="flex gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                n.type === 'reminder' ? "bg-orange-100 text-orange-600" :
                                n.type === 'success' ? "bg-primary/10 text-primary" :
                                "bg-blue-100 text-blue-600"
                              )}>
                                {n.type === 'reminder' ? <Shrub size={14} /> : <Bell size={14} />}
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{n.title}</p>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{n.message}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <img
              src={profile?.photoURL || 'https://picsum.photos/seed/user/100/100'}
              alt="Profile"
              className="w-8 h-8 rounded-full border-2 border-slate-200"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        </div>
        {children}
      </main>
    </div>
  );
}
