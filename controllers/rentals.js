import crypto from 'crypto';
import mongoose from 'mongoose';
import Rental from '../models/Rental.js';
import Item from '../models/Item.js';

export const createRentalRequest = async (req, res) => {
    const { itemId, quantity } = req.body;
    const renterId = req.user._id;
    try {
        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Item not found.' });
        if (!item.isAvailable) return res.status(400).json({ message: 'This item is not currently available.' });
        const totalPrice = item.price * quantity;
        const rental = new Rental({ item: itemId, renter: renterId, owner: item.owner, quantity, totalPrice });
        const createdRental = await rental.save();
        res.status(201).json(createdRental);
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

export const getMyRentals = async (req, res) => {
    try {
        const userId = req.user._id;
        const rentals = await Rental.find({ $or: [{ renter: userId }, { owner: userId }] })
            .populate('item', 'title imageUrl price priceType')
            .populate('owner', 'name')
            .populate('renter', 'name')
            .sort({ createdAt: -1 });
        res.json(rentals);
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

export const getRentalById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid rental ID format.' });
        }
        const rental = await Rental.findById(req.params.id)
            .populate('item', 'title imageUrl owner')
            .populate('owner', 'name')
            .populate('renter', 'name');
        if (!rental) return res.status(404).json({ message: 'Rental not found.' });
        const userId = req.user._id;
        if (rental.renter._id.toString() !== userId.toString() && rental.owner._id.toString() !== userId.toString()) {
            return res.status(401).json({ message: 'Not authorized.' });
        }
        res.json(rental);
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

export const decideOnRequest = async (req, res) => {
    try {
        const { decision } = req.body;
        if (!['approved', 'denied'].includes(decision)) return res.status(400).json({ message: "Invalid decision." });
        const rental = await Rental.findById(req.params.id);
        if (!rental) return res.status(404).json({ message: "Rental not found." });
        if (rental.owner.toString() !== req.user._id.toString()) return res.status(401).json({ message: "Not authorized." });
        if (rental.status !== 'pending') return res.status(400).json({ message: `Request is already '${rental.status}'.` });
        rental.status = decision;
        await rental.save();
        res.json({ message: `Request successfully ${decision}.`, rental });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

export const scheduleRental = async (req, res) => {
    try {
        const { scheduledTime, scheduledLocation } = req.body;
        const rental = await Rental.findById(req.params.id);
        if (!rental) return res.status(404).json({ message: "Rental not found." });
        const pickupToken = crypto.randomBytes(32).toString('hex');
        const returnToken = crypto.randomBytes(32).toString('hex');
        rental.scheduledTime = scheduledTime;
        rental.scheduledLocation = scheduledLocation;
        rental.status = 'scheduled';
        rental.pickupToken = pickupToken;
        rental.returnToken = returnToken;
        await rental.save();
        res.json(rental);
    } catch (error) {
        console.error("Error in scheduleRental:", error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

export const verifyExchange = async (req, res) => {
    try {
        const { token } = req.body;
        const rental = await Rental.findById(req.params.id);
        if (!rental) return res.status(404).json({ message: "Rental not found." });
        if (rental.status === 'scheduled' && rental.pickupToken === token) {
            rental.status = 'in_progress';
            await rental.save();
            return res.json({ success: true, newStatus: 'in_progress', message: 'Pickup confirmed!' });
        }
        if (rental.status === 'in_progress' && rental.returnToken === token) {
            rental.status = 'completed';
            await rental.save();
            return res.json({ success: true, newStatus: 'completed', message: 'Return confirmed!' });
        }
        res.status(400).json({ success: false, message: 'Invalid or incorrect QR code.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

export const cancelRental = async (req, res) => {
    try {
        const rental = await Rental.findById(req.params.id);
        if (!rental) return res.status(404).json({ message: "Rental not found." });
        if (rental.renter.toString() !== req.user._id.toString()) return res.status(401).json({ message: "Not authorized." });
        if (rental.status !== 'pending' && rental.status !== 'approved' && rental.status !== 'scheduled') {
            return res.status(400).json({ message: `Cannot cancel a rental that is already '${rental.status}'.` });
        }
        rental.status = 'cancelled';
        await rental.save();
        res.json({ message: "Rental request has been cancelled.", rental });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};