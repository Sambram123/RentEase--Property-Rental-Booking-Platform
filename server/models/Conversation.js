import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate conversations for same property + participants
conversationSchema.index({ property: 1, participants: 1 });
// Fast lookup for user's conversations sorted by recent
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
