import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [totalOrders, totalProducts, totalUsers, totalCategories, recentOrders] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: 'USER' }),
      Category.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
    ]);

    // Calculate demo revenue
    const orders = await Order.find({ paymentStatus: { $in: ['PAID', 'PENDING'] } });
    const totalRevenue = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

    const pendingArtworkReviews = await Order.countDocuments({ 'items.artworkStatus': 'PENDING' });

    return sendSuccess(res, STATUS_CODES.OK, 'Admin stats fetched successfully', {
      stats: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalCategories,
        totalRevenue,
        pendingArtworkReviews,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email phone');
    return sendSuccess(res, STATUS_CODES.OK, 'All orders fetched successfully', { orders });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Order not found');
    }

    order.orderStatus = orderStatus || order.orderStatus;
    if (note) {
      order.statusHistory.push({ status: order.orderStatus, note });
    }
    await order.save();

    return sendSuccess(res, STATUS_CODES.OK, 'Order status updated successfully', { order });
  } catch (error) {
    next(error);
  }
};
