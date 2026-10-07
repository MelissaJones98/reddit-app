// one shared list of categories, used by the feed's filter buttons AND the Create Post dropdown, so the two can never drift apart
// a post's category must exactly match one of these - backend/constants/categories.js holds a copy of POST_CATEGORIES (called CATEGORIES there) for the server's check, so a change here must be made there too

// the filter buttons above the feed - 'All' and 'Most Visited' are ways of VIEWING the feed
export const FEED_CATEGORIES = [
  'All',
  'Most Visited',
  'Internet Culture',
  'Games',
  'Movies & TV',
  'Technology',
  'Places & Travel',
  'Pop Culture',
  'Sports',
  'Education & Career',
  'Business & Finance',
  'News & Politics',
  'Fashion & Beauty',
  'Vehicles',
  'Food & Drink',
  'Home & Garden',
  'Music',
  'Anime & Cosplay',
  'Reading & Writing',
  'Humanities & Law',
  'Science',
  'Art',
  'Collectibles & Hobbies',
  'Wellness',
  'Nature & Outdoors',
];

// the topics a post can actually belong to - everything except the two viewing options
export const POST_CATEGORIES = FEED_CATEGORIES.filter(
  (category) => category !== 'All' && category !== 'Most Visited'
);
