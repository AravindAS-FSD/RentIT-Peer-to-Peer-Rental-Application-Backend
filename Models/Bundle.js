import mongoose from 'mongoose';

const bundleSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Bundle name is required'], 
        trim: true 
    },
    description: { 
        type: String 
    },
    price: { 
        type: Number, 
        required: [true, 'Bundle price is required'] 
    },
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'User' 
    },
    // This is the array of item IDs that belong to the bundle
    items: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Item' 
    }],
}, { timestamps: true });

const Bundle = mongoose.models.Bundle || mongoose.model('Bundle', bundleSchema);
export default Bundle;