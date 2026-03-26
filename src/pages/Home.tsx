import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, writeBatch, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Lock, Star, Play, Trophy, Zap, Calendar, Sun, Moon, Sunrise, BookOpen, ArrowRight, X, Brain, Shrub, Gift } from 'lucide-react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

interface Lesson {
  id: string;
  title: string;
  description: string;
  category: string;
  order: number;
  xpReward: number;
  isOfficial?: boolean;
  averageRating?: number;
  ratingCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  visits?: number;
  likes?: number;
  authorId?: string;
  authorName?: string;
  authorDonationLink?: string;
}

export default function Home() {
  const [officialLessons, setOfficialLessons] = useState<Lesson[]>([]);
  const [communityLessons, setCommunityLessons] = useState<Lesson[]>([]);
  const [sortBy, setSortBy] = useState<'trending' | 'visits' | 'likes' | 'stars'>('trending');
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [showGreeting, setShowGreeting] = useState(false);
  const { profile } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Daily Challenge Logic
  const today = new Date().toISOString().split('T')[0];
  const categories = ['Bible Basics', 'Parables', 'The Apostles', 'Christian Living'];
  const dailyCategory = categories[new Date().getDate() % categories.length];
  const dailyBonus = 25;

  const completedToday = Object.values(progress).filter((p: any) => p.lastAttempt?.startsWith(today)).length;
  const isDailyDone = Object.values(progress).some((p: any) => 
    p.lastAttempt?.startsWith(today) && 
    officialLessons.find(l => l.id === p.lessonId)?.category === dailyCategory
  );

  useEffect(() => {
    if (!profile?.uid) return;

    const q = query(collection(db, 'lessons'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
      setOfficialLessons(all.filter(l => l.isOfficial !== false));
      setCommunityLessons(all.filter(l => l.isOfficial === false));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'lessons');
    });

    const progressQuery = query(collection(db, 'progress'), where('userId', '==', profile.uid));
    const progressUnsubscribe = onSnapshot(progressQuery, (snapshot) => {
      const p: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        p[doc.data().lessonId] = doc.data();
      });
      setProgress(p);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'progress');
    });

    // Show greeting if not shown today
    const lastGreeting = localStorage.getItem(`greeting_${today}_${profile?.uid}`);
    if (!lastGreeting) {
      setTimeout(() => setShowGreeting(true), 1000);
    }

    return () => {
      unsubscribe();
      progressUnsubscribe();
    };
  }, [profile]);

  // Notify on daily challenge completion
  useEffect(() => {
    if (isDailyDone) {
      const lastNotified = localStorage.getItem(`daily_challenge_${today}_${profile?.uid}`);
      if (!lastNotified) {
        addNotification(
          "Daily Challenge Complete! 🏆",
          `You've mastered the ${dailyCategory} category today! +${dailyBonus} XP earned.`,
          'success'
        );
        localStorage.setItem(`daily_challenge_${today}_${profile?.uid}`, 'true');
      }
    }
  }, [isDailyDone, today, profile?.uid, dailyCategory, dailyBonus, addNotification]);

  // Notify on daily goal completion
  useEffect(() => {
    if (completedToday >= 3) {
      const lastNotified = localStorage.getItem(`daily_goal_${today}_${profile?.uid}`);
      if (!lastNotified) {
        addNotification(
          "Daily Goal Reached! 🌟",
          "You've completed 3 lessons today. Your streak is safe and sound!",
          'success'
        );
        localStorage.setItem(`daily_goal_${today}_${profile?.uid}`, 'true');
      }
    }
  }, [completedToday, today, profile?.uid, addNotification]);

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const seedData = async () => {
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      const initialLessons = [
        { id: 'bible-basics-1', title: 'The Creation', description: 'Learn about the seven days of creation.', category: 'Bible Basics', order: 1, xpReward: 50 },
        { id: 'bible-basics-2', title: 'Noah\'s Ark', description: 'The story of the great flood and God\'s promise.', category: 'Bible Basics', order: 2, xpReward: 50 },
        { id: 'parables-1', title: 'The Good Samaritan', description: 'Who is our neighbor?', category: 'Parables', order: 3, xpReward: 75 },
        { id: 'parables-2', title: 'The Prodigal Son', description: 'God\'s unconditional love and forgiveness.', category: 'Parables', order: 4, xpReward: 75 },
        { id: 'apostles-1', title: 'Peter the Rock', description: 'The fisherman who became a leader.', category: 'The Apostles', order: 5, xpReward: 100 },
      ];

      initialLessons.forEach(l => {
        const ref = doc(db, 'lessons', l.id);
        batch.set(ref, l);
      });

      // Add some quizzes
      const quizzes = [
        // Creation
        { id: 'q1', lessonId: 'bible-basics-1', question: 'What did God create on the first day?', options: ['Animals', 'Light', 'Plants', 'Humans'], correctAnswer: 'Light', explanation: 'Genesis 1:3 says "And God said, Let there be light: and there was light."' },
        { id: 'q2', lessonId: 'bible-basics-1', question: 'On which day did God rest?', options: ['5th', '6th', '7th', '1st'], correctAnswer: '7th', explanation: 'God blessed the seventh day and sanctified it because he rested from all his work.' },
        { id: 'q3', lessonId: 'bible-basics-1', question: 'What did God create on the sixth day?', options: ['Sun and Moon', 'Birds and Fish', 'Land animals and Humans', 'Stars'], correctAnswer: 'Land animals and Humans', explanation: 'Genesis 1:24-31 describes the creation of land animals and humans on the sixth day.' },
        { id: 'q4', lessonId: 'bible-basics-1', question: 'How many days did it take for God to complete creation?', options: ['6', '7', '40', '12'], correctAnswer: '6', explanation: 'God created everything in six days and rested on the seventh.' },
        
        // Noah's Ark
        { id: 'n1', lessonId: 'bible-basics-2', question: 'How many of each clean animal did Noah take on the ark?', options: ['2', '7', '12', '1'], correctAnswer: '7', explanation: 'Genesis 7:2 specifies seven pairs of every clean animal.' },
        { id: 'n2', lessonId: 'bible-basics-2', question: 'What bird did Noah first send out to see if the water had receded?', options: ['Dove', 'Raven', 'Eagle', 'Sparrow'], correctAnswer: 'Raven', explanation: 'Genesis 8:7 says he first sent out a raven.' },
        { id: 'n3', lessonId: 'bible-basics-2', question: 'What was the sign of God\'s promise never to flood the earth again?', options: ['A Dove', 'An Olive Branch', 'A Rainbow', 'A Cloud'], correctAnswer: 'A Rainbow', explanation: 'Genesis 9:13 says "I do set my bow in the cloud, and it shall be for a token of a covenant between me and the earth."' },
        
        // Good Samaritan
        { id: 's1', lessonId: 'parables-1', question: 'In the parable, who was the first person to pass by the injured man?', options: ['A Priest', 'A Levite', 'A Samaritan', 'A Soldier'], correctAnswer: 'A Priest', explanation: 'Luke 10:31 says a certain priest came down that way.' },
        { id: 's2', lessonId: 'parables-1', question: 'Where was the man traveling to when he was attacked?', options: ['Jerusalem to Jericho', 'Jericho to Jerusalem', 'Nazareth to Bethlehem', 'Rome to Athens'], correctAnswer: 'Jerusalem to Jericho', explanation: 'Luke 10:30 says "A certain man went down from Jerusalem to Jericho."' },
        { id: 's3', lessonId: 'parables-1', question: 'What did the Samaritan use to treat the man\'s wounds?', options: ['Water and Bread', 'Oil and Wine', 'Honey and Salt', 'Milk and Herbs'], correctAnswer: 'Oil and Wine', explanation: 'Luke 10:34 says he poured in oil and wine.' },
        
        // Prodigal Son
        { id: 'p1', lessonId: 'parables-2', question: 'What did the younger son ask his father for?', options: ['A Blessing', 'His Inheritance', 'A New House', 'A Party'], correctAnswer: 'His Inheritance', explanation: 'Luke 15:12 says he asked for the portion of goods that falleth to him.' },
        { id: 'p2', lessonId: 'parables-2', question: 'What job did the son take when he ran out of money?', options: ['Shepherd', 'Carpenter', 'Feeding Pigs', 'Tax Collector'], correctAnswer: 'Feeding Pigs', explanation: 'Luke 15:15 says he was sent into the fields to feed swine.' },
        { id: 'p3', lessonId: 'parables-2', question: 'How did the father react when he saw his son returning?', options: ['He was angry', 'He ignored him', 'He ran and embraced him', 'He questioned him'], correctAnswer: 'He ran and embraced him', explanation: 'Luke 15:20 says his father saw him, had compassion, and ran, and fell on his neck, and kissed him.' },
        
        // Peter the Rock
        { id: 'a1', lessonId: 'apostles-1', question: 'What was Peter\'s occupation before following Jesus?', options: ['Tax Collector', 'Tent Maker', 'Fisherman', 'Physician'], correctAnswer: 'Fisherman', explanation: 'Matthew 4:18 says he was casting a net into the sea: for they were fishers.' },
        { id: 'a2', lessonId: 'apostles-1', question: 'How many times did Peter deny Jesus?', options: ['1', '2', '3', '7'], correctAnswer: '3', explanation: 'Jesus predicted and Peter fulfilled the denial three times before the cock crew.' },
        { id: 'a3', lessonId: 'apostles-1', question: 'What was Peter\'s name before Jesus changed it?', options: ['Paul', 'Simon', 'Andrew', 'John'], correctAnswer: 'Simon', explanation: 'John 1:42 says "Thou art Simon the son of Jona: thou shalt be called Cephas, which is by interpretation, A stone."' },
      ];

      quizzes.forEach(q => {
        const ref = doc(db, 'lessons', q.lessonId, 'quizzes', q.id);
        batch.set(ref, q);
      });

      await batch.commit();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (error) {
      console.error('Error seeding data:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: Sunrise, color: 'text-orange-500' };
    if (hour < 18) return { text: 'Good Afternoon', icon: Sun, color: 'text-yellow-500' };
    return { text: 'Good Evening', icon: Moon, color: 'text-indigo-500' };
  };

  const greeting = getGreeting();

  const sortedCommunityLessons = useMemo(() => {
    return [...communityLessons].sort((a, b) => {
      if (sortBy === 'trending') {
        const scoreA = (a.visits || 0) * 0.3 + (a.likes || 0) * 0.7;
        const scoreB = (b.visits || 0) * 0.3 + (b.likes || 0) * 0.7;
        return scoreB - scoreA;
      }
      if (sortBy === 'visits') return (b.visits || 0) - (a.visits || 0);
      if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
      if (sortBy === 'stars') return (b.averageRating || 0) - (a.averageRating || 0);
      return 0;
    });
  }, [communityLessons, sortBy]);

  const morningVerse = useMemo(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const verses = [
      { text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", ref: "John 3:16" },
      { text: "The LORD is my shepherd; I shall not want.", ref: "Psalm 23:1" },
      { text: "I can do all things through Christ which strengtheneth me.", ref: "Philippians 4:13" },
      { text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", ref: "Proverbs 3:5" },
      { text: "In all thy ways acknowledge him, and he shall direct thy paths.", ref: "Proverbs 3:6" },
      { text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.", ref: "Romans 8:28" },
      { text: "Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee.", ref: "Deuteronomy 31:6" },
      { text: "The name of the LORD is a strong tower: the righteous runneth into it, and is safe.", ref: "Proverbs 18:10" },
      { text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.", ref: "Isaiah 40:31" },
      { text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.", ref: "Isaiah 41:10" }
    ];
    return verses[dayOfYear % verses.length];
  }, []);

  const handleGreetingAction = (action: 'bible' | 'lessons') => {
    localStorage.setItem(`greeting_${today}_${profile?.uid}`, 'true');
    setShowGreeting(false);
    if (action === 'bible') {
      navigate('/bible');
    }
  };

  return (
    <div className="space-y-16 pb-20">
      <AnimatePresence>
        {showGreeting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowGreeting(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden p-6 md:p-10 text-center space-y-6 md:space-y-8"
            >
              <button 
                onClick={() => setShowGreeting(false)}
                className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X size={20} className="md:w-6 md:h-6" />
              </button>

              <div className="space-y-4">
                <div className={cn("w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] mx-auto flex items-center justify-center bg-slate-50", greeting.color)}>
                  <greeting.icon size={32} className="md:w-10 md:h-10" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase font-display tracking-tight">
                  {greeting.text}, {profile?.displayName?.split(' ')[0]}!
                </h2>
                <div className="bg-primary/10 p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-primary/20 space-y-2">
                  <p className="text-primary font-serif italic text-base md:text-lg leading-relaxed">
                    "{morningVerse.text}"
                  </p>
                  <p className="text-primary/60 font-black uppercase tracking-widest text-[8px] md:text-[10px]">— {morningVerse.ref}</p>
                </div>
                <p className="text-slate-500 font-medium text-sm md:text-lg">
                  A new day to grow in faith. How would you like to start?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-2 md:pt-4">
                <button
                  onClick={() => handleGreetingAction('bible')}
                  className="group p-4 md:p-6 bg-primary/10 hover:bg-primary/20 rounded-2xl md:rounded-3xl border-2 border-primary/20 transition-all text-left space-y-2 md:space-y-3"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <BookOpen size={16} className="md:w-5 md:h-5" />
                  </div>
                  <div>
                    <div className="font-black text-primary uppercase text-[10px] tracking-widest">Wanna read</div>
                    <div className="font-black text-slate-900 text-lg md:text-xl font-display">THE BIBLE</div>
                  </div>
                  <ArrowRight className="text-primary group-hover:translate-x-1 transition-transform md:w-5 md:h-5" size={18} />
                </button>

                <button
                  onClick={() => handleGreetingAction('lessons')}
                  className="group p-4 md:p-6 bg-blue-50 hover:bg-blue-100 rounded-2xl md:rounded-3xl border-2 border-blue-100 transition-all text-left space-y-2 md:space-y-3"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Play size={16} className="md:w-5 md:h-5" fill="currentColor" />
                  </div>
                  <div>
                    <div className="font-black text-blue-700 uppercase text-[10px] tracking-widest">Go straight into</div>
                    <div className="font-black text-blue-900 text-lg md:text-xl font-display">LESSONS</div>
                  </div>
                  <ArrowRight className="text-blue-400 group-hover:translate-x-1 transition-transform md:w-5 md:h-5" size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="text-center space-y-4">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase font-display">Your Journey</h1>
        <p className="text-slate-500 font-medium">Master the Word, one step at a time.</p>
        <div className="flex items-center justify-center gap-4">
          {profile?.role === 'admin' && (
            <button 
              onClick={seedData} 
              disabled={isSeeding}
              className={cn(
                "text-xs underline transition-colors",
                seedSuccess ? "text-primary-500 font-bold" : "text-primary-600",
                isSeeding && "opacity-50"
              )}
            >
              {isSeeding ? 'Seeding...' : seedSuccess ? 'Lessons Seeded! ✓' : 'Seed Initial Lessons'}
            </button>
          )}
          <Link to="/create-lesson" className="text-xs text-blue-600 underline font-bold">Create Community Lesson</Link>
        </div>
      </header>

      {/* What's New Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">What's New</h2>
          <div className="h-px flex-1 bg-slate-100 mx-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-lg shadow-slate-100/50 space-y-3 relative overflow-hidden group"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full group-hover:scale-150 transition-transform" />
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white relative z-10 shadow-lg shadow-primary/20">
              <BookOpen size={20} />
            </div>
            <div className="relative z-10">
              <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight">20 New Lessons</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Explore Bible Basics, Parables, Apostles, and Christian Living.</p>
              <div className="mt-2 text-[8px] font-black text-primary uppercase tracking-widest bg-primary/10 w-fit px-2 py-0.5 rounded-full">Just Added</div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-lg shadow-slate-100/50 space-y-3 relative overflow-hidden group"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full group-hover:scale-150 transition-transform" />
            <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center text-white relative z-10 shadow-lg shadow-blue-200">
              <Trophy size={20} />
            </div>
            <div className="relative z-10">
              <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight">Spiritual Ranks</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">12 new ranks to achieve! From Seeker to Saint. Can you reach the top?</p>
              <div className="mt-2 text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 w-fit px-2 py-0.5 rounded-full">New Feature</div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-lg shadow-slate-100/50 space-y-3 relative overflow-hidden group"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-50 rounded-full group-hover:scale-150 transition-transform" />
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white relative z-10 shadow-lg shadow-orange-200">
              <Brain size={20} />
            </div>
            <div className="relative z-10">
              <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight">300+ Quizzes</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Test your knowledge with hundreds of new questions and explanations.</p>
              <div className="mt-2 text-[8px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 w-fit px-2 py-0.5 rounded-full">Updated</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Daily Challenge Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
      >
        <div className="bg-gradient-to-br from-orange-400 to-rose-500 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-2xl shadow-orange-100 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 space-y-3 md:space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 w-fit px-3 py-1 rounded-full">
              <Calendar size={12} className="md:w-3.5 md:h-3.5" /> Daily Challenge
            </div>
            <h3 className="text-xl md:text-2xl font-black uppercase font-display leading-tight">
              Master the <span className="underline decoration-white/50">{dailyCategory}</span>
            </h3>
            <p className="text-white/80 font-medium text-xs md:text-sm">
              Complete any lesson in this category today to earn a bonus <span className="font-black">+{dailyBonus} XP</span>!
            </p>
            <div className="pt-1 md:pt-2">
              {isDailyDone ? (
                <div className="flex items-center gap-2 bg-primary-500/30 w-fit px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-primary-400/50">
                  <Trophy size={16} className="md:w-4.5 md:h-4.5 text-primary-200" />
                  <span className="font-black text-[10px] uppercase tracking-widest">Challenge Completed!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white/20 w-fit px-3 md:px-4 py-1.5 md:py-2 rounded-xl">
                  <Zap size={16} className="md:w-4.5 md:h-4.5 text-yellow-200" />
                  <span className="font-black text-[10px] uppercase tracking-widest">Active Challenge</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-100 flex flex-col justify-between gap-4">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              <div className="flex items-center gap-1.5">
                <Trophy size={12} className="md:w-3.5 md:h-3.5 text-primary" /> Daily Progress
              </div>
              <span className="text-primary">{Math.round((completedToday / 3) * 100)}%</span>
            </div>
            <div className="h-2.5 md:h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((completedToday / 3) * 100, 100)}%` }}
                className="h-full bg-primary"
              />
            </div>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {completedToday >= 3 ? 'Daily goal reached! Keep it up!' : `${3 - completedToday} more for a daily streak!`}
            </p>
          </div>
          <div className="pt-2 md:pt-4 flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
              <Shrub size={14} className="md:w-4 md:h-4" fill="currentColor" />
            </div>
            <span className="text-xs md:text-sm font-bold text-slate-600">
              Current Streak: <span className="text-orange-500">{profile?.streak || 0} days</span>
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-2xl shadow-amber-100 relative overflow-hidden group md:col-span-2 lg:col-span-1">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 space-y-3 md:space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 w-fit px-3 py-1 rounded-full">
              <Brain size={12} className="md:w-3.5 md:h-3.5" /> Quick Play
            </div>
            <h3 className="text-xl md:text-2xl font-black uppercase font-display leading-tight">
              Bible <span className="underline decoration-white/50">Trivia</span>
            </h3>
            <p className="text-white/80 font-medium text-xs md:text-sm">
              Test your knowledge with 10 random questions and earn <span className="font-black">20 XP</span> per correct answer!
            </p>
            <div className="pt-1 md:pt-2">
              <Link 
                to="/trivia"
                className="inline-flex items-center gap-2 bg-white text-amber-600 px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl shadow-amber-900/20 hover:scale-105 transition-transform active:scale-95"
              >
                Start Trivia <ArrowRight size={14} className="md:w-4 md:h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Official Path */}
      <section className="space-y-8 overflow-x-hidden py-4">
        <h2 className="text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400">Official Path</h2>
        <div className="flex flex-col items-center gap-8 md:gap-12 relative">
          <div className="absolute top-0 bottom-0 w-2 bg-slate-100 -z-10 rounded-full" />
          {officialLessons.map((lesson, index) => {
            const isCompleted = progress[lesson.id]?.completed;
            const isUnlocked = index === 0 || progress[officialLessons[index - 1]?.id]?.completed;
            
            // Adjust offset for mobile - reduced for better fit
            const horizontalOffset = Math.sin(index * 1.5) * (windowWidth < 768 ? 20 : 60);

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                style={{ x: horizontalOffset }}
                className="relative group flex items-center justify-center"
              >
                <Link
                  to={isUnlocked ? `/quiz/${lesson.id}` : '#'}
                  className={cn(
                    "w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl relative z-10",
                    isCompleted ? "bg-primary text-white hover:bg-primary/80" : 
                    isUnlocked ? "bg-primary/80 text-white hover:bg-primary scale-110 ring-4 md:ring-8 ring-primary/10" : 
                    "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {isCompleted ? <CheckCircle2 size={20} className="md:w-8 md:h-8" /> : 
                   isUnlocked ? <Play size={20} fill="currentColor" className="md:w-8 md:h-8 ml-1" /> : 
                   <Lock size={20} className="md:w-8 md:h-8" />}
                </Link>

                <div className={cn(
                  "absolute left-full ml-3 md:ml-6 top-1/2 -translate-y-1/2 w-28 md:w-48 p-2.5 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all duration-300 z-20",
                  isUnlocked ? "bg-white border-primary/20 shadow-lg opacity-100" : "bg-slate-50 border-slate-200 opacity-50",
                  // On small screens, if the offset is too much to the right, flip it
                  (windowWidth < 768 && horizontalOffset > 10) ? "left-auto right-full mr-3" : ""
                )}>
                  <div className="text-[8px] md:text-xs font-black uppercase tracking-widest text-primary mb-0.5 md:mb-1">{lesson.category}</div>
                  <div className="font-bold text-slate-800 leading-tight text-xs md:text-base line-clamp-2">{lesson.title}</div>
                  {isUnlocked && !isCompleted && (
                    <div className="mt-1 md:mt-2 flex items-center gap-1 text-[10px] md:text-xs font-bold text-orange-500">
                      <Star size={10} className="md:w-3 md:h-3" fill="currentColor" />
                      <span>+{lesson.xpReward} XP</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Community Lessons */}
      {communityLessons.length > 0 && (
        <section className="space-y-8 pt-8 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Community Lessons</h2>
          <div className="flex items-center gap-2 md:gap-3 bg-slate-100 p-1 rounded-xl w-full md:w-fit overflow-x-auto no-scrollbar">
            {(['trending', 'visits', 'likes', 'stars'] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 md:flex-none",
                  sortBy === sort ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {sort}
              </button>
            ))}
          </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedCommunityLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-6 bg-white rounded-3xl border-2 border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2 py-1 bg-primary/10 rounded-lg">
                        {lesson.category}
                      </span>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                        lesson.difficulty === 'easy' ? "bg-primary/10 text-primary" :
                        lesson.difficulty === 'hard' ? "bg-rose-100 text-rose-600" :
                        "bg-amber-100 text-amber-600"
                      )}>
                        {lesson.difficulty || 'medium'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        <Star size={12} fill="currentColor" className="text-orange-400" />
                        <span>{lesson.averageRating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                        <Zap size={12} fill="currentColor" />
                        <span>{lesson.xpReward} XP</span>
                      </div>
                    </div>
                  </div>

                  <Link to={`/quiz/${lesson.id}`}>
                    <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-primary transition-colors">{lesson.title}</h3>
                  </Link>
                  <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-4">{lesson.description}</p>

                  {lesson.tags && lesson.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {lesson.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <Play size={10} className="text-blue-500" />
                      <span>{lesson.visits || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <Star size={10} className="text-rose-500" fill="currentColor" />
                      <span>{lesson.likes || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {lesson.authorDonationLink && (
                      <a
                        href={lesson.authorDonationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                      >
                        <Gift size={12} />
                        Donate
                      </a>
                    )}
                    <Link
                      to={`/quiz/${lesson.id}`}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      Start
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
