import { collection, doc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

import { BIBLE_BASICS_LESSONS } from './data/bible-basics';
import { PARABLES_LESSONS } from './data/parables';
import { APOSTLES_LESSONS } from './data/apostles';
import { CHRISTIAN_LIVING_LESSONS } from './data/christian-living';

const OFFICIAL_LESSONS = [
  ...BIBLE_BASICS_LESSONS,
  ...PARABLES_LESSONS,
  ...APOSTLES_LESSONS,
  ...CHRISTIAN_LIVING_LESSONS
];

export async function seedOfficialLessons() {
  const batch = writeBatch(db);

  for (const lessonData of OFFICIAL_LESSONS) {
    const { quizzes, ...lesson } = lessonData;
    const lessonRef = doc(db, 'lessons', lesson.id);
    batch.set(lessonRef, lesson);

    // Add quizzes
    for (let i = 0; i < quizzes.length; i++) {
      const quiz = quizzes[i];
      const quizId = `${lesson.id}_q${i + 1}`;
      const quizRef = doc(db, 'lessons', lesson.id, 'quizzes', quizId);
      batch.set(quizRef, {
        ...quiz,
        id: quizId,
        lessonId: lesson.id
      });
    }
  }

  await batch.commit();
  console.log('Official lessons and quizzes seeded successfully!');
}
