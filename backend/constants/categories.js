// the categories a post can belong to - these must exactly match the category buttons in src/components/PostFeed/PostFeed.js,
// otherwise a post could be saved with a category that no button can ever filter to
// 'All' and 'Most Visited' are left out on purpose: they're ways of VIEWING the feed, not topics a post can be about
const CATEGORIES = [
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

module.exports = CATEGORIES;
