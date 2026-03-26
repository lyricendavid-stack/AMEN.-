import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Save, X, BookOpen, HelpCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

interface QuizInput {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function CreateLesson() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [tags, setTags] = useState('');
  const [quizzes, setQuizzes] = useState<QuizInput[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddQuiz = () => {
    setQuizzes([...quizzes, { question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }]);
  };

  const handleRemoveQuiz = (index: number) => {
    setQuizzes(quizzes.filter((_, i) => i !== index));
  };

  const handleQuizChange = (index: number, field: keyof QuizInput, value: any) => {
    const newQuizzes = [...quizzes];
    newQuizzes[index] = { ...newQuizzes[index], [field]: value };
    setQuizzes(newQuizzes);
  };

  const handleOptionChange = (quizIndex: number, optionIndex: number, value: string) => {
    const newQuizzes = [...quizzes];
    newQuizzes[quizIndex].options[optionIndex] = value;
    setQuizzes(newQuizzes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSubmitting(true);

    try {
      const lessonId = `user_${profile.uid}_${Date.now()}`;
      const batch = writeBatch(db);

      const lessonData = {
        id: lessonId,
        title,
        category,
        description,
        authorId: profile.uid,
        authorName: profile.displayName,
        authorDonationLink: profile.donationLink || '',
        isOfficial: false,
        difficulty,
        tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        visits: 0,
        likes: 0,
        xpReward: quizzes.length * 10 + 20,
        order: 999, // Community lessons don't follow the main path order
        createdAt: new Date().toISOString()
      };

      batch.set(doc(db, 'lessons', lessonId), lessonData);

      quizzes.forEach((quiz, index) => {
        const quizId = `q_${index}`;
        const quizRef = doc(db, 'lessons', lessonId, 'quizzes', quizId);
        batch.set(quizRef, {
          ...quiz,
          id: quizId,
          lessonId
        });
      });

      await batch.commit();
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'lessons');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">
      <header className="space-y-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold uppercase text-xs tracking-widest">
          <ArrowLeft size={16} /> Back to Journey
        </button>
        <h1 className="text-4xl font-black text-slate-900 uppercase font-display">Create Community Lesson</h1>
        <p className="text-slate-500 font-medium">Share your biblical knowledge with the community.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Lesson Details */}
        <section className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-100 space-y-6">
          <h2 className="text-xl font-black text-slate-900 uppercase font-display flex items-center gap-2">
            <BookOpen className="text-primary-500" /> Lesson Details
          </h2>
          <div className="grid gap-6">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Lesson Title</label>
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                placeholder="e.g., The Fruits of the Spirit"
                className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Category</label>
              <input 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                required 
                placeholder="e.g., Christian Living"
                className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Difficulty</label>
              <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)} 
                required 
                className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tags (comma separated)</label>
              <input 
                value={tags} 
                onChange={(e) => setTags(e.target.value)} 
                placeholder="e.g., Faith, Prayer, Jesus"
                className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
                placeholder="What will users learn in this lesson?"
                className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold h-32" 
              />
            </div>
          </div>
        </section>

        {/* Quizzes */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 uppercase font-display flex items-center gap-2">
              <HelpCircle className="text-primary-500" /> Quiz Questions
            </h2>
            <button 
              type="button" 
              onClick={handleAddQuiz}
              className="px-4 py-2 bg-primary-50 text-primary-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-100 transition-all"
            >
              + Add Question
            </button>
          </div>

          <div className="space-y-8">
            {quizzes.map((quiz, qIndex) => (
              <motion.div 
                key={qIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-100 space-y-6 relative"
              >
                {quizzes.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveQuiz(qIndex)}
                    className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Question {qIndex + 1}</label>
                  <input 
                    value={quiz.question} 
                    onChange={(e) => handleQuizChange(qIndex, 'question', e.target.value)} 
                    required 
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quiz.options.map((opt, oIndex) => (
                    <div key={oIndex} className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Option {oIndex + 1}</label>
                      <input 
                        value={opt} 
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} 
                        required 
                        className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold text-sm" 
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Correct Answer</label>
                    <select 
                      value={quiz.correctAnswer} 
                      onChange={(e) => handleQuizChange(qIndex, 'correctAnswer', e.target.value)} 
                      required
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold"
                    >
                      <option value="">Select Correct Option</option>
                      {quiz.options.map((opt, i) => opt && (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Explanation</label>
                    <input 
                      value={quiz.explanation} 
                      onChange={(e) => handleQuizChange(qIndex, 'explanation', e.target.value)} 
                      required 
                      placeholder="Why is this the correct answer?"
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-bold" 
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-6 bg-primary-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary-200 hover:bg-primary-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Publishing...' : 'Publish Community Lesson'}
        </button>
      </form>
    </div>
  );
}
