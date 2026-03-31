require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Lecture = require('../models/Lecture');
const Quiz = require('../models/Quiz');
const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear existing
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Lecture.deleteMany({}),
    Quiz.deleteMany({}),
  ]);

  // Create admin
  const admin = await User.create({
    name: 'Learnify Admin',
    email: 'admin@learnify.com',
    password: 'Admin@123',
    role: 'admin',
  });
  console.log('✅ Admin created: admin@learnify.com / Admin@123');

  // Create demo student
  await User.create({
    name: 'Demo Student',
    email: 'student@learnify.com',
    password: 'Student@123',
    role: 'student',
  });
  console.log('✅ Student created: student@learnify.com / Student@123');

  // Create courses
  const course1 = await Course.create({
    title: 'Complete React Developer Course',
    description: 'Master React from scratch. Learn hooks, context, Redux, and build real-world projects. This comprehensive course covers everything from JSX basics to advanced patterns used in production applications.',
    price: 0,
    isFree: true,
    category: 'Web Development',
    level: 'Beginner',
    instructor: admin._id,
    isPublished: true,
    totalStudents: 0,
    tags: ['React', 'JavaScript', 'Frontend'],
  });

  const course2 = await Course.create({
    title: 'Node.js & Express Backend Development',
    description: 'Build scalable REST APIs with Node.js, Express, and MongoDB. Learn authentication, file uploads, real-time features with Socket.io, and deploy to production.',
    price: 0,
    isFree: true,
    category: 'Web Development',
    level: 'Intermediate',
    instructor: admin._id,
    isPublished: true,
    totalStudents: 0,
    tags: ['Node.js', 'Express', 'MongoDB', 'Backend'],
  });

  const course3 = await Course.create({
    title: 'Full-Stack MERN Masterclass',
    description: 'The ultimate guide to building production-ready full-stack applications with MongoDB, Express, React, and Node.js. Includes JWT auth, payments, real-time chat, and deployment.',
    price: 1999,
    isFree: false,
    category: 'Web Development',
    level: 'Advanced',
    instructor: admin._id,
    isPublished: true,
    totalStudents: 0,
    tags: ['MERN', 'Full-Stack', 'Advanced'],
  });

  // Lectures for course1
  const lectures1 = await Lecture.insertMany([
    { title: 'Introduction to React', description: 'What is React and why use it?', course: course1._id, youtubeUrl: 'https://www.youtube.com/embed/Ke90Tje7VS0', order: 1, isFreePreview: true },
    { title: 'JSX and Components', description: 'Understanding JSX syntax and creating your first components.', course: course1._id, youtubeUrl: 'https://www.youtube.com/embed/RGKi6LSPDLU', order: 2 },
    { title: 'Props and State', description: 'Learn how to pass data with props and manage state.', course: course1._id, youtubeUrl: 'https://www.youtube.com/embed/4ORZ1GmjaMc', order: 3 },
    { title: 'React Hooks (useState & useEffect)', description: 'Deep dive into React hooks.', course: course1._id, youtubeUrl: 'https://www.youtube.com/embed/O6P86uwfdR0', order: 4 },
  ]);

  // Lectures for course2
  const lectures2 = await Lecture.insertMany([
    { title: 'Node.js Fundamentals', description: 'Intro to Node.js runtime and npm.', course: course2._id, youtubeUrl: 'https://www.youtube.com/embed/TlB_eWDSMt4', order: 1, isFreePreview: true },
    { title: 'Express.js Routing', description: 'Building REST APIs with Express.', course: course2._id, youtubeUrl: 'https://www.youtube.com/embed/L72fhGm1tfE', order: 2 },
    { title: 'MongoDB & Mongoose', description: 'Database operations with Mongoose ODM.', course: course2._id, youtubeUrl: 'https://www.youtube.com/embed/bxsemcrY4gQ', order: 3 },
  ]);

  // Quizzes
  await Quiz.create({
    lecture: lectures1[0]._id,
    course: course1._id,
    passingScore: 60,
    questions: [
      { question: 'What is React?', options: ['A CSS framework', 'A JavaScript library for building UIs', 'A database', 'A server framework'], correctOption: 1, explanation: 'React is a JavaScript library for building user interfaces, developed by Facebook.' },
      { question: 'Who created React?', options: ['Google', 'Microsoft', 'Facebook (Meta)', 'Twitter'], correctOption: 2, explanation: 'React was created by Jordan Walke at Facebook and open-sourced in 2013.' },
      { question: 'What does JSX stand for?', options: ['JavaScript XML', 'JavaScript Extension', 'Java Syntax Extension', 'JSON XML'], correctOption: 0, explanation: 'JSX stands for JavaScript XML, allowing you to write HTML-like syntax in JavaScript.' },
      { question: 'What is a React component?', options: ['A CSS class', 'A reusable piece of UI', 'A database table', 'A server route'], correctOption: 1, explanation: 'A React component is a reusable, self-contained piece of user interface.' },
    ],
  });

  await Quiz.create({
    lecture: lectures1[2]._id,
    course: course1._id,
    passingScore: 60,
    questions: [
      { question: 'Which hook is used to manage component state?', options: ['useEffect', 'useContext', 'useState', 'useRef'], correctOption: 2, explanation: 'useState is the hook for adding state to functional components.' },
      { question: 'Props in React are:', options: ['Mutable', 'Read-only', 'Deleted after render', 'Server-side only'], correctOption: 1, explanation: 'Props are read-only and should never be modified by the receiving component.' },
      { question: 'What triggers a re-render in React?', options: ['CSS change', 'State or props change', 'DOM manipulation', 'Browser resize'], correctOption: 1, explanation: 'React re-renders a component when its state or props change.' },
      { question: 'Which method is called after every render?', options: ['useState', 'useEffect', 'useCallback', 'useMemo'], correctOption: 1, explanation: 'useEffect runs after every render by default, unless a dependency array is provided.' },
    ],
  });

  await Quiz.create({
    lecture: lectures2[0]._id,
    course: course2._id,
    passingScore: 60,
    questions: [
      { question: 'Node.js runs JavaScript on the:', options: ['Browser', 'Server', 'Database', 'Mobile'], correctOption: 1, explanation: 'Node.js is a server-side JavaScript runtime built on Chrome V8 engine.' },
      { question: 'What is npm?', options: ['Node Package Manager', 'New Project Manager', 'Network Protocol Manager', 'None of the above'], correctOption: 0, explanation: 'npm stands for Node Package Manager, used to manage JavaScript packages.' },
      { question: 'Node.js is:', options: ['Synchronous', 'Blocking', 'Single-threaded and event-driven', 'Multi-threaded'], correctOption: 2, explanation: 'Node.js uses a single-threaded, event-driven architecture with non-blocking I/O.' },
      { question: 'Which module system does Node.js use natively?', options: ['ES Modules only', 'CommonJS (require/module.exports)', 'AMD', 'UMD'], correctOption: 1, explanation: 'Node.js natively uses CommonJS module system with require() and module.exports.' },
    ],
  });

  console.log('✅ Courses, lectures, and quizzes seeded!');
  console.log('\n🎉 Seeding complete! Start the server with: npm run dev');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
