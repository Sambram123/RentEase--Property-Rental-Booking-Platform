import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    attachments: [
      {
        url: String,
        type: { type: String, enum: ['image', 'document'], default: 'image' },
        name: String,
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
  },
  { timestamps: true }
);

// Fast lookups: messages in a conversation ordered by time
messageSchema.index({ conversation: 1, createdAt: 1 });
// For finding unread messages for a specific user
messageSchema.index({ receiver: 1, isRead: 1 });
// Keyword search foundation
messageSchema.index({ message: 'text' });

export default mongoose.model('Message', messageSchema);
