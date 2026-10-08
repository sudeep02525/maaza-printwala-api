import express from 'express';
import { getCart, addItemToCart, updateCartItem, removeCartItem, clearCart } from '../controllers/cart.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(optionalAuth);

router.get('/', getCart);
router.post('/items', addItemToCart);
router.patch('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeCartItem);
router.delete('/', clearCart);

export default router;
