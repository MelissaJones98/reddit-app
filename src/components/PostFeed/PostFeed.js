import { useState } from 'react';
import Post from '../Post/Post';
import CategoryFilter from '../CategoryFilter/CategoryFilter';
import './PostFeed.css';
import { FEED_CATEGORIES } from '../../constants/categories'; // shared with the Create Post form

function PostFeed({ posts, searchTerm = '', onLoginRequired }) { // onLoginRequired is passed straight through to each Post // searchTerm comes from App (typed into the Banner) - defaults to '' so PostFeed still works if it isn't passed
  const [activeCategory, setActiveCategory] = useState('All');

  // a post is shown only if it passes BOTH filters
  const filteredPosts = posts.filter((post) => {
    // 'All' and 'Most Visited' both include every category - Most Visited only changes the ORDER (below)
    const matchesCategory = activeCategory === 'All' || activeCategory === 'Most Visited' || post.category === activeCategory;

    const matchesSearch = post.postHeading.toLowerCase().trim().includes(searchTerm.toLowerCase().trim());
    
    return matchesCategory && matchesSearch;
  });

  // the posts in the order they're shown - newest first (as the server sends them), unless Most Visited is chosen
  let visiblePosts = filteredPosts;
  if (activeCategory === 'Most Visited') {
    // set visiblePosts to be the filtered posts sorted by total reactions (likes + dislikes), most first
    visiblePosts = [...filteredPosts].sort((a, b) => (b.likes + b.dislikes) - (a.likes + a.dislikes)); // sorts a copy of filteredPosts 
    // [...filteredPosts] makes the copy, so the original array is never changed - that's the immutability rule
    // a.likes is post a's number of likes e.g 3
    // a.likes + a.dislikes - post a's total e.g 3 + 1 = 4
  }

  return (
    <div className="post-feed-wrapper">
      <CategoryFilter
        categories={FEED_CATEGORIES}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {visiblePosts.length === 0 ? (
        <p className="no-posts">No posts to show yet.</p> // intentional message that there aren't any posts in the event of no content being found or a failed API call 
      ) : (
        <div className="post-feed">
          {visiblePosts.map((post) => ( // map() runs a function on every item in an array and returns a new array containing whatever that function returned for each one
            <Post key={post.id} post={post} onLoginRequired={onLoginRequired} /> // each item in the array is assigned an id so the data rendered is the correct data for that id 
          ))}
        </div>
      )}
    </div>
  );
}

export default PostFeed;