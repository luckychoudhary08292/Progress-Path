import mongoose from 'mongoose';
import { isDbConnected } from './db.ts';
import {
  SubjectModel,
  LectureModel,
  ProblemModel,
  EventModel,
  ProgressModel,
} from './models/index.ts';
import type { ProblemDifficulty } from './models/index.ts';

// Helper to convert ID to ObjectId if valid, else keep as string
export function toMongoId(id: string | unknown): any {
  if (typeof id === 'string' && mongoose.isValidObjectId(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
}

// ----------------------------------------------------------------------
// In-Memory Fallback Entities
// ----------------------------------------------------------------------

export interface InMemorySubject {
  id: string;
  name: string;
  createdBy: string | null;
  isGlobal: boolean;
  nextSessionNumber: number;
  createdAt: Date;
}

export interface InMemoryLecture {
  id: string;
  subjectId: string;
  session: number;
  title: string;
  videoUrl: string;
  createdBy: string;
  createdAt: Date;
}

export interface InMemoryProblem {
  id: string;
  name: string;
  difficulty: ProblemDifficulty;
  category: string;
  link: string;
  isGlobal: boolean;
  createdBy: string | null;
  createdAt: Date;
}

export interface InMemoryEvent {
  id: string;
  userId: string;
  date: string;
  title: string;
  type: 'academic' | 'task';
  completed: boolean;
  createdAt: Date;
}

export interface InMemoryProgress {
  userId: string;
  itemType: 'lecture' | 'problem';
  itemId: string;
  status: 'todo' | 'in_progress' | 'completed' | 'revision';
  notes: string;
  completedAt: Date | null;
  updatedAt: Date;
}

// Seed Initial Data for in-memory fallback so user immediately sees rich, functional data
const inMemorySubjects: InMemorySubject[] = [
  {
    id: 'subj_dsa_01',
    name: 'Data Structures & Algorithms',
    createdBy: null,
    isGlobal: true,
    nextSessionNumber: 5,
    createdAt: new Date('2026-01-10T09:00:00Z'),
  },
  {
    id: 'subj_os_02',
    name: 'Operating Systems',
    createdBy: null,
    isGlobal: true,
    nextSessionNumber: 4,
    createdAt: new Date('2026-01-12T09:00:00Z'),
  },
  {
    id: 'subj_dbms_03',
    name: 'Database Management Systems',
    createdBy: null,
    isGlobal: true,
    nextSessionNumber: 4,
    createdAt: new Date('2026-01-15T09:00:00Z'),
  },
];

const inMemoryLectures: InMemoryLecture[] = [
  // DSA Lectures
  {
    id: 'lec_dsa_1',
    subjectId: 'subj_dsa_01',
    session: 1,
    title: 'Array Fundamentals & Memory Layout',
    videoUrl: 'https://www.youtube.com/watch?v=7h1s2SojIRw',
    createdBy: 'system',
    createdAt: new Date('2026-01-10T10:00:00Z'),
  },
  {
    id: 'lec_dsa_2',
    subjectId: 'subj_dsa_01',
    session: 2,
    title: 'Singly & Doubly Linked Lists',
    videoUrl: 'https://www.youtube.com/watch?v=njTh_OwMljA',
    createdBy: 'system',
    createdAt: new Date('2026-01-10T11:00:00Z'),
  },
  {
    id: 'lec_dsa_3',
    subjectId: 'subj_dsa_01',
    session: 3,
    title: 'Binary Trees & Tree Traversals',
    videoUrl: 'https://www.youtube.com/watch?v=fAAZ23Xd6DA',
    createdBy: 'system',
    createdAt: new Date('2026-01-10T12:00:00Z'),
  },
  {
    id: 'lec_dsa_4',
    subjectId: 'subj_dsa_01',
    session: 4,
    title: 'Graph Representation: BFS & DFS',
    videoUrl: 'https://www.youtube.com/watch?v=pcKY4hjDrxk',
    createdBy: 'system',
    createdAt: new Date('2026-01-10T13:00:00Z'),
  },
  // OS Lectures
  {
    id: 'lec_os_1',
    subjectId: 'subj_os_02',
    session: 1,
    title: 'Process Management & Context Switching',
    videoUrl: '',
    createdBy: 'system',
    createdAt: new Date('2026-01-12T10:00:00Z'),
  },
  {
    id: 'lec_os_2',
    subjectId: 'subj_os_02',
    session: 2,
    title: 'CPU Scheduling Algorithms (FCFS, SJF, RR)',
    videoUrl: '',
    createdBy: 'system',
    createdAt: new Date('2026-01-12T11:00:00Z'),
  },
  {
    id: 'lec_os_3',
    subjectId: 'subj_os_02',
    session: 3,
    title: 'Deadlocks & Banker’s Algorithm',
    videoUrl: '',
    createdBy: 'system',
    createdAt: new Date('2026-01-12T12:00:00Z'),
  },
  // DBMS Lectures
  {
    id: 'lec_dbms_1',
    subjectId: 'subj_dbms_03',
    session: 1,
    title: 'ER Diagrams & Relational Model',
    videoUrl: '',
    createdBy: 'system',
    createdAt: new Date('2026-01-15T10:00:00Z'),
  },
  {
    id: 'lec_dbms_2',
    subjectId: 'subj_dbms_03',
    session: 2,
    title: 'Functional Dependencies & Normalization',
    videoUrl: '',
    createdBy: 'system',
    createdAt: new Date('2026-01-15T11:00:00Z'),
  },
  {
    id: 'lec_dbms_3',
    subjectId: 'subj_dbms_03',
    session: 3,
    title: 'ACID Properties & Transaction Concurrency',
    videoUrl: '',
    createdBy: 'system',
    createdAt: new Date('2026-01-15T12:00:00Z'),
  },
];

const inMemoryProblems: InMemoryProblem[] = [
  {
    id: 'prob_01',
    name: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    link: 'https://leetcode.com/problems/two-sum/',
    isGlobal: true,
    createdBy: null,
    createdAt: new Date('2026-01-01T08:00:00Z'),
  },
  {
    id: 'prob_02',
    name: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stack',
    link: 'https://leetcode.com/problems/valid-parentheses/',
    isGlobal: true,
    createdBy: null,
    createdAt: new Date('2026-01-02T08:00:00Z'),
  },
  {
    id: 'prob_03',
    name: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    category: 'Sliding Window',
    link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    isGlobal: true,
    createdBy: null,
    createdAt: new Date('2026-01-03T08:00:00Z'),
  },
  {
    id: 'prob_04',
    name: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'Sliding Window',
    link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    isGlobal: true,
    createdBy: null,
    createdAt: new Date('2026-01-04T08:00:00Z'),
  },
  {
    id: 'prob_05',
    name: 'LRU Cache',
    difficulty: 'Medium',
    category: 'Linked List & Design',
    link: 'https://leetcode.com/problems/lru-cache/',
    isGlobal: true,
    createdBy: null,
    createdAt: new Date('2026-01-05T08:00:00Z'),
  },
  {
    id: 'prob_06',
    name: 'Trapping Rain Water',
    difficulty: 'Hard',
    category: 'Two Pointers',
    link: 'https://leetcode.com/problems/trapping-rain-water/',
    isGlobal: true,
    createdBy: null,
    createdAt: new Date('2026-01-06T08:00:00Z'),
  },
];

const inMemoryEvents: InMemoryEvent[] = [
  {
    id: 'evt_01',
    userId: 'global',
    date: new Date().toISOString().split('T')[0],
    title: 'Complete 2 LeetCode problems (Array & Stack)',
    type: 'task',
    completed: false,
    createdAt: new Date(),
  },
  {
    id: 'evt_02',
    userId: 'global',
    date: new Date().toISOString().split('T')[0],
    title: 'Review Operating Systems: Process vs Thread',
    type: 'academic',
    completed: false,
    createdAt: new Date(),
  },
];

const inMemoryProgress: InMemoryProgress[] = [];

// ----------------------------------------------------------------------
// SUBJECTS REPOSITORY
// ----------------------------------------------------------------------

export const SubjectRepository = {
  async listForUser(userId: string) {
    if (isDbConnected()) {
      const uId = toMongoId(userId);
      const docs = await SubjectModel.find({
        $or: [{ createdBy: uId }, { createdBy: userId }, { isGlobal: true }],
      })
        .sort({ createdAt: 1 })
        .lean();

      return docs.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        isGlobal: !!s.isGlobal,
        isOwner: !s.isGlobal && s.createdBy?.toString() === userId.toString(),
        nextSessionNumber: s.nextSessionNumber || 1,
        createdBy: s.createdBy?.toString() || null,
        createdAt: s.createdAt,
      }));
    }

    return inMemorySubjects
      .filter((s) => s.isGlobal || s.createdBy === userId)
      .map((s) => ({
        id: s.id,
        name: s.name,
        isGlobal: s.isGlobal,
        isOwner: !s.isGlobal && s.createdBy === userId,
        nextSessionNumber: s.nextSessionNumber,
        createdBy: s.createdBy,
        createdAt: s.createdAt,
      }));
  },

  async findById(subjectId: string, userId: string) {
    if (isDbConnected()) {
      if (!mongoose.isValidObjectId(subjectId)) return null;
      const uId = toMongoId(userId);
      const s = await SubjectModel.findOne({
        _id: subjectId,
        $or: [{ createdBy: uId }, { createdBy: userId }, { isGlobal: true }],
      }).lean();

      if (!s) return null;
      return {
        id: s._id.toString(),
        name: s.name,
        isGlobal: !!s.isGlobal,
        isOwner: !s.isGlobal && s.createdBy?.toString() === userId.toString(),
        nextSessionNumber: s.nextSessionNumber || 1,
        createdBy: s.createdBy?.toString() || null,
        createdAt: s.createdAt,
      };
    }

    const s = inMemorySubjects.find(
      (sub) => sub.id === subjectId && (sub.isGlobal || sub.createdBy === userId)
    );
    if (!s) return null;
    return {
      id: s.id,
      name: s.name,
      isGlobal: s.isGlobal,
      isOwner: !s.isGlobal && s.createdBy === userId,
      nextSessionNumber: s.nextSessionNumber,
      createdBy: s.createdBy,
      createdAt: s.createdAt,
    };
  },

  async create(name: string, userId: string) {
    const trimmed = name.trim();
    if (isDbConnected()) {
      const uId = toMongoId(userId);
      const newSubject = await SubjectModel.create({
        name: trimmed,
        createdBy: uId,
        isGlobal: false,
        nextSessionNumber: 1,
      });
      return {
        id: newSubject._id.toString(),
        name: newSubject.name,
        isGlobal: false,
        isOwner: true,
        nextSessionNumber: 1,
        totalTopics: 0,
        completedTopics: 0,
        percent: 0,
      };
    }

    const newSub: InMemorySubject = {
      id: 'subj_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      name: trimmed,
      createdBy: userId,
      isGlobal: false,
      nextSessionNumber: 1,
      createdAt: new Date(),
    };
    inMemorySubjects.push(newSub);
    return {
      id: newSub.id,
      name: newSub.name,
      isGlobal: false,
      isOwner: true,
      nextSessionNumber: 1,
      totalTopics: 0,
      completedTopics: 0,
      percent: 0,
    };
  },

  async delete(subjectId: string, userId: string, isAdmin: boolean) {
    if (isDbConnected()) {
      if (!mongoose.isValidObjectId(subjectId)) return false;
      const sub = await SubjectModel.findById(subjectId);
      if (!sub) return false;
      const isOwner = sub.createdBy?.toString() === userId.toString();
      if (!isOwner && !isAdmin) return null; // unauthorized

      // Cascade delete lectures and progress
      const lectures = await LectureModel.find({ subjectId: sub._id }).select('_id');
      const lecIds = lectures.map((l) => l._id);
      if (lecIds.length > 0) {
        await ProgressModel.deleteMany({ itemId: { $in: lecIds } });
      }
      await LectureModel.deleteMany({ subjectId: sub._id });
      await SubjectModel.findByIdAndDelete(sub._id);
      return true;
    }

    const idx = inMemorySubjects.findIndex((s) => s.id === subjectId);
    if (idx === -1) return false;
    const sub = inMemorySubjects[idx];
    const isOwner = sub.createdBy === userId;
    if (!isOwner && !isAdmin) return null;

    inMemorySubjects.splice(idx, 1);
    // Cascade remove lectures
    const removedLecIds: string[] = [];
    for (let i = inMemoryLectures.length - 1; i >= 0; i--) {
      if (inMemoryLectures[i].subjectId === subjectId) {
        removedLecIds.push(inMemoryLectures[i].id);
        inMemoryLectures.splice(i, 1);
      }
    }
    // Cascade remove progress
    for (let i = inMemoryProgress.length - 1; i >= 0; i--) {
      if (removedLecIds.includes(inMemoryProgress[i].itemId)) {
        inMemoryProgress.splice(i, 1);
      }
    }
    return true;
  },

  async countForUser(userId: string) {
    if (isDbConnected()) {
      const uId = toMongoId(userId);
      return await SubjectModel.countDocuments({
        $or: [{ createdBy: uId }, { createdBy: userId }, { isGlobal: true }],
      });
    }
    return inMemorySubjects.filter((s) => s.isGlobal || s.createdBy === userId).length;
  },

  async countCreatedByUser(userId: string) {
    if (isDbConnected()) {
      const uId = toMongoId(userId);
      return await SubjectModel.countDocuments({
        $or: [{ createdBy: uId }, { createdBy: userId }],
      });
    }
    return inMemorySubjects.filter((s) => s.createdBy === userId).length;
  },
};

// ----------------------------------------------------------------------
// LECTURES REPOSITORY
// ----------------------------------------------------------------------

export const LectureRepository = {
  async listForSubject(subjectId: string) {
    if (isDbConnected()) {
      if (!mongoose.isValidObjectId(subjectId)) return [];
      const lecs = await LectureModel.find({ subjectId }).sort({ session: 1 }).lean();
      return lecs.map((l) => ({
        id: l._id.toString(),
        subjectId: l.subjectId.toString(),
        session: l.session,
        title: l.title,
        videoUrl: l.videoUrl || '',
        createdBy: l.createdBy.toString(),
        createdAt: l.createdAt,
      }));
    }

    return inMemoryLectures
      .filter((l) => l.subjectId === subjectId)
      .sort((a, b) => a.session - b.session);
  },

  async createSequential(data: {
    subjectId: string;
    title: string;
    videoUrl?: string;
    createdBy: string;
  }) {
    if (isDbConnected()) {
      const subject = await SubjectModel.findByIdAndUpdate(
        data.subjectId,
        { $inc: { nextSessionNumber: 1 } },
        { returnDocument: 'before' }
      ).exec();

      if (!subject) throw new Error('Parent subject not found');
      const sessionNumber = subject.nextSessionNumber || 1;

      const lecture = await LectureModel.create({
        subjectId: toMongoId(data.subjectId),
        session: sessionNumber,
        title: data.title.trim(),
        videoUrl: (data.videoUrl || '').trim(),
        createdBy: toMongoId(data.createdBy),
      });

      return {
        id: lecture._id.toString(),
        subjectId: lecture.subjectId.toString(),
        session: lecture.session,
        title: lecture.title,
        videoUrl: lecture.videoUrl,
        createdBy: data.createdBy,
        createdAt: lecture.createdAt,
      };
    }

    const sub = inMemorySubjects.find((s) => s.id === data.subjectId);
    if (!sub) throw new Error('Parent subject not found');

    const sessionNum = sub.nextSessionNumber;
    sub.nextSessionNumber += 1;

    const newLec: InMemoryLecture = {
      id: 'lec_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      subjectId: data.subjectId,
      session: sessionNum,
      title: data.title.trim(),
      videoUrl: (data.videoUrl || '').trim(),
      createdBy: data.createdBy,
      createdAt: new Date(),
    };
    inMemoryLectures.push(newLec);
    return newLec;
  },

  async delete(lectureId: string, userId: string) {
    if (isDbConnected()) {
      if (!mongoose.isValidObjectId(lectureId)) return false;
      const lec = await LectureModel.findById(lectureId);
      if (!lec) return false;
      if (lec.createdBy.toString() !== userId.toString()) return null; // unauthorized

      await LectureModel.findByIdAndDelete(lec._id);
      await ProgressModel.deleteMany({ itemId: lec._id });
      return true;
    }

    const idx = inMemoryLectures.findIndex((l) => l.id === lectureId);
    if (idx === -1) return false;
    const lec = inMemoryLectures[idx];
    if (lec.createdBy !== userId) return null; // unauthorized

    inMemoryLectures.splice(idx, 1);
    for (let i = inMemoryProgress.length - 1; i >= 0; i--) {
      if (inMemoryProgress[i].itemId === lectureId) {
        inMemoryProgress.splice(i, 1);
      }
    }
    return true;
  },

  async countTotal() {
    if (isDbConnected()) {
      return await LectureModel.countDocuments();
    }
    return inMemoryLectures.length;
  },
};

// ----------------------------------------------------------------------
// PROBLEMS REPOSITORY
// ----------------------------------------------------------------------

export const ProblemRepository = {
  async listForUser(userId: string) {
    if (isDbConnected()) {
      const uId = toMongoId(userId);
      const docs = await ProblemModel.find({
        $or: [{ createdBy: uId }, { createdBy: userId }, { isGlobal: true }],
      })
        .sort({ createdAt: 1 })
        .lean();

      return docs.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        difficulty: p.difficulty,
        category: p.category,
        link: p.link || '',
        isGlobal: !!p.isGlobal,
        isOwner: !p.isGlobal && p.createdBy?.toString() === userId.toString(),
        createdAt: p.createdAt,
      }));
    }

    return inMemoryProblems
      .filter((p) => p.isGlobal || p.createdBy === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((p) => ({
        id: p.id,
        name: p.name,
        difficulty: p.difficulty,
        category: p.category,
        link: p.link,
        isGlobal: p.isGlobal,
        isOwner: !p.isGlobal && p.createdBy === userId,
        createdAt: p.createdAt,
      }));
  },

  async create(data: {
    name: string;
    difficulty: ProblemDifficulty;
    category: string;
    link?: string;
    createdBy: string;
  }) {
    if (isDbConnected()) {
      const uId = toMongoId(data.createdBy);
      const newProb = await ProblemModel.create({
        name: data.name.trim(),
        difficulty: data.difficulty,
        category: data.category.trim(),
        link: (data.link || '').trim(),
        isGlobal: false,
        createdBy: uId,
        createdAt: new Date(),
      });

      return {
        id: newProb._id.toString(),
        name: newProb.name,
        difficulty: newProb.difficulty,
        category: newProb.category,
        link: newProb.link,
        isGlobal: false,
        isOwner: true,
        createdAt: newProb.createdAt,
      };
    }

    const newProb: InMemoryProblem = {
      id: 'prob_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      name: data.name.trim(),
      difficulty: data.difficulty,
      category: data.category.trim(),
      link: (data.link || '').trim(),
      isGlobal: false,
      createdBy: data.createdBy,
      createdAt: new Date(),
    };
    inMemoryProblems.push(newProb);
    return {
      id: newProb.id,
      name: newProb.name,
      difficulty: newProb.difficulty,
      category: newProb.category,
      link: newProb.link,
      isGlobal: false,
      isOwner: true,
      createdAt: newProb.createdAt,
    };
  },

  async delete(problemId: string, userId: string) {
    if (isDbConnected()) {
      if (!mongoose.isValidObjectId(problemId)) return false;
      const prob = await ProblemModel.findById(problemId);
      if (!prob) return false;
      if (prob.createdBy?.toString() !== userId.toString()) return null; // unauthorized

      await ProblemModel.findByIdAndDelete(prob._id);
      await ProgressModel.deleteMany({ itemId: prob._id });
      return true;
    }

    const idx = inMemoryProblems.findIndex((p) => p.id === problemId);
    if (idx === -1) return false;
    const prob = inMemoryProblems[idx];
    if (prob.createdBy !== userId) return null;

    inMemoryProblems.splice(idx, 1);
    for (let i = inMemoryProgress.length - 1; i >= 0; i--) {
      if (inMemoryProgress[i].itemId === problemId) {
        inMemoryProgress.splice(i, 1);
      }
    }
    return true;
  },

  async countTotal() {
    if (isDbConnected()) {
      return await ProblemModel.countDocuments();
    }
    return inMemoryProblems.length;
  },
};

// ----------------------------------------------------------------------
// EVENTS REPOSITORY (Calendar)
// ----------------------------------------------------------------------

export const EventRepository = {
  async listForUser(userId: string, date?: string, month?: string) {
    if (isDbConnected()) {
      const uId = toMongoId(userId);
      const userFilters: any[] = [{ userId: uId }];
      if (mongoose.isValidObjectId(userId)) {
        userFilters.push({ userId });
      }
      const filter: any = {
        $or: userFilters,
      };
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        filter.date = date;
      } else if (month && /^\d{4}-\d{2}$/.test(month)) {
        filter.date = { $regex: `^${month}` };
      }

      const docs = await EventModel.find(filter).sort({ date: 1, createdAt: 1 }).lean();
      return docs.map((e) => ({
        id: e._id.toString(),
        userId: e.userId.toString(),
        date: e.date,
        title: e.title,
        type: e.type,
        completed: !!e.completed,
        createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
      }));
    }

    return inMemoryEvents
      .filter((e) => {
        const isForUser = e.userId === userId || e.userId === 'global';
        if (!isForUser) return false;
        if (date && e.date !== date) return false;
        if (month && !e.date.startsWith(month)) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({
        id: e.id,
        userId: e.userId,
        date: e.date,
        title: e.title,
        type: e.type,
        completed: e.completed,
        createdAt: e.createdAt.toISOString(),
      }));
  },

  async create(data: { userId: string; date: string; title: string; type: 'academic' | 'task' }) {
    if (isDbConnected()) {
      const uId = toMongoId(data.userId);
      const newEvt = await EventModel.create({
        userId: uId,
        date: data.date,
        title: data.title.trim(),
        type: data.type,
        completed: false,
        createdAt: new Date(),
      });
      return {
        id: newEvt._id.toString(),
        userId: data.userId,
        date: newEvt.date,
        title: newEvt.title,
        type: newEvt.type,
        completed: newEvt.completed,
        createdAt: newEvt.createdAt.toISOString(),
      };
    }

    const newEvt: InMemoryEvent = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      userId: data.userId,
      date: data.date,
      title: data.title.trim(),
      type: data.type,
      completed: false,
      createdAt: new Date(),
    };
    inMemoryEvents.push(newEvt);
    return {
      id: newEvt.id,
      userId: newEvt.userId,
      date: newEvt.date,
      title: newEvt.title,
      type: newEvt.type,
      completed: newEvt.completed,
      createdAt: newEvt.createdAt.toISOString(),
    };
  },

  async toggle(eventId: string, userId: string) {
    if (isDbConnected()) {
      const uId = toMongoId(userId);
      const userFilters: any[] = [{ userId: uId }];
      if (mongoose.isValidObjectId(userId)) {
        userFilters.push({ userId });
      }
      const evt = await EventModel.findOne({
        _id: toMongoId(eventId),
        $or: userFilters,
      });
      if (!evt) return null;
      evt.completed = !evt.completed;
      await evt.save();
      return {
        id: evt._id.toString(),
        userId,
        date: evt.date,
        title: evt.title,
        type: evt.type,
        completed: evt.completed,
        createdAt: evt.createdAt.toISOString(),
      };
    }

    const evt = inMemoryEvents.find(
      (e) => e.id === eventId && (e.userId === userId || e.userId === 'global')
    );
    if (!evt) return null;
    evt.completed = !evt.completed;
    return {
      id: evt.id,
      userId,
      date: evt.date,
      title: evt.title,
      type: evt.type,
      completed: evt.completed,
      createdAt: evt.createdAt.toISOString(),
    };
  },

  async delete(eventId: string, userId: string) {
    if (isDbConnected()) {
      const uId = toMongoId(userId);
      const userFilters: any[] = [{ userId: uId }];
      if (mongoose.isValidObjectId(userId)) {
        userFilters.push({ userId });
      }
      const deleted = await EventModel.findOneAndDelete({
        _id: toMongoId(eventId),
        $or: userFilters,
      });
      return !!deleted;
    }

    const idx = inMemoryEvents.findIndex(
      (e) => e.id === eventId && (e.userId === userId || e.userId === 'global')
    );
    if (idx === -1) return false;
    inMemoryEvents.splice(idx, 1);
    return true;
  },

  async countForUser(userId: string) {
    if (isDbConnected()) {
      const uId = toMongoId(userId);
      const userFilters: any[] = [{ userId: uId }];
      if (mongoose.isValidObjectId(userId)) {
        userFilters.push({ userId });
      }
      return await EventModel.countDocuments({
        $or: userFilters,
      });
    }
    return inMemoryEvents.filter((e) => e.userId === userId || e.userId === 'global').length;
  },
};

// ----------------------------------------------------------------------
// PROGRESS REPOSITORY (Lectures & Problems)
// ----------------------------------------------------------------------

export const ProgressRepository = {
  async getStatusMap(userId: string, itemType: 'lecture' | 'problem', itemIds: string[]) {
    const map = new Map<string, { status: string; notes: string; completedAt: Date | null }>();

    if (isDbConnected()) {
      const uId = toMongoId(userId);
      const mIds = itemIds.map(toMongoId);
      const records = await ProgressModel.find({
        $or: [{ userId: uId }, { userId }],
        itemType,
        itemId: { $in: mIds },
      }).lean();

      for (const r of records) {
        map.set(r.itemId.toString(), {
          status: r.status,
          notes: r.notes || '',
          completedAt: r.completedAt || null,
        });
      }
      return map;
    }

    for (const r of inMemoryProgress) {
      if (r.userId === userId && r.itemType === itemType && itemIds.includes(r.itemId)) {
        map.set(r.itemId, {
          status: r.status,
          notes: r.notes,
          completedAt: r.completedAt,
        });
      }
    }
    return map;
  },

  async updateProgress(
    userId: string,
    itemType: 'lecture' | 'problem',
    itemId: string,
    update: { status?: 'todo' | 'in_progress' | 'completed' | 'revision'; notes?: string; completed?: boolean }
  ) {
    if (isDbConnected()) {
      const uId = toMongoId(userId);
      const itId = toMongoId(itemId);
      const updateDoc: any = {};

      if (update.status) {
        updateDoc.status = update.status;
        updateDoc.completedAt = update.status === 'completed' ? new Date() : null;
      } else if (typeof update.completed === 'boolean') {
        updateDoc.status = update.completed ? 'completed' : 'todo';
        updateDoc.completedAt = update.completed ? new Date() : null;
      }

      if (typeof update.notes === 'string') {
        updateDoc.notes = update.notes;
      }

      const prog = await ProgressModel.findOneAndUpdate(
        { userId: uId, itemType, itemId: itId },
        { $set: updateDoc },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return {
        status: prog.status,
        notes: prog.notes || '',
        completed: prog.status === 'completed',
      };
    }

    let rec = inMemoryProgress.find(
      (p) => p.userId === userId && p.itemType === itemType && p.itemId === itemId
    );

    let status = rec?.status || 'todo';
    if (update.status) {
      status = update.status;
    } else if (typeof update.completed === 'boolean') {
      status = update.completed ? 'completed' : 'todo';
    }

    const notes = typeof update.notes === 'string' ? update.notes : rec?.notes || '';
    const completedAt = status === 'completed' ? new Date() : null;

    if (!rec) {
      rec = {
        userId,
        itemType,
        itemId,
        status,
        notes,
        completedAt,
        updatedAt: new Date(),
      };
      inMemoryProgress.push(rec);
    } else {
      rec.status = status;
      rec.notes = notes;
      rec.completedAt = completedAt;
      rec.updatedAt = new Date();
    }

    return {
      status: rec.status,
      notes: rec.notes,
      completed: rec.status === 'completed',
    };
  },

  async countCompleted(userId: string, itemType: 'lecture' | 'problem', itemIds?: string[]) {
    if (isDbConnected()) {
      const uId = toMongoId(userId);
      const filter: any = {
        $or: [{ userId: uId }, { userId }],
        itemType,
        status: 'completed',
      };
      if (itemIds && itemIds.length > 0) {
        filter.itemId = { $in: itemIds.map(toMongoId) };
      }
      return await ProgressModel.countDocuments(filter);
    }

    return inMemoryProgress.filter((p) => {
      if (p.userId !== userId || p.itemType !== itemType || p.status !== 'completed') {
        return false;
      }
      if (itemIds && !itemIds.includes(p.itemId)) {
        return false;
      }
      return true;
    }).length;
  },
};
