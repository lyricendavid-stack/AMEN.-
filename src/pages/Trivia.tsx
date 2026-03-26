import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Trophy, Star, ArrowRight, RotateCcw, Zap, Brain, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const TRIVIA_QUESTIONS: Question[] = [
  {
    question: "How many books are in the New Testament?",
    options: ["27", "39", "66", "12"],
    correctAnswer: "27",
    explanation: "The New Testament consists of 27 books, starting with Matthew and ending with Revelation."
  },
  {
    question: "Who was the oldest man mentioned in the Bible?",
    options: ["Adam", "Noah", "Methuselah", "Abraham"],
    correctAnswer: "Methuselah",
    explanation: "Methuselah lived to be 969 years old (Genesis 5:27)."
  },
  {
    question: "What was the first plague of Egypt?",
    options: ["Frogs", "Lice", "Water into Blood", "Darkness"],
    correctAnswer: "Water into Blood",
    explanation: "The first plague was the turning of the Nile's water into blood (Exodus 7:14-25)."
  },
  {
    question: "Which apostle was a tax collector?",
    options: ["Peter", "Matthew", "John", "Andrew"],
    correctAnswer: "Matthew",
    explanation: "Matthew (also called Levi) was a tax collector before Jesus called him (Matthew 9:9)."
  },
  {
    question: "In what city was Jesus born?",
    options: ["Nazareth", "Jerusalem", "Bethlehem", "Jericho"],
    correctAnswer: "Bethlehem",
    explanation: "Jesus was born in Bethlehem of Judea, fulfilling the prophecy of Micah 5:2."
  },
  {
    question: "Who was the first king of Israel?",
    options: ["David", "Saul", "Solomon", "Samuel"],
    correctAnswer: "Saul",
    explanation: "Saul was anointed by Samuel as the first king of Israel (1 Samuel 10:1)."
  },
  {
    question: "What was the shortest verse in the Bible?",
    options: ["Jesus wept.", "God is love.", "Pray without ceasing.", "Rejoice evermore."],
    correctAnswer: "Jesus wept.",
    explanation: "John 11:35 is the shortest verse in the English Bible."
  },
  {
    question: "How many people were on Noah's Ark?",
    options: ["2", "4", "8", "12"],
    correctAnswer: "8",
    explanation: "Noah, his wife, his three sons, and their wives (1 Peter 3:20)."
  },
  {
    question: "What is the first book of the Bible?",
    options: ["Exodus", "Genesis", "Leviticus", "Psalms"],
    correctAnswer: "Genesis",
    explanation: "Genesis is the first book of the Bible, detailing the creation of the world."
  },
  {
    question: "How many days did it take for God to create the world?",
    options: ["7", "6", "10", "40"],
    correctAnswer: "6",
    explanation: "God created the world in six days and rested on the seventh (Genesis 1)."
  },
  {
    question: "Who was swallowed by a great fish?",
    options: ["Moses", "Jonah", "Elijah", "Daniel"],
    correctAnswer: "Jonah",
    explanation: "Jonah was swallowed by a great fish after trying to run from God's command (Jonah 1:17)."
  },
  {
    question: "What is the last book of the Bible?",
    options: ["Jude", "Revelation", "Malachi", "Hebrews"],
    correctAnswer: "Revelation",
    explanation: "Revelation is the final book of the New Testament and the Bible."
  },
  {
    question: "Who received the Ten Commandments from God?",
    options: ["Abraham", "Moses", "Joshua", "Aaron"],
    correctAnswer: "Moses",
    explanation: "Moses received the Ten Commandments on Mount Sinai (Exodus 20)."
  },
  {
    question: "What is the longest book in the Bible?",
    options: ["Isaiah", "Jeremiah", "Psalms", "Genesis"],
    correctAnswer: "Psalms",
    explanation: "The Book of Psalms contains 150 chapters, making it the longest book."
  },
  {
    question: "Who was the mother of Jesus?",
    options: ["Elizabeth", "Martha", "Mary", "Sarah"],
    correctAnswer: "Mary",
    explanation: "Mary was chosen by God to be the mother of Jesus (Luke 1:30-31)."
  },
  {
    question: "How many disciples did Jesus have?",
    options: ["7", "10", "12", "14"],
    correctAnswer: "12",
    explanation: "Jesus chose twelve apostles to follow Him and spread His teachings."
  },
  {
    question: "Which fruit of the Spirit is mentioned first in Galatians 5:22?",
    options: ["Joy", "Peace", "Love", "Faithfulness"],
    correctAnswer: "Love",
    explanation: "Galatians 5:22 begins with 'But the fruit of the Spirit is love...'"
  },
  {
    question: "Who defeated Goliath with a sling and a stone?",
    options: ["Saul", "David", "Solomon", "Samson"],
    correctAnswer: "David",
    explanation: "David, a young shepherd, defeated the giant Goliath (1 Samuel 17)."
  },
  {
    question: "What was the sign of God's promise to Noah?",
    options: ["A Dove", "An Olive Branch", "A Rainbow", "A Star"],
    correctAnswer: "A Rainbow",
    explanation: "God set a rainbow in the clouds as a sign of His covenant with Noah (Genesis 9:13)."
  },
  {
    question: "Who was the strongest man in the Bible?",
    options: ["David", "Samson", "Goliath", "Peter"],
    correctAnswer: "Samson",
    explanation: "Samson was given supernatural strength by God (Judges 13-16)."
  },
  {
    question: "Who was the first woman created by God?",
    options: ["Sarah", "Eve", "Mary", "Ruth"],
    correctAnswer: "Eve",
    explanation: "Eve was the first woman, created from Adam's rib (Genesis 2:22)."
  },
  {
    question: "Who was the first murderer in the Bible?",
    options: ["Cain", "Abel", "Lamech", "Nimrod"],
    correctAnswer: "Cain",
    explanation: "Cain killed his brother Abel out of jealousy (Genesis 4:8)."
  },
  {
    question: "What was the name of the mountain where Noah's Ark rested?",
    options: ["Sinai", "Ararat", "Zion", "Carmel"],
    correctAnswer: "Ararat",
    explanation: "The ark came to rest on the mountains of Ararat (Genesis 8:4)."
  },
  {
    question: "Who is known as the 'Father of many nations'?",
    options: ["Noah", "Abraham", "Jacob", "Moses"],
    correctAnswer: "Abraham",
    explanation: "God promised Abraham he would be the father of many nations (Genesis 17:4)."
  },
  {
    question: "Who was Abraham's wife?",
    options: ["Rebekah", "Rachel", "Sarah", "Leah"],
    correctAnswer: "Sarah",
    explanation: "Sarah was Abraham's wife and the mother of Isaac."
  },
  {
    question: "How many sons did Jacob have?",
    options: ["3", "7", "10", "12"],
    correctAnswer: "12",
    explanation: "Jacob had twelve sons, who became the heads of the twelve tribes of Israel."
  },
  {
    question: "Who was Jacob's favorite son?",
    options: ["Reuben", "Judah", "Joseph", "Benjamin"],
    correctAnswer: "Joseph",
    explanation: "Jacob loved Joseph more than any of his other sons (Genesis 37:3)."
  },
  {
    question: "What did Joseph's brothers do to him?",
    options: ["Killed him", "Sold him into slavery", "Made him king", "Ignored him"],
    correctAnswer: "Sold him into slavery",
    explanation: "Joseph's brothers sold him to Ishmaelite merchants for twenty pieces of silver (Genesis 37:28)."
  },
  {
    question: "Who interpreted Pharaoh's dreams in Egypt?",
    options: ["Moses", "Aaron", "Joseph", "Daniel"],
    correctAnswer: "Joseph",
    explanation: "Joseph interpreted Pharaoh's dreams about seven years of plenty and seven years of famine (Genesis 41)."
  },
  {
    question: "Who was found in a basket in the Nile River?",
    options: ["Jesus", "Moses", "John", "Isaac"],
    correctAnswer: "Moses",
    explanation: "Moses' mother hid him in a basket to save him from Pharaoh's decree (Exodus 2)."
  },
  {
    question: "How many plagues did God send upon Egypt?",
    options: ["3", "7", "10", "12"],
    correctAnswer: "10",
    explanation: "God sent ten plagues to convince Pharaoh to let the Israelites go."
  },
  {
    question: "What sea did the Israelites cross on dry land?",
    options: ["Dead Sea", "Red Sea", "Sea of Galilee", "Mediterranean Sea"],
    correctAnswer: "Red Sea",
    explanation: "God parted the Red Sea so the Israelites could escape the Egyptian army (Exodus 14)."
  },
  {
    question: "What food did God provide for the Israelites in the wilderness?",
    options: ["Bread", "Manna", "Fruit", "Meat"],
    correctAnswer: "Manna",
    explanation: "God provided manna from heaven every morning for forty years (Exodus 16)."
  },
  {
    question: "Who led the Israelites into the Promised Land after Moses died?",
    options: ["Caleb", "Joshua", "Aaron", "Eleazar"],
    correctAnswer: "Joshua",
    explanation: "Joshua was chosen by God to succeed Moses and lead the people into Canaan."
  },
  {
    question: "What city's walls fell after the Israelites marched around them?",
    options: ["Jerusalem", "Jericho", "Ai", "Gaza"],
    correctAnswer: "Jericho",
    explanation: "The walls of Jericho collapsed after the Israelites marched around them for seven days (Joshua 6)."
  },
  {
    question: "Who was the female judge of Israel?",
    options: ["Ruth", "Esther", "Deborah", "Jael"],
    correctAnswer: "Deborah",
    explanation: "Deborah was a prophetess and the only female judge mentioned in the Bible (Judges 4)."
  },
  {
    question: "Who was the prophet who anointed both Saul and David?",
    options: ["Nathan", "Samuel", "Elijah", "Elisha"],
    correctAnswer: "Samuel",
    explanation: "Samuel was the last judge and the prophet who anointed Israel's first two kings."
  },
  {
    question: "Who was David's best friend and the son of King Saul?",
    options: ["Jonathan", "Abner", "Joab", "Absalom"],
    correctAnswer: "Jonathan",
    explanation: "David and Jonathan shared a deep and faithful friendship (1 Samuel 18)."
  },
  {
    question: "Who was the wisest king of Israel?",
    options: ["David", "Saul", "Solomon", "Hezekiah"],
    correctAnswer: "Solomon",
    explanation: "God granted Solomon wisdom beyond any other man (1 Kings 3)."
  },
  {
    question: "Who built the first Temple in Jerusalem?",
    options: ["David", "Solomon", "Zerubbabel", "Herod"],
    correctAnswer: "Solomon",
    explanation: "Solomon fulfilled his father David's dream by building the Temple (1 Kings 6)."
  },
  {
    question: "Who was the prophet taken to heaven in a whirlwind?",
    options: ["Moses", "Elijah", "Elisha", "Isaiah"],
    correctAnswer: "Elijah",
    explanation: "Elijah was taken up to heaven in a chariot of fire and a whirlwind (2 Kings 2)."
  },
  {
    question: "Who was the queen who saved her people from Haman's plot?",
    options: ["Jezebel", "Vashti", "Esther", "Athaliah"],
    correctAnswer: "Esther",
    explanation: "Queen Esther risked her life to plead for the Jews before King Xerxes."
  },
  {
    question: "Who was thrown into the lions' den for praying to God?",
    options: ["Daniel", "Jeremiah", "Ezekiel", "Hosea"],
    correctAnswer: "Daniel",
    explanation: "Daniel was miraculously protected by God in the lions' den (Daniel 6)."
  },
  {
    question: "Who were the three friends of Daniel thrown into the fiery furnace?",
    options: ["Peter, James, and John", "Shadrach, Meshach, and Abednego", "Paul, Silas, and Barnabas", "Caleb, Joshua, and Aaron"],
    correctAnswer: "Shadrach, Meshach, and Abednego",
    explanation: "They refused to bow to an idol and were saved by God from the fire (Daniel 3)."
  },
  {
    question: "Who was the forerunner of Jesus, baptizing people in the Jordan?",
    options: ["Peter", "John the Baptist", "Andrew", "Philip"],
    correctAnswer: "John the Baptist",
    explanation: "John the Baptist prepared the way for Jesus' ministry (Matthew 3)."
  },
  {
    question: "Where was Jesus baptized?",
    options: ["Sea of Galilee", "Jordan River", "Dead Sea", "Nile River"],
    correctAnswer: "Jordan River",
    explanation: "Jesus was baptized by John in the Jordan River (Matthew 3:13)."
  },
  {
    question: "How many days did Jesus fast in the wilderness?",
    options: ["7", "12", "40", "50"],
    correctAnswer: "40",
    explanation: "Jesus fasted for forty days and forty nights before being tempted (Matthew 4:2)."
  },
  {
    question: "What was Jesus' first miracle?",
    options: ["Healing a blind man", "Walking on water", "Turning water into wine", "Feeding the 5000"],
    correctAnswer: "Turning water into wine",
    explanation: "Jesus performed this miracle at a wedding in Cana (John 2)."
  },
  {
    question: "Who was the disciple who denied Jesus three times?",
    options: ["Judas", "Thomas", "Peter", "John"],
    correctAnswer: "Peter",
    explanation: "Peter denied knowing Jesus three times before the rooster crowed (Matthew 26)."
  },
  {
    question: "Who was the disciple who betrayed Jesus for 30 pieces of silver?",
    options: ["Peter", "Judas Iscariot", "Thomas", "Bartholomew"],
    correctAnswer: "Judas Iscariot",
    explanation: "Judas led the soldiers to Jesus in the Garden of Gethsemane (Matthew 26)."
  },
  {
    question: "On what day did Jesus rise from the dead?",
    options: ["The first day", "The second day", "The third day", "The seventh day"],
    correctAnswer: "The third day",
    explanation: "Jesus rose on the third day, which we celebrate as Easter Sunday."
  },
  {
    question: "Who was the first person to see the risen Jesus?",
    options: ["Peter", "John", "Mary Magdalene", "Mother Mary"],
    correctAnswer: "Mary Magdalene",
    explanation: "Mary Magdalene saw Jesus at the tomb on the morning of His resurrection (John 20)."
  },
  {
    question: "Who was the Pharisee who came to Jesus at night?",
    options: ["Gamaliel", "Nicodemus", "Caiaphas", "Saul"],
    correctAnswer: "Nicodemus",
    explanation: "Jesus told Nicodemus that he must be 'born again' (John 3)."
  },
  {
    question: "What is the 'Great Commission'?",
    options: ["A large tax", "Jesus' command to make disciples of all nations", "The building of the Temple", "The Ten Commandments"],
    correctAnswer: "Jesus' command to make disciples of all nations",
    explanation: "Jesus gave this command to His disciples before His ascension (Matthew 28:19-20)."
  },
  {
    question: "Who wrote the most books in the New Testament?",
    options: ["Peter", "John", "Paul", "Luke"],
    correctAnswer: "Paul",
    explanation: "Apostle Paul wrote 13 (or 14) epistles in the New Testament."
  },
  {
    question: "What was Paul's name before he became a Christian?",
    options: ["Simon", "Saul", "Levi", "Stephen"],
    correctAnswer: "Saul",
    explanation: "Saul was a persecutor of Christians before his conversion."
  },
  {
    question: "On what road did Saul have his encounter with Jesus?",
    options: ["Road to Jericho", "Road to Emmaus", "Road to Damascus", "Road to Jerusalem"],
    correctAnswer: "Road to Damascus",
    explanation: "A bright light from heaven blinded Saul on his way to Damascus (Acts 9)."
  },
  {
    question: "Who was the first Christian martyr?",
    options: ["Peter", "Paul", "Stephen", "James"],
    correctAnswer: "Stephen",
    explanation: "Stephen was stoned to death for his faith in Jesus (Acts 7)."
  },
  {
    question: "What is the last word of the Bible?",
    options: ["Hallelujah", "Amen", "Forever", "Life"],
    correctAnswer: "Amen",
    explanation: "The Bible ends with 'The grace of our Lord Jesus Christ be with you all. Amen.' (Revelation 22:21)."
  },
  {
    question: "Who was the father of John the Baptist?",
    options: ["Joseph", "Zechariah", "Simeon", "Levi"],
    correctAnswer: "Zechariah",
    explanation: "Zechariah was a priest who was told by an angel he would have a son (Luke 1)."
  },
  {
    question: "How many people did Jesus feed with five loaves and two fish?",
    options: ["1000", "3000", "5000", "10000"],
    correctAnswer: "5000",
    explanation: "Jesus fed 5,000 men, besides women and children (Matthew 14)."
  },
  {
    question: "What was the name of the garden where Jesus prayed before His arrest?",
    options: ["Eden", "Gethsemane", "Carmel", "Olivet"],
    correctAnswer: "Gethsemane",
    explanation: "Jesus prayed in Gethsemane while His disciples slept (Matthew 26)."
  },
  {
    question: "Who was the Roman governor who sentenced Jesus to be crucified?",
    options: ["Herod", "Pontius Pilate", "Felix", "Festus"],
    correctAnswer: "Pontius Pilate",
    explanation: "Pilate washed his hands, saying he was innocent of Jesus' blood (Matthew 27)."
  },
  {
    question: "What was the name of the mountain where Moses received the Law?",
    options: ["Nebo", "Sinai", "Tabor", "Hermon"],
    correctAnswer: "Sinai",
    explanation: "Moses spent 40 days on Mount Sinai receiving the Ten Commandments (Exodus 19)."
  }
];

export default function Trivia() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const { profile } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Shuffle questions
    const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
  }, []);

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    
    if (option === questions[currentQuestionIndex].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
      if (profile) {
        const xpEarned = score * 20;
        try {
          await updateDoc(doc(db, 'users', profile.uid), {
            totalXP: increment(xpEarned)
          });
          addNotification(`Trivia complete! Earned ${xpEarned} XP`, 'success');
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${profile.uid}`);
        }
      }
    }
  };

  const resetTrivia = () => {
    const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
  };

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-20 px-4 sm:px-0">
      <header className="text-center space-y-3 md:space-y-4">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-500 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-amber-200 mx-auto rotate-6">
          <Brain size={32} className="md:w-10 md:h-10" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase font-display tracking-tight">Bible Trivia</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">Test your knowledge and earn XP!</p>
      </header>

      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-slate-100 shadow-xl p-6 md:p-12 space-y-6 md:space-y-8"
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-100 rounded-xl text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-1.5 md:gap-2 text-amber-500 font-black text-sm md:text-base">
                <Star size={14} className="md:w-4 md:h-4" fill="currentColor" />
                <span>{score} Correct</span>
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
              {currentQuestion.question}
            </h2>

            <div className="grid gap-3 md:gap-4">
              {currentQuestion.options.map((option) => {
                const isCorrect = option === currentQuestion.correctAnswer;
                const isSelected = option === selectedOption;
                
                return (
                  <button
                    key={option}
                    onClick={() => handleOptionSelect(option)}
                    disabled={isAnswered}
                    className={cn(
                      "w-full p-4 md:p-6 rounded-xl md:rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between group text-sm md:text-base",
                      !isAnswered && "border-slate-100 hover:border-amber-500 hover:bg-amber-50",
                      isAnswered && isCorrect && "border-primary-500 bg-primary-50 text-primary-700",
                      isAnswered && isSelected && !isCorrect && "border-rose-500 bg-rose-50 text-rose-700",
                      isAnswered && !isCorrect && !isSelected && "border-slate-50 opacity-50"
                    )}
                  >
                    <span>{option}</span>
                    {isAnswered && isCorrect && <CheckCircle2 size={20} className="md:w-6 md:h-6 text-primary-500" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle size={20} className="md:w-6 md:h-6 text-rose-500" />}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="p-4 md:p-6 bg-slate-50 rounded-xl md:rounded-2xl border-2 border-slate-100">
                  <p className="text-slate-600 font-medium italic text-sm md:text-base">
                    {currentQuestion.explanation}
                  </p>
                </div>
                <button
                  onClick={handleNext}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Trivia'}
                  <ArrowRight size={18} className="md:w-5 md:h-5" />
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-slate-100 shadow-xl p-8 md:p-12 text-center space-y-6 md:space-y-8"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 bg-amber-100 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center text-amber-500 mx-auto">
              <Trophy size={40} className="md:w-12 md:h-12" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase font-display tracking-tight">Trivia Complete!</h2>
              <p className="text-slate-500 font-medium text-base md:text-lg">
                You got {score} out of {questions.length} correct.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                onClick={resetTrivia}
                className="flex-1 py-4 bg-amber-500 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm shadow-xl shadow-amber-200 hover:bg-amber-600 transition-all flex items-center justify-center gap-3"
              >
                <RotateCcw size={18} className="md:w-5 md:h-5" />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm hover:bg-slate-200 transition-all"
              >
                Back Home
              </button>
            </div>

            <div className="pt-6 md:pt-8 border-t border-slate-100">
              <div className="flex items-center justify-center gap-2 text-primary-600 font-black uppercase tracking-widest text-xs md:text-sm">
                <Zap size={18} className="md:w-5 md:h-5" fill="currentColor" />
                <span>Earned {score * 20} XP</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
