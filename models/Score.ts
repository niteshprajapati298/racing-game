import mongoose, { Schema, Document } from 'mongoose';

export interface IScore extends Document {
  userId: mongoose.Types.ObjectId;
  score: number;
  distance: number;
  time: number;
  speed: number;
  createdAt: Date;
}

const ScoreSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    time: {
      type: Number,
      required: true,
    },
    speed: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ScoreSchema.index({ userId: 1, score: -1 });

export default mongoose.models.Score || mongoose.model<IScore>('Score', ScoreSchema);
