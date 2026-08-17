import Fuse from 'fuse.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

let productFuse = null;
let suggestionFuse = null;

let productsCache = [];
let categoriesCache = [];

// Static Popular Searches (Could be moved to DB later)
const POPULAR_SEARCHES = [
  "Visiting Cards",
  "Flyers",
  "Custom T-Shirts",
  "Coffee Mugs",
  "Letterheads",
  "Banners",
  "Stickers",
  "Labels",
  "Standees",
  "Custom Packaging",
  "Brochures",
  "Posters"
];

const FUSE_OPTIONS = {
  includeScore: true,
  shouldSort: true,
  isCaseSensitive: false,
  minMatchCharLength: 2,
  threshold: 0.3, // Strict enough to prevent garbage, loose enough for typos
  ignoreLocation: true, // Important for matching words anywhere in the string
  keys: [
    { name: 'name', weight: 1.0 }, // Product name -> highest
    { name: 'keywords', weight: 0.8 }, // Keywords/synonyms -> high
    { name: 'category.name', weight: 0.5 }, // Category -> medium
    { name: 'description', weight: 0.2 }, // Description -> low
    { name: 'shortDescription', weight: 0.2 } // Description -> low
  ]
};

const SUGGESTIONS_FUSE_OPTIONS = {
  includeScore: true,
  shouldSort: true,
  isCaseSensitive: false,
  minMatchCharLength: 1, // Single-character support (h -> helmet)
  threshold: 0.4,
  ignoreLocation: true,
  keys: [
    { name: 'term', weight: 1.0 }
  ]
};

export const initSearchEngine = async () => {
  try {
    console.log('[SearchService] Initializing Search Engine...');
    const products = await Product.find({ isActive: true }).populate('category', 'name slug');
    productsCache = products;
    
    productFuse = new Fuse(products, FUSE_OPTIONS);
    
    categoriesCache = await Category.find();
    
    // Build Canonical Suggestion Index
    const suggestionMap = new Map();
    
    // 1. Add categories
    categoriesCache.forEach(c => {
       suggestionMap.set(c.name.toLowerCase(), { term: c.name, type: 'category' });
    });
    
    // 2. Add product names and canonical keywords
    products.forEach(p => {
       if (p.name) {
          suggestionMap.set(p.name.toLowerCase(), { term: p.name, type: 'product' });
       }
       if (p.keywords && Array.isArray(p.keywords)) {
          p.keywords.forEach(k => {
             // Only add meaningful keywords, avoid single characters unless intended
             if (k.length >= 3) {
               const capitalized = k.charAt(0).toUpperCase() + k.slice(1);
               if (!suggestionMap.has(k.toLowerCase())) {
                 suggestionMap.set(k.toLowerCase(), { term: capitalized, type: 'keyword' });
               }
             }
          });
       }
    });
    
    // 3. Add popular searches
    POPULAR_SEARCHES.forEach(pop => {
       if (!suggestionMap.has(pop.toLowerCase())) {
          suggestionMap.set(pop.toLowerCase(), { term: pop, type: 'popular' });
       }
    });

    const suggestionList = Array.from(suggestionMap.values());
    suggestionFuse = new Fuse(suggestionList, SUGGESTIONS_FUSE_OPTIONS);
    
    console.log(`[SearchService] Initialized with ${products.length} products and ${suggestionList.length} canonical suggestions.`);
  } catch (error) {
    console.error('[SearchService] Error initializing:', error);
  }
};

export const searchProducts = (query) => {
  if (!productFuse) return [];
  if (!query || query.trim().length === 0) return productsCache;

  const results = productFuse.search(query.trim());
  return results.map(result => result.item);
};

export const getSuggestions = (query) => {
  const q = query ? query.trim().toLowerCase() : '';
  
  if (!q) {
    return {
      popular: POPULAR_SEARCHES.slice(0, 5),
      categories: categoriesCache.slice(0, 4).map(c => c.name),
      matches: []
    };
  }

  // Use the dedicated canonical suggestion index!
  const results = suggestionFuse.search(q);
  
  const categories = [];
  const matches = [];
  
  // Dedup logic just in case
  results.slice(0, 10).forEach(r => {
     if (r.item.type === 'category') {
        if (!categories.includes(r.item.term)) categories.push(r.item.term);
     } else {
        if (!matches.includes(r.item.term)) matches.push(r.item.term);
     }
  });

  return {
    popular: [],
    categories,
    matches: matches.slice(0, 8) // Limit matches
  };
};

// Force a refresh (e.g. after adding new products)
export const refreshIndex = async () => {
  await initSearchEngine();
};
