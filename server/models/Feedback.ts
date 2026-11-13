import mongoose, { Schema, Document } from 'mongoose';
import { isDbConnected } from '../db.ts';

export interface IFeedback extends Document {
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  description: string;
  status: 'unseen' | 'seen' | 'complete';
  createdAt: Date;
}

export interface InMemoryFeedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  description: string;
  status: 'unseen' | 'seen' | 'complete';
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ['unseen', 'seen', 'complete'], default: 'unseen', index: true },
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
          status: 'unseen',
          createdAt: new Date(),
        });
        return {
          id: doc._id.toString(),
          userId: doc.userId,
          userName: doc.userName,
          userEmail: doc.userEmail,
          title: doc.title,
          description: doc.description,
          status: doc.status || 'unseen',
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
      status: 'unseen',
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
            status: d.status || 'unseen',
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
          status: d.status || 'unseen',
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

  static async updateStatus(
    id: string,
    status: 'unseen' | 'seen' | 'complete'
  ): Promise<InMemoryFeedback | null> {
    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      try {
        const doc = await FeedbackModel.findByIdAndUpdate(
          id,
          { status },
          { new: true }
        ).lean();
        if (doc) {
          return {
            id: (doc as any)._id.toString(),
            userId: (doc as any).userId,
            userName: (doc as any).userName,
            userEmail: (doc as any).userEmail,
            title: (doc as any).title,
            description: (doc as any).description,
            status: (doc as any).status || status,
            createdAt: (doc as any).createdAt ? new Date((doc as any).createdAt) : new Date(),
          };
        }
      } catch (err) {
        console.warn('[FeedbackRepository] Mongoose updateStatus failed, using memory fallback:', err);
      }
    }

    const item = inMemoryFeedbacks.find((fb) => fb.id === id);
    if (item) {
      item.status = status;
      return item;
    }
    return null;
  }

  static async delete(id: string): Promise<boolean> {
    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      try {
        const res = await FeedbackModel.findByIdAndDelete(id);
        if (res) return true;
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

  static async countByUserId(userId: string): Promise<number> {
    if (isDbConnected()) {
      try {
        return await FeedbackModel.countDocuments({ userId });
      } catch {
        // fallback
      }
    }
    return inMemoryFeedbacks.filter((fb) => fb.userId === userId).length;
  }
}
