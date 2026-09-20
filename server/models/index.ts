import mongoose from 'mongoose';
import { UserModel } from './User.ts';
import { SubjectModel } from './Subject.ts';
import { LectureModel, createLectureWithSequentialSession } from './Lecture.ts';
import { ProblemModel } from './Problem.ts';
import type { ProblemDifficulty, IProblemDocument } from './Problem.ts';
import { EventModel } from './Event.ts';
import { ProgressModel } from './Progress.ts';
import { AuditLogModel } from './AuditLog.ts';

export {
  UserModel,
  SubjectModel,
  LectureModel,
  createLectureWithSequentialSession,
  ProblemModel,
  EventModel,
  ProgressModel,
  AuditLogModel,
};
export type { ProblemDifficulty, IProblemDocument };

/**
 * Ensures all requested collections and indexes exist in the LMS MongoDB database.
 * Strictly DOES NOT insert or seed any sample data.
 */
export async function initializeCollections(): Promise<string[]> {
  if (!mongoose.connection.db) {
    return [];
  }

  const existingCollections = await mongoose.connection.db.listCollections().toArray();
  const existingNames = new Set(existingCollections.map((c) => c.name));

  const targetCollections = ['subjects', 'lectures', 'problems', 'events', 'progress', 'audit_logs'];
  const created: string[] = [];

  for (const name of targetCollections) {
    if (!existingNames.has(name)) {
      await mongoose.connection.db.createCollection(name);
      created.push(name);
      console.log(`[Database] Initialized empty collection: "${name}" in database "${mongoose.connection.db.databaseName}".`);
    }
  }

  // Ensure indexes are built (such as the unique compound index on progress)
  await Promise.all([
    SubjectModel.createIndexes(),
    LectureModel.createIndexes(),
    ProblemModel.createIndexes(),
    EventModel.createIndexes(),
    ProgressModel.createIndexes(),
  ]);

  // Purge any legacy orphaned todo progress records that have no notes
  try {
    const purgeResult = await ProgressModel.deleteMany({
      status: 'todo',
      $or: [{ notes: '' }, { notes: null }, { notes: { $exists: false } }],
    });
    if (purgeResult.deletedCount > 0) {
      console.log(`[Database] Purged ${purgeResult.deletedCount} empty todo records from "progress" collection.`);
    }
  } catch (cleanErr) {
    console.warn('[Database] Startup progress cleanup notice:', cleanErr);
  }

  return created;
}
