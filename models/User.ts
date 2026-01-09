import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  dob: Date;
  verificationQuestion: string;
  verificationAnswer: string;
  bestScore: number;
  rewardEligible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be less than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    verificationQuestion: {
      type: String,
      required: [true, 'Verification question is required'],
    },
    verificationAnswer: {
      type: String,
      required: [true, 'Verification answer is required'],
    },
    bestScore: {
      type: Number,
      default: 0,
    },
    rewardEligible: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
