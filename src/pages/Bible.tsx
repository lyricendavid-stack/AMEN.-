import React, { useState, useEffect, useMemo } from 'react';
import { Book, Search, ChevronLeft, ChevronRight, Sparkles, BookOpen, List, Sunrise, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Verse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

const BIBLE_DATA: Record<string, number> = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
  'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
  'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150, 'Proverbs': 31,
  'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66, 'Jeremiah': 52,
  'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14, 'Joel': 3,
  'Amos': 9, 'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3, 'Habakkuk': 3,
  'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4,
  'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28, 'Romans': 16,
  '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6,
  'Philippians': 4, 'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3,
  '1 Timothy': 6, '2 Timothy': 4, 'Titus': 3, 'Philemon': 1, 'Hebrews': 13,
  'James': 5, '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1,
  'Jude': 1, 'Revelation': 22
};

const BIBLE_BOOKS = Object.keys(BIBLE_DATA);

const MORNING_VERSES = [
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

const BIBLE_VERSIONS = [
  { id: 'kjv', name: 'King James Version' },
  { id: 'asv', name: 'American Standard Version' },
  { id: 'bbe', name: 'Bible in Basic English' },
  { id: 'web', name: 'World English Bible' },
  { id: 'webbe', name: 'World English Bible (British)' },
  { id: 'oeb-us', name: 'Open English Bible (US)' },
  { id: 'oeb-cw', name: 'Open English Bible (CW)' },
];

export default function BiblePage() {
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(1);
  const [version, setVersion] = useState('kjv');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showBookList, setShowBookList] = useState(false);
  const [showVersionList, setShowVersionList] = useState(false);

  const morningVerse = useMemo(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return MORNING_VERSES[dayOfYear % MORNING_VERSES.length];
  }, []);

  const fetchChapter = async (b: string, c: number, v: string, retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      // The API expects book names with spaces to use '+' instead of '%20'
      const encodedBook = b.replace(/ /g, '+');
      const res = await fetch(`https://bible-api.com/${encodedBook}+${c}?translation=${v}`);
      
      if (!res.ok) {
        if (res.status === 404) throw new Error('Chapter not found');
        if (res.status === 429) throw new Error('Too many requests. Please wait a moment.');
        throw new Error(`API returned ${res.status}`);
      }
      
      const data = await res.json();
      if (data && data.verses && data.verses.length > 0) {
        setVerses(data.verses);
      } else {
        throw new Error('No verses found for this chapter.');
      }
    } catch (err) {
      console.error('Error fetching bible:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      if (retryCount < 2 && errorMessage !== 'Chapter not found' && !errorMessage.includes('Too many')) {
        // Retry for network errors
        setTimeout(() => fetchChapter(b, c, v, retryCount + 1), 1500);
        return;
      }
      setError(`Could not load this chapter: ${errorMessage}. Please check your connection or try another version.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapter(book, chapter, version);
  }, [book, chapter, version]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search) {
      const parts = search.trim().split(' ');
      if (parts.length >= 2) {
        const potentialChapter = parseInt(parts[parts.length - 1]);
        const potentialBook = parts.slice(0, -1).join(' ');
        
        const matchedBook = BIBLE_BOOKS.find(b => b.toLowerCase() === potentialBook.toLowerCase());
        
        if (matchedBook && !isNaN(potentialChapter)) {
          const maxChapters = BIBLE_DATA[matchedBook];
          if (potentialChapter >= 1 && potentialChapter <= maxChapters) {
            setBook(matchedBook);
            setChapter(potentialChapter);
            setSearch('');
            setError(null);
            return;
          }
        }
      }
      setError('Invalid book or chapter. Try "Genesis 1"');
    }
  };

  const selectBook = (b: string) => {
    setBook(b);
    setChapter(1);
    setShowBookList(false);
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-20 max-w-3xl mx-auto px-4 sm:px-0">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase font-display tracking-tight">Holy Bible</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Read and meditate on the Word.</p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 md:gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setShowVersionList(!showVersionList);
                setShowBookList(false);
              }}
              className="flex-1 sm:flex-none p-3 bg-white border-2 border-slate-100 rounded-2xl hover:border-primary-500 transition-all text-slate-600 flex items-center justify-center gap-2 font-bold text-xs md:text-sm shadow-sm"
            >
              <BookOpen size={18} className="md:w-5 md:h-5" />
              <span>{BIBLE_VERSIONS.find(v => v.id === version)?.name.split(' ')[0]}</span>
            </button>
            <button
              onClick={() => {
                setShowBookList(!showBookList);
                setShowVersionList(false);
              }}
              className="flex-1 sm:flex-none p-3 bg-white border-2 border-slate-100 rounded-2xl hover:border-primary-500 transition-all text-slate-600 flex items-center justify-center gap-2 font-bold text-xs md:text-sm shadow-sm"
            >
              <List size={18} className="md:w-5 md:h-5" />
              <span>Books</span>
            </button>
          </div>
          <form onSubmit={handleSearch} className="relative group w-full md:w-auto">
            <input
              type="text"
              placeholder="Search (e.g. John 3)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-primary-500 outline-none transition-all w-full md:w-48 lg:w-64 font-bold text-xs md:text-sm shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
          </form>
        </div>
      </header>

      <AnimatePresence>
        {showVersionList && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowVersionList(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 1 }}
              className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Select Version</h3>
                <button onClick={() => setShowVersionList(false)} className="p-2 text-slate-300 hover:text-slate-500"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-2">
                {BIBLE_VERSIONS.map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVersion(v.id);
                      setShowVersionList(false);
                    }}
                    className={cn(
                      "px-5 py-4 rounded-2xl text-sm font-bold transition-all text-left flex items-center justify-between border-2",
                      version === v.id ? "bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-100" : "bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600"
                    )}
                  >
                    <span>{v.name}</span>
                    <span className={cn("text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full", version === v.id ? "bg-white/20" : "bg-slate-200")}>{v.id}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBookList && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowBookList(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 1 }}
              className="relative bg-white w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Select Book</h3>
                <button onClick={() => setShowBookList(false)} className="p-2 text-slate-300 hover:text-slate-500"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto pr-2">
                {BIBLE_BOOKS.map(b => (
                  <button
                    key={b}
                    onClick={() => selectBook(b)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-bold transition-all text-left border-2",
                      book === b ? "bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-100" : "bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600"
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center justify-between w-full sm:w-auto sm:gap-4">
            <button 
              onClick={() => setChapter(Math.max(1, chapter - 1))}
              disabled={chapter <= 1}
              className="p-3 md:p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-primary-500 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="text-center min-w-[120px]">
              <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase font-display truncate max-w-[150px] md:max-w-none">{book} {chapter}</h2>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[150px] md:max-w-none">
                {BIBLE_VERSIONS.find(v => v.id === version)?.name}
              </p>
            </div>
            <button 
              onClick={() => setChapter(Math.min(BIBLE_DATA[book] || 1, chapter + 1))}
              disabled={chapter >= (BIBLE_DATA[book] || 1)}
              className="p-3 md:p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-primary-500 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-primary-600 bg-primary-50 px-4 py-2 rounded-xl">
            <Sparkles size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Daily Reading</span>
          </div>
        </div>

        <div className="p-6 md:p-12 min-h-[300px] md:min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">Opening the Scrolls...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center px-4">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                <Book size={28} className="md:w-8 md:h-8" />
              </div>
              <p className="text-slate-800 font-bold text-sm md:text-base">{error}</p>
              <button 
                onClick={() => fetchChapter(book, chapter, version)}
                className="text-primary-500 font-black uppercase tracking-widest text-[10px] md:text-xs hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-5 md:space-y-6">
              {verses.map((v) => (
                <div key={v.verse} className="flex gap-3 md:gap-4 group">
                  <span className="text-primary-500 font-black text-xs md:text-sm shrink-0 mt-1.5 md:mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    {v.verse}
                  </span>
                  <p className="text-slate-700 leading-relaxed font-serif text-base md:text-lg">
                    {v.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="bg-primary-500 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-primary-100">
        <div className="absolute -right-20 -bottom-20 w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-3 md:space-y-4">
          <div className="flex items-center gap-2">
            <Sunrise className="text-yellow-300 md:w-6 md:h-6" size={20} />
            <h3 className="text-xl md:text-2xl font-black uppercase font-display tracking-wider">Morning Verse</h3>
          </div>
          <p className="text-primary-50 font-serif italic text-lg md:text-xl leading-relaxed">
            "{morningVerse.text}"
          </p>
          <p className="text-primary-200 font-black uppercase tracking-widest text-[10px] md:text-xs">— {morningVerse.ref}</p>
        </div>
      </section>
    </div>
  );
}
