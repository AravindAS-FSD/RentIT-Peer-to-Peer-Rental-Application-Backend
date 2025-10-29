import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { 
  createItem, 
  getAllItems, 
  getMyListings, 
  deleteItem, 
  getItemById, 
  updateItem 
} from '../controllers/items.js';

const router = express.Router();

router.route('/')
  .post(protect, createItem)
  .get(getAllItems);

router.route('/my-listings')
  .get(protect, getMyListings);

router.route('/:id')
  .get(getItemById)
  .put(protect, updateItem)
  .delete(protect, deleteItem);

export default router;
