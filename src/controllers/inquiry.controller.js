import BulkEnquiry from '../models/BulkEnquiry.js';
import SupportRequest from '../models/SupportRequest.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

export const submitBulkEnquiry = async (req, res, next) => {
  try {
    const { name, email, phone, companyName, productType, estimatedQuantity, targetDate, requirements } = req.body;

    if (!name || !email || !phone || !productType || !estimatedQuantity) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Name, email, phone, product type, and estimated quantity are required.');
    }

    const enquiry = new BulkEnquiry({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      companyName: companyName?.trim() || '',
      productType: productType.trim(),
      estimatedQuantity: Number(estimatedQuantity),
      targetDate: targetDate ? new Date(targetDate) : undefined,
      requirements: requirements?.trim() || '',
      status: 'NEW',
    });

    await enquiry.save();

    return sendSuccess(res, STATUS_CODES.CREATED, 'Bulk enquiry submitted successfully! Our B2B printing specialists will contact you within 24 hours.', { enquiry });
  } catch (error) {
    next(error);
  }
};

export const getAdminBulkEnquiries = async (req, res, next) => {
  try {
    const enquiries = await BulkEnquiry.find().sort({ createdAt: -1 });
    return sendSuccess(res, STATUS_CODES.OK, 'Bulk enquiries fetched successfully', { enquiries });
  } catch (error) {
    next(error);
  }
};

export const updateBulkEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const enquiry = await BulkEnquiry.findByIdAndUpdate(
      id,
      { ...(status && { status }), ...(adminNotes !== undefined && { adminNotes }) },
      { new: true }
    );

    if (!enquiry) return sendError(res, STATUS_CODES.NOT_FOUND, 'Enquiry not found.');
    return sendSuccess(res, STATUS_CODES.OK, 'Bulk enquiry updated', { enquiry });
  } catch (error) {
    next(error);
  }
};

export const submitSupportRequest = async (req, res, next) => {
  try {
    const { email, subject, message } = req.body;
    const userId = req.user?._id;

    if (!email || !subject || !message) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Email, subject, and message are required.');
    }

    const ticket = new SupportRequest({
      user: userId,
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'OPEN',
    });

    await ticket.save();

    return sendSuccess(res, STATUS_CODES.CREATED, 'Support ticket created successfully. Our team will contact you shortly.', { ticket });
  } catch (error) {
    next(error);
  }
};

export const getAdminSupportRequests = async (req, res, next) => {
  try {
    const tickets = await SupportRequest.find().populate('user', 'name email').sort({ createdAt: -1 });
    return sendSuccess(res, STATUS_CODES.OK, 'Support requests fetched successfully', { tickets });
  } catch (error) {
    next(error);
  }
};

export const updateSupportRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = await SupportRequest.findByIdAndUpdate(id, { status }, { new: true });
    if (!ticket) return sendError(res, STATUS_CODES.NOT_FOUND, 'Support ticket not found.');
    return sendSuccess(res, STATUS_CODES.OK, 'Support ticket updated', { ticket });
  } catch (error) {
    next(error);
  }
};
