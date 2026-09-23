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
        id: s._id ? s._id.toString() : '',
        name: s.name,
        isGlobal: !!s.isGlobal,
        isOwner: !s.isGlobal && Boolean(userId) && (s.createdBy ? s.createdBy.toString() === String(userId) : false),
        nextSessionNumber: s.nextSessionNumber || 1,
        createdBy: s.createdBy ? s.createdBy.toString() : null,
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
        id: s._id ? s._id.toString() : '',
        name: s.name,
        isGlobal: !!s.isGlobal,
        isOwner: !s.isGlobal && Boolean(userId) && (s.createdBy ? s.createdBy.toString() === String(userId) : false),
        nextSessionNumber: s.nextSessionNumber || 1,
        createdBy: s.createdBy ? s.createdBy.toString() : null,
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
        id: newSubject._id ? newSubject._id.toString() : '',
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
      const isOwner = Boolean(userId) && (sub.createdBy ? sub.createdBy.toString() === String(userId) : false);
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

  async listGlobal() {
    if (isDbConnected()) {
      const docs = await SubjectModel.find({ isGlobal: true }).sort({ createdAt: 1 }).lean();
      return docs.map((s) => ({
        id: s._id ? s._id.toString() : '',
        name: s.name,
        isGlobal: true,
        nextSessionNumber: s.nextSessionNumber || 1,
        createdAt: s.createdAt,
      }));
    }
    return inMemorySubjects
      .filter((s) => s.isGlobal)
      .map((s) => ({
        id: s.id,
        name: s.name,
        isGlobal: true,
        nextSessionNumber: s.nextSessionNumber,
        createdAt: s.createdAt,
      }));
  },

  async createGlobal(name: string) {
    const trimmed = name.trim();
    if (isDbConnected()) {
      const newSubject = await SubjectModel.create({
        name: trimmed,
        createdBy: null,
        isGlobal: true,
        nextSessionNumber: 1,
      });
      return {
        id: newSubject._id ? newSubject._id.toString() : '',
        name: newSubject.name,
        isGlobal: true,
        nextSessionNumber: 1,
        createdAt: newSubject.createdAt,
      };
    }
    const newSub: InMemorySubject = {
      id: 'subj_' + Math.random().toString(36).substring(2, 9),
      name: trimmed,
      createdBy: null,
      isGlobal: true,
      nextSessionNumber: 1,
      createdAt: new Date(),
    };
    inMemorySubjects.push(newSub);
    return newSub;
  },

  async updateGlobal(subjectId: string, name: string) {
    const trimmed = name.trim();
    if (isDbConnected()) {
      if (!mongoose.isValidObjectId(subjectId)) return null;
      const updated = await SubjectModel.findOneAndUpdate(
        { _id: toMongoId(subjectId), isGlobal: true },
        { name: trimmed },
        { new: true }
      ).lean();
      if (!updated) return null;
      return {
        id: updated._id ? updated._id.toString() : '',
        name: updated.name,
        isGlobal: true,
        nextSessionNumber: updated.nextSessionNumber || 1,
        createdAt: updated.createdAt,
      };
    }
    const sub = inMemorySubjects.find((s) => s.id === subjectId && s.isGlobal);
    if (!sub) return null;
    sub.name = trimmed;
    return sub;
  },

  async deleteGlobal(subjectId: string) {
    if (isDbConnected()) {
      if (!mongoose.isValidObjectId(subjectId)) return false;
      const sub = await SubjectModel.findOne({ _id: subjectId, isGlobal: true });
      if (!sub) return false;
      const lectures = await LectureModel.find({ subjectId: sub._id }).select('_id');
      const lecIds = lectures.map((l) => l._id);
      if (lecIds.length > 0) {
        await ProgressModel.deleteMany({ itemId: { $in: lecIds } });
      }
      await LectureModel.deleteMany({ subjectId: sub._id });
      await SubjectModel.findByIdAndDelete(sub._id);
      return true;
    }
    const idx = inMemorySubjects.findIndex((s) => s.id === subjectId && s.isGlobal);
    if (idx === -1) return false;
    inMemorySubjects.splice(idx, 1);
    const removedLecIds: string[] = [];
    for (let i = inMemoryLectures.length - 1; i >= 0; i--) {
      if (inMemoryLectures[i].subjectId === subjectId) {
        removedLecIds.push(inMemoryLectures[i].id);
        inMemoryLectures.splice(i, 1);
      }
    }
    for (let i = inMemoryProgress.length - 1; i >= 0; i--) {
      if (removedLecIds.includes(inMemoryProgress[i].itemId)) {
        inMemoryProgress.splice(i, 1);
      }
    }
    return true;
  },
};

// ----------------------------------------------------------------------
// LECTURES REPOSITORY
// ----------------------------------------------------------------------

export const LectureRepository = {
  async listForSubject(subjectId: string, userId?: string) {
    if (isDbConnected()) {
      if (!mongoose.isValidObjectId(subjectId)) return [];

      const query: any = { subjectId: toMongoId(subjectId) };
      if (userId) {
        const uId = toMongoId(userId);
        query.$or = [
          { createdBy: null },
          { createdBy: { $exists: false } },
          { createdBy: uId },
          { createdBy: userId },
        ];
      } else {
        query.$or = [{ createdBy: null }, { createdBy: { $exists: false } }];
      }

      const lecs = await LectureModel.find(query).sort({ session: 1 }).lean();
      return lecs.map((l) => ({
        id: l._id ? l._id.toString() : '',
        subjectId: l.subjectId ? l.subjectId.toString() : '',
        session: l.session,
        title: l.title,
        videoUrl: l.videoUrl || '',
        createdBy: l.createdBy ? l.createdBy.toString() : null,
        createdAt: l.createdAt,
      }));
    }

    return inMemoryLectures
      .filter((l) => {
        if (l.subjectId !== subjectId) return false;
        if (!userId) return !l.createdBy || l.createdBy === 'admin';
        return !l.createdBy || l.createdBy === 'admin' || l.createdBy === userId;
      })
      .sort((a, b) => a.session - b.session);
  },

  async createSequential(data: {
    subjectId: string;
    title: string;
    videoUrl?: string;
    createdBy: string;
  }) {
    if (isDbConnected()) {
      const subject = await SubjectModel.findById(data.subjectId);
      if (!subject) throw new Error('Parent subject not found');

      let sessionNumber = 1;
      if (subject.isGlobal) {
        // For a global subject, compute this specific user's sequential session number
        // so we never mutate or alter session numbering for other users
        const userLectures = await LectureRepository.listForSubject(data.subjectId, data.createdBy);
        const maxSession = userLectures.reduce((max, l) => Math.max(max, l.session), 0);
        sessionNumber = maxSession + 1;
      } else {
        const updated = await SubjectModel.findByIdAndUpdate(
          data.subjectId,
          { $inc: { nextSessionNumber: 1 } },
          { returnDocument: 'before' }
        ).exec();
        sessionNumber = updated?.nextSessionNumber || 1;
      }

      const lecture = await LectureModel.create({
        subjectId: toMongoId(data.subjectId),
        session: sessionNumber,
        title: data.title.trim(),
        videoUrl: (data.videoUrl || '').trim(),
        createdBy: toMongoId(data.createdBy),
      });

      return {
        id: lecture._id ? lecture._id.toString() : '',
        subjectId: lecture.subjectId ? lecture.subjectId.toString() : '',
        session: lecture.session,
        title: lecture.title,
        videoUrl: lecture.videoUrl,
        createdBy: data.createdBy,
        createdAt: lecture.createdAt,
      };
    }

    const sub = inMemorySubjects.find((s) => s.id === data.subjectId);
    if (!sub) throw new Error('Parent subject not found');

    let sessionNum = 1;
    if (sub.isGlobal) {
      const userLecs = inMemoryLectures.filter(
        (l) =>
          l.subjectId === data.subjectId &&
          (!l.createdBy || l.createdBy === 'admin' || l.createdBy === data.createdBy)
      );
      const maxSession = userLecs.reduce((max, l) => Math.max(max, l.session), 0);
      sessionNum = maxSession + 1;
    } else {
      sessionNum = sub.nextSessionNumber;
      sub.nextSessionNumber += 1;
    }

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
      if (!lec.createdBy || lec.createdBy.toString() !== String(userId)) return null; // unauthorized

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

  async listGlobal() {
    if (isDbConnected()) {
      const globalSubs = await SubjectModel.find({ isGlobal: true }).select('_id name').lean();
      const subMap = new Map(globalSubs.map((s) => [s._id ? s._id.toString() : '', s.name]));
      const subIds = globalSubs.map((s) => s._id);
      const docs = await LectureModel.find({
        subjectId: { $in: subIds },
        $or: [{ createdBy: null }, { createdBy: { $exists: false } }],
      })
        .sort({ subjectId: 1, session: 1 })
        .lean();
      return docs.map((l) => ({
        id: l._id ? l._id.toString() : '',
        subjectId: l.subjectId ? l.subjectId.toString() : '',
        subjectName: subMap.get(l.subjectId ? l.subjectId.toString() : '') || 'Global Subject',
        session: l.session,
        title: l.title,
        videoUrl: l.videoUrl || '',
        createdAt: l.createdAt,
      }));
    }
    const globalSubIds = inMemorySubjects.filter((s) => s.isGlobal).map((s) => s.id);
    const subMap = new Map(inMemorySubjects.filter((s) => s.isGlobal).map((s) => [s.id, s.name]));
    return inMemoryLectures
      .filter((l) => globalSubIds.includes(l.subjectId) && (!l.createdBy || l.createdBy === 'admin'))
      .sort((a, b) => a.session - b.session)
      .map((l) => ({
        id: l.id,
        subjectId: l.subjectId,
        subjectName: subMap.get(l.subjectId) || 'Global Subject',
        session: l.session,
        title: l.title,
        videoUrl: l.videoUrl,
        createdAt: l.createdAt,
      }));
  },

  async createGlobal(data: { subjectId: string; title: string; session?: number; videoUrl?: string }) {
    if (isDbConnected()) {
      const sub = await SubjectModel.findOne({ _id: toMongoId(data.subjectId), isGlobal: true });
      if (!sub) throw new Error('Global parent subject not found');
      const sessionNum = data.session || sub.nextSessionNumber || 1;
      if (sessionNum >= (sub.nextSessionNumber || 1)) {
        sub.nextSessionNumber = sessionNum + 1;
        await sub.save();
      }
      const lec = await LectureModel.create({
        subjectId: sub._id,
        session: sessionNum,
        title: data.title.trim(),
        videoUrl: (data.videoUrl || '').trim(),
        createdBy: null,
      });
      return {
        id: lec._id ? lec._id.toString() : '',
        subjectId: lec.subjectId ? lec.subjectId.toString() : '',
        session: lec.session,
        title: lec.title,
        videoUrl: lec.videoUrl,
        createdAt: lec.createdAt,
      };
    }
    const sub = inMemorySubjects.find((s) => s.id === data.subjectId && s.isGlobal);
    if (!sub) throw new Error('Global parent subject not found');
    const sessionNum = data.session || sub.nextSessionNumber || 1;
    sub.nextSessionNumber = Math.max(sub.nextSessionNumber, sessionNum + 1);
    const newLec: InMemoryLecture = {
      id: 'lec_' + Math.random().toString(36).substring(2, 9),
      subjectId: data.subjectId,
      session: sessionNum,
      title: data.title.trim(),
      videoUrl: (data.videoUrl || '').trim(),
      createdBy: 'admin',
      createdAt: new Date(),
    };
    inMemoryLectures.push(newLec);
    return newLec;
  },

  async updateGlobal(lectureId: string, data: { title?: string; session?: number; videoUrl?: string }) {
    if (isDbConnected()) {
      if (!mongoose.isValidObjectId(lectureId)) return null;
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title.trim();
      if (data.session !== undefined) updateData.session = data.session;
      if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl.trim();
      const updated = await LectureModel.findByIdAndUpdate(lectureId, updateData, { new: true }).lean();
      if (!updated) return null;
      return {
        id: updated._id ? updated._id.toString() : '',
        subjectId: updated.subjectId ? updated.subjectId.toString() : '',
        session: updated.session,
        title: updated.title,
        videoUrl: updated.videoUrl,
        createdAt: updated.createdAt,
      };
    }
    const lec = inMemoryLectures.find((l) => l.id === lectureId);
    if (!lec) return null;
    if (data.title !== undefined) lec.title = data.title.trim();
    if (data.session !== undefined) lec.session = data.session;
    if (data.videoUrl !== undefined) lec.videoUrl = data.videoUrl.trim();
    return lec;
  },

  async deleteGlobal(lectureId: string) {
    if (isDbConnected()) {
      if (!mongoose.isValidObjectId(lectureId)) return false;
      const deleted = await LectureModel.findByIdAndDelete(lectureId);
      if (!deleted) return false;
      await ProgressModel.deleteMany({ itemId: deleted._id });
      return true;
    }
    const idx = inMemoryLectures.findIndex((l) => l.id === lectureId);
    if (idx === -1) return false;
    inMemoryLectures.splice(idx, 1);
    for (let i = inMemoryProgress.length - 1; i >= 0; i--) {
      if (inMemoryProgress[i].itemId === lectureId) {
        inMemoryProgress.splice(i, 1);
      }
    }
    return true;
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
        id: p._id ? p._id.toString() : '',
        name: p.name,
        difficulty: p.difficulty,
        category: p.category,
        link: p.link || '',
        isGlobal: !!p.isGlobal,
        isOwner: !p.isGlobal && Boolean(userId) && (p.createdBy ? p.createdBy.toString() === String(userId) : false),
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
        id: newProb._id ? newProb._id.toString() : '',
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
      if (!prob.createdBy || prob.createdBy.toString() !== String(userId)) return null; // unauthorized

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

  async listGlobal() {
    if (isDbConnected()) {
      const docs = await ProblemModel.find({ isGlobal: true }).sort({ createdAt: 1 }).lean();
      return docs.map((p) => ({
        id: p._id ? p._id.toString() : '',
        name: p.name,
        difficulty: p.difficulty,
        category: p.category,
        link: p.link || '',
        isGlobal: true,
        createdAt: p.createdAt,
      }));
    }
    return inMemoryProblems
      .filter((p) => p.isGlobal)
      .map((p) => ({
        id: p.id,
        name: p.name,
        difficulty: p.difficulty,
        category: p.category,
        link: p.link,
        isGlobal: true,
        createdAt: p.createdAt,
      }));
  },

  async createGlobal(data: {
    name: string;
    difficulty: ProblemDifficulty;
    category: string;
    link?: string;
  }) {
    if (isDbConnected()) {
      const doc = await ProblemModel.create({
        name: data.name.trim(),
        difficulty: data.difficulty,
        category: data.category.trim(),
        link: (data.link || '').trim(),
        isGlobal: true,
        createdBy: null,
      });
      return {
        id: doc._id ? doc._id.toString() : '',
        name: doc.name,
        difficulty: doc.difficulty,
        category: doc.category,
        link: doc.link,
        isGlobal: true,
        createdAt: doc.createdAt,
      };
    }
    const newProb: InMemoryProblem = {
      id: 'prob_' + Math.random().toString(36).substring(2, 9),
      name: data.name.trim(),
      difficulty: data.difficulty,
      category: data.category.trim(),
      link: (data.link || '').trim(),
      isGlobal: true,
      createdBy: null,
      createdAt: new Date(),
    };
    inMemoryProblems.push(newProb);
    return newProb;
  },

  async updateGlobal(
    problemId: string,
    data: { name?: string; difficulty?: ProblemDifficulty; category?: string; link?: string }
  ) {
    if (isDbConnected()) {
      if (!mongoose.isValidObjectId(problemId)) return null;
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
      if (data.category !== undefined) updateData.category = data.category.trim();
      if (data.link !== undefined) updateData.link = (data.link || '').trim();
      const updated = await ProblemModel.findOneAndUpdate(
        { _id: toMongoId(problemId), isGlobal: true },
        updateData,
        { new: true }
      ).lean();
      if (!updated) return null;
      return {
        id: updated._id ? updated._id.toString() : '',
        name: updated.name,
        difficulty: updated.difficulty,
        category: updated.category,
        link: updated.link,
        isGlobal: true,
        createdAt: updated.createdAt,
      };
    }
    const prob = inMemoryProblems.find((p) => p.id === problemId && p.isGlobal);
    if (!prob) return null;
    if (data.name !== undefined) prob.name = data.name.trim();
    if (data.difficulty !== undefined) prob.difficulty = data.difficulty;
    if (data.category !== undefined) prob.category = data.category.trim();
    if (data.link !== undefined) prob.link = (data.link || '').trim();
    return prob;
  },

  async deleteGlobal(problemId: string) {
    if (isDbConnected()) {
      if (!mongoose.isValidObjectId(problemId)) return false;
      const deleted = await ProblemModel.findOneAndDelete({ _id: toMongoId(problemId), isGlobal: true });
      if (!deleted) return false;
      await ProgressModel.deleteMany({ itemId: deleted._id });
      return true;
    }
    const idx = inMemoryProblems.findIndex((p) => p.id === problemId && p.isGlobal);
    if (idx === -1) return false;
    inMemoryProblems.splice(idx, 1);
    for (let i = inMemoryProgress.length - 1; i >= 0; i--) {
      if (inMemoryProgress[i].itemId === problemId) {
        inMemoryProgress.splice(i, 1);
      }
    }
    return true;
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
        id: e._id ? e._id.toString() : '',
        userId: e.userId ? e.userId.toString() : '',
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
        id: newEvt._id ? newEvt._id.toString() : '',
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
        id: evt._id ? evt._id.toString() : '',
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
        if (r.itemId) {
          map.set(r.itemId.toString(), {
            status: r.status,
            notes: r.notes || '',
            completedAt: r.completedAt || null,
          });
        }
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

      // Find existing document
      const existing = await ProgressModel.findOne({
        $or: [{ userId: uId }, { userId }],
        itemType,
        itemId: itId,
      });

      let nextStatus: 'todo' | 'in_progress' | 'completed' | 'revision' = existing?.status || 'todo';
      if (update.status) {
        nextStatus = update.status;
      } else if (typeof update.completed === 'boolean') {
        nextStatus = update.completed ? 'completed' : 'todo';
      }

      let nextNotes: string = existing?.notes || '';
      if (typeof update.notes === 'string') {
        nextNotes = update.notes;
      }

      // CRITICAL FIX: If status is 'todo' (incomplete) and there are no notes,
      // DELETE the progress document completely from the database!
      // This prevents uncompleted items from remaining in the database and filling up storage.
      if (nextStatus === 'todo' && (!nextNotes || nextNotes.trim() === '')) {
        if (existing) {
          await ProgressModel.deleteOne({ _id: existing._id });
        }
        return {
          status: 'todo',
          notes: '',
          completed: false,
        };
      }

      const updateDoc: any = {
        userId: uId,
        itemType,
        itemId: itId,
        status: nextStatus,
        notes: nextNotes,
        completedAt: nextStatus === 'completed' ? (existing?.completedAt || new Date()) : null,
      };

      const prog = await ProgressModel.findOneAndUpdate(
        { $or: [{ userId: uId }, { userId }], itemType, itemId: itId },
        { $set: updateDoc },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return {
        status: prog.status,
        notes: prog.notes || '',
        completed: prog.status === 'completed',
      };
    }

    const existingIdx = inMemoryProgress.findIndex(
      (p) => p.userId === userId && p.itemType === itemType && p.itemId === itemId
    );
    const existing = existingIdx !== -1 ? inMemoryProgress[existingIdx] : null;

    let nextStatus: 'todo' | 'in_progress' | 'completed' | 'revision' = existing?.status || 'todo';
    if (update.status) {
      nextStatus = update.status;
    } else if (typeof update.completed === 'boolean') {
      nextStatus = update.completed ? 'completed' : 'todo';
    }

    const nextNotes = typeof update.notes === 'string' ? update.notes : existing?.notes || '';

    // If status is 'todo' and has no notes, delete from in-memory collection
    if (nextStatus === 'todo' && (!nextNotes || nextNotes.trim() === '')) {
      if (existingIdx !== -1) {
        inMemoryProgress.splice(existingIdx, 1);
      }
      return {
        status: 'todo',
        notes: '',
        completed: false,
      };
    }

    const completedAt = nextStatus === 'completed' ? new Date() : null;

    if (!existing) {
      const rec: InMemoryProgress = {
        userId,
        itemType,
        itemId,
        status: nextStatus,
        notes: nextNotes,
        completedAt,
        updatedAt: new Date(),
      };
      inMemoryProgress.push(rec);
    } else {
      existing.status = nextStatus;
      existing.notes = nextNotes;
      existing.completedAt = completedAt;
      existing.updatedAt = new Date();
    }

    return {
      status: nextStatus,
      notes: nextNotes,
      completed: nextStatus === 'completed',
    };
  },

  async cleanupOrphanedProgress() {
    if (isDbConnected()) {
      try {
        const res = await ProgressModel.deleteMany({
          status: 'todo',
          $or: [
            { notes: '' },
            { notes: null },
            { notes: { $exists: false } },
          ],
        });
        if (res.deletedCount > 0) {
          console.log(`[Progress Cleanup] Successfully purged ${res.deletedCount} empty todo progress records from MongoDB.`);
        }
        return res.deletedCount;
      } catch (err) {
        console.warn('[Progress Cleanup Error]:', err);
        return 0;
      }
    }
    return 0;
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

  async countTotalCompleted() {
    if (isDbConnected()) {
      return await ProgressModel.countDocuments({ status: 'completed' });
    }
    return inMemoryProgress.filter((p) => p.status === 'completed').length;
  },

  async getWeeklyActiveUsers(
    users: { id: string; name: string; email: string; role: string }[],
    days = 7
  ) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await Promise.all(
      users.map(async (u) => {
        let completedLectures = 0;
        let solvedProblems = 0;
        let recentCompletedThisWeek = 0;
        let lastActivityDate: Date | null = null;

        if (isDbConnected()) {
          const uId = toMongoId(u.id);
          const filter: any = {
            $or: [{ userId: uId }, { userId: u.id }],
            status: 'completed',
          };
          const allCompleted = await ProgressModel.find(filter).lean();
          completedLectures = allCompleted.filter((r) => r.itemType === 'lecture').length;
          solvedProblems = allCompleted.filter((r) => r.itemType === 'problem').length;

          const recent = allCompleted.filter((r) => {
            const date = r.completedAt || (r as any).updatedAt || (r as any).createdAt;
            return date && new Date(date) >= cutoff;
          });
          recentCompletedThisWeek = recent.length > 0 ? recent.length : allCompleted.length;

          allCompleted.forEach((r) => {
            const date = r.completedAt || (r as any).updatedAt;
            if (date) {
              const d = new Date(date);
              if (!lastActivityDate || d > lastActivityDate) {
                lastActivityDate = d;
              }
            }
          });
        } else {
          const allCompleted = inMemoryProgress.filter(
            (p) => p.userId === u.id && p.status === 'completed'
          );
          completedLectures = allCompleted.filter((r) => r.itemType === 'lecture').length;
          solvedProblems = allCompleted.filter((r) => r.itemType === 'problem').length;
          const recent = allCompleted.filter((r) => {
            const date = r.completedAt || r.updatedAt;
            return date && new Date(date) >= cutoff;
          });
          recentCompletedThisWeek = recent.length > 0 ? recent.length : allCompleted.length;

          allCompleted.forEach((r) => {
            const date = r.completedAt || r.updatedAt;
            if (date) {
              const d = new Date(date);
              if (!lastActivityDate || d > lastActivityDate) {
                lastActivityDate = d;
              }
            }
          });
        }

        const totalCompleted = completedLectures + solvedProblems;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          completedLectures,
          solvedProblems,
          totalCompletedThisWeek: recentCompletedThisWeek,
          totalCompleted,
          lastActivityDate: lastActivityDate ? (lastActivityDate as Date).toISOString() : null,
        };
      })
    );

    return result.sort((a, b) => {
      if (b.totalCompletedThisWeek !== a.totalCompletedThisWeek) {
        return b.totalCompletedThisWeek - a.totalCompletedThisWeek;
      }
      return b.totalCompleted - a.totalCompleted;
    });
  },
};
