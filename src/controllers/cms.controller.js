import CMSContent from '../models/CMSContent.js';
import { sendSuccess } from '../utils/response.util.js';
import { STATUS_CODES } from '../constants/error.constants.js';

export const getHomepageContent = async (req, res, next) => {
  try {
    const content = await CMSContent.find({ isActive: true });
    
    // Return standard sections array and content map for dynamic homepage rendering
    const sections = [
      { id: 'hero', enabled: true, order: 1, title: 'Hero Commercial Presentation' },
      { id: 'offer-strip', enabled: true, order: 2, title: 'Announcement Strip', subtitle: 'Corporate printing and bulk orders available nationwide' },
      { id: 'categories', enabled: true, order: 3, title: 'Popular Commercial Categories', subtitle: 'Explore high-density print solutions by industry sector' },
      { id: 'templates', enabled: true, order: 4, title: 'Featured Customizable Templates', subtitle: 'Select an editable layout and customize online in seconds' },
      { id: 'trending', enabled: true, order: 5, title: 'Trending Print Catalogue', subtitle: 'Server-authoritative volume rates for commercial accounts' },
      { id: 'business-solutions', enabled: true, order: 6, title: 'Enterprise Business Solutions', subtitle: 'Dedicated corporate support, API invoicing, and custom substrates' },
      { id: 'showcase', enabled: true, order: 7, title: 'Commercial Output Gallery', subtitle: 'Real print results and lamination specifications' },
      { id: 'quality-pillars', enabled: true, order: 8, title: 'Why Choose Maza Printwala', subtitle: 'Industrial print standards and manual QC verification' },
      { id: 'faq', enabled: true, order: 9, title: 'Frequently Asked Questions', subtitle: 'Everything you need to know about preparing artwork and bulk orders' },
    ];

    return sendSuccess(res, STATUS_CODES.OK, 'CMS homepage content fetched successfully', {
      content,
      sections,
    });
  } catch (error) {
    next(error);
  }
};
