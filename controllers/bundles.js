import Bundle from '../models/Bundle.js';
import Item from '../models/Item.js';

export const createBundle = async (req, res) => {
    const { name, description, price, itemIds } = req.body;
    if (!name || !price || !itemIds || itemIds.length < 2) {
        return res.status(400).json({ message: 'A name, price, and at least two items are required to create a bundle.' });
    }

    try {
        const bundle = new Bundle({
            name,
            description,
            price,
            items: itemIds,
            owner: req.user._id,
        });
        const createdBundle = await bundle.save();
        res.status(201).json(createdBundle);
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating bundle.', error: error.message });
    }
};

export const getMyBundles = async (req, res) => {
    try {
        const bundles = await Bundle.find({ owner: req.user._id })
            .populate('items', 'title imageUrl') 
            .sort({ createdAt: -1 });
        res.json(bundles);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching your bundles.', error: error.message });
    }
};