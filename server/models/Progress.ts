import mongoose, { Schema, Document } from 'mongoose';

export type ProgressItemType = 'lecture' | 'problem';
export type ProgressStatus = 'todo' | 'in_progress' | 'completed' | 'revision';

export interface IProgressDocument extends Document {
  userId: mongoose.Types.ObjectId;
  itemType: ProgressItemType;
  itemId: mongoose.Types.ObjectId;
  status: ProgressStatus;
  notes: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const progressSchema = new Schema<IProgressDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: ['lecture', 'problem'],
      required: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed', 'revision'],
      default: 'todo',
    },
    notes: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: 'progress',
    timestamps: true,
  }
);

// Add unique compound index on (userId, itemType, itemId)
progressSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

export const ProgressModel: mongoose.Model<IProgressDocument> =
  (mongoose.models.Progress as mongoose.Model<IProgressDocument>) ||
  mongoose.model<IProgressDocument>('Progress', progressSchema, 'progress');
