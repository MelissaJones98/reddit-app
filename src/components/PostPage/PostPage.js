import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Post from '../Post/Post';
import './PostPage.css';

// the page a shared link opens, e.g. /post/12 - shows that one post as a normal Post card, so Like, Comments and Share all still work
function PostPage({ onLoginRequired }) {
  const { id } = useParams(); // reads :id out of the URL - for /post/12, id is '12' (always text, because it comes from the URL)
  const navigate = useNavigate();

  const [post, setPost] = useState(null); // null until it's loaded
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false); // the server said 404 - no post has this id
  const [error, setError] = useState(''); // anything else that went wrong

  // load the post whenever the id in the URL changes
  useEffect(() => {
    const loadPost = async () => {
      setIsLoading(true);
      setNotFound(false);
      setError('');

      try {
        const token = localStorage.getItem('token'); // sent when logged in, so the server includes this user's own reaction
        const response = await fetch(`/api/posts/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json(); // the post on success, or { error } on failure

        if (response.ok) {
          setPost(data); // the post the server sent is in data
        } else if (response.status === 404) {
          setNotFound(true); // yes, the post could not be found
        } else {
          setError('Could not load this post. Please try again later.'); // a message for the user
        }
      } catch (err) {
        setError('Could not load this post. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadPost();
  }, [id]);

  let content;
  if (isLoading) {
    content = <p className="feed-status">Loading post...</p>;
  } else if (notFound) {
    content = <p className="feed-status">Post not found. It may have been deleted, or the link may be wrong.</p>;
  } else if (error) {
    content = <p className="feed-status">{error}</p>;
  } else if (post) {
    content = <Post post={post} onLoginRequired={onLoginRequired} />;
  }

  return (
    <div className="post-page">
      {/* someone arriving from a shared link has no feed "behind" them, so the browser's Back button might leave the app entirely - this always leads to the feed */}
      <button className="btn post-page-back" onClick={() => navigate('/')}>
        Back to all posts
      </button>
      {content}
    </div>
  );
}

export default PostPage;
