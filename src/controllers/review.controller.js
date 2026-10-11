import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    let queryId = productId;

    // Handle slug or ObjectId
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      const prod = await Product.findOne({ slug: productId });
      if (!prod) {
        return sendError(res, STATUS_CODES.NOT_FOUND, 'Product not found.');
      }
      queryId = prod._id;
    }

    const reviews = await Review.find({ product: queryId, isApproved: true })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const count = reviews.length;
    const avgRating = count > 0 
      ? Math.round((reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / count) * 10) / 10 
      : 5.0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    });

    return sendSuccess(res, STATUS_CODES.OK, 'Reviews fetched successfully', {
      reviews,
      count,
      avgRating,
      distribution,
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, comment, name } = req.body;
    const userId = req.user?._id;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, 'Rating must be an integer between 1 and 5.');
    }

    let resolvedProductId = productId;
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      const prod = await Product.findOne({ slug: productId });
      if (!prod) return sendError(res, STATUS_CODES.NOT_FOUND, 'Product not found.');
      resolvedProductId = prod._id;
    }

    // Auto-approve in development or for verified users
    const review = new Review({
      product: resolvedProductId,
      user: userId,
      rating: Number(rating),
      comment: comment?.trim() || '',
      isApproved: true,
      isDemoData: false,
    });

    await review.save();
    await review.populate('user', 'name');

    return sendSuccess(res, STATUS_CODES.CREATED, 'Review submitted successfully!', { review });
  } catch (error) {
    next(error);
  }
};

export const getAdminReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('product', 'name slug')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, STATUS_CODES.OK, 'Admin reviews fetched successfully', { reviews });
  } catch (error) {
    next(error);
  }
};

export const toggleReviewApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return sendError(res, STATUS_CODES.NOT_FOUND, 'Review not found.');

    review.isApproved = !review.isApproved;
    await review.save();

    return sendSuccess(res, STATUS_CODES.OK, `Review ${review.isApproved ? 'approved' : 'hidden'} successfully`, { review });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);
    if (!review) return sendError(res, STATUS_CODES.NOT_FOUND, 'Review not found.');

    return sendSuccess(res, STATUS_CODES.OK, 'Review deleted successfully', { reviewId: id });
  } catch (error) {
    next(error);
  }
};
