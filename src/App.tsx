import React, { useState, useEffect, useRef } from 'react';
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
  Settings, 
  Video, 
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
  Music,
  Guitar,
  Download,
  ClipboardList,
  Check,
  HelpCircle,
  Info,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  type: 'Notes' | 'Guide';
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
    stage: 'Stage 2: Basic Rhythms', 
    lessonsRemaining: 4, 
    lastLesson: '2024-03-12', 
    package: 'Package 8', 
    photo: 'https://picsum.photos/seed/sarah/200', 
    progress: 45,
    totalLessons: 8,
    aboutMe: "I've always been fascinated by the sound of the Gambus. I want to learn how to play Zapin music properly.",
    privateNotes: "Learns best with visual examples. Tends to rush — slow down exercises help. Prefers morning lessons.",
    learningPath: [
      { id: 'm1', title: 'Holding & Tuning', status: 'completed' },
      { id: 'm2', title: 'Basic Plucking', status: 'completed' },
      { id: 'm3', title: 'Simple Rhythms', status: 'current' },
      { id: 'm4', title: 'First Song', status: 'upcoming' },
    ]
  },
  { 
    id: 's2', 
    name: 'Marcus Chen', 
    email: 'marcus.c@example.com',
    instrument: 'Erhu', 
    stage: 'Stage 3: Vibrato', 
    lessonsRemaining: 1, 
    lastLesson: '2024-03-14', 
    package: 'Single', 
    photo: 'https://picsum.photos/seed/marcus/200', 
    progress: 75, 
    totalLessons: 1,
    aboutMe: "I played violin in school, but the Erhu has a much more expressive sound that I love.",
    learningPath: [
      { id: 'm1', title: 'Bowing Basics', status: 'completed' },
      { id: 'm2', title: 'D Major Scale', status: 'completed' },
      { id: 'm3', title: 'Vibrato Technique', status: 'current' },
      { id: 'm4', title: 'Traditional Pieces', status: 'upcoming' },
    ]
  },
  { 
    id: 's3', 
    name: 'Elena Rodriguez', 
    email: 'elena.r@example.com',
    instrument: 'Sitar', 
    stage: 'Stage 1: Introduction', 
    lessonsRemaining: 12, 
    lastLesson: '2024-03-10', 
    package: 'Monthly', 
    photo: 'https://picsum.photos/seed/elena/200', 
    progress: 15, 
    totalLessons: 12,
    aboutMe: "I'm a world traveler and I want to learn the instruments of the cultures I visit.",
    learningPath: [
      { id: 'm1', title: 'Sitting Posture', status: 'completed' },
      { id: 'm2', title: 'Tuning the Sitar', status: 'current' },
      { id: 'm3', title: 'Basic Raags', status: 'upcoming' },
      { id: 'm4', title: 'Improvisation', status: 'upcoming' },
    ]
  },
];

const MOCK_SESSION_LOGS: SessionLog[] = [
  {
    id: 'log1',
    studentId: 's1',
    lessonNumber: 4,
    date: '2024-03-12',
    covered: 'Reviewed basic Zapin rhythm. Focused on the downbeat and plucking strength.',
    focus: 'Practice the transition between the first and second rhythm patterns. Keep the wrist relaxed.',
    milestones: ['m1', 'm2'],
    materials: ['mat1']
  },
  {
    id: 'log2',
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
    lessonId: 'log1',
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
    studentPhoto: 'https://picsum.photos/seed/sarah/200',
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
    studentPhoto: 'https://picsum.photos/seed/marcus/200',
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
    studentPhoto: 'https://picsum.photos/seed/elena/200',
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
];

const MOCK_INSTRUMENTS: Instrument[] = [
  // Malay
  {
    id: 'i1',
    name: 'Gambus',
    nativeName: 'ݢامبوس',
    type: 'Plucked',
    culture: 'Malay',
    story: 'The soul of Zapin music. A short-necked lute that arrived via the spice trade, now a cornerstone of Malay folk music.',
    mentorCount: 4,
    photo: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'i2',
    name: 'Biola Melayu',
    nativeName: 'بيولا ملايو',
    type: 'String',
    culture: 'Malay',
    story: 'Adapted from Western influence into Asli music, the Biola Melayu carries the haunting melodies of traditional ghazals.',
    mentorCount: 3,
    photo: 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'i3',
    name: 'Rebab',
    nativeName: 'رباب',
    type: 'String',
    culture: 'Malay',
    story: 'The lead instrument in Mak Yong performances. Its three strings produce a voice-like quality that leads the ensemble.',
    mentorCount: 2,
    photo: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=400'
  },
  // Indian
  {
    id: 'i4',
    name: 'Tabla',
    nativeName: 'तबला',
    type: 'Percussion',
    culture: 'Indian',
    story: 'The rhythmic heartbeat of Hindustani music. A pair of hand drums capable of incredibly complex and fast rhythms.',
    mentorCount: 5,
    photo: 'https://images.unsplash.com/photo-1599932840003-882298642398?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'i5',
    name: 'Sitar',
    nativeName: 'सितार',
    type: 'Plucked',
    culture: 'Indian',
    story: 'Known for its complex sympathetic strings and resonant sound. It defines the sound of North Indian classical music.',
    mentorCount: 4,
    photo: 'https://images.unsplash.com/photo-1615111784767-4d7c419f25d0?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'i7',
    name: 'Bansuri Flute',
    nativeName: 'बांसुरी',
    type: 'Wind',
    culture: 'Indian',
    story: 'The voice of pastoral and divine melodies. A simple bamboo flute that requires immense breath control.',
    mentorCount: 3,
    photo: 'https://images.unsplash.com/photo-1588449668365-d15e397f6787?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'i8',
    name: 'Violin Carnatic',
    nativeName: 'வயலின்',
    type: 'String',
    culture: 'Indian',
    story: 'Played seated, held between the chest and the foot. It mimics the nuances of the human voice in South Indian music.',
    mentorCount: 3,
    photo: 'https://images.unsplash.com/photo-1460039230329-eb070fc6c77c?auto=format&fit=crop&q=80&w=400'
  },
  // Chinese
  {
    id: 'i9',
    name: 'Erhu',
    nativeName: '二胡',
    type: 'String',
    culture: 'Chinese',
    story: 'Often called the "Chinese violin". Its two strings and python-skin resonator create a deeply expressive, soulful sound.',
    mentorCount: 4,
    photo: 'https://images.unsplash.com/photo-1605826832916-d00908649430?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'i10',
    name: 'Dizi',
    nativeName: '笛子',
    type: 'Wind',
    culture: 'Chinese',
    story: 'Famous for its unique buzzing membrane (di-mo), giving it a bright, resonant timbre heard in folk and opera.',
    mentorCount: 3,
    photo: 'https://images.unsplash.com/photo-1520193343412-d5983d2a74d0?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'i11',
    name: 'Pipa',
    nativeName: '琵琶',
    type: 'Plucked',
    culture: 'Chinese',
    story: 'Shaped like a pear, known for its rapid-fire plucking techniques. It can depict both delicate scenes and fierce battles.',
    mentorCount: 3,
    photo: 'https://images.unsplash.com/photo-1550933280-67469b232c63?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'i12',
    name: 'Guzheng',
    nativeName: '古筝',
    type: 'Plucked',
    culture: 'Chinese',
    story: 'An ancient zither with 21 strings. Its cascading notes evoke the sound of flowing water and mountain echoes.',
    mentorCount: 5,
    photo: 'https://images.unsplash.com/photo-1621274403997-37aae1848b40?auto=format&fit=crop&q=80&w=400'
  },
  // Borneo
  {
    id: 'i13',
    name: 'Sape',
    nativeName: 'Sape',
    type: 'Plucked',
    culture: 'Borneo',
    story: 'Boat-shaped lute from Sarawak. Traditionally used for healing rituals by the Orang Ulu, its sound is ethereal and calming.',
    mentorCount: 6,
    photo: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'i14',
    name: 'Tongkungon',
    nativeName: 'Tongkungon',
    type: 'Plucked',
    culture: 'Borneo',
    story: 'A bamboo tube zither from Sabah. It mimics the sound of a full brass gong ensemble on a single piece of bamboo.',
    mentorCount: 2,
    photo: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'i15',
    name: 'Turali',
    nativeName: 'Turali',
    type: 'Wind',
    culture: 'Borneo',
    story: 'Bamboo nose flute from the Kadazan-Dusun. Used to express grief or mimic the sounds of nature in the deep rainforest.',
    mentorCount: 2,
    photo: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=400'
  }
];

const MOCK_MENTORS: MentorDetail[] = [
  {
    id: 'm1',
    name: 'Cikgu Aris',
    tagline: 'Master of Traditional Malay Strings',
    photo: 'https://picsum.photos/seed/aris/200',
    rating: 4.9,
    reviewCount: 128,
    location: 'Bangsar, Kuala Lumpur',
    address: 'No. 12, Jalan Telawi, Bangsar Baru, 59100 Kuala Lumpur',
    pricePerLesson: 85,
    studentsCount: 45,
    experienceYears: 15,
    about: 'I have been playing and teaching Gambus and Rebab for over 15 years. My passion is to preserve the heritage of Malay music for the next generation.',
    specialisation: ['Gambus', 'Rebab', 'Biola Melayu'],
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
      { id: 'r2', studentName: 'Marcus C.', lessonsTaken: 5, rating: 4.8, comment: 'Really enjoyed the sessions. The traditional techniques are fascinating.', timeAgo: '1 week ago' }
    ],
    credentials: ['Master of Arts (Music) - ASWARA', 'National Heritage Award 2022'],
    gallery: [
      'https://picsum.photos/seed/loc1/400/300',
      'https://picsum.photos/seed/loc2/400/300'
    ]
  },
  {
    id: 'm2',
    name: 'Guru Rajesh',
    tagline: 'The Rhythmic Heartbeat of Tabla',
    photo: 'https://picsum.photos/seed/rajesh/200',
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
      { id: 'r3', studentName: 'Anjali D.', lessonsTaken: 20, rating: 5, comment: 'Guru Rajesh is a true master. His knowledge of rhythm is unparalleled.', timeAgo: '3 days ago' }
    ],
    credentials: ['Sangeet Visharad', 'Performed at Petronas Philharmonic Hall'],
    gallery: [
      'https://picsum.photos/seed/raj1/400/300',
      'https://picsum.photos/seed/raj2/400/300'
    ]
  },
  {
    id: 'm3',
    name: 'Master Wong',
    tagline: 'Soulful Strings of the Erhu',
    photo: 'https://picsum.photos/seed/wong/200',
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
      { id: 'r4', studentName: 'Wei Kiat', lessonsTaken: 15, rating: 5, comment: 'Master Wong is very strict but his results are incredible.', timeAgo: '5 days ago' }
    ],
    credentials: ['Central Conservatory of Music Graduate', 'Penang Arts Excellence Award'],
    gallery: [
      'https://picsum.photos/seed/wong1/400/300',
      'https://picsum.photos/seed/wong2/400/300'
    ]
  },
  {
    id: 'm4',
    name: 'Mathew Ngau',
    tagline: 'Living Legend of the Sape',
    photo: 'https://picsum.photos/seed/mathew/200',
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
      { id: 'r5', studentName: 'Jasmine L.', lessonsTaken: 30, rating: 5, comment: 'Learning from a living legend is a dream come true.', timeAgo: '1 day ago' }
    ],
    credentials: ['National Living Heritage (Warisan Kebangsaan)', 'UNESCO Recognition'],
    gallery: [
      'https://picsum.photos/seed/mat1/400/300',
      'https://picsum.photos/seed/mat2/400/300'
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

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'gold' | 'harbour' | 'outline' }) => {
  const styles = {
    default: 'bg-zinc-100 text-zinc-500',
    gold: 'bg-amber-100 text-amber-700',
    harbour: 'bg-harbour-100 text-harbour-700',
    outline: 'border border-zinc-200 text-zinc-400'
  };
  return (
    <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${styles[variant]}`}>
      {children}
    </span>
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', ease: 'circOut', duration: 0.3 }}
          className={`fixed bottom-0 left-0 right-0 z-[201] rounded-t-[2.5rem] max-h-[92vh] overflow-y-auto ${dark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
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

export default function App() {
  const [view, setView] = useState<View>('auth');
  const [authView, setAuthView] = useState<AuthView>('splash');
  const [isAuth, setIsAuth] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'mentor' | null>(null);
  const [splashIndex, setSplashIndex] = useState(0);
  const [isStudent, setIsStudent] = useState(false);
  const [profileProgress, setProfileProgress] = useState(45);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [homeTab, setHomeTab] = useState<'today' | 'pending'>('today');
  const [scheduleFilter, setScheduleFilter] = useState<'week' | 'month' | 'all'>('week');
  const [activeLessonAction, setActiveLessonAction] = useState<Lesson | null>(null);
  const [walletTab, setWalletTab] = useState<'transactions' | 'withdrawals'>('transactions');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(MOCK_WITHDRAWALS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [balance, setBalance] = useState(2450);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactionFilter, setTransactionFilter] = useState<'week' | 'month' | 'custom'>('month');
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState<'idle' | 'processing' | 'success'>('idle');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSetupDetails, setShowSetupDetails] = useState(false);
  const [mentorProfile, setMentorProfile] = useState({
    name: 'Dr. Julian Vane',
    email: 'julian.vane@mentor.com',
    phone: '+60 12 345 6789',
    location: 'Kuala Lumpur, Malaysia'
  });

  // Bottom Sheet States
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<LessonPackage | null>(null);
  const [bookingDate, setBookingDate] = useState<string | null>(null);
  const [bookingTime, setBookingTime] = useState<string | null>(null);
  const [bookingNote, setBookingNote] = useState('');
  const [bookingType, setBookingType] = useState<'trial' | 'single' | 'package' | null>(null);
  const [bookingStep, setBookingStep] = useState<number>(1);
  const [bookingSuccess, setBookingSuccess] = useState<{type: 'trial' | 'single' | 'package', mentor: string} | null>(null);
  const [isWeeklyRecurring, setIsWeeklyRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState<string | null>(null);
  const [recurringTime, setRecurringTime] = useState<string | null>(null);
  const [isTrialConfirmed, setIsTrialConfirmed] = useState(false);
  const [isTrialCompleted, setIsTrialCompleted] = useState(false);

  // Theme State
  const [preferredTheme, setPreferredTheme] = useState<'light' | 'dark' | null>(null);

  // Student States
  const [studentView, setStudentView] = useState<StudentView>('home');
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<MentorDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cultureTab, setCultureTab] = useState<'Malay' | 'Indian' | 'Chinese' | 'Borneo'>('Malay');
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const currentViewIsDark = (isStudent ? (['home', 'mentor-listing', 'mentor-profile', 'book-trial', 'book-paid', 'schedule-view', 'messages'].includes(studentView)) : (view === 'home' || view === 'messages' || view === 'registration' || view === 'full-schedule'));
  const isDark = preferredTheme !== null ? preferredTheme === 'dark' : currentViewIsDark;

  const toggleTheme = () => {
    setPreferredTheme(isDark ? 'light' : 'dark');
  };

  const ThemeToggle = () => (
    <button 
      onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-zinc-900'}`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );

  // --- Views ---

  // --- Student Views ---

  const StudentHomeView = ({ forcedDark }: { forcedDark?: boolean }) => {
    const dark = forcedDark ?? isDark;
    return (
      <div className={`min-h-full px-5 pt-8 pb-32 relative overflow-hidden ${dark ? 'bg-black' : 'bg-white'}`}>
        {/* Atmospheric Background */}
        {dark && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-harbour-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full" />
          </div>
        )}

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className={`text-2xl font-serif-sturdy mb-0.5 ${dark ? 'text-white' : 'text-zinc-900'}`}>Explore</h1>
              <p className={`text-[9px] font-mono uppercase tracking-[0.3em] ${dark ? 'text-white/40' : 'text-zinc-500'}`}>Heritage Instruments</p>
            </div>
            <div className="flex gap-2">
              {!forcedDark && <ThemeToggle />}
            </div>
          </div>

          <div className="mb-5">
            <div className="flex justify-between items-end mb-2">
              <h2 className={`text-[9px] uppercase tracking-[0.2em] font-bold ${dark ? 'text-white/30' : 'text-zinc-500'}`}>Explore Genres</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(['Malay', 'Indian', 'Chinese', 'Borneo'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCultureTab(tab)}
                  className={`px-5 py-2 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border ${cultureTab === tab ? (dark ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]' : 'bg-zinc-900 text-white border-zinc-900 shadow-md') : (dark ? 'bg-white/5 text-white/40 border-white/10' : 'bg-black/5 text-zinc-500 border-black/5')}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {MOCK_INSTRUMENTS.filter(i => i.culture === cultureTab).map((instrument) => (
              <motion.div
                key={instrument.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'tween', duration: 0.1 }}
                onClick={() => { setSelectedInstrument(instrument); setStudentView('mentor-listing'); }}
                className="group relative aspect-[2.4/1] rounded-[2rem] overflow-hidden cursor-pointer shadow-lg"
              >
                <img 
                  src={instrument.photo} 
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
    return (
      <div className="px-5 pt-12 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setStudentView('home')} className={`w-10 h-10 rounded-full flex items-center justify-center border ${dark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/5 text-zinc-900'}`}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-serif-sturdy ${dark ? 'text-white' : 'text-zinc-900'}`}>{selectedInstrument?.name}</h1>
            <Badge variant="harbour">{selectedInstrument?.type}</Badge>
          </div>
        </div>

        <div className="space-y-4">
          {MOCK_MENTORS.filter(m => m.specialisation.includes(selectedInstrument?.name || '')).map((mentor) => (
            <motion.div
              key={mentor.id}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'tween', duration: 0.1 }}
              onClick={() => { setSelectedMentor(mentor); setStudentView('mentor-profile'); }}
              className={`border rounded-[2rem] p-5 relative overflow-hidden group transition-colors ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-100 shadow-sm'}`}
            >
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                  <img src={mentor.photo} alt={mentor.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
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
                <div className="text-right flex flex-col justify-between">
                  <div>
                    <p className={`text-[9px] font-mono uppercase tracking-widest mb-1 ${dark ? 'text-white/30' : 'text-zinc-400'}`}>From</p>
                    <p className={`text-xl font-serif-sturdy ${dark ? 'text-white' : 'text-zinc-900'}`}>RM{mentor.pricePerLesson}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedChat(mentor);
                      setStudentView('messages');
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-90 ${dark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-black/5 border-black/5 text-zinc-900 hover:bg-black/10'}`}
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const BookTrialView = () => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [bookingStep, setBookingStep] = useState<'datetime' | 'confirm'>('datetime');
    const dark = true;

    if (!selectedMentor) return null;

    const timeSlots = ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'];
    const dates = [
      { day: 'Mon', date: '18' },
      { day: 'Tue', date: '19' },
      { day: 'Wed', date: '20' },
      { day: 'Thu', date: '21' },
      { day: 'Fri', date: '22' },
    ];

    return (
      <div className={`min-h-full px-5 pt-12 pb-32 ${dark ? 'bg-black text-white' : 'bg-white text-zinc-900'}`}>
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setStudentView('mentor-profile')} className={`w-10 h-10 rounded-full border flex items-center justify-center ${dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-serif-sturdy">Book Free Trial</h1>
            <p className={`text-[10px] font-mono uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>With {selectedMentor.name}</p>
          </div>
        </header>

        {bookingStep === 'datetime' ? (
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

            <button 
              disabled={!selectedDate || !selectedTime}
              onClick={() => setBookingStep('confirm')}
              className={`w-full py-5 rounded-full font-bold transition-all mt-8 ${
                selectedDate && selectedTime 
                  ? (dark ? 'bg-white text-black' : 'bg-zinc-900 text-white')
                  : (dark ? 'bg-white/10 text-white/20 cursor-not-allowed' : 'bg-black/10 text-zinc-300 cursor-not-allowed')
              }`}
            >
              Confirm Selection
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
              onClick={() => setStudentView('journey')}
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
      <div className={`min-h-full px-5 pt-12 pb-32 ${dark ? 'bg-black text-white' : 'bg-white text-zinc-900'}`}>
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setStudentView('mentor-profile')} className={`w-10 h-10 rounded-full border flex items-center justify-center ${dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-serif-sturdy">Mentor Schedule</h1>
            <p className={`text-[10px] font-mono uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>{selectedMentor.name}'s Availability</p>
          </div>
        </header>

        <div className="space-y-6">
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
    const [paymentStep, setPaymentStep] = useState<'method' | 'processing' | 'success'>('method');
    const dark = true;

    if (!selectedMentor) return null;

    return (
      <div className={`min-h-full px-5 pt-12 pb-32 ${dark ? 'bg-black text-white' : 'bg-white text-zinc-900'}`}>
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setStudentView('mentor-profile')} className={`w-10 h-10 rounded-full border flex items-center justify-center ${dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-serif-sturdy">Checkout</h1>
            <p className={`text-[10px] font-mono uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>Secure Payment</p>
          </div>
        </header>

        {paymentStep === 'method' ? (
          <div className="space-y-6">
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
            {setTimeout(() => setPaymentStep('success'), 2000) && null}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-serif-sturdy mb-2">Payment Successful!</h2>
            <p className={`text-sm mb-8 ${dark ? 'text-white/60' : 'text-zinc-600'}`}>Your package has been activated. You can now start scheduling your lessons with {selectedMentor.name}.</p>
            <button 
              onClick={() => setStudentView('journey')}
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
      if (view === 'profile') return isDark; // User preference for profile
      if (view === 'mentor-listing') return true; // Always Dark as requested
      if (view === 'mentor-profile') return true; // Always Dark as requested
      return isDark;
    };

    const currentViewIsDark = getViewTheme(studentView);

    // Calendar Data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dates = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });

    const timeSlots = {
      morning: ['9:00 AM', '10:00 AM', '11:00 AM'],
      afternoon: ['2:00 PM', '4:00 PM'],
      evening: ['6:00 PM', '8:00 PM', '10:00 PM']
    };

    const selectedMentor = MOCK_MENTORS[0]; // Default for sheets

    return (
      <div className={`h-full flex flex-col transition-colors duration-500 ${currentViewIsDark ? 'bg-black text-white' : 'bg-white text-zinc-900'}`}>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            {studentView === 'home' && (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StudentHomeView forcedDark={true} />
              </motion.div>
            )}
            {studentView === 'mentor-listing' && (
              <motion.div key="listing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MentorListingView />
              </motion.div>
            )}
            {studentView === 'mentor-profile' && (
              <motion.div key="mentor-profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%]">
          <div className={`backdrop-blur-2xl border rounded-[2rem] px-2 py-2 flex items-center justify-between shadow-2xl transition-all duration-500 ${
            currentViewIsDark ? 'bg-white/10 border-white/10' : 'bg-white/80 border-black/5'
          }`}>
            {[
              { id: 'home', icon: HomeIcon, label: 'Home' },
              { id: 'journey', icon: Music2, label: 'Journey' },
              { id: 'messages', icon: MessageSquare, label: 'Chat' },
              { id: 'profile', icon: User, label: 'Profile' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setStudentView(item.id as StudentView)}
                className={`relative flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-300 ${
                  studentView === item.id 
                    ? currentViewIsDark ? 'text-white' : 'text-zinc-900' 
                    : 'text-zinc-400 opacity-50 hover:opacity-100'
                }`}
              >
                {studentView === item.id && (
                  <motion.div 
                    layoutId="activeNavStudent"
                    className={`absolute inset-0 rounded-2xl z-0 ${currentViewIsDark ? 'bg-white/10' : 'bg-black/5'}`}
                    transition={{ type: 'tween', ease: 'circOut', duration: 0.3 }}
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

        {/* Global Bottom Sheets */}
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
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.3, ease: 'easeOut' }}
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
                    setStudentView('journey');
                  }}
                  className="w-full py-5 bg-white text-black font-bold rounded-full"
                >
                  View in My Journey
                </button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  <img src={selectedMentor.photo} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h3 className="text-sm font-serif-sturdy">{selectedMentor.name}</h3>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest">
                      {bookingType === 'single' ? 'Single Session • 60 Mins • RM 60' : 
                       bookingType === 'trial' ? 'Free Trial • 30 Mins • FREE' : 
                       selectedPackage ? `${selectedPackage.name} • ${selectedPackage.lessons} Lessons` : 'Select a Package'}
                    </p>
                  </div>
                </div>

                {/* Multi-step Content */}
                {bookingType === 'single' && (
                  <>
                    {bookingStep === 1 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                          <h4 className="text-lg font-serif-sturdy mb-2">Single Session</h4>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-white/40">Duration</span>
                            <span className="font-bold">60 Minutes</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mt-2">
                            <span className="text-white/40">Price</span>
                            <span className="font-bold text-harbour-400">RM 60</span>
                          </div>
                        </div>
                        <button onClick={() => setBookingStep(2)} className="w-full py-5 bg-white text-black font-bold rounded-full">Pick Date</button>
                      </motion.div>
                    )}

                    {bookingStep === 2 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="font-serif-sturdy">March 2026</h4>
                          <div className="flex gap-2">
                            <ChevronLeft size={18} className="text-white/20" />
                            <ChevronRight size={18} className="text-white" />
                          </div>
                        </div>
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
                        <button disabled={!bookingDate} onClick={() => setBookingStep(3)} className="w-full py-5 bg-white text-black font-bold rounded-full disabled:opacity-50">Next: Pick Time</button>
                      </motion.div>
                    )}

                    {bookingStep === 3 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {Object.entries(timeSlots).map(([category, slots]) => (
                          <div key={category}>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">
                              {category === 'morning' ? 'Morning Slots' : category === 'afternoon' ? 'Afternoon Slots' : 'Evening Slots'}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {slots.map(slot => (
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
                        ))}
                        <button disabled={!bookingTime} onClick={() => setBookingStep(4)} className="w-full py-5 bg-white text-black font-bold rounded-full disabled:opacity-50">View Summary</button>
                      </motion.div>
                    )}

                    {bookingStep === 4 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                          <h4 className="text-lg font-serif-sturdy">Summary</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs"><span className="text-white/40">Mentor</span><span className="font-bold">{selectedMentor.name}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-white/40">Date</span><span className="font-bold">{bookingDate}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-white/40">Time</span><span className="font-bold">{bookingTime}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-white/40">Duration</span><span className="font-bold">60 Mins</span></div>
                            <div className="pt-2 border-t border-white/10 flex justify-between"><span className="text-sm font-bold">Total Price</span><span className="text-lg font-serif-sturdy text-harbour-400">RM 60</span></div>
                          </div>
                        </div>
                        <button onClick={() => setBookingStep(5)} className="w-full py-5 bg-harbour-500 text-white font-bold rounded-full">Proceed to Payment</button>
                      </motion.div>
                    )}

                    {bookingStep === 5 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Select Payment Method</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {['Card', 'FPX', 'Touch n Go', 'Boost'].map(method => (
                            <button key={method} className="p-4 rounded-2xl border border-white/10 bg-white/5 text-xs font-bold hover:bg-white hover:text-black transition-all">{method}</button>
                          ))}
                        </div>
                        <button onClick={() => setBookingSuccess({ type: 'single', mentor: selectedMentor.name })} className="w-full py-5 bg-harbour-500 text-white font-bold rounded-full">Confirm Payment</button>
                      </motion.div>
                    )}
                  </>
                )}

                {bookingType === 'package' && (
                  <>
                    {bookingStep === 1 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <h4 className="text-xl font-serif-sturdy mb-4">Pick a package</h4>
                        <div className="grid gap-3">
                          {selectedMentor.packages.filter(p => p.id !== 'p0').map(pkg => (
                            <button 
                              key={pkg.id}
                              onClick={() => {
                                setSelectedPackage(pkg);
                                setBookingStep(2);
                              }}
                              className="p-5 border border-white/10 bg-white/5 rounded-[2rem] flex justify-between items-center text-left"
                            >
                              <div>
                                <h4 className="font-bold text-white">{pkg.name}</h4>
                                <p className="text-[10px] text-white/40">{pkg.description || `${pkg.lessons} Lessons • Valid ${pkg.validityMonths}m`}</p>
                              </div>
                              <p className="text-lg font-serif-sturdy">RM {pkg.price}</p>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {bookingStep === 2 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Which day every week?</h4>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                            <button 
                              key={day}
                              onClick={() => setRecurringDay(day)}
                              className={`flex-shrink-0 px-5 py-3 rounded-2xl text-xs font-bold border transition-all ${recurringDay === day ? 'bg-harbour-500 border-harbour-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                        <button disabled={!recurringDay} onClick={() => setBookingStep(3)} className="w-full py-5 bg-white text-black font-bold rounded-full disabled:opacity-50">Next: Pick Time</button>
                      </motion.div>
                    )}

                    {bookingStep === 3 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {Object.entries(timeSlots).map(([category, slots]) => (
                          <div key={category}>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">
                              {category === 'morning' ? 'Morning Slots' : category === 'afternoon' ? 'Afternoon Slots' : 'Evening Slots'}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {slots.map(slot => (
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
                        ))}
                        <button disabled={!recurringTime} onClick={() => setBookingStep(4)} className="w-full py-5 bg-white text-black font-bold rounded-full disabled:opacity-50">Next: Start Date</button>
                      </motion.div>
                    )}

                    {bookingStep === 4 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Pick Start Date</h4>
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
                        <button disabled={!bookingDate} onClick={() => setBookingStep(5)} className="w-full py-5 bg-white text-black font-bold rounded-full disabled:opacity-50">View Summary</button>
                      </motion.div>
                    )}

                    {bookingStep === 5 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                          <h4 className="text-lg font-serif-sturdy">Summary</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between text-xs"><span className="text-white/40">Package</span><span className="font-bold">{selectedPackage?.name}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-white/40">Schedule</span><span className="font-bold">Every {recurringDay} @ {recurringTime}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-white/40">Start Date</span><span className="font-bold">{bookingDate}</span></div>
                            
                            <div className="pt-4 border-t border-white/10">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">All Lesson Dates</p>
                              <div className="grid grid-cols-2 gap-2">
                                {Array.from({ length: selectedPackage?.lessons || 0 }).map((_, i) => (
                                  <div key={i} className="px-3 py-2 bg-white/5 rounded-xl text-[10px] font-bold text-white/60">
                                    Lesson {i + 1}: {new Date(new Date(bookingDate || '').getTime() + i * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold">Total Price</span>
                                <span className="text-xl font-serif-sturdy text-harbour-400">RM {selectedPackage?.price}</span>
                              </div>
                              {selectedPackage?.id === 'p3' && (
                                <p className="text-[9px] text-harbour-400/60 mt-2 italic">Auto renews every month • Cancel anytime</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setBookingStep(6)} className="w-full py-5 bg-harbour-500 text-white font-bold rounded-full">Proceed to Payment</button>
                      </motion.div>
                    )}

                    {bookingStep === 6 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Select Payment Method</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {['Card', 'FPX', 'Touch n Go', 'Boost'].map(method => (
                            <button key={method} className="p-4 rounded-2xl border border-white/10 bg-white/5 text-xs font-bold hover:bg-white hover:text-black transition-all">{method}</button>
                          ))}
                        </div>
                        <button onClick={() => setBookingSuccess({ type: 'package', mentor: selectedMentor.name })} className="w-full py-5 bg-harbour-500 text-white font-bold rounded-full">Confirm Payment</button>
                      </motion.div>
                    )}
                  </>
                )}

                {bookingType === 'trial' && (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-serif-sturdy">March 2026</h4>
                      <div className="flex gap-4">
                        <button className="text-[10px] font-bold text-harbour-400 uppercase tracking-widest">Today</button>
                        <div className="flex gap-2">
                          <ChevronLeft size={18} className="text-white/20" />
                          <ChevronRight size={18} className="text-white" />
                        </div>
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

                    {bookingDate && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
                        className="space-y-6 mt-4"
                      >
                        {Object.entries(timeSlots).map(([category, slots]) => (
                          <div key={category}>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">
                              {category === 'morning' ? 'Morning Slots' : category === 'afternoon' ? 'Afternoon Slots' : 'Evening Slots'}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {slots.map(slot => {
                                const isSelected = bookingTime === slot;
                                return (
                                  <button 
                                    key={slot}
                                    onClick={() => setBookingTime(slot)}
                                    className={`px-4 py-2 rounded-full text-[10px] font-bold border transition-all ${isSelected ? 'bg-harbour-500 border-harbour-500 text-white' : 'bg-white/5 border-white/10 text-white'}`}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        <div className="pt-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Note to Mentor</h4>
                          <textarea 
                            placeholder="Tell your mentor about yourself"
                            value={bookingNote}
                            onChange={e => setBookingNote(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-harbour-500 min-h-[100px]"
                          />
                        </div>

                        <button 
                          onClick={() => {
                            setBookingSuccess({ type: 'trial', mentor: selectedMentor.name });
                            setIsTrialCompleted(true);
                          }}
                          className="w-full py-5 bg-white text-black font-bold rounded-full mt-4"
                        >
                          Confirm Free Trial
                        </button>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </BottomSheet>
      </div>
    );
  };
  const MentorProfileView = () => {
    const [expandedSection, setExpandedSection] = useState<'path' | 'packages' | 'schedule' | 'gallery' | 'reviews' | 'credentials' | null>(null);
    const [showTrialRules, setShowTrialRules] = useState(false);
    const dark = true;

    // Calendar Data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dates = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });

    const timeSlots = {
      morning: ['9:00 AM', '10:00 AM', '11:00 AM'],
      afternoon: ['2:00 PM', '4:00 PM'],
      evening: ['6:00 PM', '8:00 PM', '10:00 PM']
    };

    if (!selectedMentor) return null;

    return (
      <div className={`${dark ? 'bg-black text-white' : 'bg-white text-zinc-900'} min-h-full pb-32`}>
        <div className="relative h-64 overflow-hidden">
          <img src={selectedMentor.photo} className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
          <div className={`absolute inset-0 bg-gradient-to-t ${dark ? 'from-black' : 'from-white'} via-transparent to-transparent`} />
          <button onClick={() => setStudentView('mentor-listing')} className={`absolute top-12 left-5 w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center border ${dark ? 'bg-black/40 border-white/10 text-white' : 'bg-white/40 border-black/10 text-zinc-900'}`}>
            <ChevronLeft size={20} />
          </button>
          <div className="absolute bottom-6 left-5 flex items-end gap-4">
            <div className="relative">
              <img src={selectedMentor.photo} className={`w-24 h-24 rounded-[2rem] object-cover border-4 shadow-2xl ${dark ? 'border-black' : 'border-white'}`} referrerPolicy="no-referrer" />
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
              { label: 'Students', value: selectedMentor.studentsCount, icon: Users },
              { label: 'Reviews', value: selectedMentor.reviewCount, icon: MessageSquare },
              { label: 'Experience', value: `${selectedMentor.experienceYears}y`, icon: Award }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`text-[8px] font-mono uppercase tracking-widest mb-1 ${dark ? 'text-white/30' : 'text-zinc-500'}`}>{stat.label}</p>
                <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <button 
            onClick={() => {
              setSelectedChat(selectedMentor);
              setStudentView('messages');
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
              { id: 'gallery', label: 'Gallery', icon: ImageIcon },
              { id: 'reviews', label: 'Student Reviews', icon: Star },
              { id: 'credentials', label: 'Credentials', icon: Award }
            ].map((section) => (
              <div key={section.id} className={`border-b pb-4 ${dark ? 'border-white/10' : 'border-black/5'}`}>
                <button 
                  onClick={() => {
                    if (section.id === 'schedule') {
                      setShowScheduleSheet(true);
                    } else {
                      setExpandedSection(expandedSection === section.id ? null : section.id as any);
                    }
                  }}
                  className="w-full flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <section.icon size={18} className={dark ? 'text-white/40' : 'text-zinc-400'} />
                    <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>{section.label}</span>
                  </div>
                  <motion.div animate={{ rotate: expandedSection === section.id ? 180 : 0 }}>
                    <ChevronRight size={16} className={dark ? 'text-white/20' : 'text-zinc-300'} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedSection === section.id && (
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
                                className={`p-2.5 border rounded-xl flex justify-between items-center transition-all active:scale-[0.98] ${dark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-zinc-100 shadow-sm hover:bg-zinc-50'}`}
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
                            {selectedMentor.reviews.map(review => (
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
                            {selectedMentor.credentials.map(c => <li key={c} className="flex items-center gap-2 text-xs"><CheckCircle2 size={12} className="text-harbour-400" /> {c}</li>)}
                          </ul>
                        )}
                        {section.id === 'gallery' && (
                          <div className="grid grid-cols-2 gap-2">
                            {selectedMentor.gallery.map((img, i) => <img key={i} src={img} className="rounded-xl aspect-square object-cover" referrerPolicy="no-referrer" />)}
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

        {/* Sticky Bottom */}
        <div className={`fixed bottom-0 left-0 right-0 p-5 backdrop-blur-xl border-t flex items-center gap-4 z-[110] ${dark ? 'bg-black/80 border-white/10' : 'bg-white/80 border-black/5'}`}>

          <button 
            onClick={() => {
              if (isTrialCompleted) {
                setBookingType('package');
                setBookingStep(1);
                setShowBookingSheet(true);
              } else {
                setBookingType('trial');
                setBookingStep(1);
                setShowBookingSheet(true);
              }
            }}
            className={`flex-1 font-bold py-4 rounded-full flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${dark ? 'bg-white text-black' : 'bg-zinc-900 text-white'}`}
          >
            <Music2 size={18} />
            {isTrialCompleted ? 'Select a Package' : 'Book Free Trial'}
          </button>
        </div>
      </div>
    );
  };

  const StudentJourneyView = ({ forcedDark }: { forcedDark?: boolean }) => {
    const [journeyTab, setJourneyTab] = useState<'lessons' | 'progress'>('lessons');
    const dark = forcedDark ?? isDark;
    const [selectedInstrument, setSelectedInstrument] = useState('Gamelan');
    const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    
    // Simulated states for the flow
    const lessonsRemaining = 2; // Trigger for low package banner

    const instruments = [
      { id: 'gamelan', name: 'Gamelan', icon: Music2 },
      { id: 'gambus', name: 'Gambus', icon: Music },
      { id: 'sape', name: 'Sape', icon: Guitar },
    ];

    const stats = {
      Gamelan: { lessons: '12', hours: '18.5', level: '4', status: 'On Track' },
      Gambus: { lessons: '4', hours: '6.0', level: '2', status: 'Ahead' },
      Sape: { lessons: '0', hours: '0', level: '1', status: 'Not Started' },
    }[selectedInstrument] || { lessons: '0', hours: '0', level: '1', status: 'N/A' };

    const pastLessons = [
      { 
        id: 4, 
        date: '10 Mar 2026', 
        duration: '1h', 
        review: 'Excellent progress on the syncopated rhythms. Your striking technique is becoming much more consistent.',
        milestones: ['Mastered Basic Striking', 'Rhythm Consistency'],
        focus: 'Focus on the transition between the Pelog and Slendro scales.'
      },
      { 
        id: 3, 
        date: '03 Mar 2026', 
        duration: '1h', 
        review: 'Good session. We need to work more on the hand positioning for the larger gongs.',
        milestones: ['Scale Recognition'],
        focus: 'Practice the hand-damping technique for 15 mins daily.'
      },
      { id: 2, date: '24 Feb 2026', duration: '1h', review: 'Solid foundation building.', milestones: [], focus: 'Basic posture.' },
      { id: 1, date: '17 Feb 2026', duration: '1h', review: 'Great first session!', milestones: ['First Lesson'], focus: 'Instrument care.' },
    ];

    const roadmap = [
      { id: 1, title: 'Foundations', status: 'completed', desc: 'Mastered basic posture and striking techniques.' },
      { id: 2, title: 'Rhythmic Patterns', status: 'current', desc: 'Currently learning complex syncopated rhythms.' },
      { id: 3, title: 'Ensemble Playing', status: 'locked', desc: 'Introduction to playing with other instruments.' },
      { id: 4, title: 'Advanced Ornamentation', status: 'locked', desc: 'Learning the intricate decorative notes.' },
    ];

    const materials = [
      { id: 1, title: 'Gambus Finger Positioning Guide', type: 'PDF', category: 'Diagram', icon: FileText },
      { id: 2, title: 'Traditional Scales Reference', type: 'Doc', category: 'Scale Sheet', icon: BookOpen },
      { id: 3, title: 'Cultural History of Gamelan', type: 'PDF', category: 'Reading', icon: Music2 },
    ];

    const practiceGuides = [
      { id: 1, title: 'Week 3 Practice Plan', type: 'Doc', desc: '25 mins daily, focus on chord transitions', icon: ClipboardList },
      { id: 2, title: 'Daily Warm-up Routine', type: 'PDF', desc: '10 mins basic striking', icon: Clock },
    ];

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      return d;
    });
    
    return (
      <div className={`min-h-full px-5 pt-8 pb-32 transition-colors duration-500 ${dark ? 'bg-black text-white' : 'bg-[#F9F9F9] text-zinc-900'}`}>
        {/* Header */}
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className={`text-2xl font-serif-sturdy ${dark ? 'text-white' : 'text-zinc-900'}`}>My Journey</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className={`text-[9px] font-bold uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>
                {stats.status}
              </p>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${dark ? 'bg-white/5 text-white/40' : 'bg-black/5 text-zinc-400'}`}>
            ID: #8821
          </div>
        </div>

        {/* Instrument Switcher */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
          {instruments.map((inst) => (
            <button
              key={inst.id}
              onClick={() => setSelectedInstrument(inst.name)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-2xl border flex items-center gap-2 transition-all ${selectedInstrument === inst.name ? (dark ? 'bg-white border-white text-black shadow-lg shadow-white/5' : 'bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-black/10') : (dark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-zinc-100 text-zinc-400 shadow-sm')}`}
            >
              <inst.icon size={14} />
              <span className="text-[10px] font-bold">{inst.name}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 mb-6 p-1 rounded-full border transition-colors ${dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
          <button 
            onClick={() => setJourneyTab('lessons')}
            className={`flex-1 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${journeyTab === 'lessons' ? (dark ? 'bg-white text-black shadow-md' : 'bg-zinc-900 text-white shadow-md') : (dark ? 'text-white/40' : 'text-zinc-400')}`}
          >
            Schedule
          </button>
          <button 
            onClick={() => setJourneyTab('progress')}
            className={`flex-1 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${journeyTab === 'progress' ? (dark ? 'bg-white text-black shadow-md' : 'bg-zinc-900 text-white shadow-md') : (dark ? 'text-white/40' : 'text-zinc-400')}`}
          >
            Growth
          </button>
        </div>

        {journeyTab === 'lessons' ? (
          <div className="space-y-12">
            {/* Upcoming Lessons Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className={`text-xs font-bold uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>Upcoming Session</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dark ? 'bg-harbour-500/20 text-harbour-400' : 'bg-harbour-100 text-harbour-600'}`}>Confirmed</span>
              </div>

              {/* Confirmed Lesson Card */}
              <div className={`border rounded-[2.5rem] p-6 transition-colors relative overflow-hidden ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-100 shadow-xl shadow-black/5'}`}>
                {/* Decorative Background Element */}
                <div className={`absolute -right-20 -top-20 w-48 h-48 rounded-full blur-3xl opacity-10 ${dark ? 'bg-harbour-500' : 'bg-walnut-200'}`} />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-4 items-center">
                      <img src="https://picsum.photos/seed/ahmad/100" className="w-12 h-12 rounded-xl object-cover shadow-lg" referrerPolicy="no-referrer" />
                      <div>
                        <h3 className={`font-serif-sturdy text-base ${dark ? 'text-white' : 'text-zinc-900'}`}>Cikgu Ahmad</h3>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${dark ? 'text-white/40' : 'text-zinc-500'}`}>{selectedInstrument} • Lesson #5</p>
                      </div>
                    </div>
                    <button className={`p-2 rounded-full transition-colors ${dark ? 'hover:bg-white/10 text-white/20' : 'hover:bg-black/5 text-zinc-300'}`}><MoreVertical size={18} /></button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mb-6">
                    <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${dark ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-100'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-white/5 text-harbour-400' : 'bg-white text-harbour-500 shadow-sm'}`}>
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className={`text-[7px] font-bold uppercase tracking-widest mb-0.5 ${dark ? 'text-white/30' : 'text-zinc-400'}`}>Date & Time</p>
                        <p className={`text-xs font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>Sunday, 15 Mar 2026 • 14:00</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${dark ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-100'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-white/5 text-harbour-400' : 'bg-white text-harbour-500 shadow-sm'}`}>
                        <MapPin size={16} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-[7px] font-bold uppercase tracking-widest mb-0.5 ${dark ? 'text-white/30' : 'text-zinc-400'}`}>Location</p>
                        <p className={`text-xs font-bold leading-tight ${dark ? 'text-white' : 'text-zinc-900'}`}>No. 12, Jalan Sultan, Kuala Lumpur</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-harbour-500/10 text-harbour-400 text-[9px] font-bold uppercase tracking-widest border border-harbour-500/20">
                      <Clock size={10} /> 2 Days Away
                    </div>
                    <div className={`text-[9px] font-bold uppercase tracking-widest ${dark ? 'text-white/20' : 'text-zinc-400'}`}>
                      60 Mins
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowRescheduleModal(true)}
                      className={`flex-1 py-3.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all active:scale-95 ${dark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-black shadow-lg shadow-black/10'}`}
                    >
                      Reschedule
                    </button>
                    <button className={`flex-1 py-3.5 border rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${dark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50'}`}>Cancel</button>
                  </div>
                </div>
              </div>
            </section>

            {/* Past Lessons Log */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className={`text-xs font-bold uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>Past Lessons Log</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dark ? 'bg-zinc-500/10 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>4 Lessons</span>
              </div>

              <div className="space-y-4">
                {pastLessons.map((lesson) => (
                  <div key={lesson.id} className={`border rounded-[2rem] transition-all overflow-hidden ${dark ? 'bg-white/5 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
                    <button 
                      onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                      className="w-full p-6 flex justify-between items-center text-left"
                    >
                      <div className="flex gap-4 items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-white/5 text-white/40' : 'bg-zinc-100 text-zinc-400'}`}>
                          <Music2 size={18} />
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>Lesson #{lesson.id}</h4>
                          <p className={`text-[10px] ${dark ? 'text-white/40' : 'text-zinc-500'}`}>{lesson.date} • {lesson.duration}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex gap-0.5 mb-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} size={8} className="fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest">Completed</p>
                        </div>
                        <motion.div animate={{ rotate: expandedLesson === lesson.id ? 90 : 0 }}>
                          <ChevronRight size={16} className={dark ? 'text-white/20' : 'text-zinc-300'} />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedLesson === lesson.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/5"
                        >
                          <div className="p-6 space-y-6">
                            <div>
                              <p className={`text-[8px] font-bold uppercase tracking-widest mb-2 ${dark ? 'text-white/30' : 'text-zinc-400'}`}>Mentor's Review</p>
                              <p className={`text-xs italic leading-relaxed ${dark ? 'text-white/60' : 'text-zinc-600'}`}>"{lesson.review}"</p>
                            </div>
                            
                            {lesson.milestones.length > 0 && (
                              <div>
                                <p className={`text-[8px] font-bold uppercase tracking-widest mb-3 ${dark ? 'text-white/30' : 'text-zinc-400'}`}>Milestones Reached</p>
                                <div className="flex flex-wrap gap-2">
                                  {lesson.milestones.map(m => (
                                    <span key={m} className={`px-3 py-1 rounded-full text-[9px] font-bold flex items-center gap-1.5 ${dark ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                      <CheckCircle2 size={10} /> {m}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className={`p-4 rounded-2xl ${dark ? 'bg-harbour-500/10' : 'bg-walnut-50'}`}>
                              <p className={`text-[8px] font-bold uppercase tracking-widest mb-2 ${dark ? 'text-harbour-400/60' : 'text-harbour-500/60'}`}>Practice Focus</p>
                              <p className={`text-xs font-medium ${dark ? 'text-harbour-400' : 'text-walnut-700'}`}>{lesson.focus}</p>
                            </div>

                            <button className={`w-full py-4 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${dark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-zinc-900 text-white shadow-lg shadow-black/10'}`}>
                              <Star size={12} className="fill-current" />
                              Rate this Lesson
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Learning Roadmap */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>Learning Path</h2>
              </div>

              <div className="relative pl-8 space-y-6 pb-4">
                <div className={`absolute left-[11px] top-2 bottom-2 w-0.5 ${dark ? 'bg-white/10' : 'bg-black/5'}`} />
                {roadmap.map((stage, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[28px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${dark ? 'border-black' : 'border-white'} ${stage.status === 'completed' ? 'bg-harbour-500' : stage.status === 'current' ? (dark ? 'bg-white' : 'bg-zinc-900') : (dark ? 'bg-white/10' : 'bg-zinc-200')}`}>
                      {stage.status === 'completed' && <CheckCircle2 size={12} className="text-white" />}
                      {stage.status === 'current' && <div className={`w-1.5 h-1.5 rounded-full ${dark ? 'bg-black' : 'bg-white'}`} />}
                      {stage.status === 'locked' && <Lock size={8} className={dark ? 'text-white/40' : 'text-zinc-400'} />}
                    </div>
                    <div className={`p-5 rounded-3xl border transition-all ${stage.status === 'current' ? (dark ? 'bg-white/10 border-white/20 shadow-xl' : 'bg-white border-zinc-300 shadow-lg shadow-black/5') : (dark ? 'bg-white/5 border-white/5 opacity-60' : 'bg-white border-zinc-100 opacity-60')}`}>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-bold text-sm ${dark ? 'text-white' : 'text-zinc-900'}`}>{stage.title}</h4>
                      </div>
                      <p className={`text-[10px] leading-relaxed ${dark ? 'text-white/40' : 'text-zinc-500'}`}>{stage.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Materials Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>Learning Materials</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {materials.map(mat => (
                  <div key={mat.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-100 shadow-sm'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-white/10 text-harbour-400' : 'bg-harbour-50 text-harbour-600'}`}>
                      <mat.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[8px] font-mono uppercase tracking-widest ${dark ? 'text-white/30' : 'text-zinc-400'}`}>{mat.type}</span>
                        <span className={`w-1 h-1 rounded-full ${dark ? 'bg-white/10' : 'bg-zinc-200'}`} />
                        <span className={`text-[8px] font-mono uppercase tracking-widest ${dark ? 'text-white/30' : 'text-zinc-400'}`}>{mat.category}</span>
                      </div>
                      <h3 className={`text-xs font-bold truncate ${dark ? 'text-white' : 'text-zinc-900'}`}>{mat.title}</h3>
                    </div>
                    <button className={`p-2 rounded-lg ${dark ? 'text-white/20 hover:text-white hover:bg-white/5' : 'text-zinc-300 hover:text-zinc-900 hover:bg-zinc-50'}`}>
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Practice Guides */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-white/40' : 'text-zinc-500'}`}>Practice Guides</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {practiceGuides.map(guide => (
                  <div key={guide.id} className={`p-5 rounded-3xl border transition-all ${dark ? 'bg-harbour-500/10 border-harbour-500/20' : 'bg-walnut-50 border-walnut-100'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-harbour-500/20 text-harbour-400' : 'bg-white text-walnut-600 shadow-sm'}`}>
                        <guide.icon size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`text-sm font-bold ${dark ? 'text-white' : 'text-zinc-900'}`}>{guide.title}</h3>
                          <span className={`text-[8px] font-mono uppercase tracking-widest ${dark ? 'text-white/30' : 'text-zinc-400'}`}>{guide.type}</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${dark ? 'text-white/60' : 'text-zinc-600'}`}>{guide.desc}</p>
                        <button className={`mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-harbour-400' : 'text-walnut-700'}`}>
                          <Download size={12} /> Download Guide
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Reschedule Modal */}
        <BottomSheet isOpen={showRescheduleModal} onClose={() => setShowRescheduleModal(false)}>
          <div className="px-6 pb-10">
            <h3 className="text-2xl font-serif-sturdy mb-2">Reschedule Session</h3>
            <p className="text-sm text-white/60 mb-8">Pick a new date and time for your session with Cikgu Ahmad.</p>
            
            <div className="space-y-6">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {dates.map((date, i) => (
                  <button 
                    key={i}
                    className={`flex-shrink-0 w-12 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${i === 2 ? 'bg-harbour-500 text-white' : 'bg-white/5 text-white/60'}`}
                  >
                    <span className="text-[8px] uppercase font-bold">{days[date.getDay()]}</span>
                    <span className="text-sm font-bold">{date.getDate()}</span>
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {['10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                  <button key={time} className={`py-3 rounded-xl border text-[10px] font-bold ${time === '14:00' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/40'}`}>
                    {time}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowRescheduleModal(false)}
                className="w-full py-5 bg-harbour-500 text-white font-bold rounded-full mt-4"
              >
                Confirm New Time
              </button>
            </div>
          </div>
        </BottomSheet>
      </div>
    );
  };

  const ChatConversation = ({ recipient, onBack, dark = true }: { recipient: any, onBack: () => void, dark?: boolean }) => {
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [chatMessages]);

    const handleSend = () => {
      if (!newMessage.trim()) return;
      const msg = {
        id: Date.now(),
        text: newMessage,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages([...chatMessages, msg]);
      setNewMessage('');

      // Simulate reply
      setTimeout(() => {
        const reply = {
          id: Date.now() + 1,
          text: "Thanks for the message! I'll get back to you soon.",
          sender: 'them',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, reply]);
      }, 1000);
    };

    return (
      <div className={`fixed inset-0 z-[150] flex flex-col ${dark ? 'bg-black text-white' : 'bg-white text-zinc-900'}`}>
        <div className={`px-5 pt-12 pb-4 flex items-center gap-4 border-b ${dark ? 'border-white/10' : 'border-zinc-100'}`}>
          <button onClick={onBack} className={`p-2 rounded-full ${dark ? 'bg-white/5 text-white' : 'bg-black/5 text-zinc-900'}`}>
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <img src={recipient.photo} className="w-10 h-10 rounded-xl object-cover" referrerPolicy="no-referrer" />
            <div>
              <h3 className="font-bold text-sm">{recipient.name}</h3>
              <p className="text-[10px] text-harbour-400 uppercase tracking-widest">
                {isStudent ? 'Mentor' : 'Student'} • Online
              </p>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {chatMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-10">
              <MessageSquare size={48} className="mb-4" />
              <p className="text-xs">Start a conversation with {recipient.name}</p>
            </div>
          )}
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-xs ${msg.sender === 'me' ? (dark ? 'bg-harbour-500 text-white rounded-tr-none' : 'bg-zinc-900 text-white rounded-tr-none') : (dark ? 'bg-white/10 text-white rounded-tl-none' : 'bg-zinc-100 text-zinc-900 rounded-tl-none')}`}>
                <p>{msg.text}</p>
                <p className={`text-[8px] mt-1 opacity-50 ${msg.sender === 'me' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={`p-5 pb-10 border-t ${dark ? 'border-white/10' : 'border-zinc-100'}`}>
          <div className="relative">
            <input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
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

  const StudentMessagesView = ({ forcedDark }: { forcedDark?: boolean }) => {
    const dark = forcedDark ?? isDark;
    
    // Use a subset of mentors for messages
    const messageMentors = MOCK_MENTORS.slice(0, 3);
    const lastMessages = [
      "Looking forward to our session on Friday!",
      "Did you manage to practice the new rhythm?",
      "I've uploaded the new materials for you."
    ];

    if (selectedChat) {
      return <ChatConversation recipient={selectedChat} onBack={() => setSelectedChat(null)} dark={dark} />;
    }

    return (
      <div className={`h-full flex flex-col pt-16 pb-20 ${dark ? 'bg-black text-white' : 'bg-white text-zinc-900'}`}>
        <div className="px-5 mb-6">
          <h1 className="text-3xl font-serif-sturdy mb-6">Mentor Messages</h1>
          <div className="relative">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/30' : 'text-zinc-400'}`} size={14} />
            <input className={`w-full border rounded-full pl-10 pr-4 py-3 text-xs focus:outline-none ${dark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'}`} placeholder="Search mentors..." />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-3">
          {messageMentors.map((mentor, i) => (
            <div 
              key={mentor.id} 
              onClick={() => setSelectedChat(mentor)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer ${dark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-zinc-100 shadow-sm hover:border-zinc-200'}`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={mentor.photo} className="w-12 h-12 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                  {i === 0 && <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 bg-harbour-500 rounded-full border-2 ${dark ? 'border-black' : 'border-white'}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold truncate">{mentor.name}</h3>
                      <span className="px-1.5 py-0.5 bg-harbour-500/10 text-harbour-400 text-[7px] font-bold rounded uppercase tracking-widest">Mentor</span>
                    </div>
                    <span className={`text-[8px] font-mono ${dark ? 'text-white/30' : 'text-zinc-400'}`}>10:45 AM</span>
                  </div>
                  <p className="text-[9px] text-harbour-400 uppercase tracking-widest mb-1">{mentor.specialisation[0]}</p>
                  <p className={`text-[11px] truncate ${dark ? 'text-white/40' : 'text-zinc-500'}`}>{lastMessages[i]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const StudentProfileView = () => {
    // Use the first mock student as the "current user" for this demo
    const currentUser = MOCK_STUDENTS[0];
    const [bio, setBio] = useState(currentUser.aboutMe || "Traditional music enthusiast learning the strings of Malaysia.");
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [showPaymentHistory, setShowPaymentHistory] = useState(false);

    // Filter transactions for this student
    const studentTransactions = MOCK_TRANSACTIONS.filter(t => t.studentId === currentUser.id);

    const learningInstruments = [
      { name: currentUser.instrument, icon: Music, level: currentUser.stage },
    ];

    return (
      <div className={`h-full overflow-y-auto pb-32 ${isDark ? 'bg-black' : 'bg-zinc-50'}`}>
        {/* Profile Header */}
        <header className={`relative px-6 pt-16 pb-8 overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-zinc-900'} text-white`}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-harbour-500/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl">
                <img 
                  src="https://picsum.photos/seed/student/400" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white text-zinc-900 rounded-xl flex items-center justify-center shadow-xl">
                <Camera size={14} />
              </button>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-serif-sturdy tracking-tight">{currentUser.name}</h1>
              <p className="text-[10px] text-white/40 font-medium tracking-widest uppercase">{currentUser.email}</p>
            </div>
          </div>
        </header>

        <div className="px-6 mt-8 space-y-8">
          {/* About Me Section */}
          <section className="space-y-4">
            <h2 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-zinc-500'}`}>About Me</h2>
            
            <div className={`p-5 rounded-[2rem] border ${isDark ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-zinc-400'}`}>Short Bio</p>
                  <button onClick={() => setIsEditingBio(!isEditingBio)} className={`text-harbour-500 hover:text-harbour-400 transition-colors`}>
                    {isEditingBio ? <Check size={16} /> : <Edit2 size={14} />}
                  </button>
                </div>
                {isEditingBio ? (
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className={`w-full bg-transparent text-sm leading-relaxed border-b border-harbour-500/50 focus:border-harbour-500 outline-none pb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}
                    autoFocus
                  />
                ) : (
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-zinc-600'}`} onClick={() => setIsEditingBio(true)}>
                    {bio}
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
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{currentUser.name}</p>
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
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{currentUser.email}</p>
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
              <button 
                onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                className={`w-full p-4 flex items-center justify-between border-b transition-colors ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-zinc-50 hover:bg-zinc-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5 text-white/40' : 'bg-zinc-50 text-zinc-400'}`}>
                    <History size={18} />
                  </div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Payment History</p>
                </div>
                <ChevronRight size={16} className={`text-zinc-400 transition-transform ${showPaymentHistory ? 'rotate-90' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showPaymentHistory && (
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
            onClick={() => { setIsAuth(false); setIsStudent(false); setView('registration'); }}
            className={`w-full py-5 font-bold rounded-[2rem] flex items-center justify-center gap-2 mt-4 transition-colors ${isDark ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-100'}`}
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </div>
    );
  };

  const AuthContainer = () => {
    const splashCards = [
      {
        title: "Discover Malaysia's Musical Roots",
        image: "https://picsum.photos/seed/sape/800/1200",
        desc: "Explore the rich heritage of traditional instruments from Sape to Gamelan."
      },
      {
        title: "Learn From Real Masters",
        image: "https://picsum.photos/seed/mentor/800/1200",
        desc: "Connect with certified mentors who carry the legacy of Malaysian music."
      },
      {
        title: "Your Cultural Journey Starts Here",
        image: "https://picsum.photos/seed/culture/800/1200",
        desc: "Begin your path to mastering the sounds of our homeland."
      }
    ];

    const SplashView = () => (
      <div className="relative h-screen w-full overflow-hidden bg-black">
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
                src={splashCards[splashIndex].image} 
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
              className="w-full bg-white text-black font-bold py-5 rounded-[2rem] shadow-xl active:scale-95 transition-transform"
            >
              Get Started
            </button>
            <button 
              onClick={() => setAuthView('sign-in')}
              className="w-full bg-transparent text-white border border-white/20 font-bold py-5 rounded-[2rem] active:scale-95 transition-transform"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );

    const RoleSelectionView = () => (
      <div className={`min-h-screen p-8 flex flex-col ${isDark ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>
        <button onClick={() => setAuthView('splash')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-12">
          <ChevronLeft size={20} />
        </button>

        <div className="mb-12">
          <h2 className="text-3xl font-serif-sturdy mb-2">I want to join as...</h2>
          <p className="text-zinc-500 text-sm">Choose your path in the musical journey.</p>
        </div>

        <div className="space-y-4 flex-1">
          <button 
            onClick={() => { setUserRole('student'); setAuthView('student-registration'); }}
            className={`w-full p-8 rounded-[2.5rem] border-2 text-left transition-all group ${isDark ? 'bg-zinc-900 border-white/5 hover:border-harbour-500' : 'bg-white border-zinc-100 hover:border-harbour-500 shadow-sm'}`}
          >
            <div className="w-14 h-14 bg-harbour-100 text-harbour-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">Student</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">Learn traditional instruments from verified masters and track your progress.</p>
          </button>

          <button 
            onClick={() => { setUserRole('mentor'); setAuthView('mentor-registration'); }}
            className={`w-full p-8 rounded-[2.5rem] border-2 text-left transition-all group ${isDark ? 'bg-zinc-900 border-white/5 hover:border-walnut-500' : 'bg-white border-zinc-100 hover:border-walnut-500 shadow-sm'}`}
          >
            <div className="w-14 h-14 bg-walnut-100 text-walnut-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <User size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">Mentor</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">Share your expertise, manage students, and preserve our musical heritage.</p>
          </button>
        </div>
      </div>
    );

    const RegistrationView = ({ role }: { role: 'student' | 'mentor' }) => (
      <div className={`min-h-screen p-8 flex flex-col ${isDark ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>
        <button onClick={() => setAuthView('role-selection')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-12">
          <ChevronLeft size={20} />
        </button>

        <div className="mb-10">
          <h2 className="text-3xl font-serif-sturdy mb-2">{role === 'student' ? 'Student Registration' : 'Mentor Registration'}</h2>
          <p className="text-zinc-500 text-sm">Join the Maestro community today.</p>
        </div>

        <form className="space-y-5" onSubmit={(e) => { 
          e.preventDefault(); 
          setIsAuth(true); 
          if (role === 'student') {
            setIsStudent(true);
            setStudentView('home');
          } else {
            setIsStudent(false);
            setView('home');
          }
        }}>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Full Name</label>
            <input type="text" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="Julian Vane" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Email Address</label>
            <input type="email" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="julian@example.com" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Password</label>
            <input type="password" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="••••••••" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Phone Number</label>
            <input type="tel" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="+60 12 345 6789" required />
          </div>

          <button className={`w-full font-bold py-5 rounded-[2rem] mt-4 shadow-xl active:scale-95 transition-transform ${role === 'student' ? 'bg-harbour-500 text-white' : 'bg-zinc-900 text-white'}`}>
            {role === 'student' ? 'Create Account' : 'Register'}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className={`px-4 ${isDark ? 'bg-black text-zinc-500' : 'bg-zinc-50 text-zinc-400'}`}>Or</span>
            </div>
          </div>

          <button 
            type="button"
            className={`w-full border font-bold py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'}`}
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
            Continue with Google
          </button>
        </form>
      </div>
    );

    const SignInView = () => {
      const [roleTab, setRoleTab] = useState<'student' | 'mentor'>('student');
      return (
        <div className={`min-h-screen p-8 flex flex-col ${isDark ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>
          <button onClick={() => setAuthView('splash')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-12">
            <ChevronLeft size={20} />
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-serif-sturdy mb-2">Welcome Back</h2>
            <p className="text-zinc-500 text-sm">Sign in to continue your journey.</p>
          </div>

          {/* Role Tabs */}
          <div className={`flex p-1 rounded-2xl mb-8 ${isDark ? 'bg-white/5' : 'bg-zinc-200/50'}`}>
            <button 
              onClick={() => setRoleTab('student')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${roleTab === 'student' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
            >
              Student
            </button>
            <button 
              onClick={() => setRoleTab('mentor')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${roleTab === 'mentor' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
            >
              Mentor
            </button>
          </div>

          <form className="space-y-5" onSubmit={(e) => { 
            e.preventDefault(); 
            setIsAuth(true); 
            if (roleTab === 'student') {
              setIsStudent(true);
              setStudentView('home');
            } else {
              setIsStudent(false);
              setView('home');
            }
          }}>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Email Address</label>
              <input type="email" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="julian@example.com" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Password</label>
              <input type="password" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="••••••••" required />
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

            <button className={`w-full font-bold py-5 rounded-[2rem] mt-4 shadow-xl active:scale-95 transition-transform ${roleTab === 'student' ? 'bg-harbour-500 text-white' : 'bg-zinc-900 text-white'}`}>
              Sign In
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className={`px-4 ${isDark ? 'bg-black text-zinc-500' : 'bg-zinc-50 text-zinc-400'}`}>Or</span>
              </div>
            </div>

            <button 
              type="button"
              className={`w-full border font-bold py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'}`}
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
              Continue with Google
            </button>
          </form>
        </div>
      );
    };

    const ForgotPasswordView = () => {
      const [sent, setSent] = useState(false);
      return (
        <div className={`min-h-screen p-8 flex flex-col ${isDark ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>
          <button onClick={() => setAuthView('sign-in')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-12">
            <ChevronLeft size={20} />
          </button>

          <div className="mb-10">
            <h2 className="text-3xl font-serif-sturdy mb-2">Forgot Password</h2>
            <p className="text-zinc-500 text-sm">Enter your email to receive a reset link.</p>
          </div>

          {!sent ? (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Email Address</label>
                <input type="email" className={`w-full border rounded-2xl px-6 py-4 focus:outline-none ${isDark ? 'bg-white/5 border-white/10 focus:border-harbour-500' : 'bg-white border-zinc-200 focus:border-harbour-500'}`} placeholder="julian@example.com" required />
              </div>
              <button className="w-full bg-zinc-900 text-white font-bold py-5 rounded-[2rem] shadow-xl active:scale-95 transition-transform">
                Send Reset Link
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Email Sent!</h3>
                <p className="text-zinc-500 text-sm">We've sent a password reset link to your email address.</p>
              </div>
              <button 
                onClick={() => setAuthView('reset-password')}
                className="w-full bg-zinc-900 text-white font-bold py-5 rounded-[2rem]"
              >
                Proceed to Reset (Demo)
              </button>
            </div>
          )}

          <div className="mt-auto text-center">
            <button onClick={() => setAuthView('sign-in')} className="text-xs font-bold text-zinc-400 hover:text-zinc-900">
              Back to Sign In
            </button>
          </div>
        </div>
      );
    };

    const ResetPasswordView = () => (
      <div className={`min-h-screen p-8 flex flex-col ${isDark ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>
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
          <button className="w-full bg-harbour-600 text-white font-bold py-5 rounded-[2rem] shadow-xl active:scale-95 transition-transform">
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
    <div className="px-5 pt-12 pb-24">
      {/* Header - More Compact */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className={`text-[9px] font-mono uppercase tracking-widest ${isDark ? 'opacity-40' : 'text-zinc-500'}`}>Welcome,</h2>
          <h1 className={`text-xl font-serif-curvy italic ${isDark ? 'text-white' : 'text-zinc-900'}`}>Dr. Julian</h1>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <button className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-zinc-900'}`}>
            <Bell size={16} />
          </button>
          <img src="https://picsum.photos/seed/mentor/100" className={`w-8 h-8 rounded-full object-cover border ${isDark ? 'border-white/20' : 'border-black/10'}`} referrerPolicy="no-referrer" />
        </div>
      </div>

      {/* Profile Progress - Smaller */}
      {profileProgress < 100 && (
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/10 p-3 rounded-2xl mb-4 flex items-center gap-3"
        >
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-[8px] font-mono uppercase tracking-widest font-bold">Profile {profileProgress}%</span>
            </div>
            <ProgressBar progress={profileProgress} className="bg-white/5 h-1" />
          </div>
          <button onClick={() => setView('profile')} className="p-1.5 bg-white text-black rounded-full">
            <Plus size={12} />
          </button>
        </motion.div>
      )}

      {/* Tabs Toggle */}
      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-full">
        <button 
          onClick={() => setHomeTab('today')}
          className={`flex-1 py-2 rounded-full text-[9px] font-bold transition-all ${homeTab === 'today' ? 'bg-white text-black' : 'text-white/40'}`}
        >
          Today
        </button>
        <button 
          onClick={() => setHomeTab('pending')}
          className={`flex-1 py-2 rounded-full text-[9px] font-bold transition-all ${homeTab === 'pending' ? 'bg-white text-black' : 'text-white/40'}`}
        >
          Pending
        </button>
      </div>

      {homeTab === 'pending' ? (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h2 className="text-[9px] uppercase tracking-widest font-bold text-white/40 mb-3 flex items-center gap-2">
            Requests <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
          </h2>
          <div className="space-y-3">
            {MOCK_LESSONS.filter(l => l.status === 'pending').map(request => {
              const student = MOCK_STUDENTS.find(s => s.id === request.studentId);
              return (
                <div key={request.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3 items-center">
                      {/* Student Photo */}
                      <img 
                        src={student?.photo || `https://picsum.photos/seed/${request.studentId}/100`} 
                        className="w-10 h-10 rounded-full object-cover border border-white/10" 
                        referrerPolicy="no-referrer"
                        alt={request.studentName}
                      />
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-medium truncate">{request.studentName}</h3>
                          <Badge variant={request.type === 'Trial' ? 'gold' : request.type === 'Monthly' ? 'harbour' : 'outline'}>
                            {request.type}
                          </Badge>
                        </div>
                        <p className="text-white/40 text-[9px] truncate">{request.instrument}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveLessonAction(request)}
                      className="p-1 text-white/40"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  {/* Requested Time Slot */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/10 w-8 h-8 rounded-lg flex items-center justify-center text-white/60">
                        <Calendar size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-tighter text-white/60">
                          {new Date(request.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm font-serif-curvy italic leading-none mt-0.5">{request.time}</p>
                      </div>
                    </div>
                    {request.countdown && (
                      <div className="text-right">
                        <p className="text-[8px] font-mono uppercase tracking-widest text-red-400/60">Expires in</p>
                        <p className="text-[10px] font-bold text-red-400">{request.countdown}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const student = MOCK_STUDENTS.find(s => s.id === request.studentId);
                        if (student) {
                          setSelectedChat(student);
                          setView('messages');
                        }
                      }}
                      className="w-12 bg-white/5 border border-white/10 text-white flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button className="flex-1 bg-harbour-600 text-white text-[10px] font-bold py-3 rounded-full hover:bg-harbour-500 transition-colors">
                      Accept Request
                    </button>
                    <button className="flex-1 border border-white/10 text-white text-[10px] font-bold py-3 rounded-full hover:bg-white/5 transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[9px] uppercase tracking-widest font-bold text-white/40">Schedule</h2>
            <button 
              onClick={() => setView('full-schedule')}
              className="text-[9px] font-bold text-harbour-500 hover:text-harbour-400 transition-colors flex items-center gap-1"
            >
              See all <ChevronRight size={10} />
            </button>
          </div>
          <div className="space-y-3">
            {MOCK_LESSONS.filter(l => l.status === 'confirmed').map(lesson => {
              const student = MOCK_STUDENTS.find(s => s.id === lesson.studentId);
              return (
                <div key={lesson.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl relative group active:scale-[0.98] transition-transform">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3 items-center">
                      {/* Student Photo */}
                      <div className="relative">
                        <img 
                          src={student?.photo || `https://picsum.photos/seed/${lesson.studentId}/100`} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shadow-lg" 
                          referrerPolicy="no-referrer"
                          alt={lesson.studentName}
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-harbour-600 border-2 border-[#0A0A0A] rounded-full shadow-sm" />
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold tracking-tight truncate">{lesson.studentName}</h3>
                          <Badge variant={lesson.type === 'Trial' ? 'gold' : lesson.type === 'Monthly' ? 'harbour' : 'outline'}>
                            {lesson.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-white/40 text-[10px]">
                          <span className="font-medium">{lesson.instrument}</span>
                          <span className="w-1 h-1 bg-white/20 rounded-full" />
                          <span>{new Date(lesson.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveLessonAction(lesson)}
                      className="p-2 -mr-2 text-white/30 hover:text-white transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                  
                  {/* Time & Schedule Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 flex items-center gap-3">
                      <div className="text-white/40">
                        <Clock size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-white/30 leading-none mb-1">Scheduled Time</span>
                        <span className="text-xs font-serif-curvy italic text-white/90">{lesson.time}</span>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-mono uppercase tracking-widest text-white/30 mb-1">Lesson</span>
                      <span className="text-xs font-bold text-white/80">#{lesson.lessonNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-harbour-600 rounded-full shadow-[0_0_8px_rgba(131,72,54,0.4)]" />
                      <span className="text-[9px] font-bold text-harbour-500/80 uppercase tracking-tight">Confirmed</span>
                    </div>
                    <button 
                      onClick={() => setView('log-session')}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-harbour-500 hover:text-harbour-400 transition-colors bg-walnut-50 px-3 py-1.5 rounded-full"
                    >
                      <Plus size={12} /> Log Session
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );

  const FullScheduleView = () => (
    <div className="px-5 pt-12 pb-24 min-h-full bg-[#0A0A0A] text-white">
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
        {MOCK_LESSONS
          .filter(l => l.status === 'confirmed')
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
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(lesson => {
            const student = MOCK_STUDENTS.find(s => s.id === lesson.studentId);
            return (
              <div key={lesson.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <img 
                      src={student?.photo || `https://picsum.photos/seed/${lesson.studentId}/100`} 
                      className="w-10 h-10 rounded-full object-cover border border-white/10" 
                      referrerPolicy="no-referrer"
                      alt={lesson.studentName}
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold truncate">{lesson.studentName}</h3>
                      <p className="text-white/40 text-[9px] truncate">{lesson.instrument}</p>
                    </div>
                  </div>
                  <Badge variant={lesson.type === 'Trial' ? 'gold' : lesson.type === 'Monthly' ? 'harbour' : 'outline'}>
                    {lesson.type}
                  </Badge>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 w-8 h-8 rounded-lg flex items-center justify-center text-white/40">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-tighter text-white/60">
                        {new Date(lesson.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs font-serif-curvy italic text-white/90">{lesson.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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
                    <div className="text-right">
                      <p className="text-[8px] font-mono uppercase tracking-widest text-white/30">Lesson</p>
                      <p className="text-xs font-bold text-white/80">#{lesson.lessonNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const StudentsView = () => (
    <div className="px-5 pt-12 pb-24">
      <header className="mb-4">
        <span className="text-[8px] uppercase tracking-[0.3em] font-mono font-semibold text-zinc-400 mb-1 block">Roster</span>
        <h1 className="text-2xl font-serif-sturdy">Active Students</h1>
      </header>

      {/* Filters - Horizontal Scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide -mx-5 px-5">
        {['All', 'Trial', 'Single', 'Package'].map((tab, i) => (
          <button key={tab} className={`px-3 py-1 rounded-full text-[9px] font-bold whitespace-nowrap transition-all ${i === 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* List - Compact Cards */}
      <div className="space-y-2">
        {MOCK_STUDENTS.map(student => (
          <motion.div 
            key={student.id}
            onClick={() => { setSelectedStudent(student); setView('student-detail'); }}
            className="bg-white border border-zinc-100 p-3 rounded-xl flex items-center gap-3"
          >
            <img src={student.photo} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="text-xs font-bold truncate">{student.name}</h3>
                <Badge variant="outline">{student.lessonsRemaining}</Badge>
              </div>
              <p className="text-zinc-400 text-[8px] truncate">{student.instrument}</p>
              <div className="mt-1.5">
                <ProgressBar progress={student.progress} className="h-0.5" />
              </div>
            </div>
            <ChevronRight size={12} className="text-zinc-300" />
          </motion.div>
        ))}
      </div>
    </div>
  );

  const MessagesView = () => {
    if (selectedChat) {
      return <ChatConversation recipient={selectedChat} onBack={() => setSelectedChat(null)} dark={true} />;
    }

    return (
      <div className="h-full flex flex-col pt-16 pb-20">
        <div className="px-5 mb-4">
          <h1 className="text-2xl font-serif-curvy italic mb-4">Student Messages</h1>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={14} />
            <input className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs focus:outline-none" placeholder="Search students..." />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-2">
          {MOCK_STUDENTS.map((student, i) => (
            <div 
              key={student.id} 
              onClick={() => setSelectedChat(student)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${i === 0 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5'}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img src={student.photo} className="w-9 h-9 rounded-lg object-cover" referrerPolicy="no-referrer" />
                  {i === 0 && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white border-2 border-black rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold truncate">{student.name}</h3>
                      <span className="px-1 py-0.5 bg-white/10 text-white/40 text-[6px] font-bold rounded uppercase tracking-widest">Student</span>
                    </div>
                    <span className="text-[7px] font-mono text-white/30">12:45</span>
                  </div>
                  <p className="text-[9px] text-white/50 truncate">Thanks for the feedback!</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const WalletView = () => {
    const handleWithdraw = async () => {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0 || amount > balance) return;

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
      setBalance(balance - amount);
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
      <div className="px-5 pt-12 pb-24 bg-zinc-50 min-h-full">
        <header className="mb-6">
          <span className="text-[8px] uppercase tracking-[0.3em] font-mono font-semibold text-zinc-400 mb-1 block">Financials</span>
          <h1 className="text-2xl font-serif-sturdy text-zinc-900">Wallet</h1>
        </header>

        <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <p className="text-[9px] font-mono uppercase tracking-widest opacity-50 mb-1">Available Balance</p>
          <p className="text-4xl font-serif-sturdy mb-6">RM {balance.toLocaleString()}</p>
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="w-full py-4 bg-white text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
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
              className="fixed top-12 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-[320px]"
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

        <section>
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

              <div className="space-y-3">
                {transactions.map(t => (
                  <div key={t.id} className="bg-white border border-zinc-100 p-4 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img src={t.studentPhoto} className="w-10 h-10 rounded-xl object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <p className="text-[11px] font-bold text-zinc-900">{t.studentName}</p>
                          <p className="text-[9px] text-zinc-400">{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {t.lessonType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-serif-sturdy text-walnut-600">+RM {t.netAmount}</p>
                        <p className="text-[8px] text-zinc-400">Net Credited</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-zinc-50 flex justify-between items-center">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[7px] uppercase tracking-widest text-zinc-400 font-bold">Gross</p>
                          <p className="text-[9px] font-medium text-zinc-600">RM {t.grossAmount}</p>
                        </div>
                        <div>
                          <p className="text-[7px] uppercase tracking-widest text-zinc-400 font-bold">Fee (15%)</p>
                          <p className="text-[9px] font-medium text-red-400">-RM {t.platformFee}</p>
                        </div>
                      </div>
                      <button className="p-1.5 text-zinc-300 hover:text-zinc-900">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
            <div className="fixed inset-0 z-[200] flex items-end justify-center">
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
                          <span className="text-[10px] font-bold text-zinc-900">RM {balance.toLocaleString()}</span>
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
                        disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > balance}
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
    const setupItems = [
      { id: 'video', label: 'Intro Video', icon: Video, status: 'warning', desc: 'Introduce yourself to students' },
      { id: 'bio', label: 'About & Bio', icon: User, status: 'success', desc: 'Your professional background' },
      { id: 'skills', label: 'Specialisation', icon: Music2, status: 'success', desc: 'What you teach best' },
      { id: 'pricing', label: 'Pricing', icon: Wallet, status: 'warning', desc: 'Set your hourly rates' },
      { id: 'availability', label: 'Availability', icon: Calendar, status: 'success', desc: 'When you are free' },
      { id: 'path', label: 'Learning Path', icon: BookOpen, status: 'success', desc: 'Your teaching methodology' },
      { id: 'location', label: 'Location', icon: MapPin, status: 'warning', desc: 'Where lessons happen' },
      { id: 'gallery', label: 'Gallery', icon: ImageIcon, status: 'success', desc: 'Photos of your studio' },
    ];

    return (
      <div className="h-full bg-zinc-50 overflow-y-auto pb-32">
        {/* Premium Header */}
        <header className="relative px-6 pt-16 pb-12 bg-zinc-900 text-white overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-harbour-500/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full -ml-32 -mb-32 blur-[80px]" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://picsum.photos/seed/mentor/400" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-zinc-900 rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-transform">
                <Camera size={18} />
              </button>
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
                <p className="text-xl font-serif-sturdy">4.9</p>
                <p className="text-[8px] uppercase tracking-widest text-white/30 font-bold">Rating</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-xl font-serif-sturdy">12</p>
                <p className="text-[8px] uppercase tracking-widest text-white/30 font-bold">Students</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-xl font-serif-sturdy">156</p>
                <p className="text-[8px] uppercase tracking-widest text-white/30 font-bold">Lessons</p>
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 -mt-8 relative z-20">
          {/* Profile Completion Banner - Glassmorphism */}
          <section className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-xl border border-white/20 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Profile Strength</h3>
                <p className="text-xl font-serif-sturdy text-zinc-900">60% Complete</p>
              </div>
              <button className="text-[9px] font-bold text-walnut-600 uppercase tracking-widest bg-walnut-50 px-4 py-2.5 rounded-2xl hover:bg-walnut-100 transition-colors">
                Complete Now
              </button>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                className="h-full bg-gradient-to-r from-harbour-400 to-harbour-600 rounded-full"
              />
            </div>
          </section>

          {/* Main Actions - Bento Style */}
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => setShowSetupDetails(true)}
              className="group relative overflow-hidden p-6 bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                    <Settings size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-bold text-zinc-900">Setup & Details</p>
                    <p className="text-xs text-zinc-400">Configure your professional profile</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:text-zinc-900 transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
            </button>

            <button className="group relative overflow-hidden p-6 bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
                    <Award size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-bold text-zinc-900">Credentials & ID</p>
                    <p className="text-xs text-zinc-400">Manage your certifications</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:text-zinc-900 transition-colors">
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
              {[
                { icon: Bell, label: 'Notifications', color: 'text-blue-500', bg: 'bg-blue-50' },
                { icon: FileText, label: 'Rules & Information', color: 'text-zinc-400', bg: 'bg-zinc-50' },
              ].map((item, i) => (
                <button 
                  key={i} 
                  className={`w-full p-5 flex items-center justify-between hover:bg-zinc-50 transition-colors ${i !== 1 ? 'border-b border-zinc-50' : ''}`}
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
              onClick={() => { setIsAuth(false); setView('registration'); }}
              className="w-full mt-6 p-6 flex items-center justify-center gap-3 bg-red-50 text-red-600 rounded-[2rem] font-bold text-sm active:scale-95 transition-all"
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
              className="fixed inset-0 z-[200] bg-white flex flex-col"
            >
              <header className="px-6 pt-16 pb-6 flex items-center justify-between">
                <button onClick={() => setIsEditingProfile(false)} className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center active:scale-90 transition-transform">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-serif-sturdy">Edit Profile</h2>
                <div className="w-12" />
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {[
                  { label: 'Full Name', value: mentorProfile.name, key: 'name', type: 'text' },
                  { label: 'Email Address', value: mentorProfile.email, key: 'email', type: 'email' },
                  { label: 'Phone Number', value: mentorProfile.phone, key: 'phone', type: 'tel' },
                  { label: 'Location', value: mentorProfile.location, key: 'location', type: 'text' },
                ].map((field) => (
                  <div key={field.key} className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 ml-1">{field.label}</label>
                    <input 
                      type={field.type} 
                      value={field.value}
                      onChange={(e) => setMentorProfile({...mentorProfile, [field.key]: e.target.value})}
                      className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-[1.5rem] text-sm font-medium focus:outline-none focus:ring-4 ring-zinc-900/5 focus:bg-white transition-all"
                    />
                  </div>
                ))}
              </div>

              <div className="p-8 bg-white border-t border-zinc-50">
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="w-full py-5 bg-zinc-900 text-white text-sm font-bold rounded-full shadow-2xl active:scale-95 transition-transform"
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
              className="fixed inset-0 z-[200] bg-zinc-50 flex flex-col"
            >
              <header className="px-6 pt-16 pb-6 bg-white flex items-center justify-between shadow-sm">
                <button onClick={() => setShowSetupDetails(false)} className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center active:scale-90 transition-transform">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-serif-sturdy">Setup & Details</h2>
                <div className="w-12" />
              </header>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-3">
                  {setupItems.map((item) => (
                    <button key={item.id} className="w-full p-5 bg-white rounded-[2.5rem] border border-zinc-100 flex items-center justify-between group active:scale-[0.98] transition-all shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 ${item.status === 'success' ? 'bg-walnut-50 text-walnut-600' : 'bg-amber-50 text-amber-600'} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                          <item.icon size={24} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-zinc-900">{item.label}</p>
                          <p className="text-[10px] text-zinc-400">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {item.status === 'success' ? (
                          <div className="w-8 h-8 bg-walnut-100 text-walnut-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={16} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center animate-pulse">
                            <AlertCircle size={16} />
                          </div>
                        )}
                        <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  const LogSessionView = () => (
    <div className="px-5 pt-16 pb-24 bg-white text-zinc-900 min-h-screen">
      <button onClick={() => setView('home')} className="flex items-center gap-1 text-zinc-400 mb-6 text-[10px] uppercase tracking-widest font-bold">
        <ChevronLeft size={14} /> Back
      </button>
      
      <header className="mb-8">
        <Badge variant="gold">Lesson #5</Badge>
        <h1 className="text-2xl font-serif-sturdy mt-2 text-zinc-900">Sarah Jenkins</h1>
        <p className="text-zinc-400 text-[10px]">Piano • Advanced Harmony</p>
      </header>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Covered</label>
          <textarea 
            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-xs min-h-[80px] focus:outline-none text-zinc-900"
            placeholder="Topics explored..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Next Focus</label>
          <textarea 
            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-xs min-h-[60px] focus:outline-none text-zinc-900"
            placeholder="Preparation..."
          />
        </div>

        <div className="space-y-3">
          <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Milestones</label>
          <div className="grid grid-cols-1 gap-2">
            {['Secondary Dominants', 'Chromatic Alteration'].map(m => (
              <label key={m} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded-full border-zinc-300" />
                <span className="text-[10px] font-medium text-zinc-900">{m}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
            <Paperclip size={18} />
          </button>
          <button 
            onClick={() => setView('home')}
            className="flex-1 bg-zinc-900 text-white text-xs font-bold py-4 rounded-full"
          >
            Save & Log
          </button>
        </div>
      </div>
    </div>
  );

  const StudentDetailView = () => {
    if (!selectedStudent) return null;
    const studentLogs = MOCK_SESSION_LOGS.filter(log => log.studentId === selectedStudent.id);
    const studentMaterials = MOCK_MATERIALS.filter(mat => mat.studentId === selectedStudent.id);

    const toggleMilestone = (milestoneId: string) => {
      if (!selectedStudent || !selectedStudent.learningPath) return;
      const newPath = selectedStudent.learningPath.map(m => {
        if (m.id === milestoneId) {
          return { ...m, status: m.status === 'completed' ? 'upcoming' : 'completed' } as Milestone;
        }
        return m;
      });
      setSelectedStudent({ ...selectedStudent, learningPath: newPath });
    };

    return (
      <div className="px-5 pt-16 pb-24 bg-zinc-50 min-h-full">
        <button onClick={() => setView('students')} className="flex items-center gap-1 text-zinc-400 mb-6 text-[10px] uppercase tracking-widest font-bold">
          <ChevronLeft size={14} /> Back to Roster
        </button>

        <header className="mb-8 flex gap-5 items-center">
          <div className="relative">
            <img src={selectedStudent.photo} className="w-24 h-24 rounded-[2rem] object-cover shadow-xl border-4 border-white" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex gap-1.5 mb-2">
              <Badge variant="gold">{selectedStudent.package}</Badge>
              <Badge variant="outline">Active</Badge>
            </div>
            <h1 className="text-2xl font-serif-sturdy text-zinc-900 leading-tight">{selectedStudent.name}</h1>
            <p className="text-xs text-zinc-500 font-medium">{selectedStudent.instrument} • {selectedStudent.stage}</p>
          </div>
        </header>

        <div className="space-y-10">
          {/* Section 1 — Learning Path */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Learning Path</h2>
              <button className="text-[10px] font-bold text-zinc-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full shadow-sm border border-zinc-100">
                <Edit2 size={10} /> Edit Path
              </button>
            </div>
            
            <div className="relative pl-8 space-y-6">
              {/* Vertical Line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-zinc-200" />
              
              {(selectedStudent.learningPath || []).map((milestone, i) => (
                <div key={milestone.id} className="relative">
                  {/* Milestone Dot */}
                  <button 
                    onClick={() => toggleMilestone(milestone.id)}
                    className={`absolute -left-[29px] top-1.5 w-5 h-5 rounded-full border-4 border-zinc-50 flex items-center justify-center z-10 transition-all active:scale-90 ${
                      milestone.status === 'completed' ? 'bg-harbour-500' : 
                      milestone.status === 'current' ? 'bg-zinc-900' : 'bg-zinc-300'
                    }`}
                  >
                    {milestone.status === 'completed' && <CheckCircle2 size={10} className="text-white" />}
                  </button>

                  <div 
                    onClick={() => toggleMilestone(milestone.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${
                      milestone.status === 'completed' ? 'bg-white border-walnut-100 opacity-60' : 
                      milestone.status === 'current' ? 'bg-white border-zinc-900 shadow-md ring-1 ring-zinc-900' : 
                      'bg-white border-zinc-100 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-400 mb-0.5">Stage {i + 1}</span>
                        <span className="text-xs font-bold text-zinc-900">{milestone.title}</span>
                      </div>
                      <button className="p-1.5 text-zinc-300 hover:text-zinc-900 transition-colors">
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-2xl flex items-center justify-center gap-2 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-all">
                <Plus size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Add New Stage</span>
              </button>
            </div>
          </section>

          {/* Section 2 — Session Logs */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Session Logs</h2>
              <button className="text-[10px] font-bold text-walnut-600 flex items-center gap-1 bg-walnut-50 px-3 py-1.5 rounded-full border border-walnut-100">
                <Plus size={12} /> Add Manual Log
              </button>
            </div>

            <div className="space-y-4">
              {studentLogs.map(log => (
                <div key={log.id} className="bg-white border border-zinc-100 rounded-[1.5rem] p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="gold">Lesson #{log.lessonNumber}</Badge>
                        <span className="text-[10px] font-mono text-zinc-400">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <button className="p-2 -mr-2 text-zinc-300 hover:text-zinc-900">
                      <Edit2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[8px] uppercase tracking-widest font-bold text-zinc-400 mb-1.5">What was covered</p>
                      <p className="text-[11px] text-zinc-600 leading-relaxed">{log.covered}</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase tracking-widest font-bold text-zinc-400 mb-1.5">Practice Focus</p>
                      <p className="text-[11px] font-serif-curvy italic text-zinc-900 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">{log.focus}</p>
                    </div>
                    
                    {log.milestones.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {log.milestones.map(mId => {
                          const m = selectedStudent.learningPath?.find(lp => lp.id === mId);
                          return m ? <span key={mId} className="text-[8px] font-bold bg-walnut-50 text-walnut-700 px-2 py-1 rounded-full border border-walnut-100 flex items-center gap-1">
                            <CheckCircle2 size={8} /> {m.title}
                          </span> : null;
                        })}
                      </div>
                    )}

                    {log.materials.length > 0 && (
                      <div className="pt-3 border-t border-zinc-50 flex gap-2 overflow-x-auto scrollbar-hide">
                        {log.materials.map(matId => {
                          const mat = studentMaterials.find(m => m.id === matId);
                          return mat ? (
                            <div key={matId} className="flex items-center gap-2 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100 min-w-max">
                              <FileText size={12} className="text-zinc-400" />
                              <span className="text-[9px] font-medium text-zinc-600">{mat.title}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 — Materials */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Materials</h2>
              <button className="text-[10px] font-bold text-zinc-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full shadow-sm border border-zinc-100">
                <Upload size={12} /> Upload New
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {studentMaterials.map(mat => (
                <div key={mat.id} className="bg-white border border-zinc-100 p-4 rounded-2xl flex items-center gap-4 group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mat.type === 'Notes' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {mat.type === 'Notes' ? <FileText size={18} /> : <BookOpen size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[8px] font-mono uppercase tracking-widest opacity-40">{mat.type}</span>
                      <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                      <span className="text-[8px] font-mono text-zinc-400">Lesson #{mat.lessonId?.replace('l', '')}</span>
                    </div>
                    <h3 className="text-xs font-bold text-zinc-900 truncate">{mat.title}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-zinc-300 hover:text-zinc-900"><Edit2 size={12} /></button>
                    <button className="p-2 text-zinc-300 hover:text-zinc-900"><Move size={12} /></button>
                    <button className="p-2 text-zinc-300 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 — Package Details */}
          <section className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-6">Package Details</h2>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1">Type</p>
                <p className="text-lg font-serif-sturdy">{selectedStudent.package}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1">Status</p>
                <p className="text-lg font-serif-sturdy text-harbour-400">Active</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1">Progress</p>
                  <p className="text-2xl font-serif-sturdy">
                    {selectedStudent.totalLessons ? selectedStudent.totalLessons - selectedStudent.lessonsRemaining : 0} 
                    <span className="text-sm text-white/30 font-sans ml-1">/ {selectedStudent.totalLessons || 8} lessons</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1">Remaining</p>
                  <p className="text-2xl font-serif-sturdy text-amber-400">{selectedStudent.lessonsRemaining}</p>
                </div>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000" 
                  style={{ width: `${((selectedStudent.totalLessons ? selectedStudent.totalLessons - selectedStudent.lessonsRemaining : 0) / (selectedStudent.totalLessons || 8)) * 100}%` }}
                />
              </div>
            </div>

            <button className="w-full mt-8 py-4 bg-white text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-xl active:scale-95 transition-transform">
              Renew Package
            </button>
          </section>

          {/* Section 5 — Notes About This Student */}
          <section className="bg-amber-50/50 border border-amber-100 p-8 rounded-[2.5rem]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                  <FileText size={16} />
                </div>
                <h2 className="text-[10px] uppercase tracking-widest font-bold text-amber-900/40">Private Mentor Notes</h2>
              </div>
              <button className="p-2 text-amber-900/20 hover:text-amber-900/60 transition-colors">
                <Edit2 size={16} />
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-200/50 rounded-full" />
              <p className="text-xs text-amber-900/70 leading-relaxed font-medium italic">
                "{selectedStudent.privateNotes || 'No private notes yet. Add some to track student preferences and learning style.'}"
              </p>
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-[8px] font-bold text-amber-900/30 uppercase tracking-widest">
              <CheckCircle2 size={10} />
              Only visible to you
            </div>
          </section>
        </div>
      </div>
    );
  };

  // --- Main Render ---

  return (
    <div className={`h-screen font-sans transition-colors duration-500 overflow-hidden ${isDark ? 'bg-black text-white' : 'bg-white text-zinc-900'}`}>
      <div className="max-w-md mx-auto h-full relative overflow-hidden flex flex-col">
        {!isAuth ? (
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
                      onClick={() => setActiveLessonAction(null)}
                      className="w-full flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Calendar size={16} className="text-zinc-400" />
                      </div>
                      <span className="text-sm font-bold">Reschedule</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveLessonAction(null)}
                      className="w-full flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <XCircle size={16} className="text-red-400" />
                      </div>
                      <span className="text-sm font-bold">Cancel Lesson</span>
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
          {profileProgress === 100 && (
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
                  onClick={() => setProfileProgress(101)}
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
              className="flex-1 overflow-y-auto scrollbar-hide pb-32"
            >
              {view === 'home' && HomeView()}
              {view === 'full-schedule' && FullScheduleView()}
              {view === 'students' && StudentsView()}
              {view === 'messages' && MessagesView()}
              {view === 'wallet' && WalletView()}
              {view === 'profile' && ProfileView()}
              {view === 'log-session' && LogSessionView()}
              {view === 'student-detail' && StudentDetailView()}
            </motion.main>
          </AnimatePresence>

          {/* Mobile Nav */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%]">
            <div className={`backdrop-blur-2xl border rounded-[2rem] px-2 py-2 flex items-center justify-between shadow-2xl transition-all duration-500 ${
              isDark ? 'bg-white/10 border-white/10' : 'bg-white/80 border-black/5'
            }`}>
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
                      ? isDark ? 'text-white' : 'text-zinc-900' 
                      : 'text-zinc-400 opacity-50 hover:opacity-100'
                  }`}
                >
                  {view === item.id && (
                    <motion.div 
                      layoutId="activeNavMentor"
                      className={`absolute inset-0 rounded-2xl z-0 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}
                      transition={{ type: 'tween', ease: 'circOut', duration: 0.3 }}
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
        </>
      )}
      </div>
    </div>
  );
}
