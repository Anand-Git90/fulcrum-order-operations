import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, match: /^OT-\d+$/ },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  initials: { type: String, default: '' },
  color: { type: String, default: '#edf2ff' },
  date: { type: String, required: true },
  status: { type: String, enum: ['Processing', 'Ready to ship', 'Label created', 'In transit', 'Delivered', 'Return requested', 'Refunded'], default: 'Processing' },
  payment: { type: String, enum: ['Paid', 'Pending', 'Refunded'], default: 'Pending' },
  amount: { type: Number, required: true, min: 0 },
  items: { type: [mongoose.Schema.Types.Mixed], validate: v => v.length > 0 },
  city: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  carrier: { type: String, default: '' },
  tracking: { type: String, default: '' },
  updated: { type: String, default: 'Just now' },
  reason: { type: String, default: '' },
  events: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { timestamps: true, versionKey: false, toJSON: { transform: (_doc, ret) => { delete ret._id; return ret; } } });

export const Order = mongoose.model('Order', orderSchema);
