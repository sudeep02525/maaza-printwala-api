import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import DeliveryRule from '../models/DeliveryRule.js';
import SearchLog from '../models/SearchLog.js';
import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      totalProducts,
      totalUsers,
      totalCategories,
      recentOrders,
      todayOrders,
      pendingArtworkReviews,
      ordersWithRevenue,
      revenueTodayOrders,
      revenueMonthOrders,
      ordersThisWeek,
      ordersLastWeek,
      revenueThisWeekOrders,
      revenueLastWeekOrders,
      usersThisWeek,
      usersLastWeek,
      activeProducts,
      draftProducts,
      outOfStockProducts,
      statusAgg,
      dailySales,
    ] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: 'USER' }),
      Category.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(8).populate('user', 'name email'),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ 'items.artworkStatus': 'PENDING_REVIEW' }),
      Order.find({ paymentStatus: { $in: ['PAID', 'PENDING'] } }),
      Order.find({ createdAt: { $gte: startOfToday }, paymentStatus: { $in: ['PAID', 'PENDING'] } }),
      Order.find({ createdAt: { $gte: startOfMonth }, paymentStatus: { $in: ['PAID', 'PENDING'] } }),
      Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Order.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Order.find({ createdAt: { $gte: sevenDaysAgo }, paymentStatus: { $in: ['PAID', 'PENDING'] } }),
      Order.find({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }, paymentStatus: { $in: ['PAID', 'PENDING'] } }),
      User.countDocuments({ role: 'USER', createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ role: 'USER', createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Product.countDocuments({
        $or: [
          { status: 'ACTIVE' },
          { status: { $exists: false }, isActive: true },
          { status: null, isActive: true },
        ],
      }),
      Product.countDocuments({
        $or: [
          { status: 'DRAFT' },
          { status: { $exists: false }, isActive: false },
          { status: null, isActive: false },
        ],
      }),
      Product.countDocuments({ status: 'OUT_OF_STOCK' }),
      Order.aggregate([{ $group: { _id: '$fulfilmentStatus', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$finalPayableAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totalRevenue = ordersWithRevenue.reduce((acc, order) => acc + (order.finalPayableAmount || 0), 0);
    const revenueToday = revenueTodayOrders.reduce((acc, order) => acc + (order.finalPayableAmount || 0), 0);
    const revenueThisMonth = revenueMonthOrders.reduce((acc, order) => acc + (order.finalPayableAmount || 0), 0);
    const revenueThisWeek = revenueThisWeekOrders.reduce((acc, order) => acc + (order.finalPayableAmount || 0), 0);
    const revenueLastWeek = revenueLastWeekOrders.reduce((acc, order) => acc + (order.finalPayableAmount || 0), 0);

    const calcGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    const statusBreakdown = {
      NEW: 0,
      ARTWORK_REVIEW: 0,
      PRODUCTION: 0,
      DISPATCH_READY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    statusAgg.forEach((item) => {
      const s = item._id || '';
      if (!s) return;
      statusBreakdown[s] = (statusBreakdown[s] || 0) + item.count;

      if (s === 'ORDER_RECEIVED' || s === 'NEW') {
        statusBreakdown.NEW = (statusBreakdown.NEW || 0) + item.count;
      } else if (s === 'ARTWORK_REVIEW' || s === 'ARTWORK_CHANGES_REQUIRED' || s === 'ARTWORK_APPROVED') {
        statusBreakdown.ARTWORK_REVIEW = (statusBreakdown.ARTWORK_REVIEW || 0) + item.count;
      } else if (s === 'PRINTING' || s === 'QUEUED_FOR_PRINTING' || s === 'PRODUCTION' || s === 'QUALITY_CHECK') {
        statusBreakdown.PRODUCTION = (statusBreakdown.PRODUCTION || 0) + item.count;
      } else if (s === 'READY_FOR_DISPATCH' || s === 'DISPATCHED' || s === 'DISPATCH_READY') {
        statusBreakdown.DISPATCH_READY = (statusBreakdown.DISPATCH_READY || 0) + item.count;
      } else if (s === 'DELIVERED') {
        statusBreakdown.DELIVERED = (statusBreakdown.DELIVERED || 0) + item.count;
      } else if (s === 'CANCELLED') {
        statusBreakdown.CANCELLED = (statusBreakdown.CANCELLED || 0) + item.count;
      }
    });

    return sendSuccess(res, STATUS_CODES.OK, 'Admin stats fetched successfully', {
      stats: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalCategories,
        totalRevenue,
        pendingArtworkReviews,
        todayOrders,
        statusBreakdown,
        revenueToday,
        revenueThisMonth,
        growth: {
          orders: calcGrowth(ordersThisWeek, ordersLastWeek),
          revenue: calcGrowth(revenueThisWeek, revenueLastWeek),
          customers: calcGrowth(usersThisWeek, usersLastWeek),
          ordersThisWeek,
          ordersLastWeek,
          revenueThisWeek,
          revenueLastWeek,
          usersThisWeek,
          usersLastWeek,
        },
        productStatus: {
          active: activeProducts,
          outOfStock: outOfStockProducts,
          draft: draftProducts,
        },
      },
      dailySales,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email phone')
      .lean();
      
    const total = await Order.countDocuments();
    
    return sendSuccess(res, STATUS_CODES.OK, 'All orders fetched successfully', { 
      orders, 
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Order not found');
    }

    const oldStatus = order.fulfilmentStatus;
    order.fulfilmentStatus = status || order.fulfilmentStatus;
    
    order.statusHistory.push({
       previousStatus: oldStatus,
       newStatus: order.fulfilmentStatus,
       actorType: 'ADMIN',
       note: note || ''
    });
    
    await order.save();

    // Trigger Notification for user
    if (order.user || order.deliveryAddress?.phone) {
      Notification.create({
        user: order.user,
        recipient: order.deliveryAddress?.phone || order.orderNumber,
        channel: 'IN_APP',
        subject: `Order #${order.orderNumber} Status Updated`,
        message: `Your order status has changed to ${order.fulfilmentStatus.replace(/_/g, ' ')}. ${note || ''}`.trim(),
        status: 'SENT',
        metadata: {
          orderId: String(order._id),
          orderNumber: String(order.orderNumber),
          fulfilmentStatus: order.fulfilmentStatus,
        },
      }).catch((err) => console.error('Status notification error:', err));
    }

    return sendSuccess(res, STATUS_CODES.OK, 'Order status updated successfully', { order });
  } catch (error) {
    next(error);
  }
};

export const getAllUsersAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments();

    return sendSuccess(res, STATUS_CODES.OK, 'All users fetched successfully', {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryRulesAdmin = async (req, res, next) => {
  try {
    const rules = await DeliveryRule.find().sort({ createdAt: -1 });
    return sendSuccess(res, STATUS_CODES.OK, 'Delivery rules fetched successfully', { rules });
  } catch (error) {
    next(error);
  }
};

export const createDeliveryRuleAdmin = async (req, res, next) => {
  try {
    const { name, pinCodePrefixes, deliveryMethod, charge, freeDeliveryThreshold, estimatedDaysMin, estimatedDaysMax, isActive } = req.body;
    if (!name) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Rule name is required');
    }

    const prefixes = Array.isArray(pinCodePrefixes)
      ? pinCodePrefixes
      : (pinCodePrefixes ? String(pinCodePrefixes).split(',').map((s) => s.trim()) : []);

    const rule = await DeliveryRule.create({
      name,
      pinCodePrefixes: prefixes,
      deliveryMethod: deliveryMethod || 'STANDARD',
      charge: Number(charge) || 0,
      freeDeliveryThreshold: freeDeliveryThreshold ? Number(freeDeliveryThreshold) : undefined,
      estimatedDaysMin: Number(estimatedDaysMin) || 3,
      estimatedDaysMax: Number(estimatedDaysMax) || 7,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isDemoData: false,
    });

    return sendSuccess(res, STATUS_CODES.CREATED, 'Delivery rule created successfully', { rule });
  } catch (error) {
    next(error);
  }
};

export const updateDeliveryRuleAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, pinCodePrefixes, deliveryMethod, charge, freeDeliveryThreshold, estimatedDaysMin, estimatedDaysMax, isActive } = req.body;

    const prefixes = pinCodePrefixes !== undefined
      ? (Array.isArray(pinCodePrefixes) ? pinCodePrefixes : String(pinCodePrefixes).split(',').map((s) => s.trim()))
      : undefined;

    const updateData = {};
    if (name) updateData.name = name;
    if (prefixes) updateData.pinCodePrefixes = prefixes;
    if (deliveryMethod) updateData.deliveryMethod = deliveryMethod;
    if (charge !== undefined) updateData.charge = Number(charge);
    if (freeDeliveryThreshold !== undefined) updateData.freeDeliveryThreshold = freeDeliveryThreshold ? Number(freeDeliveryThreshold) : undefined;
    if (estimatedDaysMin !== undefined) updateData.estimatedDaysMin = Number(estimatedDaysMin);
    if (estimatedDaysMax !== undefined) updateData.estimatedDaysMax = Number(estimatedDaysMax);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const rule = await DeliveryRule.findByIdAndUpdate(id, updateData, { new: true });
    if (!rule) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Delivery rule not found');
    }

    return sendSuccess(res, STATUS_CODES.OK, 'Delivery rule updated successfully', { rule });
  } catch (error) {
    next(error);
  }
};

export const deleteDeliveryRuleAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await DeliveryRule.findByIdAndDelete(id);
    if (!rule) {
      return sendError(res, STATUS_CODES.NOT_FOUND, 'Delivery rule not found');
    }
    return sendSuccess(res, STATUS_CODES.OK, 'Delivery rule deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getReportsAdmin = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const paidOrders = await Order.find({ paymentStatus: 'PAID' });
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.finalPayableAmount || 0), 0);
    const avgOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

    // Status breakdown
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$fulfilmentStatus', count: { $sum: 1 }, revenue: { $sum: '$finalPayableAmount' } } }
    ]);

    // Payment breakdown
    const paymentCounts = await Order.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]);

    // Recent 30 days daily sales
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailySales = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$finalPayableAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Search analytics
    const topSearches = await SearchLog.find().sort({ count: -1 }).limit(10).lean();

    return sendSuccess(res, STATUS_CODES.OK, 'Admin reports fetched successfully', {
      summary: {
        totalOrders,
        paidOrdersCount: paidOrders.length,
        totalRevenue,
        avgOrderValue,
      },
      statusBreakdown: statusCounts,
      paymentBreakdown: paymentCounts,
      dailySales,
      topSearches,
    });
  } catch (error) {
    next(error);
  }
};


