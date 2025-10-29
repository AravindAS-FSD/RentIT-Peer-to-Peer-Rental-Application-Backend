import multer from 'multer';
import mongoose from 'mongoose';
import { storage, cloudinary } from '../config/cloudinary.js';
import Item from '../models/Item.js';

const upload = multer({ storage });

/* -------------------------- CREATE NEW ITEM -------------------------- */
export const createItem = async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Image upload failed.', error: err.message });
    }

    const { title, description, category, courseCode, price, priceType, condition } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    try {
      const item = new Item({
        title,
        description,
        category,
        courseCode,
        condition,
        price,
        priceType,
        imageUrl: req.file.path,
        imagePublicId: req.file.filename,
        owner: req.user._id,
      });

      const createdItem = await item.save();
      res.status(201).json(createdItem);
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: 'Failed to create item.', error: error.message });
    }
  });
};

/* -------------------------- GET USER'S LISTINGS -------------------------- */
export const getMyListings = async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching your listings.' });
  }
};

/* -------------------------- DELETE ITEM -------------------------- */
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Only owner can delete
    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    // Check if item is used in any active rental
    const existingRental = await Rental.findOne({
      item: item._id,
      status: { $nin: ['completed', 'cancelled'] }
    });

    if (existingRental) {
      return res.status(400).json({
        message: 'Item is currently rented or pending. Cannot delete now.',
      });
    }

    await item.deleteOne();
    res.status(200).json({ message: 'Item deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting item' });
  }
};

/* -------------------------- UPDATE ITEM -------------------------- */
export const updateItem = async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Image upload failed.', error: err.message });
    }

    const { id } = req.params;

    try {
      const item = await Item.findById(id);
      if (!item) return res.status(404).json({ message: 'Item not found.' });

      if (item.owner.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to update this item.' });
      }

      // ✅ Update all fields safely
      item.title = req.body.title || item.title;
      item.description = req.body.description || item.description;
      item.category = req.body.category || item.category;
      item.courseCode = req.body.courseCode || item.courseCode;
      item.condition = req.body.condition || item.condition;
      item.price = req.body.price || item.price;
      item.priceType = req.body.priceType || item.priceType;

      // ✅ Handle image replacement
      if (req.file) {
        await cloudinary.uploader.destroy(item.imagePublicId);
        item.imageUrl = req.file.path;
        item.imagePublicId = req.file.filename;
      }

      const updatedItem = await item.save();
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ message: 'Failed to update item.', error: error.message });
    }
  });
};

/* -------------------------- GET ITEM BY ID -------------------------- */
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID format.' });
    }

    const item = await Item.findById(id).populate('owner', 'name');
    if (!item) return res.status(404).json({ message: 'Item not found.' });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching item details.' });
  }
};

/* -------------------------- GET ALL ITEMS -------------------------- */
export const getAllItems = async (req, res) => {
  try {
    const items = await Item.find({ isAvailable: true })
      .populate('owner', 'name')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching all items.' });
  }
};
