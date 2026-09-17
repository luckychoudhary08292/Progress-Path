import mongoose, { Schema, Document } from 'mongoose';

export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface IProblemDocument extends Document {
  name: string;
  difficulty: ProblemDifficulty;
  category: string;
  link: string;
  isGlobal?: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

export const problemSchema = new Schema<IProblemDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    isGlobal: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'problems',
  }
);

export const ProblemModel: mongoose.Model<IProblemDocument> =
  (mongoose.models.Problem as mongoose.Model<IProblemDocument>) ||
  mongoose.model<IProblemDocument>('Problem', problemSchema, 'problems');
