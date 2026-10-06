import { useState } from 'react';
import Post from '../Post/Post';
import CategoryFilter from '../CategoryFilter/CategoryFilter';
import './PostFeed.css';

const CATEGORIES = [
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

function PostFeed({ posts, searchTerm = '' }) { // searchTerm comes from App (typed into the Banner) - defaults to '' so PostFeed still works if it isn't passed
  const [activeCategory, setActiveCategory] = useState('All');

  // a post is shown only if it passes BOTH filters
  const filteredPosts = posts.filter((post) => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;

    const matchesSearch = post.postHeading.toLowerCase().trim().includes(searchTerm.toLowerCase().trim());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="post-feed-wrapper">
      <CategoryFilter
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {filteredPosts.length === 0 ? (
        <p className="no-posts">No posts to show yet.</p> // intentional message that there aren't any posts in the event of no content being found or a failed API call 
      ) : (
        <div className="post-feed">
          {filteredPosts.map((post) => ( // map() runs a function on every item in an array and returns a new array containing whatever that function returned for each one
            <Post key={post.id} post={post} /> // each item in the array is assigned an id so the data rendered is the correct data for that id 
          ))}
        </div>
      )}
    </div>
  );
}

export default PostFeed;