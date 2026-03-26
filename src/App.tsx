import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import CreateLesson from './pages/CreateLesson';
import Abilities from './pages/Abilities';
import Bible from './pages/Bible';
import Trivia from './pages/Trivia';
import Events from './pages/Events';
import { NotificationProvider } from './contexts/NotificationContext';
import { BookOpen, ShieldCheck } from 'lucide-react';

function AppRoutes() {
  const { user, profile, loading, signIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-bounce w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white">
          <BookOpen size={24} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center space-y-12">
        <div className="space-y-4">
          <div className="w-24 h-24 bg-primary-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-primary-200 mx-auto rotate-12">
            <BookOpen size={48} />
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-primary-600 font-display">AMEN.</h1>
          <p className="text-xl text-slate-500 font-medium max-w-sm mx-auto">
            The fun, free, and effective way to learn the Word of God.
          </p>
        </div>

        <div className="space-y-4 w-full max-w-sm">
          <button
            onClick={signIn}
            className="w-full py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-600 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            Get Started
          </button>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Sign in with Google to save your progress
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz/:lessonId" element={<Quiz />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/abilities" element={<Abilities />} />
        <Route path="/bible" element={<Bible />} />
        <Route path="/trivia" element={<Trivia />} />
        <Route path="/events" element={<Events />} />
        <Route path="/create-lesson" element={<CreateLesson />} />
        <Route path="/admin" element={profile?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppRoutes />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
