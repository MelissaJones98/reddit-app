import Post from '../Post/Post';
import './PostFeed.css';

function PostFeed({ posts }) {
  if (posts.length === 0) {
    return <p className="no-posts">No posts to show yet.</p>;
  }

  return (
    <div className="post-feed">
      {posts.map((post) => ( // map() runs a function on every item in an array and returns a new array containing whatever that function returned for each one
        <Post key={post.id} post={post} /> // each item in the array is assigned an id so the data rendered is the correct data for that id 
      ))}
    </div>
  );
}

export default PostFeed;