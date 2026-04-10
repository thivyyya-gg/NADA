import React, { useState, useEffect, useRef, memo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Music2, 
  ChevronRight, 
  Clock, 
  Star, 
  Play, 
  BookOpen, 
  User, 
  Home as HomeIcon, 
  Users, 
  MessageSquare, 
  Wallet, 
  Bell, 
  Mail,
  CheckCircle2, 
  XCircle, 
  Calendar, 
  MoreVertical, 
  Search, 
  Filter, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowUpDown,
  Settings, 
  Video, 
  TrendingUp,
  Paperclip, 
  Send,
  ChevronLeft,
  Camera,
  MapPin,
  Award,
  DollarSign,
  Image as ImageIcon,
  FileText,
  Edit2,
  Trash2,
  Move,
  Upload,
  Circle,
  Link,
  MoreHorizontal,
  LogOut,
  Phone,
  AlertCircle,
  Sun,
  Moon,
  Lock,
  Inbox,
  Music,
  Guitar,
  Download,
  ClipboardList,
  Check,
  HelpCircle,
  Info,
  History,
  CreditCard,
  Bot,
  Sparkles,
  Zap,
  Brain,
  Lightbulb,
  Target,
  MessageCircle,
  Volume2,
  Eye,
  Shield,
  ShieldAlert,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc,
  getDoc,
  setDoc,
  getDocFromServer,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { auth, db } from './firebase';

// --- Firebase Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- Types ---

type AuthView = 'splash' | 'role-selection' | 'student-registration' | 'mentor-registration' | 'sign-in' | 'forgot-password' | 'reset-password';
type View = 'home' | 'students' | 'messages' | 'wallet' | 'profile' | 'registration' | 'log-session' | 'student-detail' | 'full-schedule' | 'auth';
type StudentView = 'home' | 'mentor-listing' | 'mentor-profile' | 'journey' | 'messages' | 'profile' | 'book-trial' | 'book-paid' | 'schedule-view';

interface Instrument {
  id: string;
  name: string;
  nativeName: string;
  type: 'String' | 'Percussion' | 'Wind' | 'Plucked';
  culture: 'Malay' | 'Indian' | 'Chinese' | 'Borneo';
  story: string;
  mentorCount: number;
  photo: string;
}

interface MentorDetail {
  id: string;
  name: string;
  tagline: string;
  photo: string;
  rating: number;
  reviewCount: number;
  location: string;
  address: string;
  pricePerLesson: number;
  studentsCount: number;
  experienceYears: number;
  about: string;
  specialisation: string[];
  teachingStyle: string[];
  languages: string[];
  introVideoUrl?: string;
  isVerified: boolean;
  packages: LessonPackage[];
  reviews: StudentReview[];
  credentials: string[];
  gallery: string[];
  certifications?: any[];
  idDocument?: string | null;
}

interface LessonPackage {
  id: string;
  name: string;
  lessons: number;
  price: number;
  validityMonths?: number;
  description?: string;
}

interface StudentReview {
  id: string;
  studentName: string;
  lessonsTaken: number;
  rating: number;
  comment: string;
  timeAgo: string;
}

interface Student {
  id: string;
  name: string;
  email?: string;
  instrument: string;
  stage: string;
  lessonsRemaining: number;
  lastLesson: string;
  lastSession?: string;
  nextSession?: string;
  package: 'Trial' | 'Single' | 'Package 8' | 'Package 12' | 'Monthly';
  photo: string;
  progress: number;
  privateNotes?: string;
  learningPath?: Milestone[];
  totalLessons?: number;
  aboutMe?: string;
}

interface Milestone {
  id: string;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
  description?: string;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

interface SessionLog {
  id: string;
  studentId: string;
  lessonNumber: number;
  date: string;
  covered: string;
  focus: string;
  milestones: string[]; // IDs of milestones ticked
  materials: string[]; // IDs of materials attached
}

interface Material {
  id: string;
  studentId: string;
  type: 'Notes' | 'Guide' | 'PDF';
  title: string;
  lessonId?: string; // Linked lesson ID
  date: string;
  url: string;
}

interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  studentPhoto: string;
  date: string;
  lessonType: 'Trial' | 'Single' | 'Package' | 'Monthly';
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  isPartOfPackage?: boolean;
  completedAt?: any;
  status?: string;
}

interface Withdrawal {
  id: string;
  date: string;
  amount: number;
  bankAccount: string;
  status: 'Processed' | 'Pending';
}

interface Lesson {
  id: string;
  studentId: string;
  studentName: string;
  instrument: string;
  time: string;
  date: string;
  lessonNumber: number;
  type: 'Trial' | 'Single' | 'Package' | 'Monthly';
  countdown?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  studentNote?: string;
}

interface Message {
  id: string;
  studentId: string;
  text: string;
  time: string;
  isMe: boolean;
}

// --- Mock Data ---

const MOCK_STUDENTS: Student[] = [
  { 
    id: 's1', 
    name: 'Sarah Jenkins', 
    email: 'sarah.j@example.com',
    instrument: 'Gambus', 
    stage: 'Stage 2 — Developing', 
    lessonsRemaining: 4, 
    lastLesson: '2024-03-12', 
    lastSession: '2 days ago',
    nextSession: 'Tomorrow, 4:00 PM',
    package: 'Package 8', 
    photo: 'https://picsum.photos/seed/woman5/200', 
    progress: 45,
    totalLessons: 8,
    aboutMe: "I've always been fascinated by the sound of the Gambus. I want to learn how to play Zapin music properly.",
    privateNotes: "Learns best with visual examples. Tends to rush — slow down exercises help. Prefers morning lessons.",
    learningPath: [
      { id: 'm1', title: 'Stage 1 — Foundation', status: 'completed', description: 'Hold and position the Gambus correctly, Tune all strings by ear, Basic open string plucking, First chord shape, Simple Zapin strumming pattern' },
      { id: 'm2', title: 'Stage 2 — Developing', status: 'current', description: 'Full Zapin rhythm pattern, Chord transitions, First traditional melody, Basic ornamentation' },
      { id: 'm3', title: 'Stage 3 — Progressing', status: 'upcoming', description: 'Full song performance, Advanced chord shapes, Improvisation basics, Dynamic control' },
      { id: 'm4', title: 'Stage 4 — Performance Ready', status: 'upcoming', description: 'Full repertoire of 3 songs, Stage performance technique, Cultural context and storytelling, Solo performance' },
    ]
  },
  { 
    id: 's2', 
    name: 'Marcus Chen', 
    email: 'marcus.c@example.com',
    instrument: 'Erhu', 
    stage: 'Stage 3 — Progressing', 
    lessonsRemaining: 1, 
    lastLesson: '2024-03-14', 
    lastSession: 'Yesterday',
    nextSession: 'Thursday, 5:30 PM',
    package: 'Single', 
    photo: 'https://picsum.photos/seed/man9/200', 
    progress: 75, 
    totalLessons: 1,
    aboutMe: "I played violin in school, but the Erhu has a much more expressive sound that I love.",
    learningPath: [
      { id: 'm1', title: 'Stage 1 — Foundation', status: 'completed', description: 'Correct bow hold and posture, Open string tone production, D major scale, Basic bow control' },
      { id: 'm2', title: 'Stage 2 — Developing', status: 'completed', description: 'First traditional melody, Vibrato introduction, Position shifting basics, Dynamic control' },
      { id: 'm3', title: 'Stage 3 — Progressing', status: 'current', description: 'Advanced vibrato and slides, Full song performance, Ornamentation techniques, Expression and phrasing' },
      { id: 'm4', title: 'Stage 4 — Performance Ready', status: 'upcoming', description: 'Full repertoire, Advanced techniques mastery, Stage presence, Solo performance' },
    ]
  },
  { 
    id: 's3', 
    name: 'Elena Rodriguez', 
    email: 'elena.r@example.com',
    instrument: 'Sitar', 
    stage: 'Stage 1 — Foundation', 
    lessonsRemaining: 12, 
    lastLesson: '2024-03-10', 
    lastSession: '1 week ago',
    nextSession: 'Saturday, 10:00 AM',
    package: 'Monthly', 
    photo: 'https://picsum.photos/seed/woman6/200', 
    progress: 15, 
    totalLessons: 12,
    aboutMe: "I'm a world traveler and I want to learn the instruments of the cultures I visit.",
    learningPath: [
      { id: 'm1', title: 'Stage 1 — Foundation', status: 'current', description: 'Correct sitting posture and hold, Right hand Mizrab technique, Basic Raga notes, Simple Alap' },
      { id: 'm2', title: 'Stage 2 — Developing', status: 'upcoming', description: 'First full Raga, Gat pattern basics, Left hand slides and pulls, Rhythm coordination' },
      { id: 'm3', title: 'Stage 3 — Progressing', status: 'upcoming', description: 'Advanced Raga development, Jhala technique, Improvisation within Raga, Speed and clarity' },
      { id: 'm4', title: 'Stage 4 — Performance Ready', status: 'upcoming', description: 'Full Raga performance, Alap, Jor, Jhala mastery, Stage presence, Solo concert readiness' },
    ]
  },
  { 
    id: 's4', 
    name: 'Ahmad Fauzi', 
    email: 'ahmad.f@example.com',
    instrument: 'Gambus', 
    stage: 'New Student', 
    lessonsRemaining: 0, 
    lastLesson: '-', 
    package: 'Trial', 
    photo: 'https://picsum.photos/seed/man10/200', 
    progress: 0, 
    totalLessons: 1,
    aboutMe: "Interested in traditional Malay music.",
    learningPath: []
  },
  { 
    id: 's5', 
    name: 'Mei Ling', 
    email: 'mei.l@example.com',
    instrument: 'Guzheng', 
    stage: 'New Student', 
    lessonsRemaining: 0, 
    lastLesson: '-', 
    package: 'Trial', 
    photo: 'https://picsum.photos/seed/woman7/200', 
    progress: 0, 
    totalLessons: 1,
    aboutMe: "Love the sound of Guzheng.",
    learningPath: []
  },
  { 
    id: 's6', 
    name: 'Karthik Raja', 
    email: 'karthik.r@example.com',
    instrument: 'Tabla', 
    stage: 'New Student', 
    lessonsRemaining: 0, 
    lastLesson: '-', 
    package: 'Trial', 
    photo: 'https://picsum.photos/seed/man11/200', 
    progress: 0, 
    totalLessons: 1,
    aboutMe: "Fascinated by Indian rhythms.",
    learningPath: []
  },
  { 
    id: 's7', 
    name: 'Zhi Wei', 
    email: 'zhi.w@example.com',
    instrument: 'Pipa', 
    stage: 'Stage 3 — Progressing', 
    lessonsRemaining: 3, 
    lastLesson: '2024-03-20', 
    package: 'Package 12', 
    photo: 'https://picsum.photos/seed/man18/200', 
    progress: 65, 
    totalLessons: 12,
    aboutMe: "I've been playing Pipa for a few years and want to improve my speed and precision.",
    learningPath: [
      { id: 'm1', title: 'Stage 1 — Foundation', status: 'completed', description: 'Basic plucking, Tuning, Simple melodies' },
      { id: 'm2', title: 'Stage 2 — Developing', status: 'completed', description: 'Intermediate techniques, Traditional songs' },
      { id: 'm3', title: 'Stage 3 — Progressing', status: 'current', description: 'Advanced techniques, Complex rhythms' },
    ]
  }
];

const MOCK_SESSION_LOGS: SessionLog[] = [
  {
    id: 'log4',
    studentId: 's1',
    lessonNumber: 4,
    date: '2024-03-12',
    covered: 'Reviewed basic Zapin rhythm. Focused on the downbeat and plucking strength.',
    focus: 'Practice the transition between the first and second rhythm patterns. Keep the wrist relaxed.',
    milestones: ['m3'],
    materials: ['mat1']
  },
  {
    id: 'log3',
    studentId: 's1',
    lessonNumber: 3,
    date: '2024-03-05',
    covered: 'Introduction to syncopated rhythms. Worked on hand positioning.',
    focus: 'Daily 15 mins of scale exercises.',
    milestones: ['m2'],
    materials: []
  },
  {
    id: 'log2',
    studentId: 's1',
    lessonNumber: 2,
    date: '2024-02-26',
    covered: 'Basic plucking techniques and tuning the Gambus.',
    focus: 'Focus on the G and D strings.',
    milestones: ['m1'],
    materials: []
  },
  {
    id: 'log1',
    studentId: 's1',
    lessonNumber: 1,
    date: '2024-02-19',
    covered: 'First lesson! Introduction to the instrument and posture.',
    focus: 'Correct sitting posture.',
    milestones: [],
    materials: []
  },
  {
    id: 'log_m2_1',
    studentId: 's2',
    lessonNumber: 1,
    date: '2024-03-14',
    covered: 'Introduction to Erhu bowing. D major scale practice.',
    focus: 'Maintain consistent pressure on the bow. Watch the angle of the bow against the strings.',
    milestones: ['m1'],
    materials: ['mat2']
  }
];

const MOCK_MATERIALS: Material[] = [
  {
    id: 'mat1',
    studentId: 's1',
    type: 'Notes',
    title: 'Zapin Rhythm Basics',
    lessonId: 'log4',
    date: '2024-03-12',
    url: '#'
  },
  {
    id: 'mat2',
    studentId: 's2',
    type: 'Guide',
    title: 'Erhu Bowing Technique',
    lessonId: 'log2',
    date: '2024-03-14',
    url: '#'
  }
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    studentId: 's1',
    studentName: 'Sarah Jenkins',
    studentPhoto: 'https://picsum.photos/seed/woman5/200',
    date: '2024-03-14',
    lessonType: 'Package',
    grossAmount: 612,
    platformFee: 91.8,
    netAmount: 520.2
  },
  {
    id: 't2',
    studentId: 's2',
    studentName: 'Marcus Chen',
    studentPhoto: 'https://picsum.photos/seed/man9/200',
    date: '2024-03-13',
    lessonType: 'Single',
    grossAmount: 120,
    platformFee: 18,
    netAmount: 102
  },
  {
    id: 't3',
    studentId: 's3',
    studentName: 'Elena Rodriguez',
    studentPhoto: 'https://picsum.photos/seed/woman6/200',
    date: '2024-03-10',
    lessonType: 'Monthly',
    grossAmount: 350,
    platformFee: 52.5,
    netAmount: 297.5
  }
];

const MOCK_WITHDRAWALS: Withdrawal[] = [
  {
    id: 'w1',
    date: '2024-03-12',
    amount: 1500,
    bankAccount: 'Maybank **** 8821',
    status: 'Processed'
  },
  {
    id: 'w2',
    date: '2024-03-15',
    amount: 800,
    bankAccount: 'Maybank **** 8821',
    status: 'Pending'
  }
];

const MOCK_LESSONS: Lesson[] = [
  { id: 'l1', studentId: 's1', studentName: 'Sarah Jenkins', instrument: 'Gambus', time: '14:00', date: '2024-03-15', lessonNumber: 5, type: 'Package', status: 'confirmed' },
  { id: 'l2', studentId: 's2', studentName: 'Marcus Chen', instrument: 'Erhu', time: '16:30', date: '2024-03-15', lessonNumber: 2, type: 'Single', status: 'confirmed' },
  { id: 'l3', studentId: 's3', studentName: 'Elena Rodriguez', instrument: 'Sitar', time: '11:00', date: '2024-03-16', lessonNumber: 1, type: 'Monthly', status: 'confirmed' },
  { id: 'l4', studentId: 's4', studentName: 'Ahmad Fauzi', instrument: 'Gambus', time: '10:00', date: '2024-03-22', lessonNumber: 1, type: 'Trial', status: 'pending', countdown: '2h 15m', studentNote: "Hi, I'm a complete beginner. Looking forward to learning the basics!" },
  { id: 'l5', studentId: 's5', studentName: 'Mei Ling', instrument: 'Guzheng', time: '15:00', date: '2024-03-23', lessonNumber: 1, type: 'Trial', status: 'pending', countdown: '5h 40m', studentNote: "I've played a bit before, but want to focus on traditional techniques." },
  { id: 'l6', studentId: 's6', studentName: 'Karthik Raja', instrument: 'Tabla', time: '18:30', date: '2024-03-24', lessonNumber: 1, type: 'Trial', status: 'pending', countdown: '12h 10m', studentNote: "Interested in the rhythmic patterns of the Tabla. Can we start with basic bols?" },
  { id: 'l7', studentId: 's7', studentName: 'Siti Aminah', instrument: 'Oud', time: '11:00', date: '2024-03-25', lessonNumber: 1, type: 'Single', status: 'pending', studentNote: "I want to learn how to play some traditional Malay songs on the Oud." },
  { id: 'l8', studentId: 's8', studentName: 'Wei Kang', instrument: 'Pipa', time: '14:30', date: '2024-03-26', lessonNumber: 1, type: 'Package', status: 'pending', studentNote: "Booking the 8-lesson package to get a solid foundation in Pipa." },
];

const MOCK_MESSAGES = [
  {
    id: 'ch1',
    mentorId: 'm1',
    studentId: 's1',
    lastMessage: 'Looking forward to our next session!',
    timestamp: '2h ago',
    unreadCount: 0,
    messages: [
      { id: 'msg1', sender: 'mentor', text: 'Hi Sarah, how was your practice session today?', timestamp: '10:00 AM' },
      { id: 'msg2', sender: 'student', text: 'It was great! I managed to master the basic Zapin rhythm.', timestamp: '10:15 AM' },
      { id: 'msg3', sender: 'mentor', text: 'Excellent! Looking forward to our next session!', timestamp: '10:20 AM' }
    ]
  },
  {
    id: 'ch2',
    mentorId: 'm2',
    studentId: 's2',
    lastMessage: 'Can we reschedule to 5 PM?',
    timestamp: '1d ago',
    unreadCount: 1,
    messages: [
      { id: 'msg4', sender: 'student', text: 'Hi Guru Rajesh, can we reschedule to 5 PM?', timestamp: 'Yesterday' }
    ]
  }
];

const INSTRUMENT_STAGES: Record<string, { title: string; milestones: string[] }[]> = {
  'Gambus': [
    { title: 'Stage 1 — Foundation', milestones: ['Hold and position the Gambus correctly', 'Tune all strings by ear', 'Basic open string plucking', 'First chord shape', 'Simple Zapin strumming pattern'] },
    { title: 'Stage 2 — Developing', milestones: ['Full Zapin rhythm pattern', 'Chord transitions', 'First traditional melody', 'Basic ornamentation'] },
    { title: 'Stage 3 — Progressing', milestones: ['Full song performance', 'Advanced chord shapes', 'Improvisation basics', 'Dynamic control'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full repertoire of 3 songs', 'Stage performance technique', 'Cultural context and storytelling', 'Solo performance'] }
  ],
  'Biola Melayu': [
    { title: 'Stage 1 — Foundation', milestones: ['Correct bow hold and posture', 'Open string bowing', 'Basic scales', 'First Asli melody'] },
    { title: 'Stage 2 — Developing', milestones: ['Ghazal rhythm bowing', 'Vibrato introduction', 'First full song', 'Intonation control'] },
    { title: 'Stage 3 — Progressing', milestones: ['Advanced bowing techniques', 'Ornamentation and slides', 'Full Ghazal performance', 'Improvisation'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full repertoire', 'Ensemble awareness', 'Stage presence', 'Solo performance'] }
  ],
  'Rebab': [
    { title: 'Stage 1 — Foundation', milestones: ['Hold Rebab correctly', 'Bow technique basics', 'Open string tone production', 'First scale'] },
    { title: 'Stage 2 — Developing', milestones: ['Mak Yong melody basics', 'Intonation development', 'First full piece', 'Dynamic control'] },
    { title: 'Stage 3 — Progressing', milestones: ['Advanced Mak Yong repertoire', 'Ornamentation', 'Extended techniques', 'Performance readiness'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full traditional repertoire', 'Cultural storytelling through music', 'Solo performance', 'Stage presence'] }
  ],
  'Tabla': [
    { title: 'Stage 1 — Foundation', milestones: ['Correct hand and finger placement', 'Basic strokes — Na, Ta, Tin, Dha', 'Simple Teentaal pattern', 'Basic rhythm counting'] },
    { title: 'Stage 2 — Developing', milestones: ['Full Teentaal at medium tempo', 'Keherwa Taal introduction', 'Composition basics', 'Solo phrases'] },
    { title: 'Stage 3 — Progressing', milestones: ['Advanced Taals — Rupak, Jhaptal', 'Speed development', 'Layakari patterns', 'Improvisation'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full solo performance', 'Multiple Taal mastery', 'Call and response with melody', 'Stage performance'] }
  ],
  'Sitar': [
    { title: 'Stage 1 — Foundation', milestones: ['Correct sitting posture and hold', 'Right hand Mizrab technique', 'Basic Raga notes', 'Simple Alap'] },
    { title: 'Stage 2 — Developing', milestones: ['First full Raga', 'Gat pattern basics', 'Left hand slides and pulls', 'Rhythm coordination'] },
    { title: 'Stage 3 — Progressing', milestones: ['Advanced Raga development', 'Jhala technique', 'Improvisation within Raga', 'Speed and clarity'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full Raga performance', 'Alap, Jor, Jhala mastery', 'Stage presence', 'Solo concert readiness'] }
  ],
  'Bansuri Flute': [
    { title: 'Stage 1 — Foundation', milestones: ['Correct embouchure and breath', 'First 3 notes — Sa, Re, Ga', 'Basic breath control', 'Simple scale'] },
    { title: 'Stage 2 — Developing', milestones: ['Full lower octave scale', 'First simple melody', 'Tongue technique', 'Breath stamina'] },
    { title: 'Stage 3 — Progressing', milestones: ['Upper octave development', 'Meend and Gamak ornaments', 'First full Raga', 'Dynamic control'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full Raga performance', 'Improvisation', 'Breath mastery', 'Solo performance'] }
  ],
  'Violin Carnatic': [
    { title: 'Stage 1 — Foundation', milestones: ['Seated posture and bow hold', 'Open string bowing', 'Sa Re Ga Ma Pa scale', 'Basic intonation'] },
    { title: 'Stage 2 — Developing', milestones: ['First Carnatic kriti', 'Gamaka ornaments introduction', 'Shruti accuracy', 'Bow control development'] },
    { title: 'Stage 3 — Progressing', milestones: ['Advanced Gamakas', 'Full kriti performance', 'Improvisation basics', 'Raga recognition'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full concert repertoire', 'Advanced Raga improvisation', 'Stage performance', 'Solo concert readiness'] }
  ],
  'Erhu': [
    { title: 'Stage 1 — Foundation', milestones: ['Correct bow hold and posture', 'Open string tone production', 'D major scale', 'Basic bow control'] },
    { title: 'Stage 2 — Developing', milestones: ['First traditional melody', 'Vibrato introduction', 'Position shifting basics', 'Dynamic control'] },
    { title: 'Stage 3 — Progressing', milestones: ['Advanced vibrato and slides', 'Full song performance', 'Ornamentation techniques', 'Expression and phrasing'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full repertoire', 'Advanced techniques mastery', 'Stage presence', 'Solo performance'] }
  ],
  'Dizi': [
    { title: 'Stage 1 — Foundation', milestones: ['Correct embouchure', 'Membrane attachment and tuning', 'First 5 notes', 'Basic breath control'] },
    { title: 'Stage 2 — Developing', milestones: ['Full scale', 'First traditional melody', 'Tongue techniques — single and double', 'Breath stamina'] },
    { title: 'Stage 3 — Progressing', milestones: ['Advanced ornamentation', 'Full song performance', 'Upper register development', 'Dynamic control'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full repertoire', 'Improvisation', 'Stage performance', 'Solo concert readiness'] }
  ],
  'Pipa': [
    { title: 'Stage 1 — Foundation', milestones: ['Correct hold and nail technique', 'Basic right hand plucking', 'Open string exercises', 'First scale'] },
    { title: 'Stage 2 — Developing', milestones: ['First traditional piece', 'Left hand techniques — slides and vibrato', 'Tremolo introduction', 'Dynamic control'] },
    { title: 'Stage 3 — Progressing', milestones: ['Advanced tremolo', 'Full classical piece', 'Rapid plucking technique', 'Expression and storytelling'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full concert repertoire', 'Advanced techniques mastery', 'Stage presence', 'Solo performance'] }
  ],
  'Guzheng': [
    { title: 'Stage 1 — Foundation', milestones: ['Correct posture and hand position', 'Basic right hand plucking — thumb and index', 'Pentatonic scale', 'String dampening technique'] },
    { title: 'Stage 2 — Developing', milestones: ['Left hand pressing techniques', 'First traditional melody', 'Glissando introduction', 'Dynamic control'] },
    { title: 'Stage 3 — Progressing', milestones: ['Advanced left hand ornaments', 'Full classical piece', 'Both hands coordination', 'Vibrato and tremolo'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full concert repertoire', 'Advanced techniques mastery', 'Stage presence', 'Solo performance'] }
  ],
  'Sape': [
    { title: 'Stage 1 — Foundation', milestones: ['Hold and position the Sape correctly', 'Tuning by ear', 'Basic open string drone', 'First melody phrase'] },
    { title: 'Stage 2 — Developing', milestones: ['Traditional Sape melody', 'Drone and melody coordination', 'Spiritual music context', 'First full piece'] },
    { title: 'Stage 3 — Progressing', milestones: ['Advanced melodies', 'Improvisation within traditional framework', 'Extended playing techniques', 'Cultural storytelling'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full traditional repertoire', 'Cultural ceremony readiness', 'Stage performance', 'Solo concert readiness'] }
  ],
  'Tongkungon': [
    { title: 'Stage 1 — Foundation', milestones: ['Correct hold and posture', 'Basic string plucking', 'Pentatonic scale', 'First simple pattern'] },
    { title: 'Stage 2 — Developing', milestones: ['Gong imitation patterns', 'First traditional melody', 'Rhythm coordination', 'Dynamic control'] },
    { title: 'Stage 3 — Progressing', milestones: ['Advanced patterns', 'Full traditional piece', 'Cultural context', 'Expression and feel'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full repertoire', 'Cultural ceremony readiness', 'Stage performance', 'Solo performance'] }
  ],
  'Turali': [
    { title: 'Stage 1 — Foundation', milestones: ['Correct nose flute embouchure', 'First 3 notes', 'Basic breath control', 'Simple phrase'] },
    { title: 'Stage 2 — Developing', milestones: ['Full pentatonic scale', 'First traditional melody', 'Breath stamina', 'Expressive playing'] },
    { title: 'Stage 3 — Progressing', milestones: ['Advanced melodies', 'Ornamentation', 'Dynamic control', 'Cultural context'] },
    { title: 'Stage 4 — Performance Ready', milestones: ['Full traditional repertoire', 'Cultural ceremony readiness', 'Solo performance', 'Stage presence'] }
  ]
};

const MOCK_INSTRUMENTS: Instrument[] = [
  // Malay
  {
    id: 'i1',
    name: 'Gambus',
    nativeName: 'ݢامبوس',
    type: 'Plucked',
    culture: 'Malay',
    story: 'A short-necked lute, the soul of Zapin music. It arrived via the spice trade and became a cornerstone of Malay folk music.',
    mentorCount: 2,
    photo: 'https://i.ibb.co/xSN37sLm/Gemini-Generated-Image-gemalannn.png'
  },
  {
    id: 'i2',
    name: 'Biola Melayu',
    nativeName: 'بيولا ملايو',
    type: 'String',
    culture: 'Malay',
    story: 'Traditional violin adapted for Asli and Ghazal music, carrying haunting melodies through generations.',
    mentorCount: 3,
    photo: 'https://i.ibb.co/GvfXHrG4/bolamelayu.png'
  },
  {
    id: 'i3',
    name: 'Rebab',
    nativeName: 'رباب',
    type: 'String',
    culture: 'Malay',
    story: 'A three-stringed bowed instrument used in Mak Yong. Its voice-like quality leads the traditional ensemble.',
    mentorCount: 2,
    photo: 'https://i.ibb.co/8gY5sgcv/rebab.png'
  },
  // Indian
  {
    id: 'i4',
    name: 'Tabla',
    nativeName: 'तबला',
    type: 'Percussion',
    culture: 'Indian',
    story: 'A pair of hand drums for complex Hindustani rhythms. The rhythmic heartbeat of Indian classical music.',
    mentorCount: 2,
    photo: 'https://i.ibb.co/W4nnX01k/tablaa.png'
  },
  {
    id: 'i5',
    name: 'Sitar',
    nativeName: 'सितار',
    type: 'Plucked',
    culture: 'Indian',
    story: 'A plucked string instrument with sympathetic strings. It defines the resonant sound of North Indian classical music.',
    mentorCount: 3,
    photo: 'https://i.ibb.co/ksXQF8Fn/sitarr.png'
  },
  {
    id: 'i7',
    name: 'Bansuri Flute',
    nativeName: 'बांसुरी',
    type: 'Wind',
    culture: 'Indian',
    story: 'A bamboo flute requiring immense breath control. It produces pastoral and divine melodies.',
    mentorCount: 2,
    photo: 'https://i.ibb.co/0V6VqwKR/bansuriflute.png'
  },
  {
    id: 'i8',
    name: 'Carnatic Violin',
    nativeName: 'வயலின்',
    type: 'String',
    culture: 'Indian',
    story: 'Seated violin style mimicking the human voice. Held between the chest and foot in South Indian music.',
    mentorCount: 1,
    photo: 'https://i.ibb.co/wFmw5Tv2/carnaticviolin.png'
  },
  // Chinese
  {
    id: 'i9',
    name: 'Erhu',
    nativeName: '二胡',
    type: 'String',
    culture: 'Chinese',
    story: 'The Chinese violin with a python-skin resonator. Its two strings create a deeply expressive, soulful sound.',
    mentorCount: 3,
    photo: 'https://i.ibb.co/BVqch6gw/erhuuuu.png'
  },
  {
    id: 'i11',
    name: 'Dizi',
    nativeName: '笛子',
    type: 'Wind',
    culture: 'Chinese',
    story: 'A traditional Chinese transverse flute made of bamboo, featuring a unique buzzing membrane that produces a bright, resonant sound.',
    mentorCount: 2,
    photo: 'https://i.ibb.co/6RH3KmS7/Gemini-Generated-Image-1qjgkt1qjgkt1qjg.png'
  },
  {
    id: 'i12',
    name: 'Guzheng',
    nativeName: '古筝',
    type: 'Plucked',
    culture: 'Chinese',
    story: 'An ancient 21-string zither. Its cascading notes evoke flowing water and mountain echoes.',
    mentorCount: 2,
    photo: 'https://i.ibb.co/Lz53ZnkJ/guzhenggg.png'
  },
  // Borneo
  {
    id: 'i13',
    name: 'Sape',
    nativeName: 'Sape',
    type: 'Plucked',
    culture: 'Borneo',
    story: 'The famous boat-shaped lute from Sarawak. Traditionally used for healing rituals, its sound is ethereal.',
    mentorCount: 3,
    photo: 'https://i.ibb.co/nN935F09/sapee.png'
  },
  {
    id: 'i14',
    name: 'Tangkungon',
    nativeName: 'Tangkungon',
    type: 'Plucked',
    culture: 'Borneo',
    story: 'A bamboo tube zither that mimics gong ensembles. A traditional instrument from the heart of Sabah.',
    mentorCount: 2,
    photo: 'https://i.ibb.co/ZRZCQyBC/tangkungon.png'
  },
  {
    id: 'i15',
    name: 'Turali',
    nativeName: 'Turali',
    type: 'Wind',
    culture: 'Borneo',
    story: 'A bamboo nose flute used for expressive melodies. It mimics the sounds of nature in the deep rainforest.',
    mentorCount: 1,
    photo: 'https://i.ibb.co/jvz0Y01V/turali.png'
  }
];

const MOCK_MENTORS: MentorDetail[] = [
  {
    id: 'm1',
    name: 'Cikgu Aris Ramli',
    tagline: 'Preserving the Soul of Zapin',
    photo: 'https://picsum.photos/seed/man1/200',
    rating: 4.9,
    reviewCount: 128,
    location: 'Bangsar, Kuala Lumpur',
    address: 'No. 12, Jalan Telawi, Bangsar Baru, 59100 Kuala Lumpur',
    pricePerLesson: 85,
    studentsCount: 45,
    experienceYears: 15,
    about: 'I have been playing and teaching Gambus and Rebab for over 15 years. My passion is to preserve the heritage of Malay music for the next generation.',
    specialisation: ['Gambus', 'Rebab'],
    teachingStyle: ['Traditional Oral Tradition', 'Modern Notation', 'Ensemble Focus'],
    languages: ['Bahasa Malaysia', 'English'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 85, description: '60 mins' },
      { id: 'p2', name: '8 Lessons', lessons: 8, price: 612, validityMonths: 4, description: '10% Discount' },
      { id: 'p3', name: '12 Lessons', lessons: 12, price: 867, validityMonths: 6, description: '15% Discount' },
      { id: 'p4', name: 'Monthly', lessons: 4, price: 300, description: '4 lessons • auto renews' }
    ],
    reviews: [
      { id: 'r1', studentName: 'Sarah J.', lessonsTaken: 12, rating: 5, comment: 'Cikgu Aris is an amazing teacher! He is very patient and explains things clearly.', timeAgo: '2 days ago' },
      { id: 'r2', studentName: 'Marcus C.', lessonsTaken: 5, rating: 4.8, comment: 'Really enjoyed the sessions. The traditional techniques are fascinating.', timeAgo: '1 week ago' },
      { id: 'r1_2', studentName: 'Ahmad F.', lessonsTaken: 8, rating: 5, comment: 'The studio environment is very peaceful and conducive for learning traditional instruments.', timeAgo: '3 weeks ago' },
      { id: 'r1_3', studentName: 'Lina M.', lessonsTaken: 20, rating: 5, comment: 'I have learned so much about the history of Gambus. Highly recommended!', timeAgo: '1 month ago' }
    ],
    credentials: ['Master of Arts (Music) - ASWARA', 'National Heritage Award 2022', '15+ Years of International Performance', 'Certified Traditional Music Instructor'],
    gallery: [
      'https://picsum.photos/seed/studio1/400/300',
      'https://picsum.photos/seed/studio2/400/300',
      'https://picsum.photos/seed/studio3/400/300',
      'https://picsum.photos/seed/studio4/400/300'
    ]
  },
  {
    id: 'm2',
    name: 'Guru Rajesh',
    tagline: 'The Rhythmic Heartbeat of Tabla',
    photo: 'https://picsum.photos/seed/man2/200',
    rating: 4.95,
    reviewCount: 89,
    location: 'Brickfields, Kuala Lumpur',
    address: '15, Jalan Tun Sambanthan, Brickfields, 50470 Kuala Lumpur',
    pricePerLesson: 100,
    studentsCount: 32,
    experienceYears: 20,
    about: 'Specializing in Hindustani classical music, I bring 20 years of Tabla experience from the Punjab Gharana.',
    specialisation: ['Tabla', 'Sitar'],
    teachingStyle: ['Gharana Tradition', 'Rhythmic Mastery', 'Live Accompaniment'],
    languages: ['English', 'Tamil', 'Bahasa Malaysia'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 100, description: '60 mins' },
      { id: 'p2', name: '8 Lessons', lessons: 8, price: 720, validityMonths: 4 },
      { id: 'p3', name: '12 Lessons', lessons: 12, price: 1020, validityMonths: 6 },
      { id: 'p4', name: 'Monthly', lessons: 4, price: 350, description: '4 lessons • auto renews' }
    ],
    reviews: [
      { id: 'r3', studentName: 'Anjali D.', lessonsTaken: 20, rating: 5, comment: 'Guru Rajesh is a true master. His knowledge of rhythm is unparalleled.', timeAgo: '3 days ago' },
      { id: 'r3_2', studentName: 'Kevin L.', lessonsTaken: 10, rating: 5, comment: 'The Tabla sessions are intense but very rewarding. Highly recommend!', timeAgo: '2 weeks ago' },
      { id: 'r3_3', studentName: 'Priya S.', lessonsTaken: 4, rating: 4.9, comment: 'Great atmosphere in the studio. Guru Rajesh makes complex rhythms easy to understand.', timeAgo: '1 month ago' },
      { id: 'r3_4', studentName: 'Sanjay T.', lessonsTaken: 15, rating: 5, comment: 'Best Tabla teacher in KL. Very disciplined and thorough.', timeAgo: '2 months ago' }
    ],
    credentials: ['Sangeet Visharad', 'Performed at Petronas Philharmonic Hall', 'Punjab Gharana Certified', '20+ Years Teaching Experience'],
    gallery: [
      'https://picsum.photos/seed/tabla1/400/300',
      'https://picsum.photos/seed/tabla2/400/300',
      'https://picsum.photos/seed/tabla3/400/300',
      'https://picsum.photos/seed/tabla4/400/300'
    ]
  },
  {
    id: 'm3',
    name: 'Master Wong',
    tagline: 'Soulful Strings of the Erhu',
    photo: 'https://picsum.photos/seed/man3/200',
    rating: 4.88,
    reviewCount: 156,
    location: 'Georgetown, Penang',
    address: '42, Lebuh Armenian, 10200 George Town, Pulau Pinang',
    pricePerLesson: 120,
    studentsCount: 58,
    experienceYears: 25,
    about: 'A former lead erhu player for the National Symphony, I focus on the expressive nuances of Chinese classical music.',
    specialisation: ['Erhu', 'Guzheng', 'Pipa'],
    teachingStyle: ['Classical Technique', 'Emotional Expression', 'Exam Prep'],
    languages: ['Mandarin', 'English', 'Bahasa Malaysia'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 120, description: '60 mins' },
      { id: 'p2', name: '8 Lessons', lessons: 8, price: 864, validityMonths: 4 },
      { id: 'p3', name: '12 Lessons', lessons: 12, price: 1224, validityMonths: 6 },
      { id: 'p4', name: 'Monthly', lessons: 4, price: 420, description: '4 lessons • auto renews' }
    ],
    reviews: [
      { id: 'r4', studentName: 'Wei Kiat', lessonsTaken: 15, rating: 5, comment: 'Master Wong is very strict but his results are incredible.', timeAgo: '5 days ago' },
      { id: 'r4_2', studentName: 'Mei Ling', lessonsTaken: 8, rating: 4.7, comment: 'The Erhu has such a beautiful, haunting sound. Master Wong teaches with great precision.', timeAgo: '2 weeks ago' },
      { id: 'r4_3', studentName: 'David T.', lessonsTaken: 12, rating: 5, comment: 'Excellent studio setup. The acoustics are perfect for Guzheng practice.', timeAgo: '1 month ago' },
      { id: 'r4_4', studentName: 'Sophie L.', lessonsTaken: 6, rating: 4.9, comment: 'I love how Master Wong explains the emotional depth of each piece.', timeAgo: '2 months ago' }
    ],
    credentials: ['Central Conservatory of Music Graduate', 'Penang Arts Excellence Award', 'Former Lead Erhu - National Symphony', 'Published Author on Chinese Music Theory'],
    gallery: [
      'https://picsum.photos/seed/erhu1/400/300',
      'https://picsum.photos/seed/erhu2/400/300',
      'https://picsum.photos/seed/erhu3/400/300',
      'https://picsum.photos/seed/erhu4/400/300'
    ]
  },
  {
    id: 'm4',
    name: 'Mathew Ngau',
    tagline: 'Living Legend of the Sape',
    photo: 'https://picsum.photos/seed/man4/200',
    rating: 5.0,
    reviewCount: 210,
    location: 'Kuching, Sarawak',
    address: 'Kampung Budaya Sarawak, Pantai Damai, 93752 Kuching',
    pricePerLesson: 150,
    studentsCount: 80,
    experienceYears: 40,
    about: 'I am a 3rd generation Sape maker and player. My mission is to share the ethereal sounds of the longhouse with the world.',
    specialisation: ['Sape', 'Tongkungon'],
    teachingStyle: ['Oral Tradition', 'Spiritual Connection', 'Storytelling'],
    languages: ['English', 'Bahasa Malaysia', 'Iban'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 150, description: '60 mins' },
      { id: 'p2', name: '8 Lessons', lessons: 8, price: 1080, validityMonths: 4 },
      { id: 'p3', name: '12 Lessons', lessons: 12, price: 1530, validityMonths: 6 },
      { id: 'p4', name: 'Monthly', lessons: 4, price: 500, description: '4 lessons • auto renews' }
    ],
    reviews: [
      { id: 'r5', studentName: 'Jasmine L.', lessonsTaken: 30, rating: 5, comment: 'Learning from a living legend is a dream come true.', timeAgo: '1 day ago' },
      { id: 'r5_2', studentName: 'Boon H.', lessonsTaken: 15, rating: 5, comment: 'The Sape music is so healing. Mathew is a wonderful storyteller and teacher.', timeAgo: '1 week ago' },
      { id: 'r5_3', studentName: 'Elena R.', lessonsTaken: 6, rating: 4.8, comment: 'The studio is filled with beautiful handcrafted Sapes. A truly authentic experience.', timeAgo: '3 weeks ago' },
      { id: 'r5_4', studentName: 'Chris M.', lessonsTaken: 10, rating: 5, comment: 'Mathew is not just a teacher, but a cultural ambassador. Incredible experience.', timeAgo: '1 month ago' }
    ],
    credentials: ['National Living Heritage (Warisan Kebangsaan)', 'UNESCO Recognition', 'Master Sape Maker', 'Honorary Doctorate in Arts'],
    gallery: [
      'https://picsum.photos/seed/sape1/400/300',
      'https://picsum.photos/seed/sape2/400/300',
      'https://picsum.photos/seed/sape3/400/300',
      'https://picsum.photos/seed/sape4/400/300'
    ]
  },
  {
    id: 'm5',
    name: 'Cikgu Siti Aminah',
    tagline: 'Melodies of the Biola Melayu',
    photo: 'https://picsum.photos/seed/woman1/200',
    rating: 4.85,
    reviewCount: 64,
    location: 'Shah Alam, Selangor',
    address: '22, Jalan Snuker 13/28, Seksyen 13, 40100 Shah Alam',
    pricePerLesson: 75,
    studentsCount: 28,
    experienceYears: 12,
    about: 'I specialize in the Biola Melayu, bringing the haunting melodies of Asli and Ghazal music to life.',
    specialisation: ['Biola Melayu'],
    teachingStyle: ['Melodic Focus', 'Historical Context', 'Technique Driven'],
    languages: ['Bahasa Malaysia', 'English'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 75, description: '60 mins' },
      { id: 'p2', name: '8 Lessons', lessons: 8, price: 540, validityMonths: 4 },
      { id: 'p4', name: 'Monthly', lessons: 4, price: 280 }
    ],
    reviews: [
      { id: 'r6', studentName: 'Nurul A.', lessonsTaken: 10, rating: 4.9, comment: 'Cikgu Siti is very detailed in her teaching. I love the Asli repertoire.', timeAgo: '4 days ago' },
      { id: 'r6_2', studentName: 'Zul H.', lessonsTaken: 4, rating: 4.8, comment: 'The Biola Melayu has a unique charm. The studio is very welcoming.', timeAgo: '2 weeks ago' }
    ],
    credentials: ['Diploma in Music - UiTM', 'Best Instrumental Performance (Ghazal Festival)'],
    gallery: [
      'https://picsum.photos/seed/biola1/400/300',
      'https://picsum.photos/seed/biola2/400/300',
      'https://picsum.photos/seed/biola3/400/300',
      'https://picsum.photos/seed/biola4/400/300'
    ]
  },
  {
    id: 'm6',
    name: 'Guru Meenakshi',
    tagline: 'The Divine Voice of Carnatic Violin',
    photo: 'https://picsum.photos/seed/woman2/200',
    rating: 4.92,
    reviewCount: 75,
    location: 'Petaling Jaya, Selangor',
    address: '8, Jalan Templer, 46000 Petaling Jaya',
    pricePerLesson: 110,
    studentsCount: 25,
    experienceYears: 18,
    about: 'Trained in the Lalgudi style, I teach the seated Carnatic violin, focusing on mimicking the human voice.',
    specialisation: ['Violin Carnatic'],
    teachingStyle: ['Gayana Style', 'Raga Exploration', 'Spiritual Approach'],
    languages: ['English', 'Tamil'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 110, description: '60 mins' },
      { id: 'p2', name: '10 Lessons', lessons: 10, price: 990, validityMonths: 5 }
    ],
    reviews: [
      { id: 'r7', studentName: 'Suresh K.', lessonsTaken: 15, rating: 5, comment: 'Guru Meenakshi is a treasure. Her teaching is deeply spiritual.', timeAgo: '1 week ago' },
      { id: 'r7_2', studentName: 'Lakshmi V.', lessonsTaken: 8, rating: 4.9, comment: 'The Lalgudi style is so expressive. The studio has a very positive vibe.', timeAgo: '3 weeks ago' }
    ],
    credentials: ['B.A. Music (Violin) - Madras University', 'A-Grade Artist (All India Radio)'],
    gallery: [
      'https://picsum.photos/seed/carnatic1/400/300',
      'https://picsum.photos/seed/carnatic2/400/300',
      'https://picsum.photos/seed/carnatic3/400/300',
      'https://picsum.photos/seed/carnatic4/400/300'
    ]
  },
  {
    id: 'm7',
    name: 'Pandit Ravi',
    tagline: 'Breath of the Bansuri',
    photo: 'https://picsum.photos/seed/man5/200',
    rating: 4.98,
    reviewCount: 112,
    location: 'Kajang, Selangor',
    address: 'Jalan Bukit, 43000 Kajang',
    pricePerLesson: 95,
    studentsCount: 40,
    experienceYears: 22,
    about: 'The Bansuri is more than an instrument; it is a meditation. I teach breath control and the nuances of Hindustani ragas.',
    specialisation: ['Bansuri Flute', 'Sitar'],
    teachingStyle: ['Meditative Practice', 'Breath Mastery', 'Raga Theory'],
    languages: ['English', 'Hindi', 'Malayalam'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 95, description: '60 mins' },
      { id: 'p2', name: '8 Lessons', lessons: 8, price: 684, validityMonths: 4 }
    ],
    reviews: [
      { id: 'r8', studentName: 'Rohan M.', lessonsTaken: 12, rating: 5, comment: 'Pandit Ravi is a master of the Bansuri. His breath control exercises are life-changing.', timeAgo: '2 days ago' },
      { id: 'r8_2', studentName: 'Sita R.', lessonsTaken: 6, rating: 5, comment: 'The studio is a peaceful sanctuary. Learning Sitar here is a wonderful experience.', timeAgo: '1 week ago' }
    ],
    credentials: ['Disciple of Hariprasad Chaurasia', 'International Flute Festival Performer'],
    gallery: [
      'https://picsum.photos/seed/bansuri1/400/300',
      'https://picsum.photos/seed/bansuri2/400/300',
      'https://picsum.photos/seed/bansuri3/400/300',
      'https://picsum.photos/seed/bansuri4/400/300'
    ]
  },
  {
    id: 'm8',
    name: 'Master Chen',
    tagline: 'Bright Echoes of the Dizi',
    photo: 'https://picsum.photos/seed/man6/200',
    rating: 4.87,
    reviewCount: 94,
    location: 'Cheras, Kuala Lumpur',
    address: 'Jalan Cheras, 56100 Kuala Lumpur',
    pricePerLesson: 80,
    studentsCount: 35,
    experienceYears: 15,
    about: 'Specializing in the Dizi and its unique buzzing membrane. I teach both folk and operatic styles.',
    specialisation: ['Dizi', 'Erhu'],
    teachingStyle: ['Technical Precision', 'Folk Repertoire', 'Breath Control'],
    languages: ['Mandarin', 'Cantonese', 'English'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 80, description: '60 mins' },
      { id: 'p2', name: '12 Lessons', lessons: 12, price: 864, validityMonths: 6 }
    ],
    reviews: [
      { id: 'r9', studentName: 'Li Wei', lessonsTaken: 10, rating: 5, comment: 'Master Chen is very patient. The Dizi sounds so bright and clear under his guidance.', timeAgo: '3 days ago' },
      { id: 'r9_2', studentName: 'Siew M.', lessonsTaken: 5, rating: 4.8, comment: 'The studio is well-equipped. I love the traditional atmosphere.', timeAgo: '2 weeks ago' }
    ],
    credentials: ['Shanghai Conservatory of Music', 'Gold Medalist - National Chinese Music Competition'],
    gallery: [
      'https://picsum.photos/seed/dizi1/400/300',
      'https://picsum.photos/seed/dizi2/400/300',
      'https://picsum.photos/seed/dizi3/400/300',
      'https://picsum.photos/seed/dizi4/400/300'
    ]
  },
  {
    id: 'm9',
    name: 'Ms. Lin',
    tagline: 'Cascading Notes of the Guzheng',
    photo: 'https://picsum.photos/seed/woman3/200',
    rating: 4.94,
    reviewCount: 142,
    location: 'Puchong, Selangor',
    address: 'Bandar Puteri, 47100 Puchong',
    pricePerLesson: 110,
    studentsCount: 50,
    experienceYears: 14,
    about: 'The Guzheng evokes the sound of flowing water. I help students master the 21 strings with grace and precision.',
    specialisation: ['Guzheng', 'Pipa'],
    teachingStyle: ['Graceful Technique', 'Repertoire Focused', 'Performance Prep'],
    languages: ['Mandarin', 'English'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 110, description: '60 mins' },
      { id: 'p2', name: '8 Lessons', lessons: 8, price: 792, validityMonths: 4 }
    ],
    reviews: [
      { id: 'r10', studentName: 'Xiao Yan', lessonsTaken: 15, rating: 5, comment: 'Ms. Lin is a wonderful teacher. The Guzheng is such a beautiful instrument.', timeAgo: '1 week ago' },
      { id: 'r10_2', studentName: 'Tan K.', lessonsTaken: 8, rating: 4.9, comment: 'The studio is very elegant. I enjoy every lesson here.', timeAgo: '3 weeks ago' }
    ],
    credentials: ['Master of Music - Beijing Academy', 'Featured Soloist - Asian Cultural Festival'],
    gallery: [
      'https://picsum.photos/seed/guzheng1/400/300',
      'https://picsum.photos/seed/guzheng2/400/300',
      'https://picsum.photos/seed/guzheng3/400/300',
      'https://picsum.photos/seed/guzheng4/400/300'
    ]
  },
  {
    id: 'm10',
    name: 'Uncle Jerry Kamit',
    tagline: 'Sarawak Sape Virtuoso',
    photo: 'https://picsum.photos/seed/man7/200',
    rating: 4.99,
    reviewCount: 185,
    location: 'Kuching, Sarawak',
    address: 'Jalan Satok, 93400 Kuching',
    pricePerLesson: 130,
    studentsCount: 65,
    experienceYears: 35,
    about: 'A master of the contemporary Sape style. I blend traditional Orang Ulu melodies with modern sensibilities.',
    specialisation: ['Sape'],
    teachingStyle: ['Modern Fusion', 'Rhythmic Innovation', 'Cultural Storytelling'],
    languages: ['English', 'Bahasa Malaysia', 'Iban'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 130, description: '60 mins' },
      { id: 'p2', name: '10 Lessons', lessons: 10, price: 1170, validityMonths: 5 }
    ],
    reviews: [
      { id: 'r11', studentName: 'Alex G.', lessonsTaken: 20, rating: 5, comment: 'Uncle Jerry is a legend. His Sape playing is so inspiring.', timeAgo: '2 days ago' },
      { id: 'r11_2', studentName: 'Sarah W.', lessonsTaken: 10, rating: 5, comment: 'The studio in Kuching is beautiful. A perfect place to learn Sape.', timeAgo: '1 week ago' }
    ],
    credentials: ['Rainforest World Music Festival Regular', 'Sarawak State Arts Award'],
    gallery: [
      'https://picsum.photos/seed/jerrysape1/400/300',
      'https://picsum.photos/seed/jerrysape2/400/300',
      'https://picsum.photos/seed/jerrysape3/400/300',
      'https://picsum.photos/seed/jerrysape4/400/300'
    ]
  },
  {
    id: 'm11',
    name: 'Alena Murang',
    tagline: 'Voice of the Kelabit Highlands',
    photo: 'https://picsum.photos/seed/woman4/200',
    rating: 4.97,
    reviewCount: 120,
    location: 'Miri, Sarawak',
    address: 'Miri Waterfront, 98000 Miri',
    pricePerLesson: 140,
    studentsCount: 40,
    experienceYears: 10,
    about: 'I teach the Sape as a medium for storytelling and cultural preservation, focusing on the Kelabit tradition.',
    specialisation: ['Sape'],
    teachingStyle: ['Visual Arts Integration', 'Storytelling', 'Traditional Chants'],
    languages: ['English', 'Bahasa Malaysia', 'Kelabit'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 140, description: '60 mins' }
    ],
    reviews: [
      { id: 'r12', studentName: 'Maya K.', lessonsTaken: 12, rating: 5, comment: 'Alena is an inspiration. Her Sape lessons are deeply connected to her culture.', timeAgo: '3 days ago' },
      { id: 'r12_2', studentName: 'John D.', lessonsTaken: 5, rating: 5, comment: 'The studio in Miri is such a creative space. I love the storytelling aspect.', timeAgo: '2 weeks ago' }
    ],
    credentials: ['Forbes 30 Under 30 Asia', 'Best Music Video - UK Music Video Awards'],
    gallery: [
      'https://picsum.photos/seed/alenasape1/400/300',
      'https://picsum.photos/seed/alenasape2/400/300',
      'https://picsum.photos/seed/alenasape3/400/300',
      'https://picsum.photos/seed/alenasape4/400/300'
    ]
  },
  {
    id: 'm12',
    name: 'Cikgu Roslan',
    tagline: 'Guardian of Mak Yong Traditions',
    photo: 'https://picsum.photos/seed/man8/200',
    rating: 4.89,
    reviewCount: 52,
    location: 'Kota Bharu, Kelantan',
    address: 'Jalan Sultanah Zainab, 15000 Kota Bharu',
    pricePerLesson: 70,
    studentsCount: 20,
    experienceYears: 25,
    about: 'Dedicated to the Rebab and its role in Mak Yong. I teach the deep spiritual connection of Kelantanese music.',
    specialisation: ['Rebab', 'Biola Melayu'],
    teachingStyle: ['Spiritual Focus', 'Improvisation', 'Traditional Repertoire'],
    languages: ['Bahasa Malaysia (Kelantan Dialect)', 'English'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 70, description: '60 mins' },
      { id: 'p2', name: '12 Lessons', lessons: 12, price: 756, validityMonths: 6 }
    ],
    reviews: [
      { id: 'r13', studentName: 'Hafiz M.', lessonsTaken: 15, rating: 5, comment: 'Cikgu Roslan is a master of the Rebab. His teaching is deeply rooted in tradition.', timeAgo: '1 week ago' },
      { id: 'r13_2', studentName: 'Siti K.', lessonsTaken: 8, rating: 4.8, comment: 'The studio in Kota Bharu is a wonderful place to learn Kelantanese music.', timeAgo: '3 weeks ago' }
    ],
    credentials: ['Mak Yong Master Teacher', 'Kelantan State Heritage Icon'],
    gallery: [
      'https://picsum.photos/seed/rebab1/400/300',
      'https://picsum.photos/seed/rebab2/400/300',
      'https://picsum.photos/seed/rebab3/400/300',
      'https://picsum.photos/seed/rebab4/400/300'
    ]
  },
  {
    id: 'm13',
    name: 'Guru Subramaniam',
    tagline: 'Precision and Power in Tabla',
    photo: 'https://picsum.photos/seed/subra/200',
    rating: 4.91,
    reviewCount: 68,
    location: 'Ipoh, Perak',
    address: 'Little India, 30000 Ipoh',
    pricePerLesson: 90,
    studentsCount: 30,
    experienceYears: 16,
    about: 'Focusing on the Farukhabad Gharana, I emphasize technical precision and the mathematical beauty of Tabla.',
    specialisation: ['Tabla'],
    teachingStyle: ['Mathematical Approach', 'Speed Drills', 'Composition Focus'],
    languages: ['English', 'Tamil', 'Bahasa Malaysia'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 90, description: '60 mins' },
      { id: 'p2', name: '8 Lessons', lessons: 8, price: 648, validityMonths: 4 }
    ],
    reviews: [
      { id: 'r14', studentName: 'Vikram S.', lessonsTaken: 12, rating: 5, comment: 'Guru Subramaniam is a master of rhythm. His mathematical approach is very clear.', timeAgo: '1 week ago' },
      { id: 'r14_2', studentName: 'Meena P.', lessonsTaken: 6, rating: 4.9, comment: 'The studio in Ipoh is a great place to learn Tabla. Highly recommend!', timeAgo: '3 weeks ago' }
    ],
    credentials: ['Gold Medalist - All Malaysia Tabla Competition', 'Music Lecturer at UPSI'],
    gallery: [
      'https://picsum.photos/seed/subra1/400/300',
      'https://picsum.photos/seed/subra2/400/300',
      'https://picsum.photos/seed/subrastudio1/400/300',
      'https://picsum.photos/seed/subrastudio2/400/300'
    ]
  },
  {
    id: 'm14',
    name: 'Master Zhang',
    tagline: 'The Rapid Plucking of the Pipa',
    photo: 'https://picsum.photos/seed/zhang/200',
    rating: 4.93,
    reviewCount: 110,
    location: 'Johor Bahru, Johor',
    address: 'Taman Pelangi, 80400 Johor Bahru',
    pricePerLesson: 115,
    studentsCount: 42,
    experienceYears: 20,
    about: 'The Pipa is an instrument of fire and water. I teach the rapid plucking techniques that define this ancient lute.',
    specialisation: ['Pipa', 'Erhu'],
    teachingStyle: ['Virtuosic Technique', 'Historical Narrative', 'Rigorous Practice'],
    languages: ['Mandarin', 'English'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 115, description: '60 mins' },
      { id: 'p2', name: '10 Lessons', lessons: 10, price: 1035, validityMonths: 5 }
    ],
    reviews: [
      { id: 'r15', studentName: 'Li Na', lessonsTaken: 15, rating: 5, comment: 'Master Zhang is a virtuoso. The Pipa lessons are very challenging but rewarding.', timeAgo: '1 week ago' },
      { id: 'r15_2', studentName: 'Wong J.', lessonsTaken: 8, rating: 4.9, comment: 'The studio in JB is very well-maintained. I enjoy learning Erhu here.', timeAgo: '3 weeks ago' }
    ],
    credentials: ['China National Orchestra Member', 'Johor Arts Council Consultant'],
    gallery: [
      'https://picsum.photos/seed/zhang1/400/300',
      'https://picsum.photos/seed/zhang2/400/300',
      'https://picsum.photos/seed/zhangstudio1/400/300',
      'https://picsum.photos/seed/zhangstudio2/400/300'
    ]
  },
  {
    id: 'm15',
    name: 'Cikgu Zainal',
    tagline: 'The Rhythms of Johor Ghazal',
    photo: 'https://picsum.photos/seed/zainal/200',
    rating: 4.86,
    reviewCount: 45,
    location: 'Muar, Johor',
    address: 'Jalan Maharani, 84000 Muar',
    pricePerLesson: 80,
    studentsCount: 18,
    experienceYears: 28,
    about: 'Specializing in the Gambus for Johor Ghazal. I focus on the rhythmic interplay between the strings and the ensemble.',
    specialisation: ['Gambus'],
    teachingStyle: ['Ensemble Based', 'Rhythmic Focus', 'Oral Tradition'],
    languages: ['Bahasa Malaysia'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 80, description: '60 mins' },
      { id: 'p2', name: '8 Lessons', lessons: 8, price: 576, validityMonths: 4 }
    ],
    reviews: [
      { id: 'r16', studentName: 'Faisal R.', lessonsTaken: 10, rating: 5, comment: 'Cikgu Zainal is a master of the Gambus. His teaching is very traditional and authentic.', timeAgo: '1 week ago' },
      { id: 'r16_2', studentName: 'Aisha M.', lessonsTaken: 5, rating: 4.7, comment: 'The studio in Muar is a great place to learn Ghazal music.', timeAgo: '2 weeks ago' }
    ],
    credentials: ['Ghazal Muar Master', 'National Arts & Culture Department Award'],
    gallery: [
      'https://picsum.photos/seed/zainal1/400/300',
      'https://picsum.photos/seed/zainal2/400/300',
      'https://picsum.photos/seed/zainalstudio1/400/300',
      'https://picsum.photos/seed/zainalstudio2/400/300'
    ]
  },
  {
    id: 'm16',
    name: 'Guru Lakshmi',
    tagline: 'Soulful Melodies of the Bansuri',
    photo: 'https://picsum.photos/seed/lakshmi/200',
    rating: 4.95,
    reviewCount: 82,
    location: 'Klang, Selangor',
    address: 'Bandar Bukit Tinggi, 41200 Klang',
    pricePerLesson: 100,
    studentsCount: 28,
    experienceYears: 15,
    about: 'I teach the Bansuri with a focus on Carnatic ragas and the spiritual essence of the bamboo flute.',
    specialisation: ['Bansuri Flute'],
    teachingStyle: ['Devotional Music', 'Raga Foundation', 'Breath Mastery'],
    languages: ['English', 'Tamil', 'Malayalam'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 100, description: '60 mins' },
      { id: 'p2', name: '12 Lessons', lessons: 12, price: 1080, validityMonths: 6 }
    ],
    reviews: [
      { id: 'r17', studentName: 'Karthik R.', lessonsTaken: 12, rating: 5, comment: 'Guru Lakshmi is a wonderful teacher. The Bansuri lessons are very meditative.', timeAgo: '1 week ago' },
      { id: 'r17_2', studentName: 'Divya S.', lessonsTaken: 6, rating: 4.9, comment: 'The studio in Klang is a peaceful place to learn. I love the Carnatic ragas.', timeAgo: '3 weeks ago' }
    ],
    credentials: ['M.A. Music - Annamalai University', 'Temple Music Festival Coordinator'],
    gallery: [
      'https://picsum.photos/seed/lakshmi1/400/300',
      'https://picsum.photos/seed/lakshmi2/400/300',
      'https://picsum.photos/seed/lakshmistudio1/400/300',
      'https://picsum.photos/seed/lakshmistudio2/400/300'
    ]
  },
  {
    id: 'm17',
    name: 'Master Liu',
    tagline: 'The Buzzing Spirit of the Dizi',
    photo: 'https://picsum.photos/seed/liu/200',
    rating: 4.84,
    reviewCount: 60,
    location: 'Melaka City, Melaka',
    address: 'Jonker Street, 75200 Melaka',
    pricePerLesson: 85,
    studentsCount: 22,
    experienceYears: 12,
    about: 'Specializing in the Dizi and Xiao. I focus on the unique timbres and techniques of Southern Chinese flute music.',
    specialisation: ['Dizi'],
    teachingStyle: ['Timbre Focus', 'Southern Style', 'Modern Interpretation'],
    languages: ['Mandarin', 'English', 'Bahasa Malaysia'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 85, description: '60 mins' },
      { id: 'p2', name: '8 Lessons', lessons: 8, price: 612, validityMonths: 4 }
    ],
    reviews: [
      { id: 'r18', studentName: 'Chen W.', lessonsTaken: 10, rating: 5, comment: 'Master Liu is very patient. The Dizi lessons are very clear and easy to follow.', timeAgo: '1 week ago' },
      { id: 'r18_2', studentName: 'Lee K.', lessonsTaken: 5, rating: 4.8, comment: 'The studio in Melaka is very charming. I love learning Dizi here.', timeAgo: '2 weeks ago' }
    ],
    credentials: ['Nanjing Arts Institute Graduate', 'Melaka Cultural Heritage Award'],
    gallery: [
      'https://picsum.photos/seed/liu1/400/300',
      'https://picsum.photos/seed/liu2/400/300',
      'https://picsum.photos/seed/liustudio1/400/300',
      'https://picsum.photos/seed/liustudio2/400/300'
    ]
  },
  {
    id: 'm18',
    name: 'Uncle Arthur Borman',
    tagline: 'Echoes of the Borneo Rainforest',
    photo: 'https://picsum.photos/seed/arthur/200',
    rating: 4.96,
    reviewCount: 95,
    location: 'Kota Kinabalu, Sabah',
    address: 'Tanjung Aru, 88100 Kota Kinabalu',
    pricePerLesson: 110,
    studentsCount: 35,
    experienceYears: 30,
    about: 'I teach the Turali (nose flute) and Tongkungon, preserving the ancient sounds of the Kadazan-Dusun people.',
    specialisation: ['Turali', 'Tongkungon'],
    teachingStyle: ['Nature Mimicry', 'Oral Tradition', 'Spiritual Connection'],
    languages: ['English', 'Bahasa Malaysia', 'Kadazan'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 110, description: '60 mins' },
      { id: 'p2', name: '10 Lessons', lessons: 10, price: 990, validityMonths: 5 }
    ],
    reviews: [
      { id: 'r19', studentName: 'Benoit P.', lessonsTaken: 15, rating: 5, comment: 'Uncle Arthur is a true guardian of tradition. The Turali lessons are very unique.', timeAgo: '1 week ago' },
      { id: 'r19_2', studentName: 'Lina M.', lessonsTaken: 8, rating: 4.9, comment: 'The studio in KK is a wonderful place to learn Kadazan-Dusun music.', timeAgo: '3 weeks ago' }
    ],
    credentials: ['Sabah Cultural Board Master Artist', 'Living Human Treasure Award'],
    gallery: [
      'https://picsum.photos/seed/arthur1/400/300',
      'https://picsum.photos/seed/arthur2/400/300',
      'https://picsum.photos/seed/arthurstudio1/400/300',
      'https://picsum.photos/seed/arthurstudio2/400/300'
    ]
  },
  {
    id: 'm19',
    name: 'Cikgu Farah',
    tagline: 'Elegant Strings of Asli Music',
    photo: 'https://picsum.photos/seed/farah/200',
    rating: 4.9,
    reviewCount: 48,
    location: 'Kuala Terengganu, Terengganu',
    address: 'Jalan Sultan Sulaiman, 20000 Kuala Terengganu',
    pricePerLesson: 80,
    studentsCount: 24,
    experienceYears: 10,
    about: 'Specializing in the Biola Melayu for Asli and Keroncong music. I focus on the lyrical and expressive qualities of the violin.',
    specialisation: ['Biola Melayu'],
    teachingStyle: ['Lyrical Focus', 'Keroncong Style', 'Modern Adaptation'],
    languages: ['Bahasa Malaysia', 'English'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 80, description: '60 mins' },
      { id: 'p2', name: '8 Lessons', lessons: 8, price: 576, validityMonths: 4 }
    ],
    reviews: [
      { id: 'r20', studentName: 'Aiman Z.', lessonsTaken: 10, rating: 5, comment: 'Cikgu Farah is a wonderful teacher. The Biola Melayu lessons are very expressive.', timeAgo: '1 week ago' },
      { id: 'r20_2', studentName: 'Sofia H.', lessonsTaken: 5, rating: 4.8, comment: 'The studio in KT is very peaceful. I love learning Keroncong music here.', timeAgo: '2 weeks ago' }
    ],
    credentials: ['B.Mus - ASWARA', 'Terengganu State Music Festival Winner'],
    gallery: [
      'https://picsum.photos/seed/farah1/400/300',
      'https://picsum.photos/seed/farah2/400/300',
      'https://picsum.photos/seed/farahstudio1/400/300',
      'https://picsum.photos/seed/farahstudio2/400/300'
    ]
  },
  {
    id: 'm20',
    name: 'Guru Lakshmi Devi',
    tagline: 'The Soulful Sitar',
    photo: 'https://picsum.photos/seed/lakshmidevi/200',
    rating: 4.96,
    reviewCount: 105,
    location: 'Seremban, Negeri Sembilan',
    address: 'Taman Rasah, 70300 Seremban',
    pricePerLesson: 105,
    studentsCount: 38,
    experienceYears: 20,
    about: 'I teach the Sitar with a focus on the Maihar Gharana, emphasizing the deep emotional resonance of the strings.',
    specialisation: ['Sitar'],
    teachingStyle: ['Gharana Tradition', 'Raga Mastery', 'Emotional Depth'],
    languages: ['English', 'Tamil', 'Hindi'],
    isVerified: true,
    packages: [
      { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
      { id: 'p1', name: 'Single Session', lessons: 1, price: 105, description: '60 mins' },
      { id: 'p2', name: '12 Lessons', lessons: 12, price: 1134, validityMonths: 6 }
    ],
    reviews: [
      { id: 'r21', studentName: 'Ravi P.', lessonsTaken: 15, rating: 5, comment: 'Guru Lakshmi Devi is a master of the Sitar. Her teaching is deeply emotional.', timeAgo: '1 week ago' },
      { id: 'r21_2', studentName: 'Anusha K.', lessonsTaken: 8, rating: 4.9, comment: 'The studio in Seremban is a peaceful place to learn. I love the Sitar ragas.', timeAgo: '3 weeks ago' }
    ],
    credentials: ['Sangeet Alankar', 'Performed at International Sitar Festival'],
    gallery: [
      'https://picsum.photos/seed/lakshmidevi1/400/300',
      'https://picsum.photos/seed/lakshmidevi2/400/300',
      'https://picsum.photos/seed/lakshmidevistudio1/400/300',
      'https://picsum.photos/seed/lakshmidevistudio2/400/300'
    ]
  }
];

// --- Components ---

const ProgressBar = ({ progress, className = "" }: { progress: number, className?: string }) => (
  <div className={`h-1 w-full bg-zinc-100 rounded-full overflow-hidden ${className}`}>
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      className="h-full bg-zinc-900 rounded-full"
    />
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: 'default' | 'gold' | 'harbour' | 'outline', className?: string }) => {
  const styles = {
    default: 'bg-zinc-100 text-zinc-500',
    gold: 'bg-amber-100 text-amber-700',
    harbour: 'bg-harbour-100 text-harbour-700',
    outline: 'border border-zinc-200 text-zinc-400'
  };
  return (
    <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Avatar = ({ name, photo, size = 'sm', className = '' }: { 
  name?: string, photo?: string, size?: 'sm' | 'md' | 'lg' | 'xl', className?: string 
}) => {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const sizes = { 
    sm: 'w-8 h-8 text-[10px]', 
    md: 'w-12 h-12 text-xs', 
    lg: 'w-20 h-20 text-xl',
    xl: 'w-24 h-24 text-2xl'
  };
  if (photo) {
    return <img src={photo} className={`${sizes[size]} rounded-full object-cover ${className}`} referrerPolicy="no-referrer" alt={name} />;
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-harbour-500/20 border border-harbour-500/30 flex items-center justify-center font-bold text-harbour-400 ${className}`}>
      {initials}
    </div>
  );
};

const BottomSheet = ({ isOpen, onClose, title, children, dark = true }: { isOpen: boolean, onClose: () => void, title?: string, children: React.ReactNode, dark?: boolean }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 z-[200]"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
          className={`absolute bottom-0 left-0 right-0 z-[201] rounded-t-[2.5rem] max-h-[92vh] overflow-y-auto ${dark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className={`w-12 h-1 rounded-full mx-auto my-4 ${dark ? 'bg-white/10' : 'bg-black/10'}`} />
          {title && <h3 className={`text-xl font-serif-sturdy px-6 mb-4 ${dark ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>}
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    userId: 'student_001',
    type: 'lesson_confirmed',
    title: 'Trial Confirmed',
    body: 'Cikgu Aris confirmed your free trial on Sat 15 Mar at 3:00 PM',
    read: false,
    createdAt: new Date()
  },
  {
    id: 'n2',
    userId: 'student_001',
    type: 'message',
    title: 'New Message',
    body: 'You have a new message from Cikgu Aris',
    read: true,
    createdAt: new Date(Date.now() - 3600000)
  }
];

const calculateProfileProgress = (profile: any) => {
  if (!profile) return 0;
  const fields = [
    { key: 'photo', weight: 15 },
    { key: 'about', weight: 15 },
    { key: 'specialisation', weight: 20, isArray: true },
    { key: 'pricePerLesson', weight: 15, isNumber: true },
    { key: 'location', weight: 10 },
    { key: 'languages', weight: 10, isArray: true },
    { key: 'introVideoUrl', weight: 15 },
  ];
  
  let total = 0;
  fields.forEach(f => {
    if (f.isArray) {
      if (profile[f.key]?.length > 0) total += f.weight;
    } else if (f.isNumber) {
      if (profile[f.key] > 0) total += f.weight;
    } else {
      if (profile[f.key]?.trim?.()?.length > 0) total += f.weight;
    }
  });
  return total;
};

export default function App() {
  const isDark = true;
  const [view, setView] = useState<View>('auth');
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [hasSeenVerification, setHasSeenVerification] = useState(false);
  const [mentorProfile, setMentorProfile] = useState<any>({
    name: '',
    email: '',
    photo: '',
    about: '',
    tagline: '',
    birthday: '',
    specialisation: [],
    pricePerLesson: 0,
    location: '',
    address: '',
    languages: [],
    introVideoUrl: '',
    teachingStyle: [],
    teachingMethodology: '',
    availability: {},
    gallery: [],
    experienceYears: 0,
    studentsCount: 0,
    rating: 0.0,
    reviewCount: 0,
    isVerified: false,
    packages: [],
    certifications: [],
    idDocument: null
  });
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [authView, setAuthView] = useState<AuthView>('splash');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [realMentors, setRealMentors] = useState<MentorDetail[]>([]);
  const [realStudents, setRealStudents] = useState<Student[]>([]);
  const [realSessionLogs, setRealSessionLogs] = useState<SessionLog[]>([]);
  const [sessionLessonNumber, setSessionLessonNumber] = useState(1);
  const [mentorsLoading, setMentorsLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentActiveLesson, setStudentActiveLesson] = useState<any>(null);
  const [studentLessons, setStudentLessons] = useState<any[]>([]);
  const [studentLogs, setStudentLogs] = useState<any[]>([]);
  const [studentTransactions, setStudentTransactions] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>({
    name: '',
    email: '',
    photo: '',
    aboutMe: '',
    instrument: '',
    birthday: '',
  });
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Firebase Auth Listener
  useEffect(() => {
    let lessonsUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuth(true);
        // Check if user has a profile in Firestore
        getDoc(doc(db, 'users', user.uid)).then((docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const role = userData.role;
            setUserProfile(userData);
            setIsStudent(role === 'student');
            
            // Unsubscribe from previous lessons listener if any
            if (lessonsUnsubscribe) {
              lessonsUnsubscribe();
              lessonsUnsubscribe = null;
            }

            // Check if user is "new" (no lessons/students)
            const q = query(collection(db, 'lessons'), where(role === 'student' ? 'studentId' : 'mentorId', '==', user.uid));
            lessonsUnsubscribe = onSnapshot(q, (querySnapshot) => {
              const lessonsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
              setLessons(lessonsData);
              setIsNewUser(querySnapshot.empty);
            }, (error) => {
              // Only report error if user is still authenticated
              if (auth.currentUser) {
                handleFirestoreError(error, OperationType.GET, 'lessons');
              }
            });

            // Delay view change to next tick so state is committed
            setTimeout(() => setView('home'), 0);
          } else {
            // New user, need to register
            setView('registration');
            setIsNewUser(true);
          }
          setAuthLoading(false);
        });
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsAuth(false);
        setView('auth');
        setAuthLoading(false);
        
        // Unsubscribe from lessons listener on logout
        if (lessonsUnsubscribe) {
          lessonsUnsubscribe();
          lessonsUnsubscribe = null;
        }
      }
    });

    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();

    return () => {
      unsubscribe();
      if (lessonsUnsubscribe) {
        lessonsUnsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuth || !userProfile) return;
    const q = query(collection(db, 'mentors'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      } as MentorDetail));
      setRealMentors(data);
      setMentorsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'mentors');
    });
    return () => unsub();
  }, [isAuth, userProfile]);

  // Students Listener
  useEffect(() => {
    if (!isAuth || !currentUser || !userProfile) return;
    
    const q = query(collection(db, 'students'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      } as Student));
      setRealStudents(data);
      setStudentsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
    });
    return () => unsub();
  }, [isAuth, currentUser, userProfile]);

  // Session Logs Listener
  useEffect(() => {
    if (!isAuth || !currentUser || !userProfile) return;
    
    const q = query(
      collection(db, 'sessionLogs'),
      where(isStudent ? 'studentId' : 'mentorId', '==', currentUser.uid),
      orderBy('date', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      } as SessionLog));
      setRealSessionLogs(data);
    }, (error) => {
      if (error.code === 'failed-precondition') {
        const fallbackQ = query(
          collection(db, 'sessionLogs'),
          where(isStudent ? 'studentId' : 'mentorId', '==', currentUser.uid)
        );
        onSnapshot(fallbackQ, (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as SessionLog))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setRealSessionLogs(data);
        });
      } else {
        console.warn("Session logs listener error:", error);
      }
    });
    
    return () => unsub();
  }, [isAuth, isStudent, currentUser, userProfile]);

  // Student Active Lesson Listener
  useEffect(() => {
    if (!currentUser || !isStudent) return;
    
    const q = query(
      collection(db, 'lessons'),
      where('studentId', '==', currentUser.uid),
      where('status', 'in', ['pending', 'confirmed']),
      orderBy('createdAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setStudentActiveLesson({
          id: snap.docs[0].id,
          ...snap.docs[0].data()
        });
      } else {
        setStudentActiveLesson(null);
      }
    }, (error) => {
      if (error.code === 'failed-precondition') {
        const fallbackQ = query(
          collection(db, 'lessons'),
          where('studentId', '==', currentUser.uid),
          where('status', 'in', ['pending', 'confirmed'])
        );
        onSnapshot(fallbackQ, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
          if (docs.length > 0) {
            setStudentActiveLesson(docs[0]);
          } else {
            setStudentActiveLesson(null);
          }
        });
      } else {
        handleFirestoreError(error, OperationType.GET, 'lessons');
      }
    });
    
    return () => unsub();
  }, [currentUser, isStudent]);

  // Student Journey Data Listener
  useEffect(() => {
    if (!currentUser || !isStudent || !userProfile) return;
    
    const lessonsQuery = query(
      collection(db, 'lessons'),
      where('studentId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const logsQuery = query(
      collection(db, 'sessionLogs'),
      where('studentId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsub1 = onSnapshot(lessonsQuery, (snap) => {
      setStudentLessons(snap.docs.map(d => ({
        id: d.id, ...d.data()
      })));
    }, (error) => {
      if (error.code === 'failed-precondition') {
        const fallbackQ = query(
          collection(db, 'lessons'),
          where('studentId', '==', currentUser.uid)
        );
        onSnapshot(fallbackQ, (snap) => {
          setStudentLessons(snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)));
        });
      } else {
        handleFirestoreError(error, OperationType.GET, 'lessons');
      }
    });
    
    const unsub2 = onSnapshot(logsQuery, (snap) => {
      setStudentLogs(snap.docs.map(d => ({
        id: d.id, ...d.data()
      })));
    }, (error) => {
      if (error.code === 'failed-precondition') {
        const fallbackQ = query(
          collection(db, 'sessionLogs'),
          where('studentId', '==', currentUser.uid)
        );
        onSnapshot(fallbackQ, (snap) => {
          setStudentLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)));
        });
      } else {
        handleFirestoreError(error, OperationType.GET, 'sessionLogs');
      }
    });
    
    return () => { unsub1(); unsub2(); };
  }, [currentUser, isStudent, userProfile]);

  // Student Profile Listener
  useEffect(() => {
    if (!currentUser || !isStudent || !userProfile) return;
    const unsub = onSnapshot(
      doc(db, 'students', currentUser.uid),
      (snap) => {
        if (snap.exists()) {
          setStudentProfile(prev => ({
            ...prev,
            ...snap.data()
          }));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `students/${currentUser.uid}`);
      }
    );
    return () => unsub();
  }, [currentUser, isStudent, userProfile]);

  // Mentor Profile Listener
  useEffect(() => {
    if (!currentUser || isStudent || !userProfile) return;
    const unsub = onSnapshot(
      doc(db, 'mentors', currentUser.uid),
      (snap) => {
        if (snap.exists()) {
          setMentorProfile(prev => ({
            ...prev,
            ...snap.data()
          }));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `mentors/${currentUser.uid}`);
      }
    );
    return () => unsub();
  }, [currentUser, isStudent, userProfile]);

  // Conversations Listener
  useEffect(() => {
    if (!currentUser || !userProfile) return;
    
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setConversations(snap.docs.map(d => ({
        id: d.id, ...d.data()
      })));
    }, (error) => {
      if (error.code === 'failed-precondition') {
        const fallbackQ = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', currentUser.uid)
        );
        onSnapshot(fallbackQ, (snap) => {
          setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => (b.lastMessageAt?.toDate?.() || 0) - (a.lastMessageAt?.toDate?.() || 0)));
        });
      } else {
        handleFirestoreError(error, OperationType.GET, 'conversations');
      }
    });
    
    return () => unsub();
  }, [currentUser, isStudent, userProfile]);

  // Messages Listener
  useEffect(() => {
    if (!selectedChat?.conversationId) return;
    
    const q = query(
      collection(db, 'conversations', 
        selectedChat.conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({
        id: d.id,
        text: d.data().text,
        senderId: d.data().senderId,
        isMe: d.data().senderId === currentUser?.uid,
        createdAt: d.data().timestamp,
        time: d.data().timestamp?.toDate()
          ?.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) || ''
      })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `conversations/${selectedChat.conversationId}/messages`);
    });
    
    return () => unsub();
  }, [selectedChat?.conversationId]);

  // Mark messages as read
  useEffect(() => {
    if (!currentUser || !selectedChat?.conversationId) return;
    
    const conversation = conversations.find(c => c.id === selectedChat.conversationId);
    if (conversation?.unreadBy?.includes(currentUser.uid)) {
      updateDoc(doc(db, 'conversations', selectedChat.conversationId), {
        unreadBy: arrayRemove(currentUser.uid)
      }).catch(err => console.error("Error marking as read:", err));
    }
  }, [selectedChat?.conversationId, conversations, currentUser]);

  const saveStudentProfile = async (updates: any) => {
    if (!currentUser) return;
    try {
      await updateDoc(
        doc(db, 'students', currentUser.uid), 
        { ...updates, updatedAt: serverTimestamp() }
      );
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleStartConversation = async (mentorId: string, mentorName: string, mentorPhoto: string) => {
    if (!currentUser) return;

    try {
      // Check if conversation already exists
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUser.uid)
      );

      const snap = await getDocs(q);
      let existingConv = snap.docs.find(doc => doc.data().participants.includes(mentorId));

      if (existingConv) {
        setSelectedChat({
          id: existingConv.id,
          name: mentorName,
          photo: mentorPhoto,
          role: 'mentor'
        });
        setStudentViewStack(['chat']);
      } else {
        // Create new conversation
        const newConv = await addDoc(collection(db, 'conversations'), {
          participants: [currentUser.uid, mentorId],
          participantDetails: {
            [currentUser.uid]: {
              name: currentUser.displayName || 'Student',
              photo: currentUser.photoURL || '',
              role: 'student'
            },
            [mentorId]: {
              name: mentorName,
              photo: mentorPhoto,
              role: 'mentor'
            }
          },
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });

        setSelectedChat({
          id: newConv.id,
          name: mentorName,
          photo: mentorPhoto,
          role: 'mentor'
        });
        setStudentViewStack(['chat']);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser || !selectedChat || !text.trim()) return;

    let conversationId = selectedChat.conversationId;
    const trimmedText = text.trim();

    // If it's a new conversation, we need to create it first
    if (!conversationId) {
      try {
        const otherParticipantId = selectedChat.recipientId;
        if (!otherParticipantId) return;

        // Check if conversation already exists (double check)
        const existingConv = conversations.find(c => c.participants.includes(otherParticipantId));
        if (existingConv) {
          conversationId = existingConv.id;
        } else {
          // Create new conversation
          const participants = [currentUser.uid, otherParticipantId];
          const participantDetails: any = {};
          
          // Current user details
          const myProfile = isStudent ? studentProfile : mentorProfile;
          participantDetails[currentUser.uid] = {
            name: myProfile.name || 'User',
            photo: myProfile.photo || null,
            role: isStudent ? 'Student' : 'Mentor'
          };

          // Other participant details
          participantDetails[otherParticipantId] = {
            name: selectedChat.name,
            photo: selectedChat.photo,
            role: selectedChat.role || (isStudent ? 'Mentor' : 'Student')
          };

          const newConvRef = await addDoc(collection(db, 'conversations'), {
            participants,
            participantDetails,
            lastMessage: trimmedText,
            lastMessageAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          conversationId = newConvRef.id;
          
          // Update selectedChat so subsequent messages use the new ID
          setSelectedChat({
            ...selectedChat,
            conversationId: conversationId,
            id: conversationId
          });
        }
      } catch (error) {
        console.error("Error creating conversation:", error);
        return;
      }
    }

    // Optimistic UI update
    const optimisticMessage = {
      id: 'temp-' + Date.now(),
      text: trimmedText,
      senderId: currentUser.uid,
      isMe: true,
      createdAt: null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sending: true
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const messageData = {
        text: trimmedText,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        read: false
      };

      await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

      const otherParticipantId = selectedChat.recipientId || 
        conversations.find(c => c.id === conversationId)?.participants.find((p: string) => p !== currentUser.uid);

      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: trimmedText,
        lastMessageAt: serverTimestamp(),
        unreadBy: arrayUnion(otherParticipantId)
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        setAuthError("This domain is not authorized. Please add it to Firebase Console.");
      } else {
        setAuthError("Failed to sign in with Google. Please try again.");
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Login Error:", error);
      switch (error.code) {
        case 'auth/invalid-email':
          setAuthError("The email address is not valid.");
          break;
        case 'auth/user-disabled':
          setAuthError("This user account has been disabled.");
          break;
        case 'auth/user-not-found':
          setAuthError("No user found with this email. Please register first.");
          break;
        case 'auth/wrong-password':
          setAuthError("Incorrect password. Please try again.");
          break;
        case 'auth/invalid-credential':
          setAuthError("Invalid email or password. Please check and try again.");
          break;
        case 'auth/too-many-requests':
          setAuthError("Too many failed attempts. Please try again later.");
          break;
        default:
          setAuthError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent<HTMLFormElement>, role: 'student' | 'mentor') => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const phone = formData.get('phone') as string;
    const birthday = formData.get('birthday') as string;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (role === 'mentor') {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name,
          email: user.email,
          phone,
          birthday,
          role: 'mentor',
          createdAt: serverTimestamp()
        });

        await setDoc(doc(db, 'mentors', user.uid), {
          uid: user.uid,
          name,
          email: user.email,
          phone,
          birthday,
          role: 'mentor',
          tagline: '',
          about: '',
          photo: '',
          coverPhoto: '',
          introVideoUrl: '',
          location: '',
          address: '',
          specialisation: [],
          teachingStyle: [],
          languages: [],
          pricePerLesson: 0,
          rating: 0,
          reviewCount: 0,
          studentsCount: 0,
          experienceYears: 0,
          isVerified: false,
          packages: [],
          credentials: [],
          gallery: [],
          createdAt: serverTimestamp()
        });
      } else {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name,
          email: user.email,
          phone,
          birthday,
          role: 'student',
          createdAt: serverTimestamp()
        });

        await setDoc(doc(db, 'students', user.uid), {
          uid: user.uid,
          name,
          email: user.email,
          phone,
          birthday,
          role: 'student',
          instrument: '',
          stage: 'Stage 1 — Foundation',
          progress: 0,
          photo: '',
          createdAt: serverTimestamp()
        });
      }
      
      setIsStudent(role === 'student');
      setView('home');
    } catch (error: any) {
      console.error("Registration Error:", error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setAuthError("This email is already registered. Try signing in instead.");
          break;
        case 'auth/invalid-email':
          setAuthError("The email address is not valid.");
          break;
        case 'auth/operation-not-allowed':
          setAuthError("Email/password accounts are not enabled. Contact support.");
          break;
        case 'auth/weak-password':
          setAuthError("The password is too weak. Use at least 6 characters.");
          break;
        default:
          setAuthError("Failed to create account. Please try again.");
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      await sendPasswordResetEmail(auth, email);
      setForgotPasswordSent(true);
    } catch (error: any) {
      console.error("Forgot Password Error:", error);
      switch (error.code) {
        case 'auth/invalid-email':
          setAuthError("The email address is not valid.");
          break;
        case 'auth/user-not-found':
          setAuthError("No user found with this email.");
          break;
        default:
          setAuthError("Failed to send reset link. Please try again.");
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthView('splash');
      setStudentViewStack(['home']);
      setSelectedMentor(null);
      setSelectedStudent(null);
      setSelectedChat(null);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const saveMentorProfile = async (updates: Partial<MentorDetail>) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'mentors', currentUser.uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Profile save failed:', error);
    }
  };

  const handleBookingConfirm = async (
    type: 'trial' | 'package' | 'single'
  ) => {
    if (!currentUser || !selectedMentor) return;
    
    // Capitalize type for Bug 2
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    
    try {
      const isPartOfPackage = type === 'package';
      const price = type === 'trial' ? 0 : 
                   type === 'single' ? selectedMentor.pricePerLesson : 
                   selectedPackage?.price || 0;
      const totalLessons = type === 'package' ? selectedPackage?.lessons : 1;
      const walletCredit = isPartOfPackage 
        ? (price / (totalLessons || 1)) 
        : price;

      await addDoc(collection(db, 'lessons'), {
        studentId: currentUser.uid,
        studentName: userProfile?.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'Student',
        mentorId: selectedMentor.id,
        mentorName: selectedMentor.name,
        instrument: selectedInstrument?.name || selectedMentor.specialisation[0] || '',
        date: bookingDate || '',
        time: bookingTime || '',
        type: capitalizedType,
        status: 'pending',
        price: price,
        // Bug 4: Save totalLessons for packages
        totalLessons: totalLessons,
        walletCredit,
        isPartOfPackage,
        studentNote: bookingNote || '',
        lessonNumber: 1,
        createdAt: serverTimestamp()
      });

      setBookingSuccess({ type, mentor: selectedMentor.name });
      if (type === 'trial') {
        // No longer need setIsTrialCompleted(true) as we use dynamic check
      }
      
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };


  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationSheet, setShowNotificationSheet] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Notifications Listener
  useEffect(() => {
    if (!currentUser || !userProfile) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Notification));
      setNotifications(notifs);
    }, (error) => {
      console.warn("Notifications listener error (index may be missing):", error.message);
      // Fallback: try without orderBy
      const fallbackQ = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser!.uid)
      );
      onSnapshot(fallbackQ, (snap) => {
        const notifs: Notification[] = snap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          } as Notification))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setNotifications(notifs);
      });
    });

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  useEffect(() => {
    if (!currentUser || isStudent || !userProfile) return;
    const unsub = onSnapshot(
      doc(db, 'mentors', currentUser.uid), 
      (snap) => {
        if (snap.exists()) {
          setMentorProfile(prev => ({
            ...prev,
            ...snap.data()
          }));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `mentors/${currentUser.uid}`);
      }
    );
    return () => unsub();
  }, [currentUser, isStudent, userProfile]);

  useEffect(() => {
    if (!currentUser || isStudent || !userProfile) return;
    
    const q = query(
      collection(db, 'lessons'),
      where('mentorId', '==', currentUser.uid)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const lessons = snap.docs.map(d => d.data());
      // Include all lessons in balance as requested
      const total = lessons.reduce((sum, l) => 
        sum + (l.walletCredit ?? l.price ?? 0), 0);
      const platformFee = total * 0.1;
      setRealBalance(total - platformFee);
      setRealTransactions(
        snap.docs.map(d => {
          const data = d.data();
          const amount = data.walletCredit ?? data.price ?? 0;
          return {
            id: d.id,
            studentName: data.studentName,
            date: data.date,
            grossAmount: amount,
            platformFee: amount * 0.1,
            netAmount: amount * 0.9,
            lessonType: data.type,
            studentPhoto: '',
            studentId: data.studentId,
            isPartOfPackage: data.isPartOfPackage,
            completedAt: data.completedAt,
            status: data.status // Add status for UI
          };
        })
      );
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'lessons (mentor balance)');
    });
    
    return () => unsub();
  }, [currentUser, isStudent, userProfile]);

  const triggerNotification = async (targetUserId: string, type: string, title: string, body: string) => {
    if (!notificationsEnabled) return;
    
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: targetUserId,
        type,
        title,
        body,
        read: false,
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Error triggering notification:", error);
    }
  };
  const handleRescheduleRequest = async (lesson: any, newDate: string, newTime: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'lessons', lesson.id), {
        status: 'reschedule_requested',
        requestedDate: newDate,
        requestedTime: newTime,
        requestedBy: currentUser.uid,
        updatedAt: serverTimestamp()
      });

      const targetId = currentUser.uid === lesson.studentId ? lesson.mentorId : lesson.studentId;
      const requesterName = userProfile?.name || 'Your partner';
      await triggerNotification(
        targetId,
        'reschedule_requested',
        'Reschedule Requested',
        `${requesterName} requested to reschedule your lesson to ${new Date(newDate).toLocaleDateString()} at ${newTime}.`
      );
      
      setShowRescheduleModal(false);
      setReschedulingLesson(null);
    } catch (error) {
      console.error("Error requesting reschedule:", error);
    }
  };

  const handleRescheduleAction = async (lesson: any, action: 'accept' | 'decline') => {
    if (!currentUser) return;
    try {
      if (action === 'accept') {
        await updateDoc(doc(db, 'lessons', lesson.id), {
          date: lesson.requestedDate,
          time: lesson.requestedTime,
          status: 'confirmed',
          requestedDate: null,
          requestedTime: null,
          requestedBy: null,
          updatedAt: serverTimestamp()
        });

        const targetId = currentUser.uid === lesson.studentId ? lesson.mentorId : lesson.studentId;
        await triggerNotification(
          targetId,
          'reschedule_accepted',
          'Reschedule Accepted',
          `Your reschedule request for ${new Date(lesson.requestedDate).toLocaleDateString()} has been accepted.`
        );
      } else {
        await updateDoc(doc(db, 'lessons', lesson.id), {
          status: 'confirmed',
          requestedDate: null,
          requestedTime: null,
          requestedBy: null,
          updatedAt: serverTimestamp()
        });

        const targetId = currentUser.uid === lesson.studentId ? lesson.mentorId : lesson.studentId;
        await triggerNotification(
          targetId,
          'reschedule_declined',
          'Reschedule Declined',
          `Your reschedule request has been declined. The original time remains.`
        );
      }
    } catch (error) {
      console.error("Error handling reschedule action:", error);
    }
  };

  const handleCancelLesson = async (lesson: any, reason: string) => {
    if (!currentUser) return;
    try {
      const cancelledBy = isStudent ? 'student' : 'mentor';
      
      if (lesson.id.startsWith('l')) {
        // Mock lesson update
        setLessons(prev => prev.map(l => l.id === lesson.id ? { 
          ...l, 
          status: 'cancelled', 
          cancelledBy,
          cancelReason: reason 
        } : l));
      } else {
        await updateDoc(doc(db, 'lessons', lesson.id), {
          status: 'cancelled',
          cancelledBy,
          cancelReason: reason,
          updatedAt: serverTimestamp()
        });
      }

      const targetId = currentUser.uid === lesson.studentId ? lesson.mentorId : lesson.studentId;
      const cancellerName = userProfile?.name || (isStudent ? 'Student' : 'Mentor');
      
      await triggerNotification(
        targetId,
        'lesson_cancelled',
        'Lesson Cancelled',
        `Your lesson with ${cancellerName} has been cancelled. Reason: ${reason}`
      );

      // Also notify self
      await triggerNotification(
        currentUser.uid,
        'lesson_cancelled',
        'Lesson Cancelled',
        `You cancelled your lesson with ${lesson.studentName || 'Your partner'}.`
      );
    } catch (error) {
      console.error("Error cancelling lesson:", error);
    }
  };
  const [splashIndex, setSplashIndex] = useState(0);
  const profileProgress = calculateProfileProgress(mentorProfile);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [homeTab, setHomeTab] = useState<'today' | 'pending'>('today');
  const [scheduleFilter, setScheduleFilter] = useState<'week' | 'month' | 'all'>('week');
  const [activeLessonAction, setActiveLessonAction] = useState<Lesson | null>(null);
  const [walletTab, setWalletTab] = useState<'transactions' | 'withdrawals'>('transactions');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(MOCK_WITHDRAWALS);
  const [realTransactions, setRealTransactions] = useState<Transaction[]>([]);
  const [realBalance, setRealBalance] = useState(0);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactionFilter, setTransactionFilter] = useState<'week' | 'month' | 'custom'>('month');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState<'idle' | 'processing' | 'success'>('idle');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSetupDetails, setShowSetupDetails] = useState(false);
  const [mentorProfileExpandedSections, setMentorProfileExpandedSections] = useState<string[]>([]);
  const [sessionSaveSuccess, setSessionSaveSuccess] = useState(false);
  const [newCert, setNewCert] = useState({ title: '', issuer: '', year: '' });
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [idUploadStatus, setIdUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');

  // Bottom Sheet States
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [showAllLessonsSheet, setShowAllLessonsSheet] = useState(false);
  const [showCredentialsSheet, setShowCredentialsSheet] = useState(false);
  const [selectedLessonDetails, setSelectedLessonDetails] = useState<any | null>(null);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showAIGenerateSheet, setShowAIGenerateSheet] = useState(false);
  const [showAIBuddySheet, setShowAIBuddySheet] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | null>(null);
  const [bookingTime, setBookingTime] = useState<string | null>(null);
  const [bookingNote, setBookingNote] = useState('');
  const [bookingType, setBookingType] = useState<'trial' | 'single' | 'package' | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [bookingStep, setBookingStep] = useState<number>(1);
  const [bookingSuccess, setBookingSuccess] = useState<{type: 'trial' | 'single' | 'package', mentor: string} | null>(null);
  const [isWeeklyRecurring, setIsWeeklyRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState<string | null>(null);
  const [recurringTime, setRecurringTime] = useState<string | null>(null);
  const [isTrialConfirmed, setIsTrialConfirmed] = useState(false);

  // Calendar & Time Data for Booking
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
  const timeSlots = {
    morning: ['9:00 AM', '10:00 AM', '11:00 AM'],
    afternoon: ['2:00 PM', '4:00 PM'],
    evening: ['6:00 PM', '7:00 PM', '8:00 PM']
  };

  // Theme State
  const [preferredTheme, setPreferredTheme] = useState<'light' | 'dark' | null>(null);

  // Student States
  const [studentViewStack, setStudentViewStack] = useState<StudentView[]>(['home']);
  const studentView = studentViewStack[studentViewStack.length - 1];

  const pushStudentView = (view: StudentView) => {
    setStudentViewStack(prev => [...prev, view]);
  };
  const switchStudentTab = (tab: StudentView) => {
    setStudentViewStack([tab]);
  };
  const popStudentView = () => {
    setStudentViewStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  };
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<MentorDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cultureTab, setCultureTab] = useState<'Malay' | 'Indian' | 'Chinese' | 'Borneo'>('Malay');

  // Student Detail View States (Moved to top level to fix Rules of Hooks)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [showAddMilestoneSheet, setShowAddMilestoneSheet] = useState(false);
  const [showAddMaterialSheet, setShowAddMaterialSheet] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialType, setNewMaterialType] = useState<'PDF' | 'Guide' | 'Notes'>('PDF');

  // Book Trial View States
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [studentNote, setStudentNote] = useState('');
  const [bookingStepTrial, setBookingStepTrial] = useState<'datetime' | 'confirm'>('datetime');

  // Book Paid View States
  const [paymentStep, setPaymentStep] = useState<'method' | 'processing' | 'success'>('method');

  // Mentor Profile View States
  const [showTrialRules, setShowTrialRules] = useState(false);

  // Student Journey View States
  const [journeyTab, setJourneyTab] = useState<'lessons' | 'progress'>('lessons');
  const [selectedInstrumentJourney, setSelectedInstrumentJourney] = useState('Gambus');
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reschedulingLesson, setReschedulingLesson] = useState<any | null>(null);
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState<string | null>(null);
  const [selectedRescheduleTime, setSelectedRescheduleTime] = useState<string | null>(null);
  const [cancellingIds, setCancellingIds] = useState<string[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [lessonToCancel, setLessonToCancel] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Auth View States
  const [roleTab, setRoleTab] = useState<'student' | 'mentor'>('student');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  useEffect(() => {
    setForgotPasswordSent(false);
    setAuthError(null);
  }, [authView]);

  // Chat and Profile States
  const [studentBio, setStudentBio] = useState("Traditional music enthusiast learning the strings of Malaysia.");
  const [isEditingStudentBio, setIsEditingStudentBio] = useState(false);
  const [studentNotificationsEnabled, setStudentNotificationsEnabled] = useState(true);
  const [showStudentPaymentHistory, setShowStudentPaymentHistory] = useState(false);
  const [showStudentPaymentMethods, setShowStudentPaymentMethods] = useState(false);
  const [studentPaymentMethods, setStudentPaymentMethods] = useState([
    { id: 'pm1', type: 'Visa', last4: '4242', expiry: '12/26', isDefault: true },
    { id: 'pm2', type: 'Mastercard', last4: '8888', expiry: '08/25', isDefault: false }
  ]);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardData, setNewCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const currentViewIsDark = studentView !== 'journey';

  // --- Views ---

  // --- Student Views ---

  const StudentHomeView = () => {
    const dark = true;
    return (
      <div className={`min-h-full px-5 pt-8 relative overflow-hidden ${dark ? 'bg-atmospheric-dark' : 'bg-white'}`}>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className={`text-[9px] font-mono uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>Welcome,</h2>
              <h1 className={`text-2xl font-serif-sturdy mb-0.5 ${dark ? 'text-white' : 'text-zinc-900'}`}>
                {userProfile?.name?.split(' ')[0] || 'Student'}
              </h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowNotificationSheet(true)}
                className={`w-10 h-10 rounded-full flex items-center justify-center relative transition-all ${dark ? 'bg-white/10 text-white' : 'bg-black/5 text-zinc-900'}`}
              >
                <Bell size={18} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-harbour-500 rounded-full border-2 border-black" />
                )}
              </button>
              <Avatar 
                name={userProfile?.name || 'Student'} 
                photo={userProfile?.photo} 
                size="sm" 
                className={`border ${dark ? 'border-white/20' : 'border-black/10'}`} 
              />
            </div>
          </div>

          {/* Continue Learning Card */}
          {studentActiveLesson && (
            <div className={`mb-5 p-4 rounded-3xl border ${dark ? 'border-white/10 bg-white/5' : 'border-zinc-100 bg-white shadow-sm'}`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${dark ? 'text-white/30' : 'text-zinc-400'}`}>Continue Learning</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>
                    {studentActiveLesson.instrument}
                  </p>
                  <p className={`text-xs ${dark ? 'text-white/40' : 'text-zinc-500'}`}>
                    with {studentActiveLesson.mentorName}
                  </p>
                  <p className={`text-xs mt-1 ${dark ? 'text-white/40' : 'text-zinc-400'}`}>
                    {studentActiveLesson.status === 'pending' 
                      ? '⏳ Awaiting confirmation' 
                      : `📅 ${studentActiveLesson.date} at ${studentActiveLesson.time}`}
                  </p>
                </div>
                <button 
                  onClick={() => switchStudentTab('journey')}
                  className={`px-4 py-2 text-xs font-bold rounded-full ${dark ? 'bg-white text-black' : 'bg-zinc-900 text-white'}`}
                >
                  View →
                </button>
              </div>
            </div>
          )}

          <div className="mb-5">
            <div className="flex justify-between items-end mb-2">
              <h2 className={`text-[9px] uppercase tracking-[0.2em] font-bold ${dark ? 'text-white/30' : 'text-zinc-500'}`}>
                {isNewUser ? 'Explore Instruments' : 'Continue Learning'}
              </h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(['Malay', 'Indian', 'Chinese', 'Borneo'] as const).map((tab) => (
              <motion.button
                key={tab}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCultureTab(tab)}
                className={`px-5 py-2 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border ${cultureTab === tab ? (dark ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]' : 'bg-zinc-900 text-white border-zinc-900 shadow-md') : (dark ? 'bg-white/5 text-white/40 border-white/10' : 'bg-black/5 text-zinc-500 border-black/5')}`}
              >
                {tab}
              </motion.button>
            ))}
          </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pb-32">
            {MOCK_INSTRUMENTS.filter(i => i.culture === cultureTab).map((instrument) => (
              <motion.div
                key={instrument.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'tween', duration: 0.1 }}
                onClick={() => { setSelectedInstrument(instrument); pushStudentView('mentor-listing'); }}
                className="group relative aspect-[2.4/1] rounded-[2rem] overflow-hidden cursor-pointer shadow-lg"
              >
                <img 
                  src={instrument.photo || null} 
                  alt={instrument.name} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
                
                <div className="absolute top-3 right-4">
                  <div className="px-2.5 py-1 backdrop-blur-md bg-white/10 border border-white/20 rounded-full text-[7px] font-bold uppercase tracking-widest text-white">
                    {instrument.type}
                  </div>
                </div>

                <div className="absolute inset-y-0 left-6 right-12 flex flex-col justify-center">
                  <h3 className="text-xl font-serif-sturdy text-white mb-1 leading-tight">{instrument.name}</h3>
                  <p className="text-[9px] text-white/70 line-clamp-2 leading-relaxed max-w-[80%]">
                    {instrument.story}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const MentorListingView = () => {
    const dark = true;
    const [sortBy, setSortBy] = useState<'rating' | 'price-low' | 'price-high' | 'name'>('rating');

    if (mentorsLoading) return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/40 text-sm animate-pulse">
          Loading mentors...
        </p>
      </div>
    );

    if (!mentorsLoading && realMentors.length === 0) return null;

    const sortedMentors = [...realMentors].sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price-low') return a.pricePerLesson - b.pricePerLesson;
      if (sortBy === 'price-high') return b.pricePerLesson - a.pricePerLesson;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return (
      <div className={`h-full overflow-y-auto scrollbar-hide px-5 pt-12 ${dark ? 'bg-atmospheric-dark text-white' : 'bg-white text-zinc-900'}`}>
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => popStudentView()} className={`w-10 h-10 rounded-full flex items-center justify-center border ${dark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/5 text-zinc-900'}`}>
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className={`text-2xl font-serif-sturdy ${dark ? 'text-white' : 'text-zinc-900'}`}>{selectedInstrument?.name}</h1>
            <Badge variant="harbour">{selectedInstrument?.type}</Badge>
          </div>
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-white/5 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-harbour-500 transition-all text-white"
            >
              <option value="rating">Top Rated</option>
              <option value="price-low">Price: Low</option>
              <option value="price-high">Price: High</option>
              <option value="name">Name</option>
            </select>
            <ArrowUpDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-4 pb-32">
          {sortedMentors.filter(m => {
            const progress = calculateProfileProgress(m);
            return progress === 100 && (m.specialisation as string[]).some(s => s.toLowerCase().includes(selectedInstrument?.name?.toLowerCase() || ''));
          }).map((mentor) => (
            <motion.div
              key={mentor.id}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'tween', duration: 0.1 }}
              onClick={() => { setSelectedMentor(mentor); pushStudentView('mentor-profile'); }}
              className={`border rounded-[2rem] p-5 relative overflow-hidden group transition-colors ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-100 shadow-sm'} ${
                selectedInstrument?.culture === 'Malay' ? 'border-l-4 border-l-emerald-500' :
                selectedInstrument?.culture === 'Indian' ? 'border-l-4 border-l-amber-500' :
                selectedInstrument?.culture === 'Chinese' ? 'border-l-4 border-l-rose-500' :
                'border-l-4 border-l-harbour-500'
              }`}
            >
              <div className="flex gap-4">
                <Avatar name={mentor.name} photo={mentor.photo} size="lg" className="rounded-2xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <h3 className={`text-lg font-serif-sturdy truncate ${dark ? 'text-white' : 'text-zinc-900'}`}>{mentor.name}</h3>
                    {mentor.isVerified && <CheckCircle2 size={14} className="text-harbour-400" />}
                  </div>
                  <p className={`text-xs mb-3 line-clamp-1 italic ${dark ? 'text-white/40' : 'text-zinc-500'}`}>{mentor.tagline}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                      <Star size={12} fill="currentColor" />
                      {mentor.rating}
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-400'}`}>
                      <MapPin size={12} />
                      {mentor.location}
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-end">
                  <div>
                    <p className={`text-[9px] font-mono uppercase tracking-widest mb-1 ${dark ? 'text-white/30' : 'text-zinc-400'}`}>From</p>
                    <p className={`text-xl font-serif-sturdy ${dark ? 'text-white' : 'text-zinc-900'}`}>RM{mentor.pricePerLesson}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const BookTrialView = () => {
    const dark = true;

    if (!selectedMentor) return null;

    useEffect(() => {
      setBookingStepTrial('datetime');
      setSelectedDate(null);
      setSelectedTime(null);
      setStudentNote('');
    }, [selectedMentor?.id]);

    const timeSlots = ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'];
    const dates = [
      { day: 'Mon', date: '18' },
      { day: 'Tue', date: '19' },
      { day: 'Wed', date: '20' },
      { day: 'Thu', date: '21' },
      { day: 'Fri', date: '22' },
    ];

    return (
      <div className={`min-h-full px-5 pt-12 ${dark ? 'bg-atmospheric-dark text-white' : 'bg-white text-zinc-900'}`}>
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => popStudentView()} className={`w-10 h-10 rounded-full border flex items-center justify-center ${dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-serif-sturdy">Book Free Trial</h1>
            <p className={`text-[10px] font-mono uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>With {selectedMentor.name}</p>
          </div>
        </header>

        {bookingStepTrial === 'datetime' ? (
          <div className="space-y-8">
            <section>
              <h2 className={`text-[10px] uppercase tracking-widest font-bold mb-4 ${dark ? 'text-white/30' : 'text-zinc-500'}`}>Select Date</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {dates.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    className={`flex-shrink-0 w-16 h-20 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                      selectedDate === d.date 
                        ? 'bg-harbour-600 border-harbour-500 shadow-lg scale-105' 
                        : (dark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-black/5 border-black/5 text-zinc-400')
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold mb-1">{d.day}</span>
                    <span className="text-xl font-serif-sturdy">{d.date}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className={`text-[10px] uppercase tracking-widest font-bold mb-4 ${dark ? 'text-white/30' : 'text-zinc-500'}`}>Select Time</h2>
              <div className="grid grid-cols-3 gap-3">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 rounded-xl border text-[10px] font-bold transition-all ${
                      selectedTime === time 
                        ? (dark ? 'bg-white text-black border-white' : 'bg-zinc-900 text-white border-zinc-900')
                        : (dark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-black/5 border-black/5 text-zinc-400')
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </section>

            <section className="pb-32">
              <h2 className={`text-[10px] uppercase tracking-widest font-bold mb-4 ${dark ? 'text-white/30' : 'text-zinc-500'}`}>Add a Note (Optional)</h2>
              <textarea 
                value={studentNote}
                onChange={(e) => setStudentNote(e.target.value)}
                placeholder="Tell the mentor about your experience or what you'd like to learn..."
                className={`w-full p-4 rounded-2xl border text-sm focus:outline-none transition-all h-32 resize-none ${dark ? 'bg-white/5 border-white/10 text-white focus:border-harbour-500' : 'bg-white border-zinc-200 text-zinc-900 focus:border-harbour-500'}`}
              />
            </section>

            <button 
              disabled={!selectedDate || !selectedTime}
              onClick={() => {
                if (!selectedDate || !selectedTime) {
                  // shake animation via class toggle - add a shake state
                  return;
                }
                setBookingStepTrial('confirm');
              }}
              className={`w-full py-5 rounded-full font-bold transition-all mt-8 ${
                selectedDate && selectedTime 
                  ? (dark ? 'bg-white text-black active:scale-95' : 'bg-zinc-900 text-white active:scale-95')
                  : (dark ? 'bg-white/10 text-white/20 cursor-not-allowed' : 'bg-black/10 text-zinc-300 cursor-not-allowed')
              }`}
            >
              {!selectedDate ? 'Pick a Date First' : !selectedTime ? 'Pick a Time' : 'Confirm Selection'}
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-serif-sturdy mb-2">Booking Confirmed!</h2>
            <p className={`text-sm mb-8 ${dark ? 'text-white/60' : 'text-zinc-600'}`}>Your free trial with {selectedMentor.name} is scheduled for March {selectedDate} at {selectedTime}.</p>
            <button 
              onClick={() => switchStudentTab('journey')}
              className={`w-full py-5 rounded-full font-bold ${dark ? 'bg-white text-black' : 'bg-zinc-900 text-white'}`}
            >
              View My Journey
            </button>
          </div>
        )}
      </div>
    );
  };

  const StudentScheduleView = () => {
    const dark = true;
    if (!selectedMentor) return null;
    return (
      <div className={`min-h-full px-5 pt-12 ${dark ? 'bg-atmospheric-dark text-white' : 'bg-white text-zinc-900'}`}>
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => popStudentView()} className={`w-10 h-10 rounded-full border flex items-center justify-center ${dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-serif-sturdy">Mentor Schedule</h1>
            <p className={`text-[10px] font-mono uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>{selectedMentor.name}'s Availability</p>
          </div>
        </header>

        <div className="space-y-6 pb-32">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
            <div key={day} className={`p-5 rounded-3xl border ${dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>{day}</h3>
                <span className="text-[10px] font-mono text-harbour-400 uppercase tracking-widest">Available</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['09:00', '10:30', '14:00', '15:30'].map(time => (
                  <span key={time} className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold ${dark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-black/5 border-black/5 text-zinc-500'}`}>{time}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const BookPaidView = () => {
    const dark = true;

    if (!selectedMentor) return null;

    useEffect(() => {
      setPaymentStep('method');
    }, [selectedMentor?.id]);

    useEffect(() => {
      if (paymentStep === 'processing') {
        const timer = setTimeout(() => setPaymentStep('success'), 2000);
        return () => clearTimeout(timer);
      }
    }, [paymentStep]);

    return (
      <div className={`min-h-full px-5 pt-12 ${dark ? 'bg-atmospheric-dark text-white' : 'bg-white text-zinc-900'}`}>
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => popStudentView()} className={`w-10 h-10 rounded-full border flex items-center justify-center ${dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-serif-sturdy">Checkout</h1>
            <p className={`text-[10px] font-mono uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>Secure Payment</p>
          </div>
        </header>

        {paymentStep === 'method' ? (
          <div className="space-y-6 pb-32">
            <div className={`p-6 rounded-3xl border ${dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
              <p className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${dark ? 'text-white/30' : 'text-zinc-500'}`}>Selected Package</p>
              <h3 className={`text-xl font-serif-sturdy mb-1 ${dark ? 'text-white' : 'text-zinc-900'}`}>Standard Package</h3>
              <p className={`text-sm ${dark ? 'text-white/60' : 'text-zinc-600'}`}>4 Lessons with {selectedMentor.name}</p>
              <div className={`mt-4 pt-4 border-t flex justify-between items-center ${dark ? 'border-white/10' : 'border-black/5'}`}>
                <span className="text-sm font-bold">Total Amount</span>
                <span className="text-xl font-serif-sturdy">RM{selectedMentor.pricePerLesson * 4}</span>
              </div>
            </div>

            <section>
              <h2 className={`text-[10px] uppercase tracking-widest font-bold mb-4 ${dark ? 'text-white/30' : 'text-zinc-500'}`}>Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'card', label: 'Credit / Debit Card', icon: Wallet },
                  { id: 'fpx', label: 'FPX Online Banking', icon: ArrowUpRight },
                  { id: 'ewallet', label: 'E-Wallet (Grab/TNG)', icon: DollarSign }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentStep('processing')}
                    className={`w-full p-5 border rounded-2xl flex items-center justify-between group transition-all ${dark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${dark ? 'bg-white/5 text-white/40 group-hover:text-white' : 'bg-black/5 text-zinc-400 group-hover:text-zinc-900'}`}>
                        <method.icon size={20} />
                      </div>
                      <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>{method.label}</span>
                    </div>
                    <ChevronRight size={16} className={dark ? 'text-white/20' : 'text-zinc-300'} />
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : paymentStep === 'processing' ? (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-harbour-500 border-t-transparent rounded-full mx-auto mb-8"
            />
            <h2 className="text-xl font-serif-sturdy mb-2">Processing Payment</h2>
            <p className={`text-xs uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>Please do not close this window</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-serif-sturdy mb-2">Payment Successful!</h2>
            <p className={`text-sm mb-8 ${dark ? 'text-white/60' : 'text-zinc-600'}`}>Your package has been activated. You can now start scheduling your lessons with {selectedMentor.name}.</p>
            <button 
              onClick={() => switchStudentTab('journey')}
              className={`w-full py-5 rounded-full font-bold ${dark ? 'bg-white text-black' : 'bg-zinc-900 text-white'}`}
            >
              Go to My Journey
            </button>
          </div>
        )}
      </div>
    );
  };

  const StudentDashboard = () => {
    // Determine theme based on view
    const getViewTheme = (view: StudentView) => {
      if (view === 'home') return true; // Dark
      if (view === 'journey') return false; // Light
      if (view === 'messages') return true; // Dark
      if (view === 'profile') return true; // User preference for profile
      if (view === 'mentor-listing') return true; // Always Dark as requested
      if (view === 'mentor-profile') return true; // Always Dark as requested
      return true;
    };

    const currentViewIsDark = getViewTheme(studentView);

    return (
      <div className={`h-full flex flex-col transition-colors duration-500 relative overflow-hidden ${currentViewIsDark ? 'bg-atmospheric-dark text-white' : 'bg-white text-zinc-900'}`}>
        {currentViewIsDark && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-seafoam-glow/20 blur-[150px] rounded-full" />
            <div className="absolute top-[20%] left-[10%] w-[60%] h-[60%] bg-pine-dark/10 blur-[120px] rounded-full" />
          </div>
        )}
        <div className={`flex-1 relative z-10 ${['mentor-listing', 'mentor-profile', 'book-trial', 'book-paid', 'schedule-view'].includes(studentView) ? 'h-full overflow-hidden' : 'overflow-y-auto scrollbar-hide'} ${!['mentor-listing', 'mentor-profile', 'book-trial', 'book-paid', 'schedule-view'].includes(studentView) ? 'pb-24' : ''}`}>
          <AnimatePresence mode="wait">
            {studentView === 'home' && (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StudentHomeView forcedDark={true} />
              </motion.div>
            )}
            {studentView === 'mentor-listing' && (
              <motion.div key="listing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <MentorListingView />
              </motion.div>
            )}
            {studentView === 'mentor-profile' && (
              <motion.div key="mentor-profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <MentorProfileView />
              </motion.div>
            )}
            {studentView === 'journey' && (
              <motion.div key="journey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StudentJourneyView forcedDark={false} />
              </motion.div>
            )}
            {studentView === 'messages' && (
              <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StudentMessagesView forcedDark={true} />
              </motion.div>
            )}
            {studentView === 'profile' && (
              <motion.div key="profile-settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StudentProfileView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Nav */}
        {!['mentor-listing', 'mentor-profile', 'book-trial', 'book-paid', 'schedule-view'].includes(studentView) && !selectedChat && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%]">
            <div className="backdrop-blur-2xl border rounded-[2rem] px-2 py-1.5 flex items-center justify-between shadow-2xl transition-all duration-500 bg-zinc-900/90 border-white/10">
              {[
                { id: 'home', icon: HomeIcon, label: 'Home' },
                { id: 'journey', icon: Music2, label: 'Journey' },
                { id: 'messages', icon: MessageSquare, label: 'Chat' },
                { id: 'profile', icon: User, label: 'Profile' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => switchStudentTab(item.id as StudentView)}
                  className={`relative flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-300 ${
                    studentView === item.id 
                      ? 'text-white' 
                      : 'text-zinc-400 opacity-50 hover:opacity-100'
                  }`}
                >
                  {studentView === item.id && (
                    <motion.div 
                      layoutId="activeNavStudent"
                      className="absolute inset-0 rounded-2xl z-0 bg-white/10"
                      transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <item.icon size={18} strokeWidth={studentView === item.id ? 2.5 : 2} />
                    <span className="text-[8px] font-bold uppercase tracking-[0.15em]">{item.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  const MentorProfileView = () => {
    const dark = true;

    if (!selectedMentor) return null;

    const hasBookedTrialForInstrument = studentLessons.some(l => 
      l.type?.toLowerCase() === 'trial' && 
      (l.instrument?.toLowerCase().includes(selectedInstrument?.name?.toLowerCase() || '') ||
       selectedMentor.specialisation.some(s => s.toLowerCase().includes(l.instrument?.toLowerCase() || ''))) &&
      l.status !== 'cancelled'
    );

    const mentorInstrument = MOCK_INSTRUMENTS.find(i => 
      selectedMentor.specialisation.some(s => 
        s.toLowerCase().includes(i.name.toLowerCase())
      )
    );
    const coverImage = mentorInstrument?.photo || selectedMentor.photo;

    const displayReviews = selectedMentor.reviews?.length > 0 ? selectedMentor.reviews : [
      { id: 'mock-r1', studentName: 'Alex Tan', lessonsTaken: 8, rating: 5, comment: 'Incredible teacher! Very patient and knowledgeable about traditional techniques.', timeAgo: '2 days ago' },
      { id: 'mock-r2', studentName: 'Sarah Lim', lessonsTaken: 15, rating: 4.9, comment: 'The lessons are well-structured and very engaging. I highly recommend!', timeAgo: '1 week ago' },
      { id: 'mock-r3', studentName: 'John Doe', lessonsTaken: 4, rating: 5, comment: 'Great studio atmosphere and professional guidance.', timeAgo: '2 weeks ago' }
    ];

    const displayCredentials = selectedMentor.credentials?.length > 0 ? selectedMentor.credentials : [
      'Certified Traditional Music Instructor',
      '10+ Years of Professional Performance',
      'Master of Arts in Cultural Heritage',
      'Award-winning Instrumentalist'
    ];

    return (
      <div className={`h-full flex flex-col ${dark ? 'bg-atmospheric-dark text-white' : 'bg-white text-zinc-900'} overflow-hidden`}>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="relative h-64 overflow-hidden">
          {selectedMentor.introVideoUrl ? (
            <video
              src={selectedMentor.introVideoUrl}
              className="w-full h-full object-cover opacity-70"
              autoPlay
              muted
              loop
              playsInline
              poster={coverImage}
            />
          ) : (
            <img 
              src={coverImage || null}
              className="w-full h-full object-cover opacity-60" 
              referrerPolicy="no-referrer" 
            />
          )}
          <div className={`absolute inset-0 bg-gradient-to-t ${dark ? 'from-black' : 'from-white'} via-transparent to-transparent`} />
          <button 
            onClick={() => popStudentView()} 
            className={`absolute top-12 left-5 w-10 h-10 backdrop-blur-xl rounded-full flex items-center justify-center border z-50 transition-all active:scale-90 ${dark ? 'bg-black/20 border-white/10 text-white hover:bg-black/40' : 'bg-white/20 border-black/5 text-zinc-900 hover:bg-white/40'}`}
          >
            <ChevronLeft size={20} />
          </button>
          {selectedMentor.introVideoUrl && (
            <button 
              onClick={() => {
                const vid = document.querySelector('video') as HTMLVideoElement;
                if (vid) vid.muted = !vid.muted;
              }}
              className="absolute top-12 right-5 w-10 h-10 backdrop-blur-md bg-black/40 border border-white/10 rounded-full flex items-center justify-center text-white z-10"
            >
              <Volume2 size={16} />
            </button>
          )}
          <div className="absolute bottom-6 left-5 flex items-end gap-4">
            <div className="relative">
              <Avatar name={selectedMentor.name} photo={selectedMentor.photo} size="xl" className={`rounded-[2rem] border-4 shadow-2xl ${dark ? 'border-black' : 'border-white'}`} />
              {selectedMentor.isVerified && <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 ${dark ? 'bg-harbour-400 text-white border-black' : 'bg-harbour-500 text-white border-white'}`}><CheckCircle2 size={12} /></div>}
            </div>
            <div className="mb-2">
              <h1 className={`text-2xl font-serif-sturdy ${dark ? 'text-white' : 'text-zinc-900'}`}>{selectedMentor.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  <Star size={12} fill="currentColor" /> {selectedMentor.rating}
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-400'}`}>
                  <MapPin size={12} /> {selectedMentor.location}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 mt-8 space-y-8">
          <div className={`flex justify-between p-4 border rounded-3xl ${dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
            {[
              { label: 'Students', value: selectedMentor.studentsCount || 24, icon: Users },
              { label: 'Reviews', value: selectedMentor.reviewCount || 158, icon: MessageSquare },
              { label: 'Experience', value: `${selectedMentor.experienceYears || 8}y`, icon: Award }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`text-[8px] font-mono uppercase tracking-widest mb-1 ${dark ? 'text-white/30' : 'text-zinc-500'}`}>{stat.label}</p>
                <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Profile Completion Shimmer */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>Profile Completion</span>
              <span className={`text-[10px] font-bold ${dark ? 'text-harbour-400' : 'text-harbour-600'}`}>{calculateProfileProgress(selectedMentor)}%</span>
            </div>
            <div className={`h-1.5 w-full rounded-full overflow-hidden relative ${dark ? 'bg-white/10' : 'bg-black/5'}`}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${calculateProfileProgress(selectedMentor)}%` }}
                className="h-full bg-harbour-500 relative"
              >
                <motion.div 
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2"
                />
              </motion.div>
            </div>
          </div>

          <button 
            onClick={() => {
              setSelectedChat(selectedMentor);
              pushStudentView('messages');
            }}
            className={`w-full py-4 border rounded-2xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest ${dark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/5 text-zinc-900'}`}
          >
            <MessageSquare size={16} /> Send Message
          </button>

          <section>
            <h2 className={`text-[10px] uppercase tracking-widest font-bold mb-3 ${dark ? 'text-white/30' : 'text-zinc-500'}`}>About</h2>
            <p className={`text-sm leading-relaxed ${dark ? 'text-white/60' : 'text-zinc-600'}`}>{selectedMentor.about}</p>
          </section>

          <section>
            <h2 className={`text-[10px] uppercase tracking-widest font-bold mb-3 ${dark ? 'text-white/30' : 'text-zinc-500'}`}>Specialisation</h2>
            <div className="flex flex-wrap gap-2">
              {selectedMentor.specialisation.map(s => <span key={s} className="px-3 py-1.5 bg-harbour-500/10 text-harbour-400 text-[10px] font-bold rounded-full border border-harbour-500/20">{s}</span>)}
              {selectedMentor.teachingStyle.map(s => <span key={s} className={`px-3 py-1.5 border text-[10px] font-bold rounded-full ${dark ? 'bg-white/5 text-white/40 border-white/10' : 'bg-black/5 text-zinc-500 border-black/5'}`}>{s}</span>)}
            </div>
          </section>

          <section>
            <h2 className={`text-[10px] uppercase tracking-widest font-bold mb-3 ${dark ? 'text-white/30' : 'text-zinc-500'}`}>Communication</h2>
            <div className="flex flex-wrap gap-2">
              {selectedMentor.languages.map(l => <span key={l} className={`px-3 py-1.5 border text-[10px] font-bold rounded-full ${dark ? 'bg-white/5 text-white/60 border-white/10' : 'bg-black/5 text-zinc-600 border-black/5'}`}>{l}</span>)}
            </div>
          </section>

          {/* Expandable Sections */}
          <div id="mentor-packages-section" className="space-y-4">
            {[
              { id: 'packages', label: 'Lesson Packages', icon: Music2 },
              { id: 'path', label: 'Learning Path', icon: BookOpen },
              { id: 'schedule', label: 'View Schedule', icon: Calendar },
              { id: 'gallery', label: 'Studio Gallery', subtext: 'Images of the location/studio', icon: ImageIcon },
              { id: 'reviews', label: 'Student Reviews', icon: Star },
              { id: 'credentials', label: 'Credentials', icon: Award }
            ].map((section: any) => (
              <div key={section.id} id={`section-${section.id}`} className={`border-b pb-4 ${dark ? 'border-white/10' : 'border-black/5'}`}>
                <button 
                  onClick={(e) => {
                    if (section.id === 'schedule') {
                      setShowScheduleSheet(true);
                    } else {
                      setMentorProfileExpandedSections(prev => 
                        prev.includes(section.id) 
                          ? prev.filter(id => id !== section.id) 
                          : [...prev, section.id]
                      );
                    }
                  }}
                  className={`w-full flex items-center justify-between py-3 px-2 -mx-2 rounded-2xl transition-all duration-300 group ${dark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <section.icon size={18} className={dark ? 'text-white/40' : 'text-zinc-400'} />
                    <div className="text-left">
                      <span className={`text-sm font-bold block ${dark ? 'text-white' : 'text-zinc-900'}`}>{section.label}</span>
                      {section.subtext && <span className={`text-[10px] block ${dark ? 'text-white/40' : 'text-zinc-500'}`}>{section.subtext}</span>}
                    </div>
                  </div>
                  <motion.div animate={{ rotate: mentorProfileExpandedSections.includes(section.id) ? 180 : 0 }}>
                    <ChevronRight size={16} className={`transition-colors ${dark ? 'text-white/20 group-hover:text-white/60' : 'text-zinc-300 group-hover:text-zinc-500'}`} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {mentorProfileExpandedSections.includes(section.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`py-4 text-sm ${dark ? 'text-white/60' : 'text-zinc-600'}`}>
                        {section.id === 'packages' && (
                          <div className="grid gap-2">
                            {selectedMentor.packages.map(pkg => (
                              <button 
                                key={pkg.id} 
                                onClick={() => {
                                  setSelectedPackage(pkg);
                                  if (pkg.id === 'p1') {
                                    setBookingType('single');
                                  } else {
                                    setBookingType('package');
                                  }
                                  setBookingStep(1);
                                  setShowBookingSheet(true);
                                }}
                                className={`p-2.5 border rounded-xl flex justify-between items-center transition-all ${dark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-zinc-100 shadow-sm hover:bg-zinc-50'}`}
                              >
                                <div className="text-left">
                                  <h4 className={`text-[11px] font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>{pkg.name}</h4>
                                  <p className={`text-[8px] ${dark ? 'text-white/40' : 'text-zinc-500'}`}>
                                    {pkg.lessons} Lessons {pkg.validityMonths ? `• ${pkg.validityMonths}m` : ''}
                                  </p>
                                </div>
                                <p className={`text-[11px] font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>
                                  {pkg.price === 0 ? 'FREE' : `RM ${pkg.price}`}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                        {section.id === 'reviews' && (
                          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {displayReviews.map(review => (
                              <div key={review.id} className={`min-w-[280px] p-5 border rounded-3xl ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-100 shadow-sm'}`}>
                                <div className="flex justify-between mb-3">
                                  <div>
                                    <h4 className={`font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>{review.studentName}</h4>
                                    <p className={`text-[10px] ${dark ? 'text-white/40' : 'text-zinc-500'}`}>{review.lessonsTaken} lessons taken • {review.timeAgo}</p>
                                  </div>
                                  <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < review.rating ? 'currentColor' : 'none'} />)}
                                  </div>
                                </div>
                                <p className={`text-xs italic leading-relaxed ${dark ? 'text-white/60' : 'text-zinc-600'}`}>"{review.comment}"</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {section.id === 'credentials' && (
                          <ul className="space-y-2">
                            {displayCredentials.map(c => <li key={c} className="flex items-center gap-2 text-xs"><CheckCircle2 size={12} className="text-harbour-400" /> {c}</li>)}
                          </ul>
                        )}
                        {section.id === 'gallery' && (
                          <div className="space-y-4">
                            <div className={`flex items-start gap-2 p-3 rounded-2xl ${dark ? 'bg-white/5' : 'bg-black/5'}`}>
                              <MapPin size={14} className="mt-0.5 text-harbour-400 flex-shrink-0" />
                              <p className={`text-[11px] leading-relaxed ${dark ? 'text-white/70' : 'text-zinc-600'}`}>
                                {selectedMentor.address || selectedMentor.location}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedMentor.gallery.map((img, i) => <img key={i} src={img || null} className="rounded-xl aspect-square object-cover" referrerPolicy="no-referrer" />)}
                            </div>
                          </div>
                        )}
                        {section.id === 'path' && (
                          <div className="relative pl-6 space-y-6">
                            <div className={`absolute left-2 top-2 bottom-2 w-0.5 ${dark ? 'bg-white/10' : 'bg-black/5'}`} />
                            {[
                              { title: 'Foundations', desc: 'Basic techniques and posture' },
                              { title: 'Intermediate', desc: 'Complex rhythms and scales' },
                              { title: 'Advanced', desc: 'Performance pieces and improvisation' }
                            ].map((stage, i) => (
                              <div key={i} className="relative">
                                <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-harbour-500 border-2 ${dark ? 'border-black' : 'border-white'}`} />
                                <h4 className={`font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>{stage.title}</h4>
                                <p className={`text-[11px] ${dark ? 'text-white/40' : 'text-zinc-500'}`}>{stage.desc}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

        {/* Sticky Bottom */}
        <div className={`flex-shrink-0 p-6 pb-8 backdrop-blur-2xl border-t flex flex-col gap-3 z-[110] ${dark ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/5'}`}>
          <div className="flex items-center gap-3 w-full">
            {isStudent && (
              <button 
                onClick={() => {
                  handleStartConversation(selectedMentor.id, selectedMentor.name, selectedMentor.photo);
                }}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${dark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm hover:bg-zinc-50'}`}
              >
                <MessageSquare size={20} />
              </button>
            )}

            {isStudent && (
              <div className="flex-1 flex gap-2">
                {!hasBookedTrialForInstrument && (
                  <button 
                    onClick={() => {
                      setBookingType('trial');
                      setBookingStep(1);
                      setShowBookingSheet(true);
                    }}
                    className={`flex-1 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${dark ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20' : 'bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200'}`}
                  >
                    Free Trial
                  </button>
                )}
                <button 
                  onClick={() => {
                    setBookingType('package');
                    setBookingStep(1);
                    setShowBookingSheet(true);
                  }}
                  className={`flex-1 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all active:scale-95 ${dark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                >
                  <Music2 size={18} />
                  {hasBookedTrialForInstrument ? 'Select Package' : 'Buy Package'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const StudentJourneyView = () => {
    const dark = false;
    
    if (studentLessons.length === 0) return (
      <div className={`flex flex-col items-center justify-center h-full gap-4 text-center px-8 pt-20 ${dark ? 'bg-atmospheric-dark text-white' : 'bg-[#F9F9F9] text-zinc-900'}`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${dark ? 'bg-white/5' : 'bg-black/5'}`}>
          <Music2 size={32} className={dark ? 'text-white/20' : 'text-zinc-300'} />
        </div>
        <h2 className={`text-xl font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>
          Your journey starts here
        </h2>
        <p className={`text-sm leading-relaxed ${dark ? 'text-white/40' : 'text-zinc-400'}`}>
          Find a mentor and book your free trial to begin your musical journey
        </p>
        <button 
          onClick={() => switchStudentTab('home')}
          className={`px-6 py-3 text-xs font-bold rounded-full ${dark ? 'bg-white text-black' : 'bg-zinc-900 text-white'}`}
        >
          Explore Mentors →
        </button>
      </div>
    );

    // Fall through to full journey view for all cases with lessons

    // Use the dynamic user profile
    const currentStudent = userProfile || MOCK_STUDENTS[0];
    const mentor = realMentors.find(m => m.id === studentLessons[0]?.mentorId) || MOCK_MENTORS[0];

    const upcomingLesson = studentLessons
      .filter(l => 
        (l.status === 'confirmed' || l.status === 'pending' || l.status === 'reschedule_requested' || l.status === 'cancelled') && 
        new Date(l.date) >= new Date(new Date().setHours(0,0,0,0)) && 
        l.instrument === selectedInstrumentJourney
      )
      .sort((a, b) => {
        if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
        if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      })[0];
    
    // Dynamic instruments based on student's active lessons
    const activeInstruments = Array.from(new Set(studentLessons.map(l => l.instrument).filter(Boolean)));
    const instruments = activeInstruments.map(name => ({
      id: (name as string).toLowerCase(),
      name: name as string,
      icon: Music2
    }));

    if (instruments.length === 0) {
      instruments.push({ id: 'gambus', name: 'Gambus', icon: Music2 });
    }
    
    const stats = {
      status: 'On Track',
      id: `#${currentUser?.uid.slice(0, 4)}`
    };

    // Map logs to a more detailed format for the UI
    const filteredLogs = studentLogs.filter(log => log.instrument === selectedInstrumentJourney);
    const pastLessons = [
      ...filteredLogs.map((log, index) => ({
        id: log.id || `log-${index}`,
        lessonNumber: log.lessonNumber,
        date: new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        review: log.covered,
        focus: log.focus,
        milestones: log.milestones || [],
        encouragement: "Solid progress today.",
        isLatest: index === 0
      })),
      // Mock logs for visualization
      {
        id: 'mock-1',
        lessonNumber: filteredLogs.length + 2,
        date: '15 Mar 2026',
        review: 'Mastered the basic striking patterns and rhythm coordination.',
        focus: 'Focus on maintaining consistent tempo during transitions.',
        milestones: ['m1'],
        encouragement: "You're picking this up very quickly!",
        isLatest: false
      },
      {
        id: 'mock-2',
        lessonNumber: filteredLogs.length + 1,
        date: '08 Mar 2026',
        review: 'Introduction to the instrument and basic posture.',
        focus: 'Practice holding the instrument correctly for 15 mins daily.',
        milestones: [],
        encouragement: "Welcome to your musical journey!",
        isLatest: false
      }
    ].sort((a, b) => (b.lessonNumber || 0) - (a.lessonNumber || 0));

    const studentProfile_lp = (currentStudent as any)?.learningPath;
    const hasLearningPath = Array.isArray(studentProfile_lp) && studentProfile_lp.length > 0;
    const roadmap = hasLearningPath && selectedInstrumentJourney === currentStudent.instrument
      ? studentProfile_lp
      : (INSTRUMENT_STAGES[selectedInstrumentJourney] || []).map((stage, i) => {
          const stageStatus = i < Math.floor(pastLessons.length / 3) ? 'completed'
            : i === Math.floor(pastLessons.length / 3) ? 'current' : 'upcoming';
          return { id: `m${i+1}`, title: stage.title, status: stageStatus, description: stage.milestones.join(', ') };
        });

    const materials = MOCK_MATERIALS.filter(m => m.studentId === currentStudent.id);

    const practiceGuides = [
      { id: 1, title: 'Week 3 Practice Plan', type: 'Doc', desc: '25 mins daily, focus on chord transitions', icon: ClipboardList, lesson: 4 },
      { id: 2, title: 'Daily Warm-up Routine', type: 'PDF', desc: '10 mins basic striking', icon: Clock, lesson: 2 },
    ];

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      return d;
    });
    
    return (
      <div className="min-h-full px-5 pt-8 bg-[#F9F9F9] text-zinc-900 pb-32">
        {/* Header Area */}
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-serif text-zinc-900">My Journey</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal-500">
                {stats.status} • {stats.id}
              </p>
            </div>
          </div>
        </div>

        {/* Instrument Switcher Chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
          {instruments.map((inst) => (
            <button
              key={inst.id}
              onClick={() => setSelectedInstrumentJourney(inst.name)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full border flex items-center gap-2 transition-all ${selectedInstrumentJourney === inst.name ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-black/10' : 'bg-white border-zinc-200 text-zinc-400 shadow-sm'}`}
            >
              <inst.icon size={14} />
              <span className="text-[11px] font-bold">{inst.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-1 mb-8 p-1 rounded-full bg-black/5 border border-black/5">
          <button 
            onClick={() => setJourneyTab('lessons')}
            className={`flex-1 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${journeyTab === 'lessons' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}
          >
            Schedule
          </button>
          <button 
            onClick={() => setJourneyTab('progress')}
            className={`flex-1 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${journeyTab === 'progress' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}
          >
            Growth
          </button>
        </div>

        {journeyTab === 'lessons' ? (
          <div className="space-y-10 pb-20">
            {/* Upcoming Session Card */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Upcoming Session</h2>
                <button 
                  onClick={() => setShowAllLessonsSheet(true)}
                  className="text-[10px] font-bold text-teal-600 flex items-center gap-1 hover:opacity-70 transition-opacity"
                >
                  See all <ChevronRight size={12} />
                </button>
              </div>

              {upcomingLesson ? (
                <div className={`rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden border transition-all ${upcomingLesson.status === 'cancelled' ? 'bg-red-50/30 border-red-100 border-dashed opacity-90' : 'bg-white border-zinc-100 shadow-teal-500/5'}`}>
                  {upcomingLesson.status === 'cancelled' && (
                    <div className="absolute top-4 right-6 z-10">
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="px-3 py-1 bg-red-500 text-white text-[8px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-red-500/20 flex items-center gap-1.5"
                      >
                        <XCircle size={10} />
                        Cancelled by {upcomingLesson.cancelledBy === 'student' ? 'You' : 'Mentor'}
                      </motion.div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4 items-center">
                      <Avatar 
                        name={upcomingLesson.mentorName} 
                        photo={realMentors.find(m => m.id === upcomingLesson.mentorId)?.photo || mentor.photo} 
                        size="md" 
                        className={`rounded-xl shadow-md ${upcomingLesson.status === 'cancelled' ? 'grayscale opacity-50' : ''}`} 
                      />
                      <div>
                        <h3 className={`font-serif text-lg ${upcomingLesson.status === 'cancelled' ? 'text-red-900/50' : 'text-zinc-900'}`}>{upcomingLesson.mentorName}</h3>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{upcomingLesson.instrument} • Lesson #{filteredLogs.length + 1}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {cancellingIds.includes(upcomingLesson.id) && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="px-3 py-1 bg-red-500 text-white text-[8px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-lg shadow-red-500/20"
                        >
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          Lesson Cancelling
                        </motion.div>
                      )}
                      {!cancellingIds.includes(upcomingLesson.id) && upcomingLesson.status !== 'cancelled' && (
                        <div className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                          upcomingLesson.status === 'confirmed' ? 'bg-emerald-500 text-white' : 
                          upcomingLesson.status === 'reschedule_requested' ? 'bg-indigo-500 text-white' :
                          'bg-amber-500 text-white'
                        }`}>
                          {upcomingLesson.status === 'confirmed' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                          {upcomingLesson.status.replace('_', ' ')}
                        </div>
                      )}
                      {upcomingLesson.status !== 'cancelled' && (
                        <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                          {Math.ceil((new Date(upcomingLesson.date).getTime() - new Date().getTime()) / 86400000)} Days Away
                        </div>
                      )}
                    </div>
                  </div>

                  {upcomingLesson.status === 'cancelled' ? (
                    <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 mb-2">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-red-400 mb-1">Reason for cancellation</p>
                      <p className="text-xs text-red-900/70 italic">"{upcomingLesson.cancelReason || 'No reason provided'}"</p>
                    </div>
                  ) : (
                    <>
                      {upcomingLesson.status === 'reschedule_requested' && upcomingLesson.requestedBy !== currentUser?.uid && (
                        <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                          <p className="text-[10px] font-bold text-indigo-900 mb-2">Reschedule Request</p>
                          <p className="text-[10px] text-indigo-700 mb-3">
                            Requested for: <span className="font-bold">{new Date(upcomingLesson.requestedDate).toLocaleDateString()} at {upcomingLesson.requestedTime}</span>
                          </p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleRescheduleAction(upcomingLesson, 'accept')}
                              className="flex-1 py-2 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleRescheduleAction(upcomingLesson, 'decline')}
                              className="flex-1 py-2 bg-white border border-indigo-200 text-indigo-600 text-[9px] font-bold uppercase tracking-widest rounded-lg"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      )}

                      {upcomingLesson.status === 'reschedule_requested' && upcomingLesson.requestedBy === currentUser?.uid && (
                        <div className="mb-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <p className="text-[10px] font-bold text-zinc-500">Reschedule Pending</p>
                          <p className="text-[10px] text-zinc-400">Waiting for mentor to confirm your request for {new Date(upcomingLesson.requestedDate).toLocaleDateString()} at {upcomingLesson.requestedTime}.</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                          <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Date & Time</p>
                          <p className="text-xs font-bold text-zinc-900">{new Date(upcomingLesson.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {upcomingLesson.time}</p>
                        </div>
                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                          <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Location</p>
                          <p className="text-xs font-bold text-zinc-900 truncate">{upcomingLesson.location || 'Bangsar Studio'}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            const mentorObj = realMentors.find(m => m.id === upcomingLesson.mentorId) || mentor;
                            setSelectedChat({
                              id: `new-${mentorObj.id}`,
                              conversationId: null,
                              name: mentorObj.name,
                              photo: mentorObj.photo,
                              role: 'Mentor',
                              recipientId: mentorObj.id
                            });
                            switchStudentTab('messages');
                          }}
                          className="flex-1 py-4 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-black/10 transition-transform active:scale-95"
                        >
                          Message
                        </button>
                        <button 
                          onClick={() => {
                            setReschedulingLesson(upcomingLesson);
                            setShowRescheduleModal(true);
                          }}
                          className="flex-1 py-4 border border-zinc-200 text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-full transition-colors hover:bg-zinc-50 active:scale-95"
                        >
                          Reschedule
                        </button>
                        <button 
                          onClick={() => {
                            setLessonToCancel(upcomingLesson);
                            setShowCancelModal(true);
                          }}
                          disabled={cancellingIds.includes(upcomingLesson.id)}
                          className={`w-12 h-12 flex items-center justify-center border rounded-full transition-all ${cancellingIds.includes(upcomingLesson.id) ? 'bg-red-500 border-red-500 text-white animate-pulse' : 'border-red-100 text-red-500 hover:bg-red-50'}`}
                        >
                          {cancellingIds.includes(upcomingLesson.id) ? <Clock size={18} /> : <X size={18} />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-zinc-100 border-dashed rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-300">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">No upcoming {selectedInstrumentJourney} sessions</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Ready to continue your journey?</p>
                  </div>
                  <button 
                    onClick={() => switchStudentTab('home')}
                    className="px-6 py-3 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full"
                  >
                    Book a Session
                  </button>
                </div>
              )}
            </section>

            {/* Past Lessons Log */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Past Lessons Log</h2>
                <div className="flex items-center gap-3">
                  <span className="bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full text-[9px] font-bold">{pastLessons.length} Lessons</span>
                  <button 
                    onClick={() => setShowAllLessonsSheet(true)}
                    className="text-[10px] font-bold text-teal-600 flex items-center gap-1 hover:opacity-70 transition-opacity"
                  >
                    See all <ChevronRight size={12} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {pastLessons.length === 0 ? (
                  <div className="bg-white border border-zinc-100 rounded-[2rem] p-8 text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-3">
                      <Music2 size={20} className="text-zinc-300" />
                    </div>
                    <p className="text-sm font-bold text-zinc-400 mb-1">No lessons logged yet</p>
                    <p className="text-xs text-zinc-300">Your lesson history will appear here after your first session.</p>
                  </div>
                ) : pastLessons.map((lesson) => {
                  const isExpanded = expandedLesson === lesson.id || (lesson.isLatest && expandedLesson === null);
                  return (
                    <div key={lesson.id} className={`bg-white border border-zinc-100 rounded-[2rem] transition-all overflow-hidden ${isExpanded ? 'shadow-lg' : 'shadow-sm'}`}>
                      <button 
                        onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                        className="w-full p-6 flex justify-between items-center text-left"
                      >
                        <div className="flex gap-4 items-center">
                          <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                            <Music2 size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-zinc-900">Lesson #{lesson.lessonNumber}</h4>
                            <p className="text-[10px] text-zinc-400">{lesson.date}</p>
                          </div>
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                          <ChevronRight size={18} className="text-zinc-300" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-zinc-50"
                          >
                            <div className="p-6 pt-2 space-y-6">
                              <div className="flex justify-between items-center">
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} size={10} className="fill-amber-400 text-amber-400" />
                                  ))}
                                </div>
                                <div className="bg-teal-50 text-teal-600 px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest flex items-center gap-1">
                                  <Check size={10} /> From Mentor
                                </div>
                              </div>

                              <div className="border-l-4 border-teal-500 pl-4 py-1 bg-teal-50/30 rounded-r-xl">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-teal-600 mb-1">Practice Focus</p>
                                <p className="text-xs font-medium text-zinc-800">{lesson.focus}</p>
                              </div>

                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Mentor's Note</p>
                                <p className="text-xs italic leading-relaxed text-zinc-600">"{lesson.encouragement || lesson.review}"</p>
                              </div>
                              
                              {lesson.milestones && lesson.milestones.length > 0 && (
                                <div>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Milestones Reached</p>
                                  <div className="flex flex-wrap gap-2">
                                    {lesson.milestones.map(m => (
                                      <span key={m} className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold flex items-center gap-1.5 border border-emerald-100">
                                        <CheckCircle2 size={10} /> {m}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <button className="w-full py-4 rounded-full bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-black/5 active:scale-95 transition-transform">
                                <Star size={12} className="fill-current" />
                                Rate this Lesson
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-10 pb-20">
            {/* Learning Path (Roadmap) */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Learning Path</h2>
                <div className="bg-teal-50 text-teal-600 px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Check size={10} /> Set by Mentor
                </div>
              </div>

              <div className="relative pl-8 space-y-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-zinc-100" />
                {roadmap.map((stage, i) => {
                  const isCurrent = stage.status === 'current';
                  const isCompleted = stage.status === 'completed';
                  const isUpcoming = stage.status === 'upcoming';
                  
                  return (
                    <div key={i} className={`relative transition-opacity duration-500 ${isUpcoming ? 'opacity-45' : 'opacity-100'}`}>
                      <div className={`absolute -left-[28px] top-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center z-10 shadow-sm ${isCompleted ? 'bg-teal-500' : isCurrent ? 'bg-zinc-900' : 'bg-zinc-200'}`}>
                        {isCompleted && <Check size={12} className="text-white" />}
                        {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        {isUpcoming && <Lock size={8} className="text-zinc-400" />}
                      </div>
                      
                      <div className={`p-6 rounded-[2rem] border transition-all ${isCurrent ? 'bg-white border-zinc-300 shadow-xl shadow-black/5 ring-1 ring-black/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
                        <h4 className="font-bold text-sm text-zinc-900 mb-1">{stage.title}</h4>
                        <div className="space-y-2">
                          {stage.description ? (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {stage.description.split(', ').map((milestone, idx) => (
                                <span key={idx} className={`px-2 py-1 rounded-md text-[9px] font-medium flex items-center gap-1 ${isCompleted ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : isCurrent ? 'bg-zinc-100 text-zinc-600 border border-zinc-200' : 'bg-zinc-50 text-zinc-400 border border-zinc-100'}`}>
                                  {isCompleted ? <Check size={8} /> : isCurrent ? <div className="w-1 h-1 rounded-full bg-zinc-400" /> : <Lock size={8} />}
                                  {milestone}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] leading-relaxed text-zinc-500">
                              {isCompleted ? 'Mastered basic posture and techniques.' : isCurrent ? 'Currently learning complex rhythms.' : 'Introduction to playing with other instruments.'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Learning Materials */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Learning Materials</h2>
                <div className="text-zinc-400 px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <ArrowUpRight size={10} /> From Mentor
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {materials.map(mat => (
                  <div key={mat.id} className="bg-white p-4 rounded-2xl border border-zinc-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mat.type === 'PDF' ? 'bg-teal-50 text-teal-600' : 'bg-zinc-50 text-zinc-400'}`}>
                      {mat.type === 'PDF' ? <FileText size={18} /> : <BookOpen size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[8px] font-mono uppercase tracking-widest ${mat.type === 'PDF' ? 'text-teal-600' : 'text-zinc-400'}`}>{mat.type}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-200" />
                        <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-400">Lesson #{mat.lessonId?.replace('log', '')}</span>
                      </div>
                      <h3 className="text-xs font-bold truncate text-zinc-900">{mat.title}</h3>
                    </div>
                    <button className="p-2.5 rounded-full bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-colors">
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Practice Guides */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Practice Guides</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {practiceGuides.map(guide => (
                  <div key={guide.id} className="bg-teal-50/50 border border-teal-100 rounded-[2rem] p-6 relative overflow-hidden">
                    <div className="absolute top-4 right-6 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest text-teal-600 border border-teal-100">
                      ✓ From Lesson #{guide.lesson}
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-teal-600 shadow-sm">
                        <guide.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-zinc-900 mb-1">{guide.title}</h3>
                        <p className="text-xs leading-relaxed text-zinc-600 mb-4">{guide.desc}</p>
                        <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-teal-600 hover:text-teal-700 transition-colors">
                          <Download size={14} /> Download Guide
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Reschedule Modal moved to main App return */}
      </div>
    );
  };

  const ChatConversation = ({ recipient, onBack, dark = true }: { recipient: any, onBack: () => void, dark?: boolean }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [localMessage, setLocalMessage] = useState('');

    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages]);

    const handleSend = async () => {
      if (!localMessage.trim()) return;
      const text = localMessage;
      setLocalMessage(''); // Clear input immediately
      await handleSendMessage(text);
    };

    return (
      <div className={`absolute inset-0 z-[150] flex flex-col ${dark ? 'bg-atmospheric-dark text-white' : 'bg-white text-zinc-900'}`}>
        <div className={`px-5 pt-12 pb-4 flex items-center gap-4 border-b ${dark ? 'border-white/10' : 'border-zinc-100'}`}>
          <button onClick={onBack} className={`p-2 rounded-full ${dark ? 'bg-white/5 text-white' : 'bg-black/5 text-zinc-900'}`}>
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <Avatar name={recipient.name} photo={recipient.photo} size="sm" className="rounded-xl" />
            <div>
              <h3 className="font-bold text-sm">{recipient.name}</h3>
              <p className="text-[10px] text-harbour-400 uppercase tracking-widest">
                {isStudent ? 'Mentor' : 'Student'} • Online
              </p>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-10">
              <MessageSquare size={48} className="mb-4" />
              <p className="text-xs">Start a conversation with {recipient.name}</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-xs ${msg.isMe ? (dark ? 'bg-harbour-500 text-white rounded-tr-none' : 'bg-zinc-900 text-white rounded-tr-none') : (dark ? 'bg-white/10 text-white rounded-tl-none' : 'bg-zinc-100 text-zinc-900 rounded-tl-none')} ${msg.sending ? 'opacity-70' : ''}`}>
                <p>{msg.text}</p>
                <div className={`flex items-center gap-1 mt-1 opacity-50 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                  <p className="text-[8px]">
                    {msg.time || 'Sending...'}
                  </p>
                  {msg.isMe && (
                    msg.sending ? <Clock size={8} /> : <Check size={8} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`p-5 pb-6 border-t ${dark ? 'border-white/10' : 'border-zinc-100'}`}>
          <div className="relative">
            <input 
              value={localMessage}
              onChange={(e) => setLocalMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              onFocus={(e) => e.stopPropagation()}
              placeholder="Type a message..."
              className={`w-full py-4 pl-6 pr-14 rounded-full text-xs focus:outline-none ${dark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'}`}
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-harbour-500 text-white rounded-full flex items-center justify-center"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const StudentMessagesView = () => {
    const dark = true;
    const [searchQuery, setSearchQuery] = useState('');
    
    if (selectedChat) {
      return <ChatConversation recipient={selectedChat} onBack={() => setSelectedChat(null)} dark={dark} />;
    }

    const bookedMentors = studentLessons.reduce((acc: any[], lesson) => {
      if (!acc.find(m => m.id === lesson.mentorId)) {
        acc.push({
          id: lesson.mentorId,
          name: lesson.mentorName,
          photo: null, // We'll try to find the photo from realMentors or MOCK_MENTORS
          role: 'Mentor'
        });
      }
      return acc;
    }, []);

    const mentorsToDisplay = bookedMentors.map(m => {
      const mentorDetails = realMentors.find(rm => rm.id === m.id) || MOCK_MENTORS.find(mm => mm.id === m.id);
      return {
        ...m,
        photo: mentorDetails?.photo || null
      };
    });

    const mentorsWithoutChat = mentorsToDisplay.filter(m => {
      return !conversations.some(conv => conv.participants.includes(m.id));
    });

    const filteredConversations = conversations.filter(conv => {
      const otherParticipantId = conv.participants.find((p: string) => p !== currentUser?.uid);
      const details = conv.participantDetails[otherParticipantId];
      return details?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const filteredMentorsWithoutChat = mentorsWithoutChat.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className={`h-full flex flex-col pt-16 ${dark ? 'bg-atmospheric-dark text-white' : 'bg-white text-zinc-900'}`}>
        <div className="px-5 mb-6">
          <h1 className="text-3xl font-serif-sturdy mb-6">Mentor Messages</h1>
          <div className="relative">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/30' : 'text-zinc-400'}`} size={14} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => e.stopPropagation()}
              className={`w-full border rounded-full pl-10 pr-4 py-3 text-xs focus:outline-none ${dark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'}`} 
              placeholder="Search mentors..." 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-6 pb-32">
          {filteredMentorsWithoutChat.length > 0 && (
            <section className="space-y-3">
              <h2 className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-white/30' : 'text-zinc-400'}`}>Your Mentors</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {filteredMentorsWithoutChat.map(mentor => (
                  <motion.div
                    key={mentor.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedChat({
                      id: `new-${mentor.id}`,
                      conversationId: null,
                      name: mentor.name,
                      photo: mentor.photo,
                      role: mentor.role,
                      recipientId: mentor.id
                    })}
                    className="flex flex-col items-center gap-2 min-w-[80px]"
                  >
                    <div className="relative">
                      <Avatar name={mentor.name} photo={mentor.photo} size="lg" className="rounded-2xl border-2 border-harbour-500/20" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-harbour-500 rounded-full flex items-center justify-center border-2 border-atmospheric-dark">
                        <Plus size={10} className="text-white" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold truncate w-full text-center">{mentor.name.split(' ')[0]}</span>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-white/30' : 'text-zinc-400'}`}>Recent Chats</h2>
            {filteredConversations.length === 0 && filteredMentorsWithoutChat.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-10 py-20 relative">
                <div className="absolute inset-0 bg-harbour-500/5 blur-[100px] rounded-full" />
                <div className="relative z-10">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto ${dark ? 'bg-white/5' : 'bg-black/5'}`}>
                    <MessageSquare size={32} className={dark ? 'text-white/20' : 'text-zinc-300'} />
                  </div>
                  <h3 className="text-lg font-serif-sturdy mb-2">No messages yet</h3>
                  <p className={`text-xs leading-relaxed ${dark ? 'text-white/40' : 'text-zinc-500'}`}>
                    {searchQuery ? "We couldn't find any mentors matching your search." : "Your musical journey starts with a conversation. Reach out to a mentor to begin."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConversations.map((conv) => {
                  const otherParticipantId = conv.participants.find((p: string) => p !== currentUser?.uid);
                  const details = conv.participantDetails[otherParticipantId];
                  
                  return (
                    <motion.div 
                      key={conv.id} 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedChat({
                        id: conv.id,
                        conversationId: conv.id,
                        name: details.name,
                        photo: details.photo,
                        role: details.role
                      })}
                      className={`p-4 rounded-3xl border transition-all cursor-pointer ${dark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-zinc-100 shadow-sm hover:border-zinc-200'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={details.photo || null} className="w-12 h-12 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                          {conv.unreadBy?.includes(currentUser?.uid) && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-harbour-500 rounded-full border-2 border-atmospheric-dark" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold truncate">{details.name}</h3>
                              <span className="px-1.5 py-0.5 bg-harbour-500/10 text-harbour-400 text-[7px] font-bold rounded uppercase tracking-widest">{details.role}</span>
                            </div>
                            <span className={`text-[8px] font-mono ${dark ? 'text-white/30' : 'text-zinc-400'}`}>
                              {conv.lastMessageAt?.toDate ? conv.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className={`text-[11px] truncate ${dark ? 'text-white/40' : 'text-zinc-500'}`}>{conv.lastMessage || ''}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  };

  const StudentProfileView = () => {
    const dark = true;
    const isDark = dark;
    // Use the dynamic user profile
    const profile = studentProfile;
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(profile);

    useEffect(() => {
      setEditData(profile);
    }, [profile]);

    const handleSave = async () => {
      await saveStudentProfile(editData);
      setIsEditing(false);
    };

    const handlePhotoUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            const base64 = readerEvent.target?.result as string;
            setEditData({ ...editData, photo: base64 });
            if (!isEditing) {
              saveStudentProfile({ photo: base64 });
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    };

    const learningInstruments = [
      { name: profile.instrument || 'Not set', icon: Music, level: profile.stage || 'Beginner' },
    ];

    return (
      <div className={`h-full overflow-y-auto ${dark ? 'bg-atmospheric-dark' : 'bg-zinc-50'}`}>
        {/* Profile Header */}
        <header className={`relative px-6 pt-16 pb-8 overflow-hidden ${dark ? 'bg-zinc-900' : 'bg-zinc-900'} text-white`}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-harbour-500/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <Avatar 
                name={profile.name} 
                photo={editData.photo} 
                size="xl" 
                className="rounded-[2rem] border-4 border-white/10 shadow-2xl" 
              />
              <button 
                onClick={handlePhotoUpload}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-white text-zinc-900 rounded-xl flex items-center justify-center shadow-xl"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="space-y-1">
              {isEditing ? (
                <input 
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  onFocus={(e) => e.stopPropagation()}
                  className="text-2xl font-serif-sturdy tracking-tight bg-transparent border-b border-white/20 text-center focus:outline-none focus:border-white"
                />
              ) : (
                <h1 className="text-2xl font-serif-sturdy tracking-tight">{profile.name}</h1>
              )}
              <p className="text-[10px] text-white/40 font-medium tracking-widest uppercase">{profile.email}</p>
            </div>

            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/10 transition-all"
            >
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>
        </header>

        <div className="px-6 mt-8 space-y-8 pb-32">
          {/* About Me Section */}
          <section className="space-y-4">
            <h2 className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>About Me</h2>
            
            <div className={`p-5 rounded-[2rem] border ${dark ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-white/20' : 'text-zinc-400'}`}>Short Bio</p>
                </div>
                {isEditing ? (
                  <textarea 
                    value={editData.aboutMe}
                    onChange={(e) => setEditData({ ...editData, aboutMe: e.target.value })}
                    onFocus={(e) => e.stopPropagation()}
                    className={`w-full bg-transparent text-sm leading-relaxed border-b border-harbour-500/50 focus:border-harbour-500 outline-none pb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}
                    rows={3}
                  />
                ) : (
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-zinc-600'}`}>
                    {profile.aboutMe || "Traditional music enthusiast learning the strings of Malaysia."}
                  </p>
                )}
              </div>

              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-white/20' : 'text-zinc-400'}`}>What I'm Learning</p>
                <div className="flex flex-wrap gap-2">
                  {learningInstruments.map((inst, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isDark ? 'bg-white/5 border-white/10 text-white/80' : 'bg-zinc-50 border-zinc-100 text-zinc-700'}`}>
                      <inst.icon size={12} />
                      <span className="text-[10px] font-bold">{inst.name}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-400" />
                      <span className="text-[9px] opacity-60">{inst.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Account Section */}
          <section className="space-y-4">
            <h2 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-zinc-500'}`}>Account</h2>
            <div className={`rounded-[2rem] overflow-hidden border ${isDark ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
              <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-white/5' : 'border-zinc-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5 text-white/40' : 'bg-zinc-50 text-zinc-400'}`}>
                    <User size={18} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-zinc-400'}`}>Name</p>
                    {isEditing ? (
                      <input 
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        onFocus={(e) => e.stopPropagation()}
                        className={`text-sm font-bold bg-transparent border-b border-harbour-500/30 focus:outline-none focus:border-harbour-500 ${isDark ? 'text-white' : 'text-zinc-900'}`}
                      />
                    ) : (
                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{profile.name}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-white/5' : 'border-zinc-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5 text-white/40' : 'bg-zinc-50 text-zinc-400'}`}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-zinc-400'}`}>Email</p>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{profile.email}</p>
                  </div>
                </div>
              </div>
              <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-white/5' : 'border-zinc-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5 text-white/40' : 'bg-zinc-50 text-zinc-400'}`}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-zinc-400'}`}>Date of Birth</p>
                    {isEditing ? (
                      <input 
                        type="date"
                        value={editData.birthday}
                        onChange={(e) => setEditData({ ...editData, birthday: e.target.value })}
                        onFocus={(e) => e.stopPropagation()}
                        className={`text-sm font-bold bg-transparent border-b border-harbour-500/30 focus:outline-none focus:border-harbour-500 ${isDark ? 'text-white' : 'text-zinc-900'}`}
                      />
                    ) : (
                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{profile.birthday || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>

              <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5 text-white/40' : 'bg-zinc-50 text-zinc-400'}`}>
                    <Lock size={18} />
                  </div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Change Password</p>
                </div>
                <ChevronRight size={16} className="text-zinc-400" />
              </button>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="space-y-4">
            <h2 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-zinc-500'}`}>Preferences</h2>
            <div className={`p-4 rounded-[2rem] border flex items-center justify-between ${isDark ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5 text-white/40' : 'bg-zinc-50 text-zinc-400'}`}>
                  <Bell size={18} />
                </div>
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Notifications</p>
              </div>
              <button 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-12 h-6 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-harbour-500' : 'bg-zinc-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </section>

          {/* Other Section */}
          <section className="space-y-4">
            <h2 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-zinc-500'}`}>Other</h2>
            <div className={`rounded-[2rem] overflow-hidden border ${isDark ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
              
              {/* Payment Details Section */}
              <button 
                onClick={() => setShowStudentPaymentMethods(!showStudentPaymentMethods)}
                className={`w-full p-4 flex items-center justify-between border-b transition-colors ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-zinc-50 hover:bg-zinc-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5 text-white/40' : 'bg-zinc-50 text-zinc-400'}`}>
                    <CreditCard size={18} />
                  </div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Payment Details</p>
                </div>
                <ChevronRight size={16} className={`text-zinc-400 transition-transform ${showStudentPaymentMethods ? 'rotate-90' : ''}`} />
              </button>

              <AnimatePresence>
                {showStudentPaymentMethods && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`overflow-hidden ${isDark ? 'bg-black/20' : 'bg-zinc-50'}`}
                  >
                    <div className="p-4 space-y-4">
                      {studentPaymentMethods.map(pm => (
                        <div key={pm.id} className={`flex justify-between items-center p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-100 shadow-sm'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5 text-white/40' : 'bg-zinc-100 text-zinc-500'}`}>
                              <CreditCard size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{pm.type} •••• {pm.last4}</p>
                                {pm.isDefault && <span className="px-1.5 py-0.5 bg-harbour-500/10 text-harbour-400 text-[8px] font-bold rounded uppercase tracking-widest">Default</span>}
                              </div>
                              <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-zinc-400'}`}>Expires {pm.expiry}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!pm.isDefault && (
                              <button 
                                onClick={() => setStudentPaymentMethods(studentPaymentMethods.map(m => ({ ...m, isDefault: m.id === pm.id })))}
                                className="text-[9px] font-bold text-harbour-500 hover:text-harbour-400 uppercase tracking-widest"
                              >
                                Set Default
                              </button>
                            )}
                            <button 
                              onClick={() => setStudentPaymentMethods(studentPaymentMethods.filter(m => m.id !== pm.id))}
                              className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <button 
                        onClick={() => setShowAddCardModal(true)}
                        className={`w-full p-4 rounded-2xl border border-dashed flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${isDark ? 'border-white/10 text-white/40 hover:border-harbour-500/50 hover:text-harbour-400' : 'border-zinc-200 text-zinc-400 hover:border-harbour-500/50 hover:text-harbour-500'}`}
                      >
                        <Plus size={16} /> Add New Card
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={() => setShowStudentPaymentHistory(!showStudentPaymentHistory)}
                className={`w-full p-4 flex items-center justify-between border-b transition-colors ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-zinc-50 hover:bg-zinc-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5 text-white/40' : 'bg-zinc-50 text-zinc-400'}`}>
                    <History size={18} />
                  </div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Payment History</p>
                </div>
                <ChevronRight size={16} className={`text-zinc-400 transition-transform ${showStudentPaymentHistory ? 'rotate-90' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showStudentPaymentHistory && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`overflow-hidden ${isDark ? 'bg-black/20' : 'bg-zinc-50'}`}
                  >
                    <div className="p-4 space-y-3">
                      {studentTransactions.map(tx => (
                        <div key={tx.id} className={`flex justify-between items-center py-2 border-b last:border-0 ${isDark ? 'border-white/5' : 'border-zinc-100'}`}>
                          <div>
                            <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{tx.lessonType} Session</p>
                            <p className={`text-[9px] ${isDark ? 'text-white/40' : 'text-zinc-400'}`}>{tx.date}</p>
                          </div>
                          <p className="text-xs font-bold text-harbour-400">RM {tx.grossAmount}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button className={`w-full p-4 flex items-center justify-between border-b transition-colors ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-zinc-50 hover:bg-zinc-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5 text-white/40' : 'bg-zinc-50 text-zinc-400'}`}>
                    <HelpCircle size={18} />
                  </div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Help & Support</p>
                </div>
                <ChevronRight size={16} className="text-zinc-400" />
              </button>
              <button className={`w-full p-4 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-zinc-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5 text-white/40' : 'bg-zinc-50 text-zinc-400'}`}>
                    <Info size={18} />
                  </div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Rules & Information</p>
                </div>
                <ChevronRight size={16} className="text-zinc-400" />
              </button>
            </div>
          </section>

          <button 
            onClick={handleLogout}
            className={`w-full py-5 font-bold rounded-[2rem] flex items-center justify-center gap-2 mt-4 transition-colors ${isDark ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-100'}`}
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>

        <AnimatePresence>
          {showAddCardModal && (
            <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddCardModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className={`relative w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden border ${isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100 shadow-2xl'}`}
              >
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className={`text-xl font-serif-sturdy ${isDark ? 'text-white' : 'text-zinc-900'}`}>Add New Card</h3>
                      <p className={`text-[10px] uppercase tracking-widest font-bold mt-1 ${isDark ? 'text-white/30' : 'text-zinc-400'}`}>Secure Payment Entry</p>
                    </div>
                    <button onClick={() => setShowAddCardModal(false)} className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5 text-white/40' : 'bg-zinc-100 text-zinc-400'}`}>
                      <XCircle size={20} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-zinc-400'}`}>Cardholder Name</label>
                      <input 
                        type="text"
                        placeholder="John Doe"
                        value={newCardData.name}
                        onChange={(e) => setNewCardData({ ...newCardData, name: e.target.value })}
                        onFocus={(e) => e.stopPropagation()}
                        className={`w-full p-4 rounded-2xl border text-sm font-bold transition-all outline-none ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-harbour-500/50' : 'bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-harbour-500/50'}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-zinc-400'}`}>Card Number</label>
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="•••• •••• •••• ••••"
                          value={newCardData.number}
                          onChange={(e) => setNewCardData({ ...newCardData, number: e.target.value })}
                          onFocus={(e) => e.stopPropagation()}
                          className={`w-full p-4 pl-12 rounded-2xl border text-sm font-bold transition-all outline-none ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-harbour-500/50' : 'bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-harbour-500/50'}`}
                        />
                        <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-zinc-400'}`}>Expiry Date</label>
                        <input 
                          type="text"
                          placeholder="MM/YY"
                          value={newCardData.expiry}
                          onChange={(e) => setNewCardData({ ...newCardData, expiry: e.target.value })}
                          onFocus={(e) => e.stopPropagation()}
                          className={`w-full p-4 rounded-2xl border text-sm font-bold transition-all outline-none ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-harbour-500/50' : 'bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-harbour-500/50'}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-zinc-400'}`}>CVV</label>
                        <input 
                          type="text"
                          placeholder="•••"
                          value={newCardData.cvv}
                          onChange={(e) => setNewCardData({ ...newCardData, cvv: e.target.value })}
                          onFocus={(e) => e.stopPropagation()}
                          className={`w-full p-4 rounded-2xl border text-sm font-bold transition-all outline-none ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-harbour-500/50' : 'bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-harbour-500/50'}`}
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if (newCardData.number && newCardData.expiry) {
                          const last4 = newCardData.number.slice(-4) || '0000';
                          setStudentPaymentMethods([...studentPaymentMethods, {
                            id: `pm${Date.now()}`,
                            type: 'Visa', // Simplified for demo
                            last4,
                            expiry: newCardData.expiry,
                            isDefault: studentPaymentMethods.length === 0
                          }]);
                          setShowAddCardModal(false);
                          setNewCardData({ number: '', expiry: '', cvv: '', name: '' });
                        }
                      }}
                      className="w-full py-4 bg-harbour-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-harbour-500/20 hover:bg-harbour-400 transition-all mt-4"
                    >
                      Save Card Details
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const AuthContainer = () => {
    const isDark = true;
    const [userRole, setUserRole] = useState<'student' | 'mentor' | null>(null);
    const splashCards = [
      {
        title: "Discover Malaysia's Musical Roots",
        image: "https://i.ibb.co/tM03GdSj/cover-nada1.png",
        desc: "Explore the rich heritage of traditional instruments from Tabla to Erhu."
      },
      {
        title: "Learn From Real Masters",
        image: "https://i.ibb.co/vGFC8hz/Gemini-Generated-Image-wct2xrwct2xrwct2.png",
        desc: "Connect with certified mentors who carry the legacy of Malaysian music."
      },
      {
        title: "Your Cultural Journey Starts Here",
        image: "https://i.ibb.co/0yf3Dm0z/booksas.png",
        desc: "Begin your path to mastering the sounds of our homeland."
      }
    ];

    const SplashView = () => (
      <div className="relative h-full w-full overflow-hidden bg-atmospheric-dark">
        {/* Atmospheric Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-seafoam-glow/20 blur-[150px] rounded-full" />
          <div className="absolute top-[20%] left-[10%] w-[60%] h-[60%] bg-pine-dark/10 blur-[120px] rounded-full" />
        </div>

        {/* Swipeable Cards */}
        <div className="h-full w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={splashIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img 
                src={splashCards[splashIndex].image || null} 
                className="w-full h-full object-cover opacity-60" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 flex flex-col justify-end p-8 pb-32">
            <motion.div
              key={`text-${splashIndex}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="max-w-xs"
            >
              <h1 className="text-4xl font-serif-sturdy text-white mb-4 leading-tight">
                {splashCards[splashIndex].title}
              </h1>
              <p className="text-white/60 text-sm leading-relaxed">
                {splashCards[splashIndex].desc}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-8 bg-gradient-to-t from-black to-transparent">
          {/* Dot Indicators */}
          <div className="flex justify-center gap-2">
            {splashCards.map((_, i) => (
              <button
                key={i}
                onClick={() => setSplashIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${splashIndex === i ? 'w-8 bg-harbour-500' : 'w-2 bg-white/20'}`}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setAuthView('role-selection')}
              className="w-full bg-white text-black font-bold py-5 rounded-[2rem] shadow-xl transition-transform"
            >
              Get Started
            </button>
            <button 
              onClick={() => setAuthView('sign-in')}
              className="w-full bg-transparent text-white border border-white/20 font-bold py-5 rounded-[2rem] transition-transform"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );

    const AuthError = ({ message }: { message: string | null | undefined }) => (
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 mb-6"
          >
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <p className="text-xs font-medium text-red-500 leading-relaxed">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    );

    const RoleSelectionView = () => (
      <div className={`min-h-full p-8 flex flex-col relative overflow-hidden ${isDark ? 'bg-atmospheric-dark text-white' : 'bg-zinc-50 text-zinc-900'}`}>
        {isDark && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-seafoam-glow/20 blur-[150px] rounded-full" />
            <div className="absolute top-[20%] left-[10%] w-[60%] h-[60%] bg-pine-dark/10 blur-[120px] rounded-full" />
          </div>
        )}
        <div className="relative z-10 flex flex-col h-full">
          {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => { setAuthView('splash'); setAuthError(null); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Step 1 of 2</span>
            <div className="flex gap-1 mt-1">
              <div className="w-6 h-1 rounded-full bg-harbour-500" />
              <div className="w-6 h-1 rounded-full bg-zinc-200" />
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-3xl font-serif-sturdy mb-2">I want to join as...</h2>
          <p className="text-zinc-500 text-sm">Choose your path in the musical journey.</p>
        </div>

        <div className="space-y-4 flex-1">
          <button 
            onClick={() => setUserRole('student')}
            className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all relative group ${userRole === 'student' ? 'border-harbour-500 bg-harbour-50/5' : isDark ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${userRole === 'student' ? 'bg-harbour-500 text-white' : 'bg-harbour-100 text-harbour-600'}`}>
                <Users size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">Student</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">Learn traditional instruments from verified masters.</p>
              </div>
              {userRole === 'student' && (
                <div className="w-6 h-6 bg-harbour-500 rounded-full flex items-center justify-center text-white">
                  <Check size={14} />
                </div>
              )}
            </div>
          </button>

          <button 
            onClick={() => setUserRole('mentor')}
            className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all relative group ${userRole === 'mentor' ? 'border-walnut-500 bg-walnut-50/5' : isDark ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${userRole === 'mentor' ? 'bg-walnut-500 text-white' : 'bg-walnut-100 text-walnut-600'}`}>
                <User size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">Mentor</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">Share your expertise and preserve our musical heritage.</p>
              </div>
              {userRole === 'mentor' && (
                <div className="w-6 h-6 bg-walnut-500 rounded-full flex items-center justify-center text-white">
                  <Check size={14} />
                </div>
              )}
            </div>
          </button>
        </div>

        <button 
          onClick={() => {
            if (userRole === 'student') setAuthView('student-registration');
            else if (userRole === 'mentor') setAuthView('mentor-registration');
            setAuthError(null);
          }}
          disabled={!userRole}
          className={`w-full py-5 rounded-[2rem] font-bold text-sm uppercase tracking-widest transition-all mt-8 ${userRole ? 'bg-zinc-900 text-white shadow-xl' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}
        >
          Continue
        </button>
      </div>
    </div>
    );

    const RegistrationView = ({ role }: { role: 'student' | 'mentor' }) => {
      const [showPassword, setShowPassword] = useState(false);
      const [password, setPassword] = useState('');

      const getPasswordStrength = (pass: string) => {
        if (!pass) return 0;
        let strength = 0;
        if (pass.length >= 8) strength += 25;
        if (/[A-Z]/.test(pass)) strength += 25;
        if (/[0-9]/.test(pass)) strength += 25;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
        return strength;
      };

      const strength = getPasswordStrength(password);
      const strengthColor = strength <= 25 ? 'bg-red-500' : strength <= 50 ? 'bg-orange-500' : strength <= 75 ? 'bg-yellow-500' : 'bg-emerald-500';

      return (
        <div className={`h-full flex flex-col relative overflow-hidden ${isDark ? 'bg-atmospheric-dark text-white' : 'bg-zinc-50 text-zinc-900'}`}>
          {isDark && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-seafoam-glow/20 blur-[150px] rounded-full" />
              <div className="absolute top-[20%] left-[10%] w-[60%] h-[60%] bg-pine-dark/10 blur-[120px] rounded-full" />
            </div>
          )}
          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
          <div className="p-8 pb-4 flex items-center justify-between">
            <button onClick={() => { setAuthView('role-selection'); setAuthError(null); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <ChevronLeft size={20} />
            </button>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Step 2 of 2</span>
              <div className="flex gap-1 mt-1">
                <div className="w-6 h-1 rounded-full bg-harbour-500" />
                <div className="w-6 h-1 rounded-full bg-harbour-500" />
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            <div className="mb-8">
              <h2 className="text-3xl font-serif-sturdy mb-2">{role === 'student' ? 'Create Student Account' : 'Join as Mentor'}</h2>
              <p className="text-zinc-500 text-sm">Fill in your details to get started.</p>
            </div>

            <AuthError message={authError} />

            <form className="space-y-5" onSubmit={(e) => handleEmailRegister(e, role)}>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Full Name</label>
                <input name="name" type="text" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="Julian Vane" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Email Address</label>
                <input name="email" type="email" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="julian@example.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Phone Number</label>
                <input name="phone" type="tel" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="+60 12 345 6789" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Date of Birth</label>
                <input name="birthday" type="date" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Password</label>
                <div className="relative">
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full border rounded-2xl px-6 py-4 pr-14 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} 
                    placeholder="••••••••" 
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <Lock size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Strength Bar */}
                <div className="h-1 w-full bg-zinc-200 rounded-full overflow-hidden mt-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${strength}%` }}
                    className={`h-full ${strengthColor} transition-all`}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isAuthLoading}
                className={`w-full font-bold py-5 rounded-[2rem] mt-4 shadow-xl transition-all flex items-center justify-center gap-2 ${role === 'student' ? 'bg-harbour-500 text-white' : 'bg-zinc-900 text-white'} ${isAuthLoading ? 'opacity-70 scale-[0.98]' : 'hover:scale-[1.02]'}`}
              >
                {isAuthLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                  <span className={`px-4 ${isDark ? 'bg-atmospheric-dark text-zinc-500' : 'bg-zinc-50 text-zinc-400'}`}>Or</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                className={`w-full border font-bold py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'}`}
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="text-center pt-4">
                <button 
                  type="button"
                  onClick={() => setAuthView('sign-in')}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-900"
                >
                  Already have an account? <span className="text-harbour-600">Sign in</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      );
    };

    const SignInView = () => {
      const [showPassword, setShowPassword] = useState(false);

      return (
        <div className={`min-h-full p-8 flex flex-col relative overflow-hidden ${isDark ? 'bg-atmospheric-dark text-white' : 'bg-zinc-50 text-zinc-900'}`}>
          {isDark && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-seafoam-glow/20 blur-[150px] rounded-full" />
              <div className="absolute top-[20%] left-[10%] w-[60%] h-[60%] bg-pine-dark/10 blur-[120px] rounded-full" />
            </div>
          )}
          <div className="relative z-10 flex flex-col h-full">
            <button onClick={() => { setAuthView('splash'); setAuthError(null); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-8">
            <ChevronLeft size={20} />
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-serif-sturdy mb-2">Welcome Back</h2>
            <p className="text-zinc-500 text-sm">Sign in to continue your journey.</p>
          </div>

          <AuthError message={authError} />

          {/* Role Tabs */}
          <div className={`flex p-1.5 rounded-2xl mb-8 ${isDark ? 'bg-white/5' : 'bg-zinc-200/50'}`}>
            <button 
              onClick={() => setRoleTab('student')}
              className={`flex-1 py-3.5 rounded-xl text-xs font-bold transition-all ${roleTab === 'student' ? 'bg-harbour-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Student
            </button>
            <button 
              onClick={() => setRoleTab('mentor')}
              className={`flex-1 py-3.5 rounded-xl text-xs font-bold transition-all ${roleTab === 'mentor' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Mentor
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleEmailLogin}>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Email Address</label>
              <input name="email" type="email" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="julian@example.com" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Password</label>
              <div className="relative">
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  className={`w-full border rounded-2xl px-6 py-4 pr-14 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} 
                  placeholder="••••••••" 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <Lock size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setAuthView('forgot-password')}
                className="text-xs font-bold text-harbour-600"
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isAuthLoading}
              className={`w-full font-bold py-5 rounded-[2rem] mt-4 shadow-xl transition-all flex items-center justify-center gap-2 ${roleTab === 'student' ? 'bg-harbour-500 text-white' : 'bg-zinc-900 text-white'} ${isAuthLoading ? 'opacity-70 scale-[0.98]' : 'hover:scale-[1.02]'}`}
            >
              {isAuthLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className={`px-4 ${isDark ? 'bg-atmospheric-dark text-zinc-500' : 'bg-zinc-50 text-zinc-400'}`}>Or</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              className={`w-full border font-bold py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'}`}
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="text-center pt-4">
              <button 
                type="button"
                onClick={() => setAuthView('role-selection')}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-900"
              >
                New here? <span className="text-harbour-600">Create account</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      );
    };

    const ForgotPasswordView = () => {
      return (
        <div className={`min-h-full p-8 flex flex-col ${isDark ? 'bg-atmospheric-dark text-white' : 'bg-zinc-50 text-zinc-900'}`}>
          <button onClick={() => setAuthView('sign-in')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-12">
            <ChevronLeft size={20} />
          </button>

          <div className="mb-10">
            <h2 className="text-3xl font-serif-sturdy mb-2">Forgot Password</h2>
            <p className="text-zinc-500 text-sm">Enter your email to receive a reset link.</p>
          </div>

          <AnimatePresence mode="wait">
            {!forgotPasswordSent ? (
              <motion.form 
                key="forgot-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6" 
                onSubmit={handleForgotPassword}
              >
                <AuthError message={authError} />
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Email Address</label>
                  <input name="email" type="email" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="julian@example.com" required />
                </div>
                <button 
                  type="submit"
                  disabled={isAuthLoading}
                  className={`w-full bg-zinc-900 text-white font-bold py-5 rounded-[2rem] shadow-xl transition-all flex items-center justify-center gap-2 ${isAuthLoading ? 'opacity-70 scale-[0.98]' : 'hover:scale-[1.02]'}`}
                >
                  {isAuthLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="forgot-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Email Sent!</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-[240px] mx-auto">We've sent a password reset link to your email address. Please check your inbox.</p>
                </div>
                <button 
                  onClick={() => { setAuthView('sign-in'); setForgotPasswordSent(false); }}
                  className="w-full bg-zinc-900 text-white font-bold py-5 rounded-[2rem] shadow-xl"
                >
                  Back to Sign In
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    };

    const ResetPasswordView = () => (
      <div className={`min-h-full p-8 flex flex-col ${isDark ? 'bg-atmospheric-dark text-white' : 'bg-zinc-50 text-zinc-900'}`}>
        <div className="mb-10 pt-12">
          <h2 className="text-3xl font-serif-sturdy mb-2">Reset Password</h2>
          <p className="text-zinc-500 text-sm">Create a new secure password for your account.</p>
        </div>

        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setAuthView('sign-in'); }}>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">New Password</label>
            <input type="password" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="••••••••" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Confirm New Password</label>
            <input type="password" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="••••••••" required />
          </div>
          <button className="w-full bg-harbour-600 text-white font-bold py-5 rounded-[2rem] shadow-xl transition-transform">
            Reset Password
          </button>
        </form>
      </div>
    );

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={authView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full w-full"
        >
          {authView === 'splash' && <SplashView />}
          {authView === 'role-selection' && <RoleSelectionView />}
          {authView === 'student-registration' && <RegistrationView role="student" />}
          {authView === 'mentor-registration' && <RegistrationView role="mentor" />}
          {authView === 'sign-in' && <SignInView />}
          {authView === 'forgot-password' && <ForgotPasswordView />}
          {authView === 'reset-password' && <ResetPasswordView />}
        </motion.div>
      </AnimatePresence>
    );
  };

  const HomeView = () => (
    <div className="px-5 pt-12">
      {/* Header - Dynamic Name */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className={`text-[9px] font-mono uppercase tracking-widest ${isDark ? 'opacity-40' : 'text-zinc-500'}`}>Welcome,</h2>
          <h1 className={`text-xl font-serif-curvy italic ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {userProfile?.name?.split(' ')[0] || 'Mentor'}
          </h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowNotificationSheet(true)}
            className={`w-8 h-8 rounded-full flex items-center justify-center relative ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-zinc-900'}`}
          >
            <Bell size={16} />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-harbour-500 rounded-full border border-black" />
            )}
          </button>
          <Avatar 
            name={userProfile?.name || 'Mentor'} 
            photo={userProfile?.photo} 
            size="sm" 
            className={`border ${isDark ? 'border-white/20' : 'border-black/10'}`} 
          />
        </div>
      </div>

      {/* Tabs Toggle */}
      {profileProgress === 100 ? (
        <>
          <div className={`flex gap-1 mb-6 p-1 rounded-full ${isDark ? 'bg-white/5' : 'bg-zinc-100'}`}>
            <button 
              onClick={() => setHomeTab('today')}
              className={`flex-1 py-2 rounded-full text-[9px] font-bold transition-all ${homeTab === 'today' ? (isDark ? 'bg-white text-black' : 'bg-white text-zinc-900 shadow-sm') : (isDark ? 'text-white/40' : 'text-zinc-400')}`}
            >
              Today
            </button>
            <button 
              onClick={() => setHomeTab('pending')}
              className={`flex-1 py-2 rounded-full text-[9px] font-bold transition-all ${homeTab === 'pending' ? (isDark ? 'bg-white text-black' : 'bg-white text-zinc-900 shadow-sm') : (isDark ? 'text-white/40' : 'text-zinc-400')}`}
            >
              Pending
            </button>
          </div>

          {homeTab === 'pending' ? (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-[9px] uppercase tracking-widest font-bold flex items-center gap-2 ${isDark ? 'text-white/40' : 'text-zinc-500'}`}>
                  Requests <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                </h2>
                <span className={`text-[8px] font-mono ${isDark ? 'text-white/20' : 'text-zinc-400'}`}>
                  {lessons.filter(l => l.status === 'pending').length} New
                </span>
              </div>
              <div className="space-y-3">
                {lessons.filter(l => (l.status === 'pending' || (l.status === 'reschedule_requested' && l.requestedBy !== currentUser?.uid))).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-4 bg-white border border-zinc-200 rounded-[2.5rem] shadow-sm">
                    <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-200">
                      <Inbox size={32} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">No pending requests</p>
                  </div>
                ) : (
                  lessons.filter(l => (l.status === 'pending' || (l.status === 'reschedule_requested' && l.requestedBy !== currentUser?.uid))).map(request => {
                    const student = realStudents.find(s => s.id === request.studentId) || MOCK_STUDENTS.find(s => s.id === request.studentId);
                    const resolvedStudentName = student?.name || (request.studentName && request.studentName !== 'Student' ? request.studentName : null) || `Student (${request.studentId?.slice(0,6) || '?'})`;
                    return (
                      <div key={request.id} className="bg-white border border-zinc-200 p-5 rounded-[2rem] transition-all hover:shadow-xl hover:border-zinc-300 shadow-md group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-4 items-center">
                            {/* Student Photo */}
                            <Avatar 
                              name={resolvedStudentName} 
                              photo={student?.photo} 
                              size="md" 
                              className="border border-zinc-100 shadow-sm" 
                            />
                            
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="text-sm font-bold tracking-tight truncate text-zinc-900">{resolvedStudentName}</h3>
                                <Badge variant={request.type === 'Trial' ? 'gold' : request.type === 'Monthly' ? 'harbour' : 'outline'}>
                                  {request.type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{request.instrument}</p>
                                <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">New Student</p>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setActiveLessonAction(request)}
                            className="p-2 text-zinc-300 hover:text-zinc-900 transition-colors"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </div>

                        {/* Requested Time Slot */}
                        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-400 shadow-sm">
                              <Calendar size={18} />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                                {request.status === 'reschedule_requested' ? 'Reschedule Requested For' : new Date(request.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                              </p>
                              <p className="text-sm font-serif-curvy italic leading-none mt-1 text-zinc-900">{request.status === 'reschedule_requested' ? `${new Date(request.requestedDate).toLocaleDateString()} at ${request.requestedTime}` : request.time}</p>
                            </div>
                          </div>
                        </div>

                        {/* Student Note */}
                        {request.studentNote && (
                          <div className="mb-5 p-4 rounded-2xl border-l-4 border-harbour-500 bg-zinc-50/50">
                            <p className="text-[8px] font-bold uppercase tracking-widest mb-1.5 text-zinc-400">Student Note</p>
                            <p className="text-[11px] leading-relaxed text-zinc-600 font-medium italic">"{request.studentNote}"</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              const student = realStudents.find(s => s.id === request.studentId) || MOCK_STUDENTS.find(s => s.id === request.studentId);
                              if (student) {
                                setSelectedChat(student);
                                setView('messages');
                              }
                            }}
                            className="w-14 h-12 bg-zinc-100 border border-zinc-200 flex items-center justify-center rounded-2xl text-zinc-900 hover:bg-zinc-200 transition-all shadow-sm"
                          >
                            <MessageSquare size={18} />
                          </button>
                          <button 
                            onClick={async () => {
                              if (request.status === 'reschedule_requested') {
                                handleRescheduleAction(request, 'accept');
                              } else {
                                try {
                                  if (request.id.startsWith('l')) {
                                    setLessons(prev => prev.map(l => l.id === request.id ? { ...l, status: 'confirmed' } : l));
                                  } else {
                                    await updateDoc(doc(db, 'lessons', request.id), { status: 'confirmed' });
                                  }
                                  triggerNotification(request.studentId, 'lesson_confirmed', 'Trial Confirmed', `${mentorProfile.name} confirmed your free trial on ${new Date(request.date).toLocaleDateString()} at ${request.time}`);
                                } catch (error) {
                                  console.error("Error confirming lesson:", error);
                                }
                              }
                            }}
                            className="flex-1 bg-zinc-900 text-white text-[10px] font-bold py-3 rounded-2xl hover:bg-black transition-all shadow-lg shadow-zinc-900/10"
                          >
                            {request.status === 'reschedule_requested' ? 'Accept Reschedule' : 'Accept Request'}
                          </button>
                          <button 
                            onClick={async () => {
                              if (request.status === 'reschedule_requested') {
                                handleRescheduleAction(request, 'decline');
                              } else {
                                try {
                                  if (request.id.startsWith('l')) {
                                    // Handle mock data
                                    setLessons(prev => prev.map(l => l.id === request.id ? { ...l, status: 'cancelled' } : l));
                                  } else {
                                    await updateDoc(doc(db, 'lessons', request.id), { status: 'cancelled' });
                                  }
                                  triggerNotification(request.studentId, 'lesson_declined', 'Trial Declined', `Your trial request was declined. Find another mentor`);
                                } catch (error) {
                                  console.error("Error declining lesson:", error);
                                }
                              }
                            }}
                            className="flex-1 border border-zinc-200 bg-white text-zinc-500 text-[10px] font-bold py-3 rounded-2xl hover:bg-zinc-50 transition-all"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          ) : (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-[9px] uppercase tracking-widest font-bold ${isDark ? 'text-white/40' : 'text-zinc-500'}`}>Upcoming Schedule</h2>
                <button 
                  onClick={() => setView('full-schedule')}
                  className="text-[9px] font-bold text-harbour-500 hover:text-harbour-400 transition-colors flex items-center gap-1"
                >
                  See all <ChevronRight size={10} />
                </button>
              </div>
              <div className="space-y-3">
                {lessons.filter(l => (l.status === 'confirmed' || l.status === 'cancelled') && new Date(l.date) >= new Date(new Date().setHours(0,0,0,0))).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-4 bg-white border border-zinc-200 rounded-[2.5rem] shadow-sm">
                    <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-200">
                      <Calendar size={32} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">No upcoming lessons</p>
                  </div>
                ) : (
                  lessons
                    .filter(l => (l.status === 'confirmed' || l.status === 'cancelled') && new Date(l.date) >= new Date(new Date().setHours(0,0,0,0)))
                    .sort((a, b) => {
                      if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
                      if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;
                      return new Date(a.date).getTime() - new Date(b.date).getTime();
                    })
                    .map(lesson => {
                      const student = realStudents.find(s => s.id === lesson.studentId) || MOCK_STUDENTS.find(s => s.id === lesson.studentId);
                      const resolvedStudentName = student?.name || (lesson.studentName && lesson.studentName !== 'Student' ? lesson.studentName : null) || `Student (${lesson.studentId?.slice(0,6) || '?'})`;
                      const isCancelled = lesson.status === 'cancelled';
                      
                      return (
                      <div key={lesson.id} className={`p-6 rounded-[2.5rem] relative group transition-all shadow-md ${isCancelled ? 'bg-red-50/30 border-red-100 border-dashed opacity-90' : 'bg-white border-zinc-200 hover:shadow-xl'}`}>
                        {isCancelled && (
                          <div className="absolute top-4 right-6 z-10">
                            <motion.div 
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="px-3 py-1 bg-red-500 text-white text-[8px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-red-500/20 flex items-center gap-1.5"
                            >
                              <XCircle size={10} />
                              Cancelled by {lesson.cancelledBy === 'mentor' ? 'You' : 'Student'}
                            </motion.div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex gap-4 items-center">
                            {/* Student Photo */}
                            <div className="relative">
                              <Avatar 
                                name={resolvedStudentName} 
                                photo={student?.photo} 
                                size="lg" 
                                className={`border-2 shadow-md ${isCancelled ? 'border-red-100 grayscale' : 'border-zinc-50'}`} 
                              />
                              {!isCancelled && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />}
                            </div>
                            
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`text-lg font-bold tracking-tight truncate ${isCancelled ? 'text-red-900/50' : 'text-zinc-900'}`}>{resolvedStudentName}</h3>
                                {cancellingIds.includes(lesson.id) ? (
                                  <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="px-2 py-0.5 bg-red-500 text-white text-[7px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1 shadow-lg shadow-red-500/20"
                                  >
                                    <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                    Cancelling
                                  </motion.div>
                                ) : !isCancelled && (
                                  <Badge variant={lesson.type === 'Trial' ? 'gold' : lesson.type === 'Monthly' ? 'harbour' : 'outline'}>
                                    {lesson.type}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                <span className={`font-bold ${isCancelled ? 'text-red-300' : 'text-zinc-500'}`}>{lesson.instrument}</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                <span>{new Date(lesson.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>
                          {!isCancelled && (
                            <button 
                              onClick={() => setActiveLessonAction(lesson)}
                              className="p-2 -mr-2 transition-colors text-zinc-300 hover:text-harbour-500"
                            >
                              <MoreVertical size={20} />
                            </button>
                          )}
                        </div>
                        
                        {isCancelled ? (
                          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 mb-2">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-red-400 mb-1">Reason for cancellation</p>
                            <p className="text-xs text-red-900/70 italic">"{lesson.cancelReason || 'No reason provided'}"</p>
                          </div>
                        ) : (
                          <>
                            {/* Time & Schedule Info */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-harbour-500 shadow-sm">
                                  <Clock size={18} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Time</span>
                                  <span className="text-sm font-serif-curvy italic text-zinc-900">{lesson.time}</span>
                                </div>
                              </div>
                              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm">
                                  <BookOpen size={18} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Lesson</span>
                                  <span className="text-sm font-bold text-zinc-900">#{lesson.lessonNumber}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-2 pt-5 border-t border-zinc-100">
                              <button 
                                onClick={() => {
                                  setReschedulingLesson(lesson);
                                  setShowRescheduleModal(true);
                                }}
                                className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-500 hover:bg-zinc-100 transition-all group/btn"
                              >
                                <Calendar size={16} className="group-hover/btn:text-harbour-500 transition-colors" />
                                <span className="text-[8px] font-bold uppercase tracking-widest">Reschedule</span>
                              </button>
                              <button 
                                onClick={() => {
                                  setLessonToCancel(lesson);
                                  setShowCancelModal(true);
                                }}
                                className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-500 hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all group/btn"
                              >
                                <XCircle size={16} />
                                <span className="text-[8px] font-bold uppercase tracking-widest">Cancel</span>
                              </button>
                              <button 
                                onClick={() => {
                                  const student = realStudents.find(s => s.id === lesson.studentId) || MOCK_STUDENTS.find(s => s.id === lesson.studentId);
                                  if (student) setSelectedStudent(student);
                                  setSelectedLesson(lesson);
                                  setView('log-session');
                                }}
                                className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-harbour-600 text-white hover:bg-harbour-700 transition-all shadow-lg shadow-harbour-600/20"
                              >
                                <Plus size={16} />
                                <span className="text-[8px] font-bold uppercase tracking-widest">Log Session</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className={`p-8 rounded-[2.5rem] border text-center space-y-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
          <div className="w-16 h-16 bg-harbour-500/20 text-harbour-500 rounded-full flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <div className="space-y-1">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Complete your profile first</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/40' : 'text-zinc-500'}`}>
              You need to reach 100% profile completion before you can start accepting students and managing lessons.
            </p>
          </div>
          <button 
            onClick={() => setView('profile')}
            className="w-full py-4 bg-harbour-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-harbour-600/20"
          >
            Go to Profile
          </button>
        </div>
      )}
    </div>
  );

  const FullScheduleView = () => (
    <div className="px-5 pt-12 min-h-full bg-[#0A0A0A] text-white">
      <header className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setView('home')}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-serif-sturdy">Upcoming Lessons</h1>
          <p className="text-[9px] font-mono uppercase tracking-widest text-white/30">Master Schedule</p>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-full border border-white/5">
        {(['week', 'month', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setScheduleFilter(tab)}
            className={`flex-1 py-2 rounded-full text-[10px] font-bold capitalize transition-all ${
              scheduleFilter === tab 
                ? 'bg-harbour-600 text-white shadow-lg' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {tab === 'week' ? 'This Week' : tab === 'month' ? 'This Month' : 'All Lessons'}
          </button>
        ))}
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {lessons
          .filter(l => l.status === 'confirmed' || l.status === 'cancelled')
          .filter(l => {
            if (scheduleFilter === 'all') return true;
            const lessonDate = new Date(l.date);
            const now = new Date();
            if (scheduleFilter === 'week') {
              const weekEnd = new Date();
              weekEnd.setDate(now.getDate() + 7);
              return lessonDate >= now && lessonDate <= weekEnd;
            }
            if (scheduleFilter === 'month') {
              const monthEnd = new Date();
              monthEnd.setMonth(now.getMonth() + 1);
              return lessonDate >= now && lessonDate <= monthEnd;
            }
            return true;
          })
          .sort((a, b) => {
            if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
            if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          })
          .map(lesson => {
            const student = realStudents.find(s => s.id === lesson.studentId) || MOCK_STUDENTS.find(s => s.id === lesson.studentId);
            const resolvedStudentName = student?.name || (lesson.studentName && lesson.studentName !== 'Student' ? lesson.studentName : null) || `Student (${lesson.studentId?.slice(0,6) || '?'})`;
            const isCancelled = lesson.status === 'cancelled';

            return (
              <div key={lesson.id} className={`p-4 rounded-2xl relative group border transition-all ${isCancelled ? 'bg-red-500/5 border-red-500/20 opacity-80' : 'bg-white/5 border-white/10'}`}>
                {isCancelled && (
                  <div className="absolute top-2 right-2">
                    <div className="px-2 py-0.5 bg-red-500 text-white text-[7px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                      <XCircle size={8} />
                      Cancelled
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <Avatar 
                      name={resolvedStudentName} 
                      photo={student?.photo} 
                      size="md" 
                      className={`rounded-full border shadow-sm ${isCancelled ? 'border-red-500/20 grayscale' : 'border-white/10'}`} 
                    />
                    <div className="min-w-0">
                      <h3 className={`text-sm font-bold truncate ${isCancelled ? 'text-red-200/50' : 'text-white'}`}>{resolvedStudentName}</h3>
                      <p className={`text-[9px] truncate ${isCancelled ? 'text-red-300/30' : 'text-white/40'}`}>{lesson.instrument}</p>
                    </div>
                  </div>
                  {!isCancelled && (
                    <Badge variant={lesson.type === 'Trial' ? 'gold' : lesson.type === 'Monthly' ? 'harbour' : 'outline'}>
                      {lesson.type}
                    </Badge>
                  )}
                </div>

                <div className={`rounded-xl p-3 flex items-center justify-between border ${isCancelled ? 'bg-red-500/5 border-red-500/10' : 'bg-white/[0.03] border-white/5'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCancelled ? 'bg-red-500/10 text-red-400/50' : 'bg-white/10 text-white/40'}`}>
                      <Calendar size={14} />
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-tighter ${isCancelled ? 'text-red-400/40' : 'text-white/60'}`}>
                        {new Date(lesson.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                      <p className={`text-xs font-serif-curvy italic ${isCancelled ? 'text-red-200/30' : 'text-white/90'}`}>{lesson.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!isCancelled && (
                      <button 
                        onClick={() => {
                          const student = MOCK_STUDENTS.find(s => s.id === lesson.studentId);
                          if (student) {
                            setSelectedChat(student);
                            setView('messages');
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/10 transition-colors mr-1"
                      >
                        <MessageSquare size={14} />
                      </button>
                    )}
                    <div className="text-right">
                      <p className={`text-[8px] font-mono uppercase tracking-widest ${isCancelled ? 'text-red-400/20' : 'text-white/30'}`}>Lesson</p>
                      <p className={`text-xs font-bold ${isCancelled ? 'text-red-200/40' : 'text-white/80'}`}>#{lesson.lessonNumber}</p>
                    </div>
                  </div>
                </div>
                
                {isCancelled && lesson.cancelReason && (
                  <div className="mt-3 px-3 py-2 bg-red-500/5 rounded-lg border border-red-500/10">
                    <p className="text-[7px] font-bold uppercase tracking-widest text-red-400/40 mb-0.5">Reason</p>
                    <p className="text-[10px] text-red-200/40 italic truncate">"{lesson.cancelReason}"</p>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );

  const StudentsView = () => {
    const [rosterFilter, setRosterFilter] = useState('All');
    const [rosterSearch, setRosterSearch] = useState('');
    
    const filteredStudents = (realStudents.length > 0 ? realStudents : MOCK_STUDENTS)
      .filter(s => rosterFilter === 'All' || s.package === rosterFilter || 
        (rosterFilter === 'Package' && (s.package === 'Package 8' || s.package === 'Package 12')))
      .filter(s => s.name.toLowerCase().includes(rosterSearch.toLowerCase()))
      .filter(s => s.nextSession || s.lastSession || realSessionLogs.some(log => log.studentId === s.id));

    return (
      <div className="px-5 pt-12 pb-32 bg-zinc-50 min-h-full">
        <header className="mb-6">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-harbour-600 mb-1 block">Roster</span>
          <h1 className="text-3xl font-serif-sturdy text-zinc-900">Active Students</h1>
          <p className="text-xs text-zinc-400 mt-1">{filteredStudents.length} students currently enrolled</p>
        </header>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
          {['All', 'Trial', 'Single', 'Package'].map((tab) => (
            <button
              key={tab}
              onClick={() => setRosterFilter(tab)}
              className={`px-5 py-2 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                rosterFilter === tab ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-black/10' : 'bg-white border-zinc-200 text-zinc-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
            <Search size={16} />
          </div>
          <input
            value={rosterSearch}
            onChange={(e) => setRosterSearch(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl pl-12 pr-4 py-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-harbour-500/20 transition-all"
            placeholder="Search by name or instrument..."
          />
        </div>

        {/* List */}
        <div className="space-y-4">
          {filteredStudents.map(student => {
            const stage = Math.min(Math.floor((student.progress || 0) / 25) + 1, 4);
            const stageColors = {
              1: 'bg-amber-50 text-amber-600 border-amber-100',
              2: 'bg-harbour-50 text-harbour-600 border-harbour-100',
              3: 'bg-blue-50 text-blue-600 border-blue-100',
              4: 'bg-purple-50 text-purple-600 border-purple-100'
            };

            return (
              <motion.div 
                key={student.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setSelectedStudent(student); setView('student-detail'); }}
                className="bg-white border border-zinc-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar name={student.name} photo={student.photo} size="md" className="rounded-xl border border-zinc-100" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-zinc-900 group-hover:text-harbour-600 transition-colors truncate">{student.name}</h3>
                        <p className="text-[10px] text-zinc-400 font-medium truncate">{student.instrument} • {student.package}</p>
                      </div>
                      <Badge className={`px-1.5 py-0.5 text-[8px] border ${stageColors[stage as keyof typeof stageColors]}`}>
                        S{stage}
                      </Badge>
                    </div>
                    <div className="flex flex-col mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[7px] uppercase tracking-widest text-zinc-300 font-bold">Overall Progress</span>
                        <span className="text-[9px] font-bold text-zinc-900">{student.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${student.progress}%` }}
                          className={`h-full rounded-full ${
                            stage === 1 ? 'bg-amber-400' :
                            stage === 2 ? 'bg-harbour-500' :
                            stage === 3 ? 'bg-blue-500' :
                            'bg-purple-500'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[7px] uppercase tracking-widest text-zinc-300 font-bold">Remaining</span>
                          <span className="text-[9px] font-bold text-harbour-600">{student.lessonsRemaining} Lessons</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[7px] uppercase tracking-widest text-zinc-300 font-bold">Next Session</span>
                          <span className="text-[9px] font-bold text-zinc-600">{student.nextSession || 'Not scheduled'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChat({
                            id: `new-${student.id}`,
                            conversationId: null,
                            name: student.name,
                            photo: student.photo,
                            role: 'Student',
                            recipientId: student.id
                          });
                          setView('messages');
                        }}
                        className="w-8 h-8 rounded-full bg-zinc-50 text-zinc-400 hover:bg-zinc-900 hover:text-white flex items-center justify-center transition-all active:scale-90"
                      >
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const MessagesView = () => {
    const [studentSearch, setStudentSearch] = useState('');
    if (selectedChat) {
      return <ChatConversation recipient={selectedChat} onBack={() => setSelectedChat(null)} dark={true} />;
    }

    const activeStudentIds = new Set([
      ...lessons.map(l => l.studentId),
      ...conversations.map(c => c.participants.find((p: string) => p !== currentUser?.uid))
    ]);

    const filteredStudents = (realStudents.length > 0 ? realStudents : MOCK_STUDENTS)
      .filter(s => activeStudentIds.has(s.id))
      .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()));

    return (
      <div className="h-full flex flex-col pt-16 bg-atmospheric-dark text-white">
        <div className="px-5 mb-6">
          <h1 className="text-3xl font-serif-sturdy mb-2 text-white">Messages</h1>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-6">Active Conversations</p>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={14} />
            <input 
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full border rounded-full pl-10 pr-4 py-3 text-xs focus:outline-none bg-white/5 border-white/10 text-white" 
              placeholder="Search students..." 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-32">
          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02]">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <MessageSquare size={24} className="text-white/20" />
              </div>
              <div className="text-center px-8">
                <p className="text-xs font-bold text-white/40">No active chats</p>
                <p className="text-[10px] text-white/20 mt-1 leading-relaxed">Students who book a session with you will appear here for messaging.</p>
              </div>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const conversation = conversations.find(c => c.participants.includes(student.id));
              const lastMessage = conversation?.lastMessage || "No messages yet";
              const lastTime = conversation?.lastMessageAt?.toDate ? 
                conversation.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                "";

              return (
                <motion.div 
                  key={student.id} 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (conversation) {
                      setSelectedChat({
                        id: conversation.id,
                        conversationId: conversation.id,
                        name: student.name,
                        photo: student.photo,
                        role: 'Student'
                      });
                    } else {
                      setSelectedChat({
                        id: `new-${student.id}`,
                        conversationId: null,
                        name: student.name,
                        photo: student.photo,
                        role: 'Student',
                        recipientId: student.id
                      });
                    }
                  }}
                  className="p-4 rounded-[2rem] border transition-all cursor-pointer bg-white/5 border-white/10 hover:bg-white/10 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar name={student.name} photo={student.photo} size="md" className="rounded-2xl" />
                      {conversation?.unreadBy?.includes(currentUser?.uid) && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-harbour-500 rounded-full border-2 border-black" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-sm font-bold truncate group-hover:text-harbour-400 transition-colors">{student.name}</h3>
                        <span className="text-[8px] font-mono text-white/30">{lastTime}</span>
                      </div>
                      <p className="text-[9px] text-harbour-400 uppercase tracking-widest mb-1">{student.instrument}</p>
                      <p className="text-[11px] truncate text-white/40">{lastMessage}</p>
                    </div>
                  </div>
                </motion.div>
              );
            }))}
        </div>
      </div>
    );
  };

  const WalletView = () => {
    const dark = false; // Lock to light
    const handleWithdraw = async () => {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0 || amount > realBalance) return;

      setIsWithdrawing('processing');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newWithdrawal: Withdrawal = {
        id: `w${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: amount,
        bankAccount: 'Maybank **** 8821',
        status: 'Pending'
      };

      setWithdrawals([newWithdrawal, ...withdrawals]);
      setRealBalance(realBalance - amount);
      setIsWithdrawing('success');
      
      // Keep success message for a bit then close
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setIsWithdrawing('idle');
        setWithdrawalSuccess(true);
        setTimeout(() => setWithdrawalSuccess(false), 3000);
      }, 2000);
    };

    return (
      <div className="px-5 pt-12 bg-zinc-50 min-h-full">
        <header className="mb-6">
          <span className="text-[8px] uppercase tracking-[0.3em] font-mono font-semibold text-zinc-400 mb-1 block">Financials</span>
          <h1 className="text-2xl font-serif-sturdy text-zinc-900">Wallet</h1>
        </header>

        <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <p className="text-[9px] font-mono uppercase tracking-widest opacity-50 mb-1">Available Balance</p>
          <p className="text-4xl font-serif-sturdy mb-6">RM {realBalance.toLocaleString()}</p>
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="w-full py-4 bg-white text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-2 shadow-xl transition-transform"
          >
            Withdraw to Bank <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Success Toast */}
        <AnimatePresence>
          {withdrawalSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              className="absolute top-12 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-[320px]"
            >
              <div className="bg-harbour-500 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-harbour-400">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold">Withdrawal Requested!</p>
                  <p className="text-[9px] opacity-90">Your funds are on the way.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="pb-32">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Activity</h2>
            <div className="flex bg-zinc-100 p-1 rounded-full">
              <button 
                onClick={() => setWalletTab('transactions')}
                className={`px-4 py-1.5 rounded-full text-[9px] font-bold transition-all ${walletTab === 'transactions' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}
              >
                Transactions
              </button>
              <button 
                onClick={() => setWalletTab('withdrawals')}
                className={`px-4 py-1.5 rounded-full text-[9px] font-bold transition-all ${walletTab === 'withdrawals' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}
              >
                Withdrawals
              </button>
            </div>
          </div>

          {walletTab === 'transactions' ? (
            <div className="space-y-4">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search transactions..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-100 rounded-3xl text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['Week', 'Month', 'Custom'].map((f) => (
                  <button 
                    key={f}
                    onClick={() => setTransactionFilter(f.toLowerCase() as any)}
                    className={`px-4 py-1.5 rounded-full text-[9px] font-bold border transition-all whitespace-nowrap ${transactionFilter === f.toLowerCase() ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-400 border-zinc-100'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {(() => {
                const filteredTransactions = realTransactions.filter(t => {
                  const matchesSearch = t.studentName.toLowerCase().includes(transactionSearch.toLowerCase()) || 
                                       t.lessonType.toLowerCase().includes(transactionSearch.toLowerCase());
                  if (!matchesSearch) return false;

                  if (transactionFilter === 'week') {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(t.date) >= weekAgo;
                  }
                  if (transactionFilter === 'month') {
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return new Date(t.date) >= monthAgo;
                  }
                  return true; // 'custom' shows all for now
                });
                return (
                  <div className="space-y-3 pb-32">
                    {filteredTransactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-3 relative overflow-hidden rounded-3xl">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-50 rounded-3xl" />
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                          <Wallet size={24} className="text-zinc-300" />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">No earnings yet</p>
                          <p className="text-[9px] text-zinc-300 mt-1">Your lesson earnings will appear here</p>
                        </div>
                      </div>
                    ) : (
                      filteredTransactions.map(t => {
                        const capitalizedType = t.lessonType.charAt(0).toUpperCase() + t.lessonType.slice(1);
                        const displayDate = t.date || (t.completedAt?.toDate ? t.completedAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                        
                        return (
                          <div key={t.id} className="bg-white border border-zinc-100 p-4 rounded-2xl shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar name={t.studentName || 'Student'} photo={t.studentPhoto} size="sm" className="rounded-xl" />
                                <div>
                                  <p className="text-[11px] font-bold text-zinc-900">{t.studentName || 'Student'}</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-[9px] text-zinc-400">{new Date(displayDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {capitalizedType}</p>
                                    {t.isPartOfPackage && (
                                      <span className="bg-zinc-100 text-zinc-400 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest">Part of package</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-zinc-900">+RM {t.netAmount.toFixed(2)}</p>
                                <p className="text-[8px] text-zinc-400">Net after fee</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
                              <div className="flex gap-4">
                                <div className="flex flex-col">
                                  <span className="text-[8px] uppercase tracking-widest text-zinc-300 font-bold">Gross</span>
                                  <span className="text-[10px] font-mono text-zinc-500">RM {t.grossAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] uppercase tracking-widest text-zinc-300 font-bold">Fee</span>
                                  <span className="text-[10px] font-mono text-zinc-500">-RM {t.platformFee.toFixed(2)}</span>
                                </div>
                              </div>
                              <Badge variant={t.status === 'completed' ? 'default' : 'outline'}>
                                {t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : 'Completed'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map(w => (
                <div key={w.id} className="bg-white border border-zinc-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${w.status === 'Processed' ? 'bg-walnut-50 text-walnut-600' : 'bg-amber-50 text-amber-600'}`}>
                      {w.status === 'Processed' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[11px] font-bold text-zinc-900">RM {w.amount.toLocaleString()}</p>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest ${w.status === 'Processed' ? 'bg-walnut-100 text-walnut-700' : 'bg-amber-100 text-amber-700'}`}>
                          {w.status === 'Processed' ? 'Processed' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-400">{new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {w.bankAccount}</p>
                    </div>
                  </div>
                  <button className="p-2 text-zinc-300 hover:text-zinc-900">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Withdraw Modal */}
        <AnimatePresence>
          {showWithdrawModal && (
            <div className="absolute inset-0 z-[200] flex items-end justify-center">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowWithdrawModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
                className="relative w-full max-w-[375px] bg-white rounded-t-[2.5rem] p-8 shadow-2xl min-h-[400px] flex flex-col"
              >
                <div className="w-12 h-1.5 bg-zinc-100 rounded-full mx-auto mb-8" />
                
                {isWithdrawing === 'idle' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col"
                  >
                    <h2 className="text-xl font-serif-sturdy text-zinc-900 mb-2">Withdraw Funds</h2>
                    <p className="text-xs text-zinc-500 mb-8">Funds will be credited to your linked bank account within 1-3 business days.</p>

                    <div className="space-y-6 mb-8 flex-1">
                      <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 mb-2">Amount to Withdraw</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-serif-sturdy text-zinc-400">RM</span>
                          <input 
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="0.00"
                            className="bg-transparent text-4xl font-serif-sturdy text-zinc-900 focus:outline-none w-full"
                            autoFocus
                          />
                        </div>
                        <div className="mt-4 pt-4 border-t border-zinc-200 flex justify-between items-center">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Available</span>
                          <span className="text-[10px] font-bold text-zinc-900">RM {realBalance.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-400 shadow-sm">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-900">Maybank Berhad</p>
                          <p className="text-[8px] text-zinc-400">Account ending in •••• 8821</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowWithdrawModal(false)}
                        className="flex-1 py-4 text-zinc-400 text-[10px] font-bold uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleWithdraw}
                        disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > realBalance}
                        className="flex-[2] py-4 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-xl disabled:opacity-50 disabled:shadow-none"
                      >
                        Confirm Withdrawal
                      </button>
                    </div>
                  </motion.div>
                )}

                {isWithdrawing === 'processing' && (
                  <div className="flex-1 flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin mb-6" />
                    <h2 className="text-xl font-serif-sturdy text-zinc-900 mb-2">Processing...</h2>
                    <p className="text-xs text-zinc-400 text-center px-8">We are securely processing your withdrawal request. Please wait a moment.</p>
                  </div>
                )}

                {isWithdrawing === 'success' && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
                    className="flex-1 flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-20 h-20 bg-walnut-50 text-walnut-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-serif-sturdy text-zinc-900 mb-3">Withdrawal Completed!</h2>
                    <p className="text-xs text-zinc-500 px-8 leading-relaxed">
                      You have successfully completed your withdrawal. Your funds are being processed. Thank you for your patience!
                    </p>
                    <div className="mt-8 px-6 py-3 bg-walnut-50 rounded-2xl border border-walnut-100">
                      <p className="text-[10px] font-bold text-walnut-700">RM {parseFloat(withdrawAmount).toLocaleString()} is on its way</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const ProfileView = () => {
    const [editForm, setEditForm] = useState(mentorProfile);
    const [activeSetupItem, setActiveSetupItem] = useState<string | null>(null);
    const [setupForm, setSetupForm] = useState(mentorProfile);
    const [showCompletionGuide, setShowCompletionGuide] = useState(false);

    useEffect(() => {
      if (isEditingProfile) {
        setEditForm(mentorProfile);
      }
    }, [isEditingProfile, mentorProfile]);

    useEffect(() => {
      if (activeSetupItem) {
        setSetupForm(mentorProfile);
      }
    }, [activeSetupItem, mentorProfile]);

    const setupItems = [
      { 
        id: 'video', 
        label: 'Intro Video', 
        icon: Video, 
        status: mentorProfile.introVideoUrl ? 'success' : 'warning', 
        desc: 'Introduce yourself to students' 
      },
      { 
        id: 'bio', 
        label: 'About & Bio', 
        icon: User, 
        status: (mentorProfile.about && mentorProfile.tagline) ? 'success' : 'warning', 
        desc: 'Your professional background' 
      },
      { 
        id: 'skills', 
        label: 'Specialisation', 
        icon: Music2, 
        status: mentorProfile.specialisation?.length > 0 ? 'success' : 'warning', 
        desc: 'What you teach best' 
      },
      { 
        id: 'pricing', 
        label: 'Pricing', 
        icon: Wallet, 
        status: mentorProfile.pricePerLesson > 0 ? 'success' : 'warning', 
        desc: 'Set your hourly rates' 
      },
      { 
        id: 'availability', 
        label: 'Availability', 
        icon: Calendar, 
        status: Object.keys(mentorProfile.availability || {}).length > 0 ? 'success' : 'warning', 
        desc: 'When you are free' 
      },
      { 
        id: 'path', 
        label: 'Learning Path', 
        icon: BookOpen, 
        status: mentorProfile.teachingMethodology ? 'success' : 'warning', 
        desc: 'Your teaching methodology' 
      },
      { 
        id: 'location', 
        label: 'Location', 
        icon: MapPin, 
        status: (mentorProfile.location && mentorProfile.address) ? 'success' : 'warning', 
        desc: 'Where lessons happen' 
      },
      { 
        id: 'languages', 
        label: 'Languages', 
        icon: FileText, 
        status: mentorProfile.languages?.length > 0 ? 'success' : 'warning', 
        desc: 'Languages you speak' 
      },
      { 
        id: 'gallery', 
        label: 'Gallery', 
        icon: ImageIcon, 
        status: mentorProfile.gallery?.length > 0 ? 'success' : 'warning', 
        desc: 'Photos of your studio' 
      },
      { 
        id: 'credentials', 
        label: 'Credentials & ID', 
        icon: Award, 
        status: (mentorProfile.certifications?.length > 0 && mentorProfile.idDocument) ? 'success' : 'warning', 
        desc: 'Verify your identity and skills' 
      },
    ];

    return (
      <div className="h-full bg-zinc-50 overflow-y-auto">
        {/* Premium Header */}
        <header className="relative px-6 pt-16 pb-12 bg-zinc-900 text-white overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-harbour-500/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full -ml-32 -mb-32 blur-[80px]" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <Avatar 
                name={mentorProfile.name} 
                photo={mentorProfile.photo} 
                size="xl" 
                className="rounded-[2.5rem] border-4 border-white/10 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500" 
              />
              <button 
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-zinc-900 rounded-2xl flex items-center justify-center shadow-xl transition-transform hover:scale-110"
              >
                <Camera size={18} />
              </button>
              <input 
                type="file" 
                id="photo-upload" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = reader.result as string;
                      setMentorProfile({ ...mentorProfile, photo: base64 });
                      saveMentorProfile({ photo: base64 });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl font-serif-sturdy tracking-tight">{mentorProfile.name}</h1>
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="p-2 text-white/30 hover:text-white transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <p className="text-xs text-white/40 font-medium tracking-widest uppercase">{mentorProfile.email}</p>
            </div>

            <div className="flex gap-6 mt-8">
              <div className="text-center">
                <p className="text-xl font-serif-sturdy">{profileProgress === 100 ? '4.9' : '0.0'}</p>
                <p className="text-[8px] uppercase tracking-widest text-white/30 font-bold">Rating</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-xl font-serif-sturdy">{profileProgress === 100 ? '12' : '0'}</p>
                <p className="text-[8px] uppercase tracking-widest text-white/30 font-bold">Students</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-xl font-serif-sturdy">{profileProgress === 100 ? '156' : '0'}</p>
                <p className="text-[8px] uppercase tracking-widest text-white/30 font-bold">Lessons</p>
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 -mt-8 relative z-20 pb-32">
          {/* Profile Completion Banner - Glassmorphism */}
          <section 
            onClick={() => setShowCompletionGuide(true)}
            className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-xl border border-white/20 mb-8 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Profile Strength</h3>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-serif-sturdy text-zinc-900">{profileProgress}% Complete</p>
                  {profileProgress < 100 && (
                    <span className="text-[9px] font-bold text-harbour-600 bg-harbour-50 px-2 py-0.5 rounded-full uppercase tracking-widest">See what's missing</span>
                  )}
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (profileProgress === 100) {
                    setView('profile');
                  } else {
                    setShowCompletionGuide(true);
                  }
                }}
                className="text-[9px] font-bold text-walnut-600 uppercase tracking-widest bg-walnut-50 px-4 py-2.5 rounded-2xl hover:bg-walnut-100 transition-colors"
              >
                {profileProgress === 100 ? 'View Profile' : 'Complete Now'}
              </button>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${profileProgress}%` }}
                className="h-full bg-gradient-to-r from-harbour-400 to-harbour-600 rounded-full relative overflow-hidden"
              >
                <motion.div 
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>
          </section>

          {/* Main Actions - Bento Style */}
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => setShowSetupDetails(true)}
              className="group relative overflow-hidden p-6 bg-white rounded-[2.5rem] border border-zinc-200 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                    <Settings size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-bold text-zinc-900">Setup & Details</p>
                    <p className="text-xs text-zinc-500 font-medium">Configure your professional profile</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
            </button>

            <button 
              onClick={() => setShowCredentialsSheet(true)}
              className="group relative overflow-hidden p-6 bg-white rounded-[2.5rem] border border-zinc-200 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
                    <Award size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-bold text-zinc-900">Credentials & ID</p>
                    <p className="text-xs text-zinc-500 font-medium">Manage your certifications</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>
            </button>
          </div>

          {/* Settings List */}
          <div className="mt-12 mb-12">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Preferences</h2>
              <div className="h-px flex-1 bg-zinc-100 ml-4" />
            </div>
            
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden shadow-sm">
              <div className="p-5 flex items-center justify-between border-b border-zinc-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                    <Bell size={18} />
                  </div>
                  <span className="text-sm font-bold text-zinc-700">Notifications</span>
                </div>
                <button 
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-harbour-500' : 'bg-zinc-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              {[
                { icon: FileText, label: 'Rules & Information', color: 'text-zinc-400', bg: 'bg-zinc-50' },
              ].map((item, i) => (
                <button 
                  key={item.label} 
                  className={`w-full p-5 flex items-center justify-between hover:bg-zinc-50 transition-colors ${i !== 0 ? 'border-b border-zinc-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
                      <item.icon size={18} />
                    </div>
                    <span className="text-sm font-bold text-zinc-700">{item.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-zinc-300" />
                </button>
              ))}
            </div>

            <button 
              onClick={handleLogout}
              className="w-full mt-6 p-6 flex items-center justify-center gap-3 bg-red-50 text-red-600 rounded-[2rem] font-bold text-sm transition-all"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </div>

        {/* Edit Profile Screen */}
        <AnimatePresence>
          {isEditingProfile && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              className="absolute inset-0 z-[200] bg-white flex flex-col"
            >
              <header className="px-6 pt-16 pb-6 flex items-center justify-between">
                <button onClick={() => setIsEditingProfile(false)} className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center transition-transform">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-serif-sturdy">Edit Profile</h2>
                <div className="w-12" />
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {[
                  { label: 'Full Name', value: editForm.name, key: 'name', type: 'text' },
                  { label: 'Email Address', value: editForm.email, key: 'email', type: 'email' },
                  { label: 'Phone Number', value: editForm.phone, key: 'phone', type: 'tel' },
                  { label: 'Date of Birth', value: editForm.birthday || '', key: 'birthday', type: 'date' },
                  { label: 'Location', value: editForm.location, key: 'location', type: 'text' },
                  { label: 'About / Bio', value: editForm.about, key: 'about', type: 'textarea' },
                  { label: 'Price Per Lesson (RM)', value: editForm.pricePerLesson.toString(), key: 'pricePerLesson', type: 'number' },
                  { label: 'Specialisation (comma separated)', value: editForm.specialisation.join(', '), key: 'specialisation', type: 'text' },
                  { label: 'Languages (comma separated)', value: editForm.languages.join(', '), key: 'languages', type: 'text' },
                  { label: 'Intro Video URL', value: editForm.introVideoUrl || '', key: 'introVideoUrl', type: 'url' },
                ].map((field) => (
                  <div key={field.key} className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea 
                        value={field.value}
                        onChange={(e) => setEditForm({...editForm, [field.key]: e.target.value})}
                        onFocus={(e) => e.stopPropagation()}
                        className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-[1.5rem] text-sm font-medium focus:outline-none focus:ring-4 ring-zinc-900/5 focus:bg-white transition-all min-h-[120px]"
                        placeholder={`Enter your ${field.label.toLowerCase()}...`}
                      />
                    ) : (
                      <input 
                        type={field.type} 
                        value={field.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditForm({...editForm, [field.key]: val});
                        }}
                        onFocus={(e) => e.stopPropagation()}
                        className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-[1.5rem] text-sm font-medium focus:outline-none focus:ring-4 ring-zinc-900/5 focus:bg-white transition-all"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="p-8 bg-white border-t border-zinc-50">
                <button 
                  onClick={() => {
                    // Process arrays and numbers before saving
                    const finalProfile = {
                      ...editForm,
                      pricePerLesson: parseFloat(editForm.pricePerLesson.toString()) || 0,
                      specialisation: typeof editForm.specialisation === 'string' 
                        ? (editForm.specialisation as string).split(',').map(s => s.trim()).filter(s => s.length > 0)
                        : editForm.specialisation,
                      languages: typeof editForm.languages === 'string'
                        ? (editForm.languages as string).split(',').map(s => s.trim()).filter(s => s.length > 0)
                        : editForm.languages
                    };
                    setMentorProfile(finalProfile);
                    saveMentorProfile(finalProfile);
                    setIsEditingProfile(false);
                  }}
                  className="w-full py-5 bg-zinc-900 text-white text-sm font-bold rounded-full shadow-2xl transition-transform"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Setup & Details Screen */}
        <AnimatePresence>
          {showSetupDetails && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              className="absolute inset-0 z-[200] bg-zinc-50 flex flex-col"
            >
              <header className="px-6 pt-16 pb-6 bg-zinc-900 flex items-center justify-between shadow-xl">
                <button onClick={() => setShowSetupDetails(false)} className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center transition-transform hover:bg-white/20">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-serif-sturdy text-white">Setup & Details</h2>
                <div className="w-12" />
              </header>

              <div className="flex-1 overflow-y-auto p-6 bg-zinc-50">
                <div className="grid grid-cols-1 gap-4">
                  {setupItems.map((item) => (
                    <button 
                      key={item.id} 
                      onClick={() => setActiveSetupItem(item.id)}
                      className="w-full p-6 bg-white rounded-[2.5rem] border border-zinc-200 flex items-center justify-between group transition-all shadow-md hover:shadow-lg hover:border-harbour-300"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 ${item.status === 'success' ? 'bg-walnut-100 text-walnut-700' : 'bg-amber-100 text-amber-700'} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                          <item.icon size={26} />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold text-zinc-900">{item.label}</p>
                          <p className="text-xs text-zinc-500 font-medium">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {item.status === 'success' ? (
                          <div className="w-9 h-9 bg-walnut-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-walnut-500/20">
                            <CheckCircle2 size={18} />
                          </div>
                        ) : (
                          <div className="w-9 h-9 bg-amber-500 text-white rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-amber-500/20">
                            <AlertCircle size={18} />
                          </div>
                        )}
                        <ChevronRight size={20} className="text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Completion Guide Overlay */}
        <AnimatePresence>
          {showCompletionGuide && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              className="absolute inset-0 z-[300] bg-atmospheric-dark flex flex-col"
            >
              <header className="px-6 pt-16 pb-6 flex items-center justify-between border-b border-white/5">
                <button onClick={() => setShowCompletionGuide(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-serif-sturdy text-white">Profile Completion</h2>
                <div className="w-12" />
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Progress Circle Section */}
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-white/5"
                      />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={440}
                        initial={{ strokeDashoffset: 440 }}
                        animate={{ strokeDashoffset: 440 - (440 * profileProgress) / 100 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="text-emerald-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-serif-sturdy text-white">{profileProgress}%</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Complete</span>
                    </div>
                  </div>
                </div>

                {/* Checklist Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Required Fields</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'photo', label: 'Photo', weight: 15, status: mentorProfile.photo ? 'success' : 'missing', setupId: 'photo' },
                      { id: 'bio', label: 'About & Bio', weight: 15, status: (mentorProfile.about && mentorProfile.tagline) ? 'success' : 'missing', setupId: 'bio' },
                      { id: 'skills', label: 'Specialisation', weight: 20, status: mentorProfile.specialisation?.length > 0 ? 'success' : 'missing', setupId: 'skills' },
                      { id: 'pricing', label: 'Price Per Lesson', weight: 15, status: mentorProfile.pricePerLesson > 0 ? 'success' : 'missing', setupId: 'pricing' },
                      { id: 'location', label: 'Location', weight: 10, status: (mentorProfile.location && mentorProfile.address) ? 'success' : 'missing', setupId: 'location' },
                      { id: 'languages', label: 'Languages', weight: 10, status: mentorProfile.languages?.length > 0 ? 'success' : 'missing', setupId: 'languages' },
                      { id: 'video', label: 'Intro Video', weight: 15, status: mentorProfile.introVideoUrl ? 'success' : 'missing', setupId: 'video' },
                    ].map((field) => (
                      <div 
                        key={field.id}
                        className="p-5 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${field.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {field.status === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{field.label}</p>
                            <p className="text-[10px] text-white/40 font-medium tracking-widest uppercase">Weight: {field.weight}%</p>
                          </div>
                        </div>
                        {field.status === 'missing' && (
                          <button 
                            onClick={() => {
                              if (field.id === 'photo') {
                                document.getElementById('photo-upload')?.click();
                                setShowCompletionGuide(false);
                              } else {
                                setActiveSetupItem(field.setupId);
                                setShowCompletionGuide(false);
                              }
                            }}
                            className="text-[10px] font-bold text-harbour-400 uppercase tracking-widest hover:text-harbour-300 transition-colors flex items-center gap-1"
                          >
                            Complete Now <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Motivational Message */}
                <div className="p-6 bg-harbour-500/10 border border-harbour-500/20 rounded-[2rem] text-center">
                  <p className="text-sm font-medium text-harbour-200">
                    {profileProgress === 100 ? (
                      "🎉 Your profile is complete! You are now visible to students."
                    ) : profileProgress >= 75 ? (
                      "Almost there! Complete the remaining items to boost your visibility."
                    ) : (
                      "A complete profile helps you attract 5x more students. Let's finish it!"
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Setup Item Overlays */}
        <AnimatePresence>
          {activeSetupItem && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              className="absolute inset-0 z-[300] bg-atmospheric-dark text-white flex flex-col"
            >
              <header className="px-6 pt-16 pb-6 flex items-center justify-between border-b border-white/5">
                <button onClick={() => setActiveSetupItem(null)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center transition-transform">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-serif-sturdy">
                  {setupItems.find(i => i.id === activeSetupItem)?.label}
                </h2>
                <div className="w-12" />
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-32">
                {activeSetupItem === 'credentials' && (
                  <div className="space-y-8">
                    <div className="p-8 bg-white/10 border border-white/20 rounded-[2.5rem] space-y-6 shadow-2xl">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-harbour-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-harbour-500/20">
                          <Shield size={28} />
                        </div>
                        <div>
                          <p className="text-base font-bold text-white">Identity Verification</p>
                          <p className="text-xs text-white/50">Upload your MyKad or Passport</p>
                        </div>
                      </div>
                      
                      {mentorProfile.idDocument ? (
                        <div className="p-5 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center gap-4">
                          <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                            <CheckCircle2 size={18} />
                          </div>
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Verified Successfully</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setIdUploadStatus('uploading');
                            setTimeout(() => {
                              setMentorProfile({ ...mentorProfile, idDocument: 'verified_id_placeholder' });
                              saveMentorProfile({ idDocument: 'verified_id_placeholder' });
                              setIdUploadStatus('success');
                            }, 2000);
                          }}
                          disabled={idUploadStatus === 'uploading'}
                          className="w-full py-5 bg-white/20 border border-white/20 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/30 transition-all disabled:opacity-50 shadow-lg"
                        >
                          {idUploadStatus === 'uploading' ? 'Uploading...' : 'Upload MyKad / Passport'}
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between px-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Certifications</h3>
                        <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white/60">{mentorProfile.certifications?.length || 0} Added</span>
                      </div>
                      
                      <div className="space-y-4">
                        {(mentorProfile.certifications || []).map((cert: any, i: number) => (
                          <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between group hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/60">
                                <Award size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{cert.title}</p>
                                <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{cert.issuer} • {cert.year}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                const newCerts = mentorProfile.certifications.filter((_: any, idx: number) => idx !== i);
                                setMentorProfile({ ...mentorProfile, certifications: newCerts });
                                saveMentorProfile({ certifications: newCerts });
                              }}
                              className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}

                        {isAddingCert ? (
                          <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
                            <div className="space-y-3">
                              <input 
                                type="text" 
                                placeholder="Certification Title"
                                value={newCert.title}
                                onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 ring-harbour-500/20"
                              />
                              <input 
                                type="text" 
                                placeholder="Issuing Institution"
                                value={newCert.issuer}
                                onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 ring-harbour-500/20"
                              />
                              <input 
                                type="text" 
                                placeholder="Year"
                                value={newCert.year}
                                onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 ring-harbour-500/20"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setIsAddingCert(false)}
                                className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-white/40"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => {
                                  if (!newCert.title) return;
                                  const newCerts = [...(mentorProfile.certifications || []), newCert];
                                  setMentorProfile({ ...mentorProfile, certifications: newCerts });
                                  saveMentorProfile({ certifications: newCerts });
                                  setNewCert({ title: '', issuer: '', year: '' });
                                  setIsAddingCert(false);
                                }}
                                className="flex-[2] py-3 bg-harbour-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setIsAddingCert(true)}
                            className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:bg-white/5 transition-colors"
                          >
                            <Plus size={16} /> Add Certification
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {activeSetupItem === 'video' && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">Intro Video URL</label>
                      <div className="relative">
                        <input 
                          type="url" 
                          value={setupForm.introVideoUrl || ''}
                          onChange={(e) => setSetupForm({...setupForm, introVideoUrl: e.target.value})}
                          onFocus={(e) => e.stopPropagation()}
                          className="w-full p-6 bg-white/10 border border-white/20 rounded-[2rem] text-sm font-bold text-white focus:outline-none focus:ring-4 ring-harbour-500/20 focus:bg-white/20 transition-all placeholder:text-white/20"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20">
                          <Video size={20} />
                        </div>
                      </div>
                      <p className="text-[10px] text-white/30 ml-2">Paste a YouTube or Vimeo link to introduce yourself.</p>
                    </div>
                    {setupForm.introVideoUrl && (
                      <div className="aspect-video w-full bg-black rounded-[2.5rem] overflow-hidden border border-white/10 flex flex-col items-center justify-center relative shadow-2xl">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white/40">
                          <Play size={32} />
                        </div>
                        <p className="text-[10px] text-white/40 mt-4 font-bold uppercase tracking-widest">Video Preview Placeholder</p>
                      </div>
                    )}
                  </div>
                )}

                {activeSetupItem === 'bio' && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">Professional Tagline</label>
                      <input 
                        type="text" 
                        value={setupForm.tagline || ''}
                        onChange={(e) => setSetupForm({...setupForm, tagline: e.target.value})}
                        onFocus={(e) => e.stopPropagation()}
                        className="w-full p-6 bg-white/10 border border-white/20 rounded-[2rem] text-sm font-bold text-white focus:outline-none focus:ring-4 ring-harbour-500/20 focus:bg-white/20 transition-all placeholder:text-white/20"
                        placeholder="e.g. Master of Traditional Sape Music"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">About & Bio</label>
                      <textarea 
                        value={setupForm.about || ''}
                        onChange={(e) => setSetupForm({...setupForm, about: e.target.value})}
                        onFocus={(e) => e.stopPropagation()}
                        className="w-full p-6 bg-white/10 border border-white/20 rounded-[2rem] text-sm font-bold text-white focus:outline-none focus:ring-4 ring-harbour-500/20 focus:bg-white/20 transition-all placeholder:text-white/20 min-h-[200px]"
                        placeholder="Tell students about your journey, experience and passion..."
                      />
                    </div>
                  </div>
                )}

                {activeSetupItem === 'skills' && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">Specialisation (comma separated)</label>
                    <input 
                      type="text" 
                      value={Array.isArray(setupForm.specialisation) ? setupForm.specialisation.join(', ') : setupForm.specialisation}
                      onChange={(e) => setSetupForm({...setupForm, specialisation: e.target.value})}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-full p-6 bg-white/10 border border-white/20 rounded-[2rem] text-sm font-bold text-white focus:outline-none focus:ring-4 ring-harbour-500/20 focus:bg-white/20 transition-all placeholder:text-white/20"
                      placeholder="e.g. Sape, Gambus, Traditional Theory"
                    />
                  </div>
                )}

                {activeSetupItem === 'pricing' && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">Price Per Lesson (RM)</label>
                      <div className="relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-bold text-white/40">RM</div>
                        <input 
                          type="number" 
                          value={setupForm.pricePerLesson || ''}
                          onChange={(e) => setSetupForm({...setupForm, pricePerLesson: e.target.value})}
                          onFocus={(e) => e.stopPropagation()}
                          className="w-full p-6 pl-16 bg-white/10 border border-white/20 rounded-[2rem] text-sm font-bold text-white focus:outline-none focus:ring-4 ring-harbour-500/20 focus:bg-white/20 transition-all placeholder:text-white/20"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Package Preview</label>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { name: 'Free Trial', price: 0, desc: '30 mins · Free' },
                          { name: 'Single Session', price: setupForm.pricePerLesson || 0, desc: '60 mins' },
                          { name: '8 Lessons', price: Math.round((setupForm.pricePerLesson || 0) * 8 * 0.90), desc: '10% Discount · 4 months validity', badge: '10% OFF' },
                          { name: '12 Lessons', price: Math.round((setupForm.pricePerLesson || 0) * 12 * 0.85), desc: '15% Discount · 6 months validity', badge: '15% OFF' },
                          { name: 'Monthly', price: Math.round((setupForm.pricePerLesson || 0) * 4 * 0.88), desc: '4 lessons · auto renews', badge: 'BEST VALUE' }
                        ].map((pkg, i) => (
                          <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-white">{pkg.name}</p>
                                {pkg.badge && (
                                  <span className="px-2 py-0.5 bg-harbour-500/10 text-harbour-500 text-[8px] font-bold rounded-full uppercase tracking-wider">
                                    {pkg.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-white/40">{pkg.desc}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-white">RM {pkg.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSetupItem === 'availability' && (
                  <div className="space-y-8">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">Weekly Availability</label>
                    <div className="grid grid-cols-7 gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <div key={day} className="space-y-4">
                          <p className="text-[10px] font-bold text-center text-white/60 uppercase tracking-widest">{day}</p>
                          <div className="flex flex-col gap-2">
                            {['morning', 'afternoon', 'evening'].map((slot) => {
                              const isSelected = setupForm.availability?.[day]?.includes(slot);
                              return (
                                <button
                                  key={slot}
                                  onClick={() => {
                                    const currentDaySlots = setupForm.availability?.[day] || [];
                                    const newDaySlots = isSelected 
                                      ? currentDaySlots.filter((s: string) => s !== slot)
                                      : [...currentDaySlots, slot];
                                    setSetupForm({
                                      ...setupForm,
                                      availability: {
                                        ...setupForm.availability,
                                        [day]: newDaySlots
                                      }
                                    });
                                  }}
                                  className={`h-14 rounded-2xl flex items-center justify-center transition-all border ${
                                    isSelected 
                                      ? 'bg-harbour-500 border-harbour-400 text-white shadow-lg shadow-harbour-500/20' 
                                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                  }`}
                                >
                                  <div className="rotate-90 text-[8px] font-bold uppercase tracking-tighter">
                                    {slot === 'morning' ? 'MOR' : slot === 'afternoon' ? 'AFT' : 'EVE'}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 shadow-inner">
                      <p className="text-[10px] text-white/40 leading-relaxed font-medium text-center">
                        Morning: 9am-12pm • Afternoon: 2pm-6pm • Evening: 7pm-10pm
                      </p>
                    </div>
                  </div>
                )}

                {activeSetupItem === 'path' && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">Teaching Methodology</label>
                    <textarea 
                      value={setupForm.teachingMethodology || ''}
                      onChange={(e) => setSetupForm({...setupForm, teachingMethodology: e.target.value})}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-full p-6 bg-white/10 border border-white/20 rounded-[2rem] text-sm font-bold text-white focus:outline-none focus:ring-4 ring-harbour-500/20 focus:bg-white/20 transition-all placeholder:text-white/20 min-h-[300px]"
                      placeholder="Describe your unique approach to teaching traditional music..."
                    />
                  </div>
                )}

                {activeSetupItem === 'location' && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">City / Area</label>
                      <input 
                        type="text" 
                        value={setupForm.location || ''}
                        onChange={(e) => setSetupForm({...setupForm, location: e.target.value})}
                        onFocus={(e) => e.stopPropagation()}
                        className="w-full p-6 bg-white/10 border border-white/20 rounded-[2rem] text-sm font-bold text-white focus:outline-none focus:ring-4 ring-harbour-500/20 focus:bg-white/20 transition-all placeholder:text-white/20"
                        placeholder="e.g. Kuala Lumpur"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">Full Address</label>
                      <input 
                        type="text" 
                        value={setupForm.address || ''}
                        onChange={(e) => setSetupForm({...setupForm, address: e.target.value})}
                        onFocus={(e) => e.stopPropagation()}
                        className="w-full p-6 bg-white/10 border border-white/20 rounded-[2rem] text-sm font-bold text-white focus:outline-none focus:ring-4 ring-harbour-500/20 focus:bg-white/20 transition-all placeholder:text-white/20"
                        placeholder="Enter your studio or home address..."
                      />
                    </div>
                  </div>
                )}

                {activeSetupItem === 'languages' && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">Languages (comma separated)</label>
                    <input 
                      type="text" 
                      value={Array.isArray(setupForm.languages) ? setupForm.languages.join(', ') : setupForm.languages}
                      onChange={(e) => setSetupForm({...setupForm, languages: e.target.value})}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-full p-6 bg-white/10 border border-white/20 rounded-[2rem] text-sm font-bold text-white focus:outline-none focus:ring-4 ring-harbour-500/20 focus:bg-white/20 transition-all placeholder:text-white/20"
                      placeholder="e.g. English, Malay, Mandarin"
                    />
                  </div>
                )}

                {activeSetupItem === 'gallery' && (
                  <div className="space-y-8">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">Studio Gallery (4 Images)</label>
                    <div className="grid grid-cols-1 gap-6">
                      {[0, 1, 2, 3].map((idx) => (
                        <div key={idx} className="space-y-3">
                          <label className="text-[10px] font-bold text-white/30 ml-2 uppercase tracking-widest">Image {idx + 1}</label>
                          <input 
                            type="url" 
                            value={setupForm.gallery?.[idx] || ''}
                            onChange={(e) => {
                              const newGallery = [...(setupForm.gallery || ['', '', '', ''])];
                              newGallery[idx] = e.target.value;
                              setSetupForm({...setupForm, gallery: newGallery});
                            }}
                            onFocus={(e) => e.stopPropagation()}
                            className="w-full p-5 bg-white/10 border border-white/20 rounded-2xl text-xs font-bold text-white focus:outline-none focus:bg-white/20 transition-all placeholder:text-white/20"
                            placeholder={`Paste Image URL ${idx + 1}...`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 bg-atmospheric-dark border-t border-white/5">
                <button 
                  onClick={() => {
                    let finalProfile = { ...setupForm };
                    
                    // Specific parsing for certain fields
                    if (activeSetupItem === 'skills') {
                      finalProfile.specialisation = typeof setupForm.specialisation === 'string'
                        ? setupForm.specialisation.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
                        : setupForm.specialisation;
                    }

                    if (activeSetupItem === 'languages') {
                      finalProfile.languages = typeof setupForm.languages === 'string'
                        ? setupForm.languages.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
                        : setupForm.languages;
                    }
                    
                    if (activeSetupItem === 'pricing') {
                      const price = parseFloat(setupForm.pricePerLesson.toString()) || 0;
                      finalProfile.pricePerLesson = price;
                      finalProfile.packages = [
                        { id: 'p0', name: 'Free Trial', lessons: 0, price: 0, description: '30 mins · Free' },
                        { id: 'p1', name: 'Single Session', lessons: 1, price: price, description: '60 mins' },
                        { id: 'p2', name: '8 Lessons', lessons: 8, price: Math.round(price * 8 * 0.90), validityMonths: 4, description: '10% Discount' },
                        { id: 'p3', name: '12 Lessons', lessons: 12, price: Math.round(price * 12 * 0.85), validityMonths: 6, description: '15% Discount' },
                        { id: 'p4', name: 'Monthly', lessons: 4, price: Math.round(price * 4 * 0.88), description: '4 lessons • auto renews' }
                      ];
                    }

                    setMentorProfile(finalProfile);
                    saveMentorProfile(finalProfile);
                    setActiveSetupItem(null);
                  }}
                  className="w-full py-5 bg-harbour-500 text-white text-sm font-bold rounded-full shadow-2xl shadow-harbour-500/20 active:scale-95 transition-all"
                >
                  Save {setupItems.find(i => i.id === activeSetupItem)?.label}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const LogSessionView = memo(({ 
    selectedStudent, 
    selectedLesson, 
    setView, 
    currentUser,
    db,
    userProfile,
    triggerNotification
  }: any) => {
    const [showAIGenerateSheet, setShowAIGenerateSheet] = useState(false);
    const [aiBrainDump, setAiBrainDump] = useState('');
    const [localBrainDump, setLocalBrainDump] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [sessionSaveSuccess, setSessionSaveSuccess] = useState(false);
    const [sessionRating, setSessionRating] = useState(0);
    const [studentMood, setStudentMood] = useState<'Engaged' | 'Distracted' | 'Tired' | null>(null);
    const [sessionCovered, setSessionCovered] = useState('');
    const [localCovered, setLocalCovered] = useState('');
    const [sessionFocus, setSessionFocus] = useState('');
    const [localFocus, setLocalFocus] = useState('');
    const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);

    if (!selectedStudent || !selectedLesson) return null;

    const handleAIGenerate = async () => {
      if (!localBrainDump) return;
      setIsGenerating(true);
      
      try {
        const prompt = `You are a music mentor assistant. A mentor has provided a "brain dump" of a lesson with a student. 
        Student Name: ${selectedStudent.name}
        Instrument: ${selectedStudent.instrument}
        Lesson Number: ${selectedLesson.lessonNumber}
        Brain Dump: "${localBrainDump}"
        
        Please structure this into two parts:
        1. "Covered": A professional summary of what was taught and achieved.
        2. "Focus": Specific practice instructions for the student for the next session.
        
        Return the response in JSON format with "covered" and "focus" keys.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        const result = JSON.parse(response.text || '{}');
        
        const covered = result.covered || "Focused on " + selectedStudent.instrument + " techniques discussed today.";
        const focus = result.focus || "Continue practicing the exercises from today's lesson.";
        
        setSessionCovered(covered);
        setLocalCovered(covered);
        setSessionFocus(focus);
        setLocalFocus(focus);
        
        if (aiBrainDump.length > 50 && selectedStudent.learningPath && selectedStudent.learningPath.length > 0) {
          setSelectedMilestones([selectedStudent.learningPath[0].id]);
        }
      } catch (error) {
        console.error("AI Generation Error:", error);
        // Fallback to simple logic if AI fails
        const sentences = aiBrainDump.split('.').filter(s => s.trim().length > 0);
        const coveredText = sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.';
        const focusText = sentences.slice(Math.ceil(sentences.length / 2)).join('. ') + '.';
        setSessionCovered(coveredText || "Focused on " + selectedStudent.instrument + " techniques.");
        setLocalCovered(coveredText || "Focused on " + selectedStudent.instrument + " techniques.");
        setSessionFocus(focusText || "Continue practicing.");
        setLocalFocus(focusText || "Continue practicing.");
      } finally {
        setIsGenerating(false);
        setShowAIGenerateSheet(false);
        setAiBrainDump('');
        setLocalBrainDump('');
      }
    };

    const handleSave = async () => {
      if (!selectedStudent || !selectedLesson || !currentUser) return;

      try {
        const logData = {
          studentId: selectedStudent.id,
          mentorId: currentUser.uid,
          instrument: selectedLesson.instrument,
          lessonNumber: selectedLesson.lessonNumber,
          date: new Date().toISOString().split('T')[0],
          covered: sessionCovered,
          focus: sessionFocus,
          milestones: selectedMilestones,
          materials: [], // TODO: handle materials
          rating: sessionRating,
          mood: studentMood,
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'sessionLogs'), logData);

        // Bug 4: Calculate walletCredit and isPartOfPackage
        const isPartOfPackage = selectedLesson.type === 'Package';
        const walletCredit = isPartOfPackage 
          ? (selectedLesson.price / (selectedLesson.totalLessons || 1)) 
          : selectedLesson.price;

        // Update lesson status to completed
        await updateDoc(doc(db, 'lessons', selectedLesson.id), {
          status: 'completed',
          studentName: selectedStudent.name,
          price: selectedLesson.price,
          completedAt: serverTimestamp(),
          walletCredit,
          isPartOfPackage
        });

        // Trigger notifications
        await triggerNotification(
          selectedStudent.id,
          'session_logged', 
          'Session Logged', 
          `${userProfile?.name || 'Mentor'} has added notes from your Lesson ${selectedLesson.lessonNumber}`
        );

        if (selectedMilestones.length > 0) {
          await triggerNotification(
            selectedStudent.id,
            'milestone_completed', 
            'Milestone Completed', 
            `You've reached a new milestone in your ${selectedStudent.instrument} journey!`
          );
        }

        setSessionSaveSuccess(true);
        setTimeout(() => {
          setSessionSaveSuccess(false);
          setView('home');
        }, 2000);

      } catch (error) {
        console.error("Error saving session log:", error);
      }
    };

    return (
      <div className="bg-white text-zinc-900 min-h-full flex flex-col relative">
        <AnimatePresence>
          {sessionSaveSuccess && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center"
            >
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-24 h-24 bg-walnut-50 text-walnut-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner"
              >
                <CheckCircle2 size={48} />
              </motion.div>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-serif-sturdy text-zinc-900 mb-4"
              >
                Session Logged!
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-zinc-500 max-w-[240px] leading-relaxed"
              >
                Great job! Your student has been notified and their journey has been updated.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-5 pt-16 pb-32 flex-1 overflow-y-auto scrollbar-hide">
          <button onClick={() => setView('home')} className="flex items-center gap-1 text-zinc-400 mb-6 text-[10px] uppercase tracking-widest font-bold">
            <ChevronLeft size={14} /> Back
          </button>
          
          <header className="mb-8">
            <h1 className="text-xl font-serif-sturdy text-zinc-900 leading-tight">
              Log Session — {selectedStudent.name} · Lesson #{selectedLesson.lessonNumber}
            </h1>
          </header>

          <div className="space-y-8">
            {/* Session Rating */}
            <div className="space-y-3">
              <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">How was this session?</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setSessionRating(star)}
                    className={`transition-colors ${sessionRating >= star ? 'text-amber-400' : 'text-zinc-200'}`}
                  >
                    <Star size={24} fill={sessionRating >= star ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Student Mood */}
            <div className="space-y-3">
              <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Student Mood</label>
              <div className="flex gap-2">
                {(['Engaged', 'Distracted', 'Tired'] as const).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setStudentMood(mood)}
                    className={`flex-1 py-2.5 rounded-full text-[10px] font-bold transition-all border ${
                      studentMood === mood 
                        ? 'bg-harbour-600 border-harbour-600 text-white' 
                        : 'bg-zinc-900 border-zinc-900 text-zinc-400'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Generate Button */}
            <button 
              onClick={() => setShowAIGenerateSheet(true)}
              className="w-full py-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-900 shadow-sm"
            >
              <TrendingUp size={16} className="text-harbour-600" /> AI Generate Log
            </button>

            {/* Covered Textarea */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">What did you cover?</label>
              <textarea 
                value={localCovered}
                onChange={(e) => setLocalCovered(e.target.value)}
                onBlur={() => setSessionCovered(localCovered)}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-xs min-h-[120px] focus:outline-none text-zinc-900 leading-relaxed"
                placeholder="Topics taught, techniques explored..."
              />
            </div>

            {/* Next Focus Textarea */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Practice focus for next session</label>
              <textarea 
                value={localFocus}
                onChange={(e) => setLocalFocus(e.target.value)}
                onBlur={() => setSessionFocus(localFocus)}
                className="w-full bg-amber-50/30 border border-amber-100/50 rounded-2xl p-4 text-xs min-h-[80px] focus:outline-none text-zinc-900 italic"
                placeholder="What should the student work on?"
              />
            </div>

            {/* Milestones Checklist */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Milestones Reached</label>
                <button className="text-[8px] font-bold text-harbour-600 flex items-center gap-1">
                  <Plus size={10} /> Add New
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(selectedStudent.learningPath || []).map((m: any) => (
                  <button 
                    key={m.id}
                    onClick={() => {
                      setSelectedMilestones((prev: string[]) => 
                        prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                      );
                    }}
                    className={`px-4 py-2.5 rounded-2xl text-[10px] font-bold border transition-all flex items-center gap-2.5 ${
                      selectedMilestones.includes(m.id)
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-900/10'
                        : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      selectedMilestones.includes(m.id) ? 'bg-white border-white text-zinc-900' : 'border-zinc-200'
                    }`}>
                      {selectedMilestones.includes(m.id) && <Check size={10} strokeWidth={3} />}
                    </div>
                    {m.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Attach Materials */}
            <div className="space-y-3">
              <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Learning Materials</label>
              <button className="w-full py-4 border-2 border-dashed border-zinc-100 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 transition-colors">
                <Paperclip size={16} /> Attach PDF, Sheet or Guide
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Save Button */}
        <div className="p-5 bg-white/80 backdrop-blur-md border-t border-zinc-100">
          <button 
            onClick={handleSave}
            className="w-full bg-harbour-600 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-harbour-600/20"
          >
            Save and Log Session
          </button>
        </div>

        {/* AI Generate Bottom Sheet */}
        <BottomSheet 
          isOpen={showAIGenerateSheet} 
          onClose={() => setShowAIGenerateSheet(false)}
          dark={false}
        >
          <div className="px-6 pb-10 space-y-6">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Type a quick brain dump of what happened in the lesson. AI will structure it into a beautiful log for your student.
            </p>
            <textarea 
              value={localBrainDump}
              onChange={(e) => setLocalBrainDump(e.target.value)}
              onBlur={() => setAiBrainDump(localBrainDump)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-xs min-h-[120px] focus:outline-none text-zinc-900"
              placeholder="e.g. Sarah did great today. We finished the D major scale and started the first page of Zapin Melayu. She needs to work on her thumb position."
            />
            <button 
              onClick={handleAIGenerate}
              disabled={isGenerating || !aiBrainDump}
              className={`w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                isGenerating || !aiBrainDump ? 'bg-zinc-100 text-zinc-400' : 'bg-harbour-600 text-white shadow-lg'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp size={16} /> Generate Log
                </>
              )}
            </button>
          </div>
        </BottomSheet>
      </div>
    );
  });

  const StudentDetailView = () => {
    if (!selectedStudent) return null;

    const studentLogs = [...realSessionLogs]
      .filter(log => log.studentId === selectedStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const studentMaterials = MOCK_MATERIALS.filter(mat => mat.studentId === selectedStudent.id);

    const lastLesson = studentLogs[0];
    const lessonsDone = studentLogs.length;
    const totalLessons = 8; // Assuming a standard 8-lesson package for now
    const progressPercent = Math.min(Math.round((lessonsDone / totalLessons) * 100), 100);

    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [localNotes, setLocalNotes] = useState(selectedStudent.notes || "Sarah responds really well to visual metaphors. She's struggling with the bridge section of 'Zapin Melayu' but her finger strength has improved significantly. Remind her to keep her thumb relaxed during the faster passages.");

    const [localMilestoneTitle, setLocalMilestoneTitle] = useState('');
    
    const toggleMilestone = (milestoneId: string) => {
      if (!selectedStudent || !selectedStudent.learningPath) return;
      const newPath = (selectedStudent.learningPath || []).map(m => {
        if (m.id === milestoneId) {
          const nextStatus = m.status === 'completed' ? 'upcoming' : 'completed';
          return { ...m, status: nextStatus } as Milestone;
        }
        return m;
      });
      setSelectedStudent({ ...selectedStudent, learningPath: newPath });
    };

    const VisibilityBadge = ({ type }: { type: 'student' | 'mentor' }) => (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-wider ${
        type === 'student' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
      }`}>
        {type === 'student' ? <><span className="text-[9px]">👁</span> Student sees</> : <><Lock size={8} /> Mentor Only</>}
      </span>
    );

    return (
      <div className="bg-zinc-50 min-h-full flex flex-col">
        {/* Header — Dark Section */}
        <header className="bg-pine-950 text-white px-5 pt-16 pb-8 relative overflow-hidden">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-8 relative z-10">
            <button onClick={() => setView('students')} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <ChevronLeft size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">{selectedStudent.name.split(' ')[0]}'s Profile</span>
            </button>
            <button className="p-2 text-white/40 hover:text-white">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Identity Section */}
          <div className="flex flex-col items-center text-center mb-8 relative z-10">
            <div className="relative mb-4">
              <img 
                src={selectedStudent.photo || null} 
                className="w-[58px] h-[58px] rounded-xl object-cover shadow-2xl border border-white/10" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal-500 border-2 border-pine-950 rounded-full shadow-lg" />
            </div>
            <h1 className="text-[22px] font-serif text-white mb-3">{selectedStudent.name}</h1>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-widest text-white/60">{selectedStudent.package}</span>
              <span className="px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full text-[9px] font-bold uppercase tracking-widest text-teal-400">Active</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-widest text-white/60">{selectedStudent.instrument}</span>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-3 gap-4 py-6 border-y border-white/5 relative z-10">
            <div className="text-center">
              <p className="text-[8px] uppercase tracking-widest font-bold text-white/30 mb-1">Done</p>
              <p className="text-sm font-bold text-teal-400">{lessonsDone}/{totalLessons} <span className="text-[10px] text-white/20">lessons</span></p>
            </div>
            <div className="text-center border-x border-white/5">
              <p className="text-[8px] uppercase tracking-widest font-bold text-white/30 mb-1">Progress</p>
              <p className="text-sm font-bold text-white">{progressPercent}%</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] uppercase tracking-widest font-bold text-white/30 mb-1">Last</p>
              <p className="text-sm font-bold text-amber-400">
                {lastLesson ? new Date(lastLesson.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'None'}
              </p>
            </div>
          </div>

          {/* Progress Bar Area */}
          <div className="mt-6 relative z-10">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-teal-600 to-teal-400 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
              <span className="text-white/40">Stage {Math.ceil(progressPercent / 25) || 1} of 4</span>
              <span className="text-teal-400">{progressPercent >= 100 ? 'Completed' : 'On Track'}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pt-8 pb-32 space-y-10">
          {/* Section 1 — Private Notes */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Private Notes</h2>
              <VisibilityBadge type="mentor" />
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Lock size={40} className="text-amber-900" />
              </div>
              {isEditingNotes ? (
                <textarea
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  onBlur={() => {
                    // Sync to outer state if needed, but here localNotes is the source of truth for the p tag
                  }}
                  autoFocus
                  className="w-full bg-transparent text-xs text-amber-900 leading-relaxed italic font-serif-curvy mb-4 border-b border-amber-200 focus:outline-none"
                  rows={4}
                />
              ) : (
                <p className="text-xs text-amber-900 leading-relaxed italic font-serif-curvy mb-4">
                  "{localNotes}"
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600/60">Only visible to you</span>
                <button 
                  onClick={() => setIsEditingNotes(!isEditingNotes)}
                  className="text-[9px] font-bold text-amber-700 underline underline-offset-2"
                >
                  {isEditingNotes ? 'Save Notes' : 'Edit Notes'}
                </button>
              </div>
            </div>
          </section>

          {/* Section 2 — Learning Path */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Learning Path</h2>
              <VisibilityBadge type="student" />
            </div>
            
            <div className="relative space-y-4">
              {/* Vertical Line */}
              <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-zinc-200" />
              
              {(selectedStudent.learningPath || []).map((milestone, i) => {
                const isCompleted = milestone.status === 'completed';
                const isCurrent = milestone.status === 'current';
                const isUpcoming = milestone.status === 'upcoming';

                return (
                  <div key={milestone.id} className={`relative pl-10 transition-opacity duration-300 ${isUpcoming ? 'opacity-45' : 'opacity-100'}`}>
                    {/* Milestone Dot */}
                    <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-zinc-50 flex items-center justify-center z-10 transition-all ${
                      isCompleted ? 'bg-teal-500' : isCurrent ? 'bg-zinc-900' : 'bg-zinc-300'
                    }`}>
                      {isCompleted ? <Check size={12} className="text-white" strokeWidth={3} /> : isUpcoming ? <Lock size={10} className="text-white" /> : null}
                    </div>

                    <div 
                      onClick={() => toggleMilestone(milestone.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isCurrent ? 'bg-white border-zinc-900 shadow-lg shadow-zinc-900/5 ring-1 ring-zinc-900' : 'bg-white border-zinc-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Stage {i + 1}</p>
                          <h3 className={`text-xs font-bold ${isCurrent ? 'text-zinc-900' : 'text-zinc-600'}`}>{milestone.title}</h3>
                        </div>
                        {isCompleted && <span className="text-[8px] font-bold text-teal-600 uppercase tracking-widest">Completed</span>}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button 
                onClick={() => setShowAddMilestoneSheet(true)}
                className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-2xl flex items-center justify-center gap-2 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900 transition-all mt-4 ml-10"
              >
                <Plus size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Add New Stage</span>
              </button>
            </div>
          </section>

          {/* Section 3 — Session Logs */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Session Logs</h2>
              <VisibilityBadge type="student" />
            </div>

            <div className="space-y-3">
              {studentLogs.map((log, i) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div key={log.id} className="bg-white border border-zinc-100 rounded-2xl overflow-hidden transition-all duration-300">
                    <button 
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-[10px] font-bold">#{log.lessonNumber}</span>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-900">{isExpanded ? 'Lesson Summary' : `Lesson #${log.lessonNumber} Summary`}</h4>
                          <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-medium">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className={`text-zinc-300 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-5 space-y-5 border-t border-zinc-50 pt-4">
                            <div>
                              <p className="text-[8px] uppercase tracking-widest font-bold text-zinc-400 mb-2">What we covered</p>
                              <p className="text-xs text-zinc-600 leading-relaxed">{log.covered}</p>
                            </div>
                            <div className="bg-teal-50/30 border-l-4 border-teal-500 p-4 rounded-r-xl">
                              <p className="text-[8px] uppercase tracking-widest font-bold text-teal-600 mb-2">Practice Focus</p>
                              <p className="text-xs text-zinc-900 font-medium italic">"{log.focus}"</p>
                            </div>
                            {log.milestones.length > 0 && (
                              <div>
                                <p className="text-[8px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Milestones Reached</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {log.milestones.map(mId => {
                                    const m = selectedStudent.learningPath?.find(lp => lp.id === mId);
                                    return m ? (
                                      <span key={mId} className="px-2 py-1 bg-zinc-100 text-zinc-600 text-[8px] font-bold rounded-md uppercase tracking-wider">
                                        {m.title}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}
                            <div className="pt-4 border-t border-zinc-50">
                              <p className="text-[9px] text-zinc-400 italic">"Great progress today, {selectedStudent.name.split(' ')[0]}! Keep up the consistent practice." — AI Summary</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              <button 
                onClick={() => {
                  const lastLog = studentLogs.sort((a,b) => b.lessonNumber - a.lessonNumber)[0];
                  const nextLessonNumber = lastLog ? lastLog.lessonNumber + 1 : 1;
                  setSelectedLesson({
                    id: 'manual-' + Date.now(),
                    studentId: selectedStudent.id,
                    studentName: selectedStudent.name,
                    instrument: selectedStudent.instrument,
                    time: 'Manual',
                    date: new Date().toISOString(),
                    lessonNumber: nextLessonNumber,
                    type: 'Manual',
                    status: 'confirmed'
                  });
                  setView('log-session');
                }}
                className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-2xl flex items-center justify-center gap-2 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900 transition-all mt-4"
              >
                <Plus size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Add Manual Log</span>
              </button>
            </div>
          </section>

          {/* Section 4 — Materials */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Materials</h2>
              <VisibilityBadge type="student" />
            </div>

            <div className="space-y-3">
              {studentMaterials.map(mat => (
                <div key={mat.id} className="bg-white border border-zinc-100 p-4 rounded-2xl flex items-center gap-4 group hover:border-zinc-200 transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mat.type === 'PDF' || mat.type === 'Notes' ? 'bg-teal-50 text-teal-600' : 'bg-zinc-100 text-zinc-400'}`}>
                    {mat.type === 'PDF' ? <FileText size={18} /> : <BookOpen size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-zinc-900 truncate">{mat.title}</h3>
                    <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-widest mt-0.5">Lesson #{mat.lessonId?.replace('l', '') || 'General'}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-zinc-300 hover:text-zinc-900 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button className="p-2 text-zinc-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <button className="p-2 text-zinc-300 hover:text-zinc-900 transition-colors">
                    <Download size={16} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setShowAddMaterialSheet(true)}
                className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-2xl flex items-center justify-center gap-2 text-zinc-400 hover:border-teal-500 hover:text-teal-600 transition-all mt-4"
              >
                <Upload size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Upload New Material</span>
              </button>
            </div>
          </section>
        </div>

        {/* Add Milestone Bottom Sheet */}
        <BottomSheet 
          isOpen={showAddMilestoneSheet} 
          onClose={() => setShowAddMilestoneSheet(false)}
          title="Add New Stage"
          dark={false}
        >
          <div className="px-6 pb-10 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">Stage Title</label>
              <input 
                type="text" 
                value={localMilestoneTitle}
                onChange={(e) => setLocalMilestoneTitle(e.target.value)}
                onBlur={() => setNewMilestoneTitle(localMilestoneTitle)}
                placeholder="e.g. Advanced Finger Picking"
                className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-[1.5rem] text-sm font-medium focus:outline-none focus:ring-4 ring-zinc-900/5 focus:bg-white transition-all"
              />
            </div>
            <button 
              onClick={() => {
                const titleToUse = localMilestoneTitle || newMilestoneTitle;
                if (!titleToUse) return;
                const newMilestone: Milestone = {
                  id: 'm' + Date.now(),
                  title: titleToUse,
                  status: 'upcoming'
                };
                setSelectedStudent({
                  ...selectedStudent,
                  learningPath: [...(selectedStudent.learningPath || []), newMilestone]
                });
                setLocalMilestoneTitle('');
                setNewMilestoneTitle('');
                setShowAddMilestoneSheet(false);
              }}
              className="w-full py-5 bg-zinc-900 text-white text-sm font-bold rounded-full shadow-2xl transition-transform active:scale-95"
            >
              Add Stage
            </button>
          </div>
        </BottomSheet>

        {/* Add Material Bottom Sheet */}
        <BottomSheet 
          isOpen={showAddMaterialSheet} 
          onClose={() => setShowAddMaterialSheet(false)}
          title="Upload Material"
          dark={false}
        >
          <div className="px-6 pb-10 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">Material Title</label>
              <input 
                type="text" 
                value={newMaterialTitle}
                onChange={(e) => setNewMaterialTitle(e.target.value)}
                placeholder="e.g. Scale Exercises PDF"
                className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-[1.5rem] text-sm font-medium focus:outline-none focus:ring-4 ring-zinc-900/5 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">Type</label>
              <div className="flex gap-2">
                {(['PDF', 'Guide', 'Notes'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewMaterialType(type)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-bold border transition-all ${
                      (newMaterialType as string) === (type as string)
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' 
                        : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={() => {
                if (!newMaterialTitle) return;
                // In a real app we'd update MOCK_MATERIALS or a stateful equivalent
                // For now we'll just close the sheet
                setNewMaterialTitle('');
                setShowAddMaterialSheet(false);
              }}
              className="w-full py-5 bg-teal-600 text-white text-sm font-bold rounded-full shadow-2xl transition-transform active:scale-95"
            >
              Upload Material
            </button>
          </div>
        </BottomSheet>

        {/* Sticky Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-xl border-t border-zinc-100 z-50 flex gap-3">
          <button 
            onClick={() => {
              const chat = MOCK_MESSAGES.find(m => m.studentId === selectedStudent.id);
              if (chat) {
                setSelectedChat({
                  id: chat.id,
                  studentId: selectedStudent.id,
                  studentName: selectedStudent.name,
                  studentPhoto: selectedStudent.photo,
                  lastMessage: chat.lastMessage,
                  time: chat.timestamp,
                  unread: 0,
                  online: true
                });
              }
              setView('messages');
            }}
            className="flex-1 py-4 border border-zinc-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-zinc-600 flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all"
          >
            <MessageSquare size={16} /> Message
          </button>
          <button 
            onClick={() => {
              const lastLog = realSessionLogs.filter(l => l.studentId === selectedStudent.id).sort((a,b) => b.lessonNumber - a.lessonNumber)[0];
              const nextLessonNumber = lastLog ? lastLog.lessonNumber + 1 : 1;
              setSelectedLesson({
                id: 'new',
                studentId: selectedStudent.id,
                studentName: selectedStudent.name,
                instrument: selectedStudent.instrument,
                time: 'N/A',
                date: new Date().toISOString(),
                lessonNumber: nextLessonNumber,
                type: 'Package',
                status: 'confirmed'
              });
              setView('log-session');
            }}
            className="flex-[1.5] bg-zinc-900 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-zinc-900/20 active:scale-95 transition-all"
          >
            <Plus size={16} /> Log Session
          </button>
        </div>
      </div>
    );
  };

  // --- Main Render ---

  const AIBuddySheet = memo(({ isOpen, onClose, isStudent, isNewUser }: { isOpen: boolean, onClose: () => void, isStudent: boolean, isNewUser: boolean }) => {
    const [aiBuddyMessages, setAiBuddyMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
    const [isAiBuddyTyping, setIsAiBuddyTyping] = useState(false);
    const [aiBuddyInput, setAiBuddyInput] = useState('');

    const handleAIBuddyAction = async (action: string) => {
      const newMessages = [...aiBuddyMessages, { role: 'user' as const, content: action }];
      setAiBuddyMessages(newMessages);
      setIsAiBuddyTyping(true);
      
      try {
        const systemInstruction = isStudent 
          ? `You are a supportive Music Companion for a student learning ${isNewUser ? 'a new instrument' : 'their instrument'}. 
             Help them with practice tips, motivation, and understanding their lessons. 
             Keep responses encouraging, concise, and professional.`
          : `You are a Teaching Assistant for a music mentor. 
             Help them draft lesson summaries, practice plans, and analyze student progress. 
             Be professional, efficient, and helpful.`;

        const chat = ai.chats.create({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction
          }
        });

        // Convert history for Gemini
        const history = aiBuddyMessages.map(m => ({
          role: m.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: m.content }]
        }));

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [...history, { role: 'user', parts: [{ text: action }] }],
          config: {
            systemInstruction
          }
        });

        const aiResponse = response.text || "I'm sorry, I couldn't process that request.";
        setAiBuddyMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      } catch (error) {
        console.error("AI Buddy Error:", error);
        setAiBuddyMessages(prev => [...prev, { role: 'assistant', content: "I'm having a bit of trouble connecting right now. Let's try again in a moment!" }]);
      } finally {
        setIsAiBuddyTyping(false);
      }
    };

    const studentPrompts = [
      "What should I practice today?",
      "Summarize my last lesson",
      "Explain my next milestone",
      "What should I review before class?",
      "Show my latest materials",
      "Motivate me for practice",
      "Help me understand this lesson",
      "Create a 15-minute practice routine"
    ];

    const mentorPrompts = [
      "Suggest a lesson summary",
      "Draft a practice plan for Sarah",
      "Analyze Marcus's progress",
      "Recommend materials for next lesson",
      "Draft an encouraging note"
    ];

    const prompts = isStudent ? studentPrompts : mentorPrompts;

    return (
      <BottomSheet 
        isOpen={isOpen} 
        onClose={onClose}
      >
        <div className="flex flex-col h-[75vh] bg-zinc-50/50">
          {/* Header Info - Executive & Minimal */}
          <div className="px-6 py-6 bg-zinc-900 border-b border-white/10 flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center text-harbour-500">
                <Bot size={28} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-lg font-serif-sturdy tracking-tight text-white">
                  {isStudent ? "Music Companion" : "Teaching Assistant"}
                </h3>
              </div>
            </div>
          </div>

          {/* Chat Area - Clean & Professional */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {aiBuddyMessages.length === 0 && (
              <div className="text-center py-12 space-y-8">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 rounded-[3rem] shadow-2xl flex items-center justify-center mx-auto bg-zinc-900 text-harbour-500 border border-white/10"
                >
                  <Bot size={40} strokeWidth={1.5} />
                </motion.div>
                <div className="space-y-3 px-8">
                  <h4 className="text-xl font-serif-sturdy text-zinc-900 tracking-tight">
                    {isStudent ? (isNewUser ? "Welcome to Your Journey!" : "Elevate Your Practice") : (isNewUser ? "Welcome, Maestro!" : "Maestro Teaching Assistant")}
                  </h4>
                  <p className="text-sm text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
                    {isStudent 
                      ? (isNewUser ? "I'm your AI Buddy. I'll help you find a mentor, pick an instrument, and start your musical journey." : "I'm your dedicated music companion, here to help you master your instrument between lessons.") 
                      : (isNewUser ? "I'm here to help you set up your profile, manage your first students, and organize your teaching materials." : "I'm your AI-powered assistant, ready to help you draft summaries, create practice plans, and track student growth.")}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-3 px-8 max-w-[320px] mx-auto">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    {isNewUser ? "Starter Tips" : "Quick Start"}
                  </p>
                  {(isStudent ? (isNewUser ? [
                    { label: "How to find a mentor?", icon: Search, prompt: "How do I find the right mentor for me?" },
                    { label: "Pick an instrument", icon: Music, prompt: "Which instrument should I start with?" },
                    { label: "First lesson tips", icon: Sparkles, prompt: "What should I expect in my first lesson?" }
                  ] : [
                    { label: "Practice Plan", icon: Target, prompt: "What should I practice today?" },
                    { label: "Lesson Recap", icon: MessageCircle, prompt: "Summarize my last lesson" },
                    { label: "Next Steps", icon: Zap, prompt: "Explain my next milestone" },
                    { label: "Ask Anything", icon: Sparkles, prompt: "" }
                  ]) : (isNewUser ? [
                    { label: "Complete my profile", icon: User, prompt: "How do I make my profile stand out?" },
                    { label: "Set availability", icon: Calendar, prompt: "How do I set my teaching hours?" },
                    { label: "Upload resources", icon: Upload, prompt: "What kind of materials should I upload first?" }
                  ] : [
                    { label: "Draft Lesson Summary", icon: MessageCircle, prompt: "Suggest a lesson summary" },
                    { label: "Create Practice Plan", icon: Target, prompt: "Draft a practice plan for Sarah" },
                    { label: "Analyze Progress", icon: Brain, prompt: "Analyze Marcus's progress" }
                  ])).map((action) => (
                    <button 
                      key={action.label}
                      onClick={() => handleAIBuddyAction(action.prompt || action.label)}
                      className="flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-2xl hover:border-harbour-500 hover:shadow-lg hover:shadow-harbour-500/5 transition-all group"
                    >
                      <div className="p-2 bg-zinc-50 rounded-xl text-zinc-400 group-hover:text-harbour-500 transition-colors">
                        <action.icon size={18} />
                      </div>
                      <span className="text-xs font-bold text-zinc-700">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {aiBuddyMessages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-3xl text-[13px] leading-relaxed shadow-sm transition-all ${
                  msg.role === 'user' 
                    ? 'bg-zinc-900 text-white rounded-tr-none' 
                    : 'bg-white border border-zinc-100 text-zinc-700 rounded-tl-none'
                }`}>
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j} className={j > 0 ? 'mt-2' : ''}>{line}</p>
                  ))}
                </div>
              </motion.div>
            ))}

            {isAiBuddyTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-zinc-100 p-4 rounded-3xl rounded-tl-none flex gap-1.5 shadow-sm">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions - Professional Tags */}
          <div className="p-4 border-t border-zinc-100 bg-white">
            <div className="flex items-center gap-2 mb-3 px-2">
              <Sparkles size={12} className="text-harbour-500" />
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Suggested for you</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {prompts.map((prompt) => (
                <button 
                  key={prompt}
                  onClick={() => handleAIBuddyAction(prompt)}
                  className="flex-shrink-0 px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-bold text-zinc-600 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area - Executive & Sleek */}
          <div className="p-5 bg-white border-t border-zinc-100">
            <div className="relative group">
              <input 
                type="text" 
                value={aiBuddyInput}
                onChange={(e) => setAiBuddyInput(e.target.value)}
                onFocus={(e) => e.stopPropagation()}
                placeholder={isStudent ? "Ask your music companion..." : "Ask your teaching assistant..."}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4.5 pl-5 pr-14 text-sm focus:outline-none focus:border-zinc-900 focus:bg-white transition-all shadow-inner text-zinc-900 placeholder-zinc-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiBuddyInput.trim()) {
                    handleAIBuddyAction(aiBuddyInput);
                    setAiBuddyInput('');
                  }
                }}
              />
              <button 
                onClick={() => {
                  if (aiBuddyInput.trim()) {
                    handleAIBuddyAction(aiBuddyInput);
                    setAiBuddyInput('');
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-zinc-900 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-xl shadow-zinc-900/20"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </BottomSheet>
    );
  });



  return (
    <div className={`h-screen font-sans transition-colors duration-500 overflow-hidden ${true ? 'bg-atmospheric-dark text-white' : 'bg-white text-zinc-900'}`}>
      <div className="w-full h-full relative overflow-hidden flex flex-col">
        {authLoading ? (
          <div className="h-full flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-harbour-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-white/30 text-xs font-mono uppercase tracking-widest">Loading...</p>
            </div>
          </div>
        ) : !isAuth ? (
          <AuthContainer />
        ) : isStudent ? (
          <StudentDashboard />
        ) : (
        <>
          {/* Action Sheet Overlay */}
          <AnimatePresence>
            {activeLessonAction && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setActiveLessonAction(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[110]"
                />
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
                  className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 z-[120] text-zinc-900"
                >
                  <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto mb-8" />
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{activeLessonAction.studentName}</h3>
                      <p className="text-xs text-zinc-500">{activeLessonAction.instrument} • {activeLessonAction.time}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        setReschedulingLesson(activeLessonAction);
                        setActiveLessonAction(null);
                        setShowRescheduleModal(true);
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Calendar size={16} className="text-zinc-400" />
                      </div>
                      <span className="text-sm font-bold">Reschedule</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setLessonToCancel(activeLessonAction);
                        setShowCancelModal(true);
                      }}
                      disabled={cancellingIds.includes(activeLessonAction.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${cancellingIds.includes(activeLessonAction.id) ? 'bg-red-50 text-red-500 cursor-not-allowed' : 'bg-zinc-50 hover:bg-zinc-100'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${cancellingIds.includes(activeLessonAction.id) ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-red-400'}`}>
                        {cancellingIds.includes(activeLessonAction.id) ? <Clock size={16} /> : <XCircle size={16} />}
                      </div>
                      <span className="text-sm font-bold">{cancellingIds.includes(activeLessonAction.id) ? 'Cancelling Lesson...' : 'Cancel Lesson'}</span>
                    </button>

                    <button 
                      onClick={() => {
                        setActiveLessonAction(null);
                        setView('messages');
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <MessageSquare size={16} className="text-zinc-400" />
                      </div>
                      <span className="text-sm font-bold">Message Student</span>
                    </button>

                    <button 
                      onClick={() => {
                        const student = MOCK_STUDENTS.find(s => s.id === activeLessonAction.studentId);
                        if (student) {
                          setSelectedStudent(student);
                          setView('student-detail');
                        }
                        setActiveLessonAction(null);
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-zinc-900 text-white rounded-2xl"
                    >
                      <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                        <ChevronRight size={16} />
                      </div>
                      <span className="text-sm font-bold">View Student Details</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Verification Popup */}
          {profileProgress === 100 && !hasSeenVerification && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
                className="bg-white text-zinc-900 p-8 rounded-[3rem] text-center shadow-2xl"
              >
                <div className="w-16 h-16 bg-walnut-100 text-walnut-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-serif-sturdy mb-3">Submitted</h2>
                <p className="text-zinc-500 text-xs leading-relaxed mb-6">
                  Verifying your account. Typically takes 3-5 days.
                </p>
                <button 
                  onClick={() => setHasSeenVerification(true)}
                  className="w-full py-4 bg-zinc-900 text-white text-xs font-bold rounded-full"
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.main
              key={view}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto scrollbar-hide pb-24"
            >
              {view === 'home' && <HomeView />}
              {view === 'full-schedule' && <FullScheduleView />}
              {view === 'students' && <StudentsView />}
              {view === 'messages' && <MessagesView />}
              {view === 'wallet' && <WalletView />}
              {view === 'profile' && <ProfileView />}
              {view === 'log-session' && (
              <LogSessionView 
                selectedStudent={selectedStudent}
                selectedLesson={selectedLesson}
                setView={setView}
                currentUser={currentUser}
                db={db}
                userProfile={userProfile}
                triggerNotification={triggerNotification}
              />
            )}
              {view === 'student-detail' && <StudentDetailView />}
            </motion.main>
          </AnimatePresence>

          {/* Mobile Nav */}
          {!['student-detail', 'log-session'].includes(view) && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%]">
            <div className="backdrop-blur-2xl border rounded-[2rem] px-2 py-1.5 flex items-center justify-between shadow-2xl transition-all duration-500 bg-zinc-900/90 border-white/10">
              {[
                { id: 'home', icon: HomeIcon, label: 'Home' },
                { id: 'students', icon: Users, label: 'Students' },
                { id: 'messages', icon: MessageSquare, label: 'Chat' },
                { id: 'wallet', icon: Wallet, label: 'Wallet' },
                { id: 'profile', icon: User, label: 'Profile' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as View)}
                  className={`relative flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-300 ${
                    view === item.id 
                      ? 'text-white' 
                      : 'text-zinc-400 opacity-50 hover:opacity-100'
                  }`}
                >
                  {view === item.id && (
                    <motion.div 
                      layoutId="activeNavMentor"
                      className="absolute inset-0 rounded-2xl z-0 bg-white/10"
                      transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <item.icon size={18} strokeWidth={view === item.id ? 2.5 : 2} />
                    <span className="text-[7px] font-bold uppercase tracking-widest">{item.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        </>
      )}

      <BottomSheet 
        isOpen={showNotificationSheet} 
        onClose={() => setShowNotificationSheet(false)}
        title="Notifications"
      >
        <div className="px-6 pb-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Recent Activity</h3>
            <button 
              onClick={async () => {
                const unreadNotifs = notifications.filter(n => !n.read);
                // Optimistic update
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                
                for (const notif of unreadNotifs) {
                  try {
                    await updateDoc(doc(db, 'notifications', notif.id), { read: true });
                  } catch (error) {
                    console.error("Error marking notification as read:", error);
                  }
                }
              }}
              className="text-[10px] font-bold text-harbour-400 uppercase tracking-widest"
            >
              Mark all as read
            </button>
          </div>

          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 rounded-2xl border transition-all ${notif.read ? 'bg-white/5 border-white/5 opacity-60' : 'bg-white/10 border-white/10 shadow-lg shadow-harbour-500/5'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-bold ${notif.read ? 'text-white/60' : 'text-white'}`}>{notif.title}</h4>
                    <span className="text-[8px] font-mono text-white/30">{notif.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${notif.read ? 'text-white/40' : 'text-white/70'}`}>{notif.body}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell size={20} className="text-white/20" />
                </div>
                <p className="text-sm text-white/40">No new notifications</p>
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Global Bottom Sheets */}
      <BottomSheet
        isOpen={showCredentialsSheet}
        onClose={() => setShowCredentialsSheet(false)}
        title="Credentials & ID"
      >
        <div className="px-6 pb-12 space-y-8">
          {/* ID Verification Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-2">Identity Verification</h3>
            {mentorProfile.idDocument ? (
              <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Identity Verified</p>
                  <p className="text-[10px] text-zinc-500">Verified via MyKad / Passport</p>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">Verification Required</p>
                    <p className="text-[10px] text-zinc-500">Upload your ID to build trust with students</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIdUploadStatus('uploading');
                    setTimeout(() => {
                      setMentorProfile({ ...mentorProfile, idDocument: 'verified_id_placeholder' });
                      saveMentorProfile({ idDocument: 'verified_id_placeholder' });
                      setIdUploadStatus('success');
                    }, 2000);
                  }}
                  disabled={idUploadStatus === 'uploading'}
                  className="w-full py-3 bg-white border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-sm hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  {idUploadStatus === 'uploading' ? 'Uploading...' : 'Upload MyKad / Passport'}
                </button>
              </div>
            )}
          </div>

          {/* Certifications Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Certifications</h3>
              <span className="text-[10px] font-bold text-zinc-900">{mentorProfile.certifications?.length || 0} Total</span>
            </div>
            
            <div className="space-y-3">
              {(mentorProfile.certifications || []).length > 0 ? (
                mentorProfile.certifications.map((cert: any, i: number) => (
                  <div key={i} className="p-5 bg-white border border-zinc-100 rounded-2xl flex items-center justify-between group">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{cert.title}</p>
                      <p className="text-[10px] text-zinc-400">{cert.issuer} • {cert.year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-zinc-300 hover:text-harbour-600 transition-colors">
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          const newCerts = mentorProfile.certifications.filter((_: any, idx: number) => idx !== i);
                          setMentorProfile({ ...mentorProfile, certifications: newCerts });
                          saveMentorProfile({ certifications: newCerts });
                        }}
                        className="p-2 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-zinc-100 rounded-[2rem]">
                  <Award size={32} className="text-zinc-200 mx-auto mb-3" />
                  <p className="text-xs text-zinc-400">No certifications added yet</p>
                </div>
              )}

              {isAddingCert ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-zinc-50 border border-zinc-200 rounded-[2rem] space-y-4"
                >
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Certification Title"
                      value={newCert.title}
                      onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                      className="w-full p-4 bg-white border border-zinc-100 rounded-xl text-xs focus:outline-none focus:ring-2 ring-harbour-500/20"
                    />
                    <input 
                      type="text" 
                      placeholder="Issuing Institution"
                      value={newCert.issuer}
                      onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                      className="w-full p-4 bg-white border border-zinc-100 rounded-xl text-xs focus:outline-none focus:ring-2 ring-harbour-500/20"
                    />
                    <input 
                      type="text" 
                      placeholder="Year"
                      value={newCert.year}
                      onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
                      className="w-full p-4 bg-white border border-zinc-100 rounded-xl text-xs focus:outline-none focus:ring-2 ring-harbour-500/20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsAddingCert(false)}
                      className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        if (!newCert.title) return;
                        const newCerts = [...(mentorProfile.certifications || []), newCert];
                        setMentorProfile({ ...mentorProfile, certifications: newCerts });
                        saveMentorProfile({ certifications: newCerts });
                        setNewCert({ title: '', issuer: '', year: '' });
                        setIsAddingCert(false);
                      }}
                      className="flex-[2] py-3 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg"
                    >
                      Save Certification
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button 
                  onClick={() => setIsAddingCert(true)}
                  className="w-full py-4 border-2 border-dashed border-zinc-100 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 transition-colors"
                >
                  <Plus size={16} /> Add New Certification
                </button>
              )}
            </div>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet 
        isOpen={showAllLessonsSheet} 
        onClose={() => setShowAllLessonsSheet(false)}
        title={`${selectedInstrumentJourney} Schedule`}
      >
        <div className="px-6 pb-10 space-y-4">
          {studentLessons.filter(l => l.instrument === selectedInstrumentJourney).length > 0 ? (
            studentLessons
              .filter(l => l.instrument === selectedInstrumentJourney)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(lesson => (
                <button 
                  key={lesson.id} 
                  onClick={() => setSelectedLessonDetails(lesson)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lesson.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{new Date(lesson.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {lesson.time}</p>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">{lesson.instrument} • {lesson.type}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                      lesson.status === 'confirmed' ? 'bg-emerald-500 text-white' : 
                      lesson.status === 'reschedule_requested' ? 'bg-indigo-500 text-white' :
                      'bg-amber-500 text-white'
                    }`}>
                      {lesson.status.replace('_', ' ')}
                    </div>
                    <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">{lesson.mentorName}</p>
                  </div>
                </button>
              ))
          ) : (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music2 size={20} className="text-white/20" />
              </div>
              <p className="text-sm text-white/40">No lessons booked yet</p>
            </div>
          )}
        </div>
      </BottomSheet>

      <BottomSheet 
        isOpen={!!selectedLessonDetails} 
        onClose={() => setSelectedLessonDetails(null)}
        title="Session Details"
      >
        <div className="px-6 pb-10">
          {selectedLessonDetails && (
            <div className="space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <Avatar 
                    name={selectedLessonDetails.mentorName || selectedLessonDetails.studentName} 
                    photo={realMentors.find(m => m.id === selectedLessonDetails.mentorId)?.photo || realStudents.find(s => s.id === selectedLessonDetails.studentId)?.photo} 
                    size="lg" 
                    className="rounded-2xl shadow-xl" 
                  />
                  <div>
                    <h3 className="text-xl font-serif text-white">{selectedLessonDetails.mentorName || selectedLessonDetails.studentName}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{selectedLessonDetails.instrument} • {selectedLessonDetails.type}</p>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                  selectedLessonDetails.status === 'confirmed' ? 'bg-emerald-500 text-white' : 
                  selectedLessonDetails.status === 'reschedule_requested' ? 'bg-indigo-500 text-white' :
                  'bg-amber-500 text-white'
                }`}>
                  {selectedLessonDetails.status.replace('_', ' ')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-white/30 mb-1">Date</p>
                  <p className="text-xs font-bold text-white">{new Date(selectedLessonDetails.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-white/30 mb-1">Time</p>
                  <p className="text-xs font-bold text-white">{selectedLessonDetails.time}</p>
                </div>
              </div>

              <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                <p className="text-[8px] font-bold uppercase tracking-widest text-white/30 mb-2">Location</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                    <MapPin size={14} />
                  </div>
                  <p className="text-xs font-bold text-white">{selectedLessonDetails.location || 'Bangsar Studio'}</p>
                </div>
              </div>

              {selectedLessonDetails.status === 'reschedule_requested' && (
                <div className="p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={14} className="text-indigo-400" />
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Reschedule Request</p>
                  </div>
                  <p className="text-xs text-white/80 mb-4">
                    Requested for: <span className="font-bold text-white">{new Date(selectedLessonDetails.requestedDate).toLocaleDateString()} at {selectedLessonDetails.requestedTime}</span>
                  </p>
                  {selectedLessonDetails.requestedBy !== currentUser?.uid && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          handleRescheduleAction(selectedLessonDetails, 'accept');
                          setSelectedLessonDetails(null);
                        }}
                        className="flex-1 py-3 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => {
                          handleRescheduleAction(selectedLessonDetails, 'decline');
                          setSelectedLessonDetails(null);
                        }}
                        className="flex-1 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    const targetId = isStudent ? selectedLessonDetails.mentorId : selectedLessonDetails.studentId;
                    const targetName = isStudent ? selectedLessonDetails.mentorName : selectedLessonDetails.studentName;
                    setSelectedChat({
                      id: `new-${targetId}`,
                      conversationId: null,
                      name: targetName,
                      photo: null,
                      role: isStudent ? 'Mentor' : 'Student',
                      recipientId: targetId
                    });
                    setView('messages');
                    setSelectedLessonDetails(null);
                    setShowAllLessonsSheet(false);
                  }}
                  className="flex-1 py-4 bg-white text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-full"
                >
                  Message
                </button>
                {selectedLessonDetails.status !== 'completed' && selectedLessonDetails.status !== 'cancelled' && (
                  <>
                    <button 
                      onClick={() => {
                        setReschedulingLesson(selectedLessonDetails);
                        setShowRescheduleModal(true);
                        setSelectedLessonDetails(null);
                      }}
                      className="flex-1 py-4 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full"
                    >
                      Reschedule
                    </button>
                    <button 
                      onClick={() => {
                        setLessonToCancel(selectedLessonDetails);
                        setShowCancelModal(true);
                        setSelectedLessonDetails(null);
                      }}
                      className="w-12 h-12 flex items-center justify-center border border-red-500/20 text-red-500 rounded-full hover:bg-red-500/5 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      <BottomSheet 
        isOpen={showScheduleSheet} 
        onClose={() => setShowScheduleSheet(false)}
        title="March 2026"
      >
        <div className="px-6 pb-10">
          <div className="flex justify-between items-center mb-6">
            <button className="text-[10px] font-bold text-harbour-400 uppercase tracking-widest">Today</button>
            <div className="flex gap-4">
              <ChevronLeft size={20} className="text-white/20" />
              <ChevronRight size={20} className="text-white" />
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
            {dates.map((date, i) => {
              const isSelected = bookingDate === date.toDateString();
              const isAvailable = i % 3 !== 0; 
              return (
                <button 
                  key={i}
                  onClick={() => isAvailable && setBookingDate(date.toDateString())}
                  className={`flex-shrink-0 w-12 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${isSelected ? 'bg-harbour-500 text-white' : isAvailable ? 'bg-white/5 text-white/60' : 'opacity-20 grayscale'}`}
                >
                  <span className="text-[8px] uppercase font-bold">{days[date.getDay()]}</span>
                  <span className="text-sm font-bold">{date.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-8 mt-4">
            {Object.entries(timeSlots).map(([category, slots]) => (
              <div key={category}>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                  {category === 'morning' ? 'Morning Slots' : category === 'afternoon' ? 'Afternoon Slots' : 'Evening Slots'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {slots.map(slot => (
                    <div key={slot} className={`px-4 py-2 rounded-full text-[10px] font-bold border ${slot === '10:00 AM' ? 'bg-white/5 border-white/10 text-white/20 line-through' : 'bg-white text-black border-white'}`}>
                      {slot}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </BottomSheet>

      <BottomSheet 
        isOpen={showBookingSheet} 
        onClose={() => {
          setShowBookingSheet(false);
          setBookingSuccess(null);
          setBookingStep(1);
        }}
      >
        <div className="px-6 pb-10">
          {bookingSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.2, ease: 'linear' }}
              className="text-center py-10"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl ${bookingSuccess.type === 'trial' ? 'bg-harbour-500 shadow-harbour-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}>
                <CheckCircle2 size={40} className="text-white" />
              </div>
              <h3 className="text-2xl font-serif-sturdy mb-2">
                {bookingSuccess.type === 'trial' ? 'Booking Confirmed!' : 'Payment Successful!'}
              </h3>
              <p className="text-sm text-white/60 mb-8">
                {bookingSuccess.type === 'trial' 
                  ? `You have successfully booked a trial lesson with ${bookingSuccess.mentor}.`
                  : `You have successfully booked your lessons with ${bookingSuccess.mentor}.`}
              </p>
              <button 
                onClick={() => {
                  setShowBookingSheet(false);
                  setBookingSuccess(null);
                  setBookingStep(1);
                  switchStudentTab('journey');
                }}
                className="w-full py-5 bg-white text-black font-bold rounded-full"
              >
                View in My Journey
              </button>
            </motion.div>
          ) : selectedMentor && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <img src={selectedMentor.photo || null} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                <div>
                  <h3 className="text-sm font-serif-sturdy">{selectedMentor.name}</h3>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest">
                    {bookingType === 'single' ? 'Single Session • 60 Mins • RM 60' : 
                     bookingType === 'trial' ? 'Free Trial • 30 Mins • FREE' : 
                     selectedPackage ? `${selectedPackage.name} • ${selectedPackage.lessons} Lessons` : 'Select a Package'}
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {/* Consolidated Single Session Flow */}
                {bookingType === 'single' && (
                  <motion.div 
                    key="single-flow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-8 pr-2 scrollbar-hide"
                  >
                  <div className="space-y-8">
                    {/* Date Selection */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">1. Pick Date</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {dates.map((date, i) => {
                          const isSelected = bookingDate === date.toDateString();
                          const isAvailable = i % 3 !== 0;
                          return (
                            <button 
                              key={i}
                              onClick={() => isAvailable && setBookingDate(date.toDateString())}
                              className={`flex-shrink-0 w-12 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${isSelected ? 'bg-harbour-500 text-white' : isAvailable ? 'bg-white/5 text-white/60' : 'opacity-20 grayscale'}`}
                            >
                              <span className="text-[8px] uppercase font-bold">{days[date.getDay()]}</span>
                              <span className="text-sm font-bold">{date.getDate()}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Selection */}
                    <div className={!bookingDate ? 'opacity-40 pointer-events-none grayscale transition-all' : 'transition-all'}>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">2. Pick Time</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.values(timeSlots).flat().map(slot => (
                          <button 
                            key={slot}
                            onClick={() => setBookingTime(slot)}
                            className={`px-4 py-2 rounded-full text-[10px] font-bold border transition-all ${bookingTime === slot ? 'bg-harbour-500 border-harbour-500 text-white' : 'bg-white/5 border-white/10 text-white'}`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Selection */}
                    <div className={!bookingTime ? 'opacity-40 pointer-events-none grayscale transition-all' : 'transition-all'}>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">3. Payment Method</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {['Card', 'FPX', 'TNG', 'Boost'].map(method => (
                              <button key={method} className="p-3 rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold hover:bg-white hover:text-black transition-all">{method}</button>
                            ))}
                          </div>
                        </div>

                        <div className="p-5 bg-harbour-500/10 rounded-3xl border border-harbour-500/20">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-[10px] text-harbour-400 font-bold uppercase tracking-widest">Total to Pay</p>
                              <h4 className="text-2xl font-serif-sturdy">RM 60</h4>
                            </div>
                            <button 
                              onClick={() => handleBookingConfirm('single')}
                              className="px-8 py-4 bg-harbour-500 text-white font-bold rounded-full shadow-lg shadow-harbour-500/20"
                            >
                              Pay Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Consolidated Package Flow */}
              {bookingType === 'package' && (
                <motion.div 
                  key="package-flow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-8 pr-2 scrollbar-hide"
                >
                  {/* Package Selection */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">1. Select Package</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {selectedMentor.packages.filter(p => p.id !== 'p0').map(pkg => (
                        <button 
                          key={pkg.id}
                          onClick={() => setSelectedPackage(pkg)}
                          className={`flex-shrink-0 w-40 p-4 rounded-3xl border transition-all text-left ${selectedPackage?.id === pkg.id ? 'bg-harbour-500 border-harbour-500 text-white' : 'bg-white/5 border-white/10 text-white'}`}
                        >
                          <h4 className="text-xs font-bold mb-1">{pkg.name}</h4>
                          <p className={`text-[9px] mb-3 ${selectedPackage?.id === pkg.id ? 'text-white/70' : 'text-white/40'}`}>{pkg.lessons} Lessons</p>
                          <p className="text-lg font-serif-sturdy">RM {pkg.price}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={!selectedPackage ? 'opacity-40 pointer-events-none grayscale transition-all' : 'transition-all'}>
                    <div className="space-y-8 mt-8">
                      {/* Weekly Day */}
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">2. Weekly Day</h4>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                            <button 
                              key={day}
                              onClick={() => setRecurringDay(day)}
                              className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${recurringDay === day ? 'bg-harbour-500 border-harbour-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Preferred Time */}
                      <div className={!recurringDay ? 'opacity-40 pointer-events-none grayscale transition-all' : 'transition-all'}>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">3. Preferred Time</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.values(timeSlots).flat().map(slot => (
                              <button 
                                key={slot}
                                onClick={() => setRecurringTime(slot)}
                                className={`px-4 py-2 rounded-full text-[10px] font-bold border transition-all ${recurringTime === slot ? 'bg-harbour-500 border-harbour-500 text-white' : 'bg-white/5 border-white/10 text-white'}`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                      </div>

                      {/* Start Date */}
                      <div className={!recurringTime ? 'opacity-40 pointer-events-none grayscale transition-all' : 'transition-all'}>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">4. Start Date</h4>
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {dates.map((date, i) => {
                              const isSelected = bookingDate === date.toDateString();
                              const isCorrectDay = days[date.getDay()].startsWith(recurringDay || '');
                              return (
                                <button 
                                  key={i}
                                  onClick={() => isCorrectDay && setBookingDate(date.toDateString())}
                                  className={`flex-shrink-0 w-12 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${isSelected ? 'bg-harbour-500 text-white' : isCorrectDay ? 'bg-white/5 text-white/60' : 'opacity-10 grayscale pointer-events-none'}`}
                                >
                                  <span className="text-[8px] uppercase font-bold">{days[date.getDay()]}</span>
                                  <span className="text-sm font-bold">{date.getDate()}</span>
                                </button>
                              );
                            })}
                          </div>
                      </div>

                      {/* Payment & Confirm */}
                      <div className={!bookingDate ? 'opacity-40 pointer-events-none grayscale transition-all' : 'transition-all'}>
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">5. Payment Method</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {['Card', 'FPX', 'TNG', 'Boost'].map(method => (
                                <button key={method} className="p-3 rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold hover:bg-white hover:text-black transition-all">{method}</button>
                              ))}
                            </div>
                          </div>

                          <div className="p-5 bg-harbour-500/10 rounded-3xl border border-harbour-500/20">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-[10px] text-harbour-400 font-bold uppercase tracking-widest">Total to Pay</p>
                                <h4 className="text-2xl font-serif-sturdy">RM {selectedPackage?.price || 0}</h4>
                              </div>
                              <button 
                                onClick={() => handleBookingConfirm('package')}
                                className="px-8 py-4 bg-harbour-500 text-white font-bold rounded-full shadow-lg shadow-harbour-500/20"
                              >
                                Confirm & Pay
                              </button>
                            </div>
                          </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Consolidated Trial Flow */}
              {bookingType === 'trial' && (
                <motion.div 
                  key="trial-flow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-8 pr-2 scrollbar-hide"
                >
                  <div className="space-y-8">
                    {/* Date Selection */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">1. Pick Date</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {dates.map((date, i) => {
                          const isSelected = bookingDate === date.toDateString();
                          const isAvailable = i % 3 !== 0;
                          return (
                            <button 
                              key={i}
                              onClick={() => isAvailable && setBookingDate(date.toDateString())}
                              className={`flex-shrink-0 w-12 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${isSelected ? 'bg-harbour-500 text-white' : isAvailable ? 'bg-white/5 text-white/60' : 'opacity-20 grayscale'}`}
                            >
                              <span className="text-[8px] uppercase font-bold">{days[date.getDay()]}</span>
                              <span className="text-sm font-bold">{date.getDate()}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Selection */}
                    <div className={!bookingDate ? 'opacity-40 pointer-events-none grayscale transition-all' : 'transition-all'}>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">2. Pick Time</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.values(timeSlots).flat().map(slot => (
                          <button 
                            key={slot}
                            onClick={() => setBookingTime(slot)}
                            className={`px-4 py-2 rounded-full text-[10px] font-bold border transition-all ${bookingTime === slot ? 'bg-harbour-500 border-harbour-500 text-white' : 'bg-white/5 border-white/10 text-white'}`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Note Selection */}
                    <div className={!bookingTime ? 'opacity-40 pointer-events-none grayscale transition-all' : 'transition-all'}>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">3. Note to Mentor</h4>
                      <textarea 
                        placeholder="Tell your mentor about your goals..."
                        value={bookingNote}
                        onChange={e => setBookingNote(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-harbour-500 min-h-[100px]"
                      />
                    </div>

                    <button 
                      disabled={!bookingDate || !bookingTime}
                      onClick={() => handleBookingConfirm('trial')}
                      className="w-full py-5 bg-white text-black font-bold rounded-full disabled:opacity-50 shadow-xl"
                    >
                      Confirm Free Trial
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* AI Buddy Floating Button - Restricted to 4 Main Navigation Pages */}
      {isAuth && (
        (() => {
          const showOnMentorViews = ['home', 'students', 'messages', 'profile'];
          const showOnStudentViews = ['home', 'journey', 'messages', 'profile'];
          
          const shouldShow = isStudent 
            ? showOnStudentViews.includes(studentView)
            : showOnMentorViews.includes(view);

          if (!shouldShow) return null;

          return (
            <>
              <motion.button 
                initial={{ scale: 0, opacity: 0, x: 20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAIBuddySheet(true)}
                className="absolute bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(212,175,55,0.3)] z-[100] overflow-hidden group border-2 border-harbour-500"
              >
                {/* Solid Black Background */}
                <div className="absolute inset-0 bg-black" />
                
                {/* Harbour Glow Accent */}
                <div className="absolute inset-0 bg-gradient-to-br from-harbour-500/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-9 h-9 bg-harbour-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-harbour-500/20 group-hover:scale-110 transition-transform">
                    <Bot size={20} />
                  </div>
                </div>

                {/* Pulsing Status Dot */}
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute top-3 right-3 w-1.5 h-1.5 bg-harbour-400 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"
                />
              </motion.button>

              <AIBuddySheet 
                isOpen={showAIBuddySheet} 
                onClose={() => setShowAIBuddySheet(false)} 
                isStudent={isStudent} 
                isNewUser={isNewUser} 
              />

              {/* Reschedule Modal - Global */}
              <BottomSheet isOpen={showRescheduleModal} onClose={() => {
                setShowRescheduleModal(false);
                setReschedulingLesson(null);
                setSelectedRescheduleDate(null);
                setSelectedRescheduleTime(null);
              }}>
                <div className="px-6 pb-10 text-zinc-900">
                  <h3 className="text-2xl font-serif mb-2">Reschedule Session</h3>
                  <p className="text-sm text-zinc-500 mb-8">Pick a new date and time for your session.</p>
                  
                  <div className="space-y-6">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {dates.map((date, i) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = selectedRescheduleDate === dateStr;
                        return (
                          <button 
                            key={i}
                            onClick={() => setSelectedRescheduleDate(dateStr)}
                            className={`flex-shrink-0 w-12 py-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${isSelected ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400'}`}
                          >
                            <span className="text-[8px] uppercase font-bold">{days[date.getDay()]}</span>
                            <span className="text-sm font-bold">{date.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {['10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].map(time => {
                        const isSelected = selectedRescheduleTime === time;
                        return (
                          <button 
                            key={time} 
                            onClick={() => setSelectedRescheduleTime(time)}
                            className={`py-3.5 rounded-xl border text-[11px] font-bold transition-all ${isSelected ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-100 text-zinc-400'}`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>

                    <button 
                      onClick={() => {
                        if (reschedulingLesson && selectedRescheduleDate && selectedRescheduleTime) {
                          handleRescheduleRequest(reschedulingLesson, selectedRescheduleDate, selectedRescheduleTime);
                        }
                      }}
                      disabled={!selectedRescheduleDate || !selectedRescheduleTime}
                      className={`w-full py-5 text-white font-bold rounded-full mt-6 shadow-lg active:scale-95 transition-transform ${(!selectedRescheduleDate || !selectedRescheduleTime) ? 'bg-zinc-300 cursor-not-allowed' : 'bg-teal-500 shadow-teal-500/20'}`}
                    >
                      Confirm New Time
                    </button>
                  </div>
                </div>
              </BottomSheet>

              {/* Cancellation Reason Modal */}
              <BottomSheet isOpen={showCancelModal} onClose={() => {
                setShowCancelModal(false);
                setLessonToCancel(null);
                setCancelReason('');
              }}>
                <div className="px-6 pb-10 text-zinc-900">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif-sturdy">Cancel Session?</h3>
                      <p className="text-xs text-zinc-500">This action cannot be undone.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Reason for cancellation</label>
                      <textarea 
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="e.g., Unforeseen circumstances, change of plans..."
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-sm text-zinc-900 focus:outline-none focus:border-harbour-500 min-h-[120px]"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          setShowCancelModal(false);
                          setLessonToCancel(null);
                          setCancelReason('');
                        }}
                        className="flex-1 py-4 bg-zinc-100 text-zinc-900 font-bold rounded-full text-xs"
                      >
                        Go Back
                      </button>
                      <button 
                        onClick={() => {
                          if (lessonToCancel && cancelReason.trim()) {
                            handleCancelLesson(lessonToCancel, cancelReason);
                            setShowCancelModal(false);
                            setLessonToCancel(null);
                            setCancelReason('');
                          }
                        }}
                        disabled={!cancelReason.trim()}
                        className={`flex-[2] py-4 text-white font-bold rounded-full text-xs shadow-lg active:scale-95 transition-transform ${!cancelReason.trim() ? 'bg-zinc-300 cursor-not-allowed' : 'bg-red-500 shadow-red-500/20'}`}
                      >
                        Confirm Cancellation
                      </button>
                    </div>
                  </div>
                </div>
              </BottomSheet>
            </>
          );
        })()
      )}
      </div>
    </div>
  );
}
