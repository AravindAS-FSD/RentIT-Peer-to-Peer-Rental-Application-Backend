import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['textbooks', 'electronics', 'dorm-essentials', 'emergency-kits', 'clothing', 'bikes-scooters', 'other'], 
    required: true 
  },
  courseCode: { type: String, trim: true },
  condition: { type: String, required: true },
  price: { type: Number, required: true },
  priceType: {
    type: String,
    enum: ['per_day', 'per_week', 'per_semester'],
    default: 'per_week',
  },
  imageUrl: { type: String, required: true },
  imagePublicId: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
export default Item;