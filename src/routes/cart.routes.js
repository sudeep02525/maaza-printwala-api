import express from 'express';
import { getCart, addItemToCart, updateCartItem, removeCartItem, clearCart } from '../controllers/cart.controller.js';

const router = express.Router();

router.get('/', getCart);
router.post('/items', addItemToCart);
router.patch('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeCartItem);
router.delete('/', clearCart);

export default router;
