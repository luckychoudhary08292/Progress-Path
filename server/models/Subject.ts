import mongoose, { Schema, Document } from 'mongoose';

export interface ISubjectDocument extends Document {
  name: string;
  createdBy: mongoose.Types.ObjectId | null;
  isGlobal: boolean;
  nextSessionNumber: number;
  createdAt: Date;
}

export const subjectSchema = new Schema<ISubjectDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isGlobal: {
      type: Boolean,
      default: false,
    },
    nextSessionNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'subjects',
  }
);

export const SubjectModel: mongoose.Model<ISubjectDocument> =
  (mongoose.models.Subject as mongoose.Model<ISubjectDocument>) ||
  mongoose.model<ISubjectDocument>('Subject', subjectSchema, 'subjects');
