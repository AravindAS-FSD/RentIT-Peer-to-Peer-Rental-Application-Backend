import mongoose from 'mongoose';

const rentalSchema = new mongoose.Schema({
    item: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'Item' 
    },
    renter: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'User' 
    },
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'User' 
    },
    quantity: { 
        type: Number, 
        required: true, 
        default: 1 
    },
    totalPrice: { 
        type: Number, 
        required: true 
    },
    status: {
        type: String,
        // --- THIS IS THE CRITICAL FIX ---
        // 'scheduled' has been added to the list of allowed values.
        enum: [
            'pending', 
            'approved', 
            'denied', 
            'scheduled', // <-- THIS VALUE WAS MISSING
            'in_progress', 
            'completed', 
            'cancelled'
        ],
        default: 'pending',
    },
    scheduledTime: { 
        type: Date 
    },
    scheduledLocation: { 
        type: String 
    },
    pickupToken: { 
        type: String 
    },
    returnToken: { 
        type: String 
    },
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const Rental = mongoose.models.Rental || mongoose.model('Rental', rentalSchema);

export default Rental;