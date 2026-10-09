import mongoose, { Schema, Document } from 'mongoose';
import { isDbConnected } from '../db.ts';

export interface IFeedback extends Document {
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  description: string;
  createdAt: Date;
}

export interface InMemoryFeedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  description: string;
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const FeedbackModel = mongoose.model<IFeedback>('Feedback', FeedbackSchema);

// In-Memory fallback store
let inMemoryFeedbacks: InMemoryFeedback[] = [];

export class FeedbackRepository {
  static async create(data: {
    userId: string;
    userName: string;
    userEmail: string;
    title: string;
    description: string;
  }): Promise<InMemoryFeedback> {
    if (isDbConnected()) {
      try {
        const doc = await FeedbackModel.create({
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          title: data.title,
          description: data.description,
          createdAt: new Date(),
        });
        return {
          id: doc._id.toString(),
          userId: doc.userId,
          userName: doc.userName,
          userEmail: doc.userEmail,
          title: doc.title,
          description: doc.description,
          createdAt: doc.createdAt,
        };
      } catch (err) {
        console.warn('[FeedbackRepository] Mongoose create failed, writing to fallback memory:', err);
      }
    }

    const newFeedback: InMemoryFeedback = {
      id: 'fb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      title: data.title,
      description: data.description,
      createdAt: new Date(),
    };
    inMemoryFeedbacks.unshift(newFeedback);
    return newFeedback;
  }

  static async listAll(): Promise<InMemoryFeedback[]> {
    if (isDbConnected()) {
      try {
        const docs = await FeedbackModel.find().sort({ createdAt: -1 }).lean();
        if (docs && docs.length > 0) {
          return docs.map((d: any) => ({
            id: d._id.toString(),
            userId: d.userId,
            userName: d.userName,
            userEmail: d.userEmail,
            title: d.title,
            description: d.description,
            createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
          }));
        }
      } catch (err) {
        console.warn('[FeedbackRepository] Mongoose listAll failed, using fallback:', err);
      }
    }

    return [...inMemoryFeedbacks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static async listByUserId(userId: string): Promise<InMemoryFeedback[]> {
    if (isDbConnected()) {
      try {
        const docs = await FeedbackModel.find({ userId }).sort({ createdAt: -1 }).lean();
        return docs.map((d: any) => ({
          id: d._id.toString(),
          userId: d.userId,
          userName: d.userName,
          userEmail: d.userEmail,
          title: d.title,
          description: d.description,
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
        }));
      } catch (err) {
        console.warn('[FeedbackRepository] Mongoose listByUserId failed:', err);
      }
    }

    return inMemoryFeedbacks
      .filter((fb) => fb.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static async delete(id: string): Promise<boolean> {
    if (isDbConnected()) {
      try {
        if (mongoose.isValidObjectId(id)) {
          const res = await FeedbackModel.findByIdAndDelete(id);
          if (res) return true;
        } else {
          const res = await FeedbackModel.deleteOne({ _id: id });
          if (res.deletedCount && res.deletedCount > 0) return true;
        }
      } catch (err) {
        console.warn('[FeedbackRepository] Mongoose delete failed:', err);
      }
    }

    const prevLength = inMemoryFeedbacks.length;
    inMemoryFeedbacks = inMemoryFeedbacks.filter((fb) => fb.id !== id);
    return inMemoryFeedbacks.length < prevLength;
  }

  static async count(): Promise<number> {
    if (isDbConnected()) {
      try {
        return await FeedbackModel.countDocuments();
      } catch {
        // fallback
      }
    }
    return inMemoryFeedbacks.length;
  }
}
