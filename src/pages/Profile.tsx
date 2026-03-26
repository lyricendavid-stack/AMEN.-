import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shrub, Trophy, Star, Calendar, Settings, Share2, Award, Shield, Zap, Sparkles, Check, ChevronRight, Info, Heart, Sword, Eye, Send, Megaphone, Crown, BookOpen } from 'lucide-react';
import { ABILITIES } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { motion, AnimatePresence } from 'motion/react';

const data = [
  { name: 'Mon', xp: 40 },
  { name: 'Tue', xp: 30 },
  { name: 'Wed', xp: 20 },
  { name: 'Thu', xp: 27 },
  { name: 'Fri', xp: 18 },
  { name: 'Sat', xp: 23 },
  { name: 'Sun', xp: 34 },
];

export default function Profile() {
  const { profile } = useAuth();
  const [donationLink, setDonationLink] = useState(profile?.donationLink || '');
  const [isUpdatingDonation, setIsUpdatingDonation] = useState(false);
  const [showDonationSuccess, setShowDonationSuccess] = useState(false);

  const [primaryColor, setPrimaryColor] = useState(profile?.theme?.primaryColor || '#3b82f6');
  const [visibleTabs, setVisibleTabs] = useState<string[]>(profile?.theme?.visibleTabs || ['home', 'leaderboard', 'events', 'profile']);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const [showThemeSuccess, setShowThemeSuccess] = useState(false);

  if (!profile) return null;

  const handleUpdateDonation = async () => {
    if (!profile.uid) return;
    setIsUpdatingDonation(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        donationLink
      });
      setShowDonationSuccess(true);
      setTimeout(() => setShowDonationSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setIsUpdatingDonation(false);
    }
  };

  const handleUpdateTheme = async () => {
    if (!profile.uid) return;
    setIsUpdatingTheme(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        theme: {
          primaryColor,
          visibleTabs
        }
      });
      // Apply color immediately
      document.documentElement.style.setProperty('--primary', primaryColor);
      setShowThemeSuccess(true);
      setTimeout(() => setShowThemeSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setIsUpdatingTheme(false);
    }
  };

  const toggleTab = (tabId: string) => {
    setVisibleTabs(prev => 
      prev.includes(tabId) 
        ? prev.filter(id => id !== tabId)
        : [...prev, tabId]
    );
  };

  const PRESET_COLORS = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Slate', value: '#475569' },
  ];

  const AVAILABLE_TABS = [
    { id: 'home', label: 'Home', icon: Shrub },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: Settings },
    { id: 'shop', label: 'Shop', icon: Sparkles },
    { id: 'admin', label: 'Admin', icon: Shield },
  ];

  const RANKS = [
    { name: 'Seeker', icon: Sparkles, color: 'text-slate-400 bg-slate-50' },
    { name: 'Believer', icon: Star, color: 'text-primary-400 bg-primary-50' },
    { name: 'Disciple', icon: BookOpen, color: 'text-blue-400 bg-blue-50' },
    { name: 'Witness', icon: Zap, color: 'text-yellow-400 bg-yellow-50' },
    { name: 'Servant', icon: Heart, color: 'text-rose-400 bg-rose-50' },
    { name: 'Steward', icon: Shield, color: 'text-indigo-400 bg-indigo-50' },
    { name: 'Warrior', icon: Sword, color: 'text-red-400 bg-red-50' },
    { name: 'Watchman', icon: Eye, color: 'text-cyan-400 bg-cyan-50' },
    { name: 'Messenger', icon: Send, color: 'text-sky-400 bg-sky-50' },
    { name: 'Evangelist', icon: Megaphone, color: 'text-orange-400 bg-orange-50' },
    { name: 'Apostle', icon: Crown, color: 'text-purple-400 bg-purple-50' },
    { name: 'Overcomer', icon: Trophy, color: 'text-amber-400 bg-amber-50' },
  ];

  const getRankInfo = (level: number) => {
    const totalSteps = level - 1;
    const rankIndex = Math.min(Math.floor(totalSteps / 3), RANKS.length - 1);
    const subRankIndex = (totalSteps % 3);
    const subRanks = ['I', 'II', 'III'];
    
    return {
      ...RANKS[rankIndex],
      subRank: subRanks[subRankIndex],
      progress: ((subRankIndex + 1) / 3) * 100
    };
  };

  const currentRank = getRankInfo(profile.level || 1);

  const badges = [
    { id: 'streak-3', icon: Shrub, label: '3 Day Streak', unlocked: (profile.streak || 0) >= 3, color: 'text-orange-500 bg-orange-50' },
    { id: 'xp-500', icon: Star, label: '500 XP Club', unlocked: (profile.totalXP || 0) >= 500, color: 'text-blue-500 bg-blue-50' },
    { id: 'first-lesson', icon: Award, label: 'First Lesson', unlocked: (profile.totalXP || 0) > 0, color: 'text-primary-500 bg-primary-50' },
    { id: 'level-5', icon: Shield, label: 'Level 5', unlocked: (profile.level || 0) >= 5, color: 'text-purple-500 bg-purple-50' },
    { id: 'speed-demon', icon: Zap, label: 'Speed Demon', unlocked: false, color: 'text-yellow-500 bg-yellow-50' },
  ];

  const handleShareBadge = async (badge: any) => {
    const text = `I just unlocked the "${badge.label}" badge on AMEN.! 🏆✨ #AMEN #BibleStudy`;
    const url = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AMEN. Badge Unlocked',
          text: text,
          url: url,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-20 px-4 sm:px-0">
      <header className="flex flex-col md:flex-row items-center md:justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
          <img
            src={profile.photoURL || 'https://picsum.photos/seed/user/200/200'}
            alt={profile.displayName}
            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl border-4 border-primary-500/20 shadow-xl"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-1">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase font-display">{profile.displayName}</h1>
              <div className="px-3 py-1 bg-blue-500 text-white text-[10px] md:text-xs font-black rounded-full shadow-lg shadow-blue-100">
                LVL {profile.level || 1}
              </div>
            </div>
            <p className="text-slate-500 font-medium text-sm md:text-base">Joined {new Date(profile.lastActive).toLocaleDateString()}</p>
          </div>
        </div>
        <button className="p-3 rounded-xl md:rounded-2xl border-2 border-slate-200 text-slate-400 hover:bg-slate-50 transition-all">
          <Settings size={20} className="md:w-6 md:h-6" />
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-100 space-y-1 md:space-y-2">
          <div className="flex items-center gap-2 text-orange-500 font-black uppercase tracking-widest text-[10px] md:text-xs">
            <Shrub size={14} className="md:w-4 md:h-4" fill="currentColor" />
            Streak
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-800">{profile.streak} Days</div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-100 space-y-1 md:space-y-2">
          <div className="flex items-center gap-2 text-primary-500 font-black uppercase tracking-widest text-[10px] md:text-xs">
            <Trophy size={14} className="md:w-4 md:h-4" fill="currentColor" />
            Total XP
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-800">{profile.totalXP}</div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-100 space-y-1 md:space-y-2">
          <div className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-widest text-[10px] md:text-xs">
            <Star size={14} className="md:w-4 md:h-4" fill="currentColor" />
            Level
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-800">{profile.level}</div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-100 space-y-4 md:space-y-6">
        <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase font-display">Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                "flex flex-col items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all group relative",
                badge.unlocked ? "border-slate-100 bg-white" : "border-slate-50 bg-slate-50 opacity-40 grayscale"
              )}
            >
              <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center", badge.color)}>
                <badge.icon size={20} className="md:w-6 md:h-6" />
              </div>
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-center text-slate-600 leading-tight">
                {badge.label}
              </span>
              {badge.unlocked && (
                <button
                  onClick={() => handleShareBadge(badge)}
                  className="absolute top-1.5 right-1.5 p-1 text-slate-300 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Share2 size={12} className="md:w-3.5 md:h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* App Customization */}
      <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-100 space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase font-display">App Customization</h2>
          <div className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100">
            Personalize
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Color Picker */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <div className="w-2 h-6 bg-primary-500 rounded-full" />
              Primary Color
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setPrimaryColor(color.value)}
                  className={cn(
                    "w-full aspect-square rounded-xl md:rounded-2xl border-4 transition-all relative overflow-hidden",
                    primaryColor === color.value ? "border-slate-900 scale-105" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: color.value }}
                >
                  {primaryColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <Check size={20} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-100"
              />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Custom Hex: {primaryColor}</span>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <div className="w-2 h-6 bg-blue-500 rounded-full" />
              Navigation Tabs
            </h3>
            <p className="text-[10px] md:text-xs text-slate-400 font-medium leading-relaxed">
              Choose which tabs appear in your navigation bar. (Min 2, Max 5)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_TABS.map((tab) => {
                const isVisible = visibleTabs.includes(tab.id);
                const isDisabled = isVisible && visibleTabs.length <= 2;
                const isMaxed = !isVisible && visibleTabs.length >= 5;

                return (
                  <button
                    key={tab.id}
                    onClick={() => !isDisabled && !isMaxed && toggleTab(tab.id)}
                    disabled={isDisabled || isMaxed}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                      isVisible 
                        ? "border-slate-900 bg-slate-900 text-white" 
                        : "border-slate-100 bg-white text-slate-400 hover:border-slate-200",
                      (isDisabled || isMaxed) && !isVisible && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <tab.icon size={16} />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-slate-50">
          <button
            onClick={handleUpdateTheme}
            disabled={isUpdatingTheme}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpdatingTheme ? 'Saving...' : showThemeSuccess ? <><Check size={18} /> Settings Saved</> : 'Save Customization'}
          </button>
        </div>
      </div>

      {/* Donation Settings */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-100 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase font-display">Creator Settings</h2>
          <div className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest border border-rose-100">
            Creator Support
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
            Add a link to your PayPal, Buy Me a Coffee, or other donation platform. This will be displayed on your community lessons.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="url"
              value={donationLink}
              onChange={(e) => setDonationLink(e.target.value)}
              placeholder="https://paypal.me/yourusername"
              className="flex-1 p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold text-sm"
            />
            <button
              onClick={handleUpdateDonation}
              disabled={isUpdatingDonation}
              className="px-8 py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdatingDonation ? 'Saving...' : showDonationSuccess ? <><Check size={18} /> Saved</> : 'Save Link'}
            </button>
          </div>
        </div>
      </div>

      {/* Owned Abilities */}
      <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-100 space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase font-display">Owned Abilities</h2>
          <div className="px-2.5 py-1 bg-yellow-50 text-yellow-600 text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest border border-yellow-100">
            {profile.abilities?.length || 0} Active
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {profile.abilities?.length ? (
            profile.abilities.map((abilityId: string) => {
              const ability = ABILITIES.find(a => a.id === abilityId);
              if (!ability) return null;
              return (
                <div key={abilityId} className="p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-slate-50 bg-slate-50/50 flex items-center gap-3 md:gap-4">
                  <div className={cn("w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shadow-sm shrink-0", ability.color)}>
                    <ability.icon size={18} className="md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 text-xs md:text-sm truncate">{ability.name}</div>
                    <div className="text-[8px] md:text-[10px] text-slate-500 font-medium uppercase tracking-wider">Active</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-6 md:py-8 text-center space-y-2">
              <Sparkles className="mx-auto text-slate-200 md:w-8 md:h-8" size={28} />
              <p className="text-slate-400 text-xs md:text-sm font-medium">No abilities unlocked yet. Visit the shop!</p>
            </div>
          )}
        </div>
      </div>

      {/* Spiritual Ranks Section */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-100 space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="space-y-0.5 md:space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase font-display">Faith Journey</h2>
            <p className="text-slate-400 text-xs md:text-sm font-medium italic">Your spiritual progression through the Word</p>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 rounded-xl text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
            Rank {Math.floor(((profile.level || 1) - 1) / 3) + 1} of 12
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-8 bg-slate-50/50 rounded-[1.5rem] md:rounded-[2rem] border-2 border-slate-50">
          <div className={cn("w-24 h-24 md:w-32 md:h-32 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center shadow-2xl relative shrink-0", currentRank.color)}>
            <currentRank.icon size={48} className="md:w-16 md:h-16" />
            <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl shadow-lg flex items-center justify-center text-lg md:text-xl font-black text-slate-800 border-2 md:border-4 border-slate-50">
              {currentRank.subRank}
            </div>
          </div>
          
          <div className="flex-1 space-y-3 md:space-y-4 w-full text-center md:text-left">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">{currentRank.name} {currentRank.subRank}</h3>
              <p className="text-slate-500 font-medium text-sm md:text-base">Keep learning to reach the next tier of your journey.</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Rank Progress</span>
                <span>{Math.round(currentRank.progress)}%</span>
              </div>
              <div className="h-3 md:h-4 bg-slate-200 rounded-full overflow-hidden p-0.5 md:p-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${currentRank.progress}%` }}
                  className="h-full bg-primary-500 rounded-full shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
          {RANKS.map((rank, index) => {
            const isUnlocked = (profile.level || 1) > (index * 3);
            const isCurrent = Math.floor(((profile.level || 1) - 1) / 3) === index;
            
            return (
              <div 
                key={rank.name}
                className={cn(
                  "flex flex-col items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all",
                  isCurrent ? "border-primary-500 bg-primary-50/30 scale-105 shadow-lg shadow-primary-100" :
                  isUnlocked ? "border-slate-100 bg-white" : "border-slate-50 bg-slate-50 opacity-30 grayscale"
                )}
              >
                <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center", rank.color)}>
                  <rank.icon size={16} className="md:w-5 md:h-5" />
                </div>
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-600 text-center leading-tight">
                  {rank.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-100 space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase font-display">Activity</h2>
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-400">
            <Calendar size={12} className="md:w-3.5 md:h-3.5" />
            Last 7 Days
          </div>
        </div>
        <div className="h-48 md:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary, #3b82f6)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="var(--primary, #3b82f6)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                itemStyle={{color: 'var(--primary, #3b82f6)', fontWeight: 'bold'}}
              />
              <Area type="monotone" dataKey="xp" stroke="var(--primary, #3b82f6)" strokeWidth={2} md:strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
