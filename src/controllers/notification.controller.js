import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const userEmail = req.user?.email;

    const conditions = [{ user: userId }];
    if (userEmail) conditions.push({ recipient: userEmail });
    if (req.user?.role === 'ADMIN') {
      conditions.push({ recipient: 'ADMIN' });
    }

    const notifications = await Notification.find({
      $or: conditions,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return sendSuccess(res, STATUS_CODES.OK, 'Notifications fetched successfully', { notifications });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findByIdAndUpdate(
      id,
      { status: 'SENT', $set: { 'metadata.read': 'true' } },
      { new: true }
    );

    if (!notif) return sendError(res, STATUS_CODES.NOT_FOUND, 'Notification not found.');
    return sendSuccess(res, STATUS_CODES.OK, 'Notification marked as read', { notification: notif });
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (req, res, next) => {
  try {
    const { recipient, channel, subject, message, metadata, userId } = req.body;
    if (!recipient || !channel || !message) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Recipient, channel, and message are required.');
    }

    const notif = new Notification({
      user: userId || req.user?._id,
      recipient,
      channel,
      subject,
      message,
      metadata: metadata || {},
      status: 'SENT',
    });

    await notif.save();
    return sendSuccess(res, STATUS_CODES.CREATED, 'Notification sent successfully', { notification: notif });
  } catch (error) {
    next(error);
  }
};
