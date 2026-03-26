import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, addDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Save, X, BookOpen, HelpCircle, Users, Shield, Zap, Trophy, History, Shrub } from 'lucide-react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { seedOfficialLessons } from '../lib/seedData';

interface Lesson {
  id: string;
  title: string;
  description: string;
  category: string;
  order: number;
  xpReward: number;
  isOfficial?: boolean;
  authorId?: string;
}

interface Quiz {
  id: string;
  lessonId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role?: string;
  streak?: number;
  totalXP?: number;
  level?: number;
  lastActive?: string;
}

export default function AdminPanel() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'content' | 'users' | 'audit'>('content');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [seedStatus, setSeedStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'lesson' | 'quiz', id: string } | null>(null);

  useEffect(() => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'co-owner' && profile.role !== 'moderator' && profile.role !== 'editor' && profile.role !== 'pastor' && profile.role !== 'church' && profile.role !== 'creator')) return;
    if (activeTab === 'content') {
      const q = query(collection(db, 'lessons'), orderBy('order', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson)));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'lessons');
      });
      return unsubscribe;
    }
  }, [activeTab, profile]);

  useEffect(() => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'co-owner' && profile.role !== 'moderator')) return;
    if (activeTab === 'users' || activeTab === 'audit') {
      const q = query(collection(db, 'users'), orderBy('displayName', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });
      return unsubscribe;
    }
  }, [activeTab, profile]);

  useEffect(() => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'co-owner' && profile.role !== 'moderator' && profile.role !== 'editor' && profile.role !== 'pastor' && profile.role !== 'church' && profile.role !== 'creator') || !selectedLesson) {
      setQuizzes([]);
      return;
    }
    const q = query(collection(db, 'lessons', selectedLesson.id, 'quizzes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `lessons/${selectedLesson.id}/quizzes`);
    });
    return unsubscribe;
  }, [selectedLesson, profile]);

  const handleSaveLesson = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const lessonData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      order: parseInt(formData.get('order') as string),
      xpReward: parseInt(formData.get('xpReward') as string),
      isOfficial: true,
      authorId: profile.uid,
    };

    if (selectedLesson) {
      await setDoc(doc(db, 'lessons', selectedLesson.id), lessonData, { merge: true });
    } else {
      const id = lessonData.title.toLowerCase().replace(/\s+/g, '-');
      await setDoc(doc(db, 'lessons', id), { ...lessonData, id });
    }
    setIsEditingLesson(false);
    setSelectedLesson(null);
  };

  const handleDeleteLesson = async (id: string) => {
    await deleteDoc(doc(db, 'lessons', id));
    setSelectedLesson(null);
    setShowDeleteConfirm(null);
  };

  const handleSaveQuiz = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLesson) return;

    const formData = new FormData(e.currentTarget);
    const quizData = {
      lessonId: selectedLesson.id,
      question: formData.get('question') as string,
      options: (formData.get('options') as string).split(',').map(s => s.trim()),
      correctAnswer: formData.get('correctAnswer') as string,
      explanation: formData.get('explanation') as string,
    };

    if (editingQuiz?.id) {
      await setDoc(doc(db, 'lessons', selectedLesson.id, 'quizzes', editingQuiz.id), quizData);
    } else {
      const newQuizRef = doc(collection(db, 'lessons', selectedLesson.id, 'quizzes'));
      await setDoc(newQuizRef, { ...quizData, id: newQuizRef.id });
    }
    setIsEditingQuiz(false);
    setEditingQuiz(null);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (selectedLesson) {
      await deleteDoc(doc(db, 'lessons', selectedLesson.id, 'quizzes', quizId));
      setShowDeleteConfirm(null);
    }
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;

    const formData = new FormData(e.currentTarget);
    const userData = {
      displayName: formData.get('displayName') as string,
      role: formData.get('role') as string,
      streak: parseInt(formData.get('streak') as string),
      totalXP: parseInt(formData.get('totalXP') as string),
      level: parseInt(formData.get('level') as string),
    };

    try {
      await updateDoc(doc(db, 'users', selectedUser.uid), userData);
      setIsEditingUser(false);
      setSelectedUser(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${selectedUser.uid}`);
    }
  };

  const canManageUsers = profile?.role === 'admin' || profile?.role === 'co-owner';
  const canManageContent = canManageUsers || profile?.role === 'editor' || profile?.role === 'moderator' || profile?.role === 'pastor' || profile?.role === 'church' || profile?.role === 'creator';
  const canAccessAudit = canManageUsers || profile?.role === 'moderator';

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedStatus('idle');
    try {
      await seedOfficialLessons();
      setSeedStatus('success');
      setTimeout(() => {
        setSeedStatus('idle');
        setShowSeedConfirm(false);
      }, 2000);
    } catch (error) {
      console.error('Error seeding data:', error);
      setSeedStatus('error');
    } finally {
      setIsSeeding(false);
    }
  };

  if (!canManageContent && !canManageUsers) {
    return <div className="p-8 text-center font-bold text-red-500">Access Denied</div>;
  }

  return (
    <div className="space-y-8 md:space-y-10 pb-24 md:pb-20 px-4 sm:px-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase font-display">Owner Panel</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Manage content and community members</p>
        </div>
        <div className="flex items-center justify-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('content')}
            className={cn(
              "px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === 'content' ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === 'users' ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={cn(
              "px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === 'audit' ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Audit
          </button>
        </div>
      </header>

      {activeTab === 'content' ? (
        <>
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <div className="relative">
              <button
                onClick={() => setShowSeedConfirm(true)}
                disabled={isSeeding}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs md:text-sm uppercase tracking-wider hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                <Zap size={16} className={cn(isSeeding ? "animate-pulse" : "", "md:w-4.5 md:h-4.5")} />
                {isSeeding ? 'Seeding...' : 'Seed Data'}
              </button>

              <AnimatePresence>
                {showSeedConfirm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute bottom-full right-0 mb-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 space-y-3"
                  >
                    {seedStatus === 'idle' ? (
                      <>
                        <p className="text-xs font-bold text-slate-600">This will overwrite or add official lessons. Continue?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSeedData}
                            className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                          >
                            Yes, Seed
                          </button>
                          <button
                            onClick={() => setShowSeedConfirm(false)}
                            className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : seedStatus === 'success' ? (
                      <div className="text-center py-2 space-y-2">
                        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto">
                          <Shield size={16} />
                        </div>
                        <p className="text-xs font-black text-primary-600 uppercase tracking-widest">Success!</p>
                      </div>
                    ) : (
                      <div className="text-center py-2 space-y-2">
                        <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                          <X size={16} />
                        </div>
                        <p className="text-xs font-black text-red-600 uppercase tracking-widest">Failed</p>
                        <button
                          onClick={() => setSeedStatus('idle')}
                          className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => { setSelectedLesson(null); setIsEditingLesson(true); }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-bold text-xs md:text-sm uppercase tracking-wider hover:bg-primary-600 transition-all"
            >
              <Plus size={16} className="md:w-4.5 md:h-4.5" /> Add Lesson
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
            {/* Lessons List */}
            <section className="space-y-4">
              <h2 className="text-lg md:text-xl font-bold text-slate-700 flex items-center gap-2">
                <BookOpen size={18} className="md:w-5 md:h-5 text-primary-500" /> Lessons
              </h2>
              <div className="space-y-3">
                {lessons.map(lesson => (
                  <div
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all cursor-pointer group flex items-center justify-between",
                      selectedLesson?.id === lesson.id ? "border-primary-500 bg-primary-50" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{lesson.category}</div>
                      <div className="font-bold text-slate-800 text-sm md:text-base truncate">{lesson.title}</div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedLesson(lesson); setIsEditingLesson(true); }}
                        className="p-2 text-slate-400 hover:text-blue-500"
                      >
                        <Edit2 size={14} className="md:w-4 md:h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm({ type: 'lesson', id: lesson.id }); }}
                        className="p-2 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={14} className="md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quizzes List */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold text-slate-700 flex items-center gap-2">
                  <HelpCircle size={18} className="md:w-5 md:h-5 text-primary-500" /> Quizzes
                </h2>
                {selectedLesson && (
                  <button
                    onClick={() => { setEditingQuiz({}); setIsEditingQuiz(true); }}
                    className="text-[10px] md:text-xs font-black text-primary-600 uppercase tracking-widest hover:underline"
                  >
                    + Add Quiz
                  </button>
                )}
              </div>

              {!selectedLesson ? (
                <div className="p-8 md:p-12 border-2 border-dashed border-slate-200 rounded-2xl md:rounded-3xl text-center text-slate-400 font-medium text-sm">
                  Select a lesson to manage quizzes
                </div>
              ) : (
                <div className="space-y-3">
                  {quizzes.map(quiz => (
                    <div key={quiz.id} className="p-4 rounded-2xl border-2 border-slate-100 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <p className="font-bold text-slate-800 text-xs md:text-sm">{quiz.question}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { setEditingQuiz(quiz); setIsEditingQuiz(true); }}
                            className="p-1 text-slate-400 hover:text-blue-500"
                          >
                            <Edit2 size={12} className="md:w-3.5 md:h-3.5" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm({ type: 'quiz', id: quiz.id })}
                            className="p-1 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 size={12} className="md:w-3.5 md:h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {quiz.options.map(opt => (
                          <span
                            key={opt}
                            className={cn(
                              "px-2 py-0.5 md:py-1 rounded-lg text-[8px] md:text-[10px] font-bold uppercase tracking-wider",
                              opt === quiz.correctAnswer ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {quizzes.length === 0 && (
                    <div className="p-6 md:p-8 text-center text-slate-400 text-xs md:text-sm">No quizzes yet for this lesson.</div>
                  )}
                </div>
              )}
            </section>
          </div>
        </>
      ) : activeTab === 'users' ? (
        <section className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {users.map(user => (
              <div key={user.uid} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-lg md:text-xl shrink-0">
                      {user.displayName?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-800 text-sm md:text-base truncate">{user.displayName}</h3>
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedUser(user); setIsEditingUser(true); }}
                    className="p-2 text-slate-400 hover:text-primary-500 transition-colors shrink-0"
                  >
                    <Edit2 size={16} className="md:w-4.5 md:h-4.5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-orange-50 p-2 md:p-3 rounded-xl md:rounded-2xl text-center">
                    <Shrub size={12} className="md:w-3.5 md:h-3.5 text-orange-500 mx-auto mb-1" fill="currentColor" />
                    <div className="text-[10px] md:text-xs font-black text-orange-700">{user.streak || 0}d</div>
                  </div>
                  <div className="bg-primary-50 p-2 md:p-3 rounded-xl md:rounded-2xl text-center">
                    <Trophy size={12} className="md:w-3.5 md:h-3.5 text-primary-500 mx-auto mb-1" />
                    <div className="text-[10px] md:text-xs font-black text-primary-700">{user.totalXP || 0}</div>
                  </div>
                  <div className="bg-blue-50 p-2 md:p-3 rounded-xl md:rounded-2xl text-center">
                    <Shield size={12} className="md:w-3.5 md:h-3.5 text-blue-500 mx-auto mb-1" />
                    <div className="text-[10px] md:text-xs font-black text-blue-700">Lvl {user.level || 1}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className={cn(
                    "text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                    user.role === 'admin' || user.role === 'co-owner' ? "bg-purple-100 text-purple-700" : 
                    user.role === 'moderator' ? "bg-blue-100 text-blue-700" :
                    user.role === 'editor' || user.role === 'pastor' || user.role === 'church' ? "bg-amber-100 text-amber-700" :
                    user.role === 'creator' ? "bg-primary-100 text-primary-700" :
                    "bg-slate-100 text-slate-500"
                  )}>
                    {user.role || 'user'}
                  </span>
                  <span className="text-[8px] md:text-[10px] font-bold text-slate-400">
                    ID: {user.uid.slice(0, 6)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-slate-100 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <History className="text-slate-400 md:w-6 md:h-6" size={20} />
            <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase font-display">System Audit Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 md:px-8 py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                  <th className="px-6 md:px-8 py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="px-6 md:px-8 py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Active</th>
                  <th className="px-6 md:px-8 py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Stats (XP/Lvl)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => (
                  <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 md:px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                          {user.displayName?.[0] || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-xs md:text-sm truncate">{user.displayName}</div>
                          <div className="text-[9px] md:text-[10px] text-slate-400 font-medium truncate">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-4">
                      <span className={cn(
                        "text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                        user.role === 'admin' || user.role === 'co-owner' ? "bg-purple-100 text-purple-700" : 
                        user.role === 'moderator' ? "bg-blue-100 text-blue-700" :
                        user.role === 'editor' || user.role === 'pastor' || user.role === 'church' ? "bg-amber-100 text-amber-700" :
                        user.role === 'creator' ? "bg-primary-100 text-primary-700" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 md:px-8 py-4">
                      <div className="text-[10px] md:text-xs font-bold text-slate-600">
                        {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-4">
                      <div className="text-[10px] md:text-xs font-black text-slate-800">
                        {user.totalXP || 0} XP / Lvl {user.level || 1}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* User Modal */}
      {isEditingUser && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase font-display">Manage User</h3>
              <button onClick={() => setIsEditingUser(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                <input name="displayName" defaultValue={selectedUser.displayName} required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Role</label>
                <select name="role" defaultValue={selectedUser.role || 'user'} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold appearance-none bg-white text-sm">
                  <option value="user">User</option>
                  <option value="creator">Creator</option>
                  <option value="editor">Editor</option>
                  <option value="moderator">Moderator</option>
                  <option value="pastor">Pastor</option>
                  <option value="church">Church</option>
                  <option value="co-owner">Co-Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Streak</label>
                  <input type="number" name="streak" defaultValue={selectedUser.streak || 0} required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">XP</label>
                  <input type="number" name="totalXP" defaultValue={selectedUser.totalXP || 0} required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Level</label>
                  <input type="number" name="level" defaultValue={selectedUser.level || 1} required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold text-sm" />
                </div>
              </div>
              <button type="submit" className="w-full py-3.5 md:py-4 bg-primary-500 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-600 transition-all text-sm">
                Update User Stats
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Lesson Modal */}
      {isEditingLesson && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase font-display">{selectedLesson ? 'Edit Lesson' : 'New Lesson'}</h3>
              <button onClick={() => setIsEditingLesson(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Title</label>
                <input name="title" defaultValue={selectedLesson?.title} required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Category</label>
                <input name="category" defaultValue={selectedLesson?.category} required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Description</label>
                <textarea name="description" defaultValue={selectedLesson?.description} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold h-24 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Order</label>
                  <input type="number" name="order" defaultValue={selectedLesson?.order || lessons.length + 1} required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">XP Reward</label>
                  <input type="number" name="xpReward" defaultValue={selectedLesson?.xpReward || 50} required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold text-sm" />
                </div>
              </div>
              <button type="submit" className="w-full py-3.5 md:py-4 bg-primary-500 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-600 transition-all text-sm">
                Save Lesson
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Quiz Modal */}
      {isEditingQuiz && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase font-display">{editingQuiz?.id ? 'Edit Quiz' : 'New Quiz'}</h3>
              <button onClick={() => setIsEditingQuiz(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Question</label>
                <textarea name="question" defaultValue={editingQuiz?.question} required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold h-20 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Options (Comma separated)</label>
                <input name="options" defaultValue={editingQuiz?.options?.join(', ')} placeholder="Option 1, Option 2, Option 3" required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Correct Answer</label>
                <input name="correctAnswer" defaultValue={editingQuiz?.correctAnswer} required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Explanation</label>
                <textarea name="explanation" defaultValue={editingQuiz?.explanation} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold h-20 text-sm" />
              </div>
              <button type="submit" className="w-full py-3.5 md:py-4 bg-primary-500 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-600 transition-all text-sm">
                Save Quiz
              </button>
            </form>
          </motion.div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase font-display">Are you sure?</h3>
                <p className="text-slate-500 font-medium text-sm mt-2">
                  {showDeleteConfirm.type === 'lesson' 
                    ? 'This will delete the lesson. Quizzes inside must be deleted manually in this version.' 
                    : 'This quiz will be permanently removed.'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => showDeleteConfirm.type === 'lesson' ? handleDeleteLesson(showDeleteConfirm.id) : handleDeleteQuiz(showDeleteConfirm.id)}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
