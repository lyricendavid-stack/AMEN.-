import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, increment, getDoc, runTransaction, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../contexts/NotificationContext';
import { X, CheckCircle2, XCircle, ArrowRight, Sparkles, Share2, Star, Shrub, BookOpen, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  category: string;
  xpReward: number;
}

export default function QuizPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { addNotification } = useNotifications();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [earnedBonus, setEarnedBonus] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [prevLessonId, setPrevLessonId] = useState<string | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when lessonId changes
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setShowExplanation(false);
    setScore(0);
    setIsFinished(false);
    setRating(null);
    setHasRated(false);
    setEarnedBonus(false);
    setShowIntro(true);
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId || !profile) return;

    const q = query(collection(db, 'lessons', lessonId, 'quizzes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `lessons/${lessonId}/quizzes`);
    });

    getDoc(doc(db, 'lessons', lessonId)).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLesson({ id: docSnap.id, ...data } as Lesson);
        
        // Increment visits
        updateDoc(doc(db, 'lessons', lessonId), {
          visits: increment(1)
        }).catch(err => console.error("Error incrementing visits:", err));
      }
    }).catch(error => {
      handleFirestoreError(error, OperationType.GET, `lessons/${lessonId}`);
    });

    return unsubscribe;
  }, [lessonId, profile]);

  useEffect(() => {
    if (!lesson?.category) return;

    const q = query(
      collection(db, 'lessons'),
      where('category', '==', lesson.category),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lessons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const currentIndex = lessons.findIndex(l => l.id === lessonId);
      
      if (currentIndex > 0) {
        setPrevLessonId(lessons[currentIndex - 1].id);
      } else {
        setPrevLessonId(null);
      }

      if (currentIndex < lessons.length - 1) {
        setNextLessonId(lessons[currentIndex + 1].id);
      } else {
        setNextLessonId(null);
      }
    }, (error) => {
      console.error("Error fetching category lessons:", error);
    });

    return unsubscribe;
  }, [lesson?.category, lessonId]);

  const handleCheck = () => {
    if (!selectedOption) return;
    const correct = selectedOption === quizzes[currentIndex].correctAnswer;
    setIsCorrect(correct);
    setShowExplanation(true);
    if (correct) setScore(s => s + 1);
  };

  const handleNext = async () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setShowExplanation(false);
    } else {
      await finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!profile || !lessonId) return;
    
    const baseXP = score * 10 + (score === quizzes.length ? 20 : 0);
    const coinsGained = 10 + (score === quizzes.length ? 5 : 0);
    
    // Daily Challenge Check
    const categories = ['Bible Basics', 'Parables', 'The Apostles', 'Christian Living'];
    const dailyCategory = categories[new Date().getDate() % categories.length];
    const isChallengeMet = lesson?.category === dailyCategory;
    const dailyBonus = isChallengeMet ? 25 : 0;
    
    if (isChallengeMet) setEarnedBonus(true);
    
    const xpGained = baseXP + dailyBonus;
    
    // Update progress
    const progressId = `${profile.uid}_${lessonId}`;
    let levelUp = false;
    try {
      await setDoc(doc(db, 'progress', progressId), {
        userId: profile.uid,
        lessonId,
        completed: true,
        score,
        lastAttempt: new Date().toISOString()
      });

      // Update user stats
      const newXP = (profile.totalXP || 0) + xpGained;
      const newLevel = Math.floor(newXP / 100) + 1;
      levelUp = newLevel > (profile.level || 1);

      await updateDoc(doc(db, 'users', profile.uid), {
        totalXP: newXP,
        level: newLevel,
        coins: increment(coinsGained + (levelUp ? 50 : 0)),
        streak: increment(1), // Simple streak logic for now
        lastActive: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `progress/${progressId}`);
    }

    await addNotification(
      "Lesson Complete! 📖",
      `You earned ${xpGained} XP and ${coinsGained} Heavenly Points. ${levelUp ? "LEVEL UP! +50 HP bonus!" : ""}`,
      'success'
    );

    setIsFinished(true);
  };

  const handleRate = async (value: number) => {
    if (!profile || !lessonId || hasRated) return;
    setRating(value);
    
    try {
      await runTransaction(db, async (transaction) => {
        const lessonRef = doc(db, 'lessons', lessonId);
        const ratingRef = doc(db, 'lessons', lessonId, 'ratings', profile.uid);
        
        const lessonDoc = await transaction.get(lessonRef);
        if (!lessonDoc.exists()) return;
        
        const data = lessonDoc.data();
        const currentAvg = data.averageRating || 0;
        const currentCount = data.ratingCount || 0;
        
        const newCount = currentCount + 1;
        const newAvg = ((currentAvg * currentCount) + value) / newCount;
        
        transaction.set(ratingRef, {
          userId: profile.uid,
          lessonId,
          rating: value,
          createdAt: new Date().toISOString()
        });
        
        transaction.update(lessonRef, {
          averageRating: newAvg,
          ratingCount: newCount
        });
      });
      setHasRated(true);
    } catch (err) {
      console.error('Error rating:', err);
    }
  };

  const handleLike = async () => {
    if (!profile || !lessonId || hasLiked) return;
    
    try {
      await updateDoc(doc(db, 'lessons', lessonId), {
        likes: increment(1)
      });
      setHasLiked(true);
      addNotification("Liked! ❤️", "Thanks for supporting this creator!", "success");
    } catch (err) {
      console.error('Error liking:', err);
    }
  };

  const handleShare = async () => {
    const text = `I just completed "${quizzes[0]?.lessonId}" on AMEN. with ${Math.round((score / quizzes.length) * 100)}% accuracy! 📖✨ #AMEN #BibleStudy`;
    const url = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AMEN. Progress',
          text: text,
          url: url,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to Twitter
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  if (quizzes.length === 0) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (showIntro && !isFinished) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col p-4 md:p-6 overflow-y-auto">
        <div className="flex items-center gap-4 mb-8 md:mb-12">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={24} />
          </button>
          <div className="flex-1 h-3 md:h-4 bg-slate-100 rounded-full overflow-hidden" />
        </div>

        <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col items-center justify-center text-center space-y-8">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 md:w-24 md:h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center shadow-lg shadow-primary/10"
          >
            <BookOpen size={40} className="md:w-12 md:h-12" />
          </motion.div>
          
          <div className="space-y-4">
            <div className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full w-fit mx-auto">
              {lesson?.category}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase font-display leading-tight">
              {lesson?.title}
            </h1>
            <p className="text-base md:text-lg text-slate-500 font-medium max-w-md mx-auto">
              {lesson?.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm pt-4">
            <div className="bg-orange-50 p-4 rounded-2xl border-2 border-orange-100">
              <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Questions</div>
              <div className="text-xl font-black text-orange-700">{quizzes.length}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100">
              <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">XP Reward</div>
              <div className="text-xl font-black text-blue-700">+{lesson?.xpReward || 0}</div>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-4 pt-8">
            <button
              onClick={() => setShowIntro(false)}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 text-lg"
            >
              Start Lesson
            </button>

            <div className="flex gap-3">
              {prevLessonId && (
                <button
                  onClick={() => navigate(`/quiz/${prevLessonId}`)}
                  className="flex-1 py-3 bg-white text-slate-400 border-2 border-slate-100 rounded-xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-[10px] md:text-xs"
                >
                  Previous Lesson
                </button>
              )}
              {nextLessonId && (
                <button
                  onClick={() => navigate(`/quiz/${nextLessonId}`)}
                  className="flex-1 py-3 bg-white text-slate-400 border-2 border-slate-100 rounded-xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-[10px] md:text-xs"
                >
                  Next Lesson
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-4 md:p-6 text-center space-y-6 md:space-y-8 overflow-y-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 md:w-32 md:h-32 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl shadow-primary/20 shrink-0"
        >
          <Sparkles size={48} className="md:w-16 md:h-16" />
        </motion.div>
        <div className="space-y-1 md:space-y-2">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase font-display">Lesson Complete!</h2>
          <p className="text-lg md:text-xl text-slate-500 font-medium">You're growing in wisdom and grace.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <div className="flex-1 bg-orange-50 p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-orange-200 relative overflow-hidden">
            {earnedBonus && (
              <div className="absolute -right-1 -top-1 bg-yellow-400 text-white p-1.5 rounded-full shadow-lg">
                <Shrub size={12} className="md:w-4 md:h-4" fill="currentColor" />
              </div>
            )}
            <div className="text-[10px] md:text-xs font-black text-orange-600 uppercase tracking-widest mb-1">XP Earned</div>
            <div className="text-2xl md:text-3xl font-black text-orange-700">
              +{score * 10 + (score === quizzes.length ? 20 : 0) + (earnedBonus ? 25 : 0)}
            </div>
            {earnedBonus && <div className="text-[8px] md:text-[10px] font-bold text-orange-500 uppercase mt-1">Includes +25 Daily Bonus!</div>}
          </div>
          <div className="flex-1 bg-primary/5 p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-primary/10">
            <div className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest mb-1">Accuracy</div>
            <div className="text-2xl md:text-3xl font-black text-primary">{Math.round((score / quizzes.length) * 100)}%</div>
          </div>
        </div>

        {/* Rating Section */}
        <div className="flex flex-col items-center gap-6">
          <div className="space-y-3 md:space-y-4">
            <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Rate this lesson</p>
            <div className="flex gap-1 md:gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  disabled={hasRated}
                  onClick={() => handleRate(star)}
                  className={cn(
                    "p-1.5 md:p-2 transition-all hover:scale-110 active:scale-95",
                    (rating || 0) >= star ? "text-orange-500" : "text-slate-200",
                    hasRated && "cursor-default"
                  )}
                >
                  <Star size={28} className="md:w-8 md:h-8" fill={(rating || 0) >= star ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            {hasRated && <p className="text-[10px] md:text-xs font-bold text-primary">Thanks for your feedback!</p>}
          </div>

          <button
            onClick={handleLike}
            disabled={hasLiked}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95",
              hasLiked ? "bg-rose-500 text-white shadow-lg shadow-rose-100" : "bg-rose-50 text-rose-600 hover:bg-rose-100"
            )}
          >
            <Heart size={16} fill={hasLiked ? "currentColor" : "none"} />
            {hasLiked ? 'Liked!' : 'Like Lesson'}
          </button>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-md">
          {nextLessonId && (
            <button
              onClick={() => navigate(`/quiz/${nextLessonId}`)}
              className="w-full py-3.5 md:py-4 bg-primary text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 text-sm md:text-base flex items-center justify-center gap-2"
            >
              Next Lesson <ArrowRight size={18} className="md:w-5 md:h-5" />
            </button>
          )}
          
          <button
            onClick={() => navigate('/')}
            className={cn(
              "w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 text-sm md:text-base",
              nextLessonId 
                ? "bg-white text-slate-600 border-2 border-slate-200 hover:bg-slate-50" 
                : "bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90"
            )}
          >
            {nextLessonId ? "Back to Path" : "Continue"}
          </button>

          {prevLessonId && (
            <button
              onClick={() => navigate(`/quiz/${prevLessonId}`)}
              className="w-full py-3.5 md:py-4 bg-white text-slate-400 border-2 border-slate-100 rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 text-sm md:text-base"
            >
              Previous Lesson
            </button>
          )}

          <button
            onClick={handleShare}
            className="w-full py-3.5 md:py-4 bg-white text-slate-600 border-2 border-slate-200 rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm md:text-base"
          >
            <Share2 size={18} className="md:w-5 md:h-5" />
            Share Result
          </button>
        </div>
      </div>
    );
  }

  const currentQuiz = quizzes[currentIndex];
  const progressPercent = ((currentIndex + 1) / quizzes.length) * 100;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 md:mb-12">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600 p-1">
          <X size={24} />
        </button>
        <div className="flex-1 h-3 md:h-4 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-primary rounded-full"
            />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 max-w-2xl mx-auto w-full space-y-6 md:space-y-8 overflow-y-auto pb-32">
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
          {currentQuiz.question}
        </h3>

        <div className="grid gap-3 md:gap-4">
          {currentQuiz.options.map((option) => (
            <button
              key={option}
              disabled={isCorrect !== null}
              onClick={() => setSelectedOption(option)}
              className={cn(
                "w-full p-4 md:p-5 rounded-xl md:rounded-2xl border-2 text-left font-bold transition-all duration-200 active:scale-[0.98] text-sm md:text-base",
                selectedOption === option
                  ? "border-primary bg-primary/5 text-primary shadow-md"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600"
              )}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <span className="w-7 h-7 md:w-8 md:h-8 rounded-lg border-2 border-current flex items-center justify-center text-xs md:text-sm shrink-0">
                  {String.fromCharCode(65 + currentQuiz.options.indexOf(option))}
                </span>
                {option}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer / Feedback */}
      <AnimatePresence>
        {isCorrect !== null ? (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 shadow-2xl border-t border-slate-100",
              isCorrect ? "bg-primary-50" : "bg-red-50"
            )}
          >
            <div className="flex items-start md:items-center gap-3 md:gap-4 w-full">
                {isCorrect ? (
                  <CheckCircle2 size={32} className="md:w-12 md:h-12 text-primary-500 shrink-0" />
                ) : (
                  <XCircle size={32} className="md:w-12 md:h-12 text-red-600 shrink-0" />
                )}
              <div className="space-y-0.5 md:space-y-1 overflow-hidden">
                <h4 className={cn("text-lg md:text-xl font-black uppercase tracking-tight", isCorrect ? "text-primary-600" : "text-red-700")}>
                  {isCorrect ? 'Excellent!' : 'Correct Answer:'}
                </h4>
                {!isCorrect && <p className="text-red-700 font-bold text-sm md:text-base truncate">{currentQuiz.correctAnswer}</p>}
                <p className={cn("text-xs md:text-sm font-medium line-clamp-2 md:line-clamp-none", isCorrect ? "text-primary-600/80" : "text-red-600")}>
                  {currentQuiz.explanation}
                </p>
              </div>
            </div>
            <button
              onClick={handleNext}
              className={cn(
                "w-full md:w-48 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 text-sm md:text-base",
                isCorrect ? "bg-primary text-white hover:bg-primary/90" : "bg-red-500 text-white hover:bg-red-600"
              )}
            >
              Continue
            </button>
          </motion.div>
        ) : (
          <div className="fixed bottom-0 left-0 right-0 p-6 md:p-8 flex justify-end border-t border-slate-100 bg-white">
            <button
              disabled={!selectedOption}
              onClick={handleCheck}
              className={cn(
                "w-full md:w-48 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 text-sm md:text-base",
                selectedOption
                  ? "bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              Check
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
