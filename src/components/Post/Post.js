import { useState } from 'react';
import DetailedPost from '../DetailedPost/DetailedPost';
import './Post.css';

// post is the full post object from the feed, onLoginRequired is App's "send them to the login form" - called when a logged out user tries to react
function Post({ post, onLoginRequired }) {
  const [likes, setLikes] = useState(post.likes);
  const [dislikes, setDislikes] = useState(post.dislikes);
  const [userReaction, setUserReaction] = useState(post.userReaction || null); // 'like' | 'dislike' | null - from the feed, so a refresh remembers what the user pressed
  const [reactionError, setReactionError] = useState('');
  const [isCommentsOpen, setIsCommentsOpen] = useState(false); // controls whether the DetailedPost modal is currently shown

  // one handler for both buttons - type is 'like' or 'dislike'
  // the add / remove / switch rules now live on the server (routes/posts.js), so this just sends the click and shows the totals that come back
  const handleReaction = async (type) => {
    setReactionError('');
    const token = localStorage.getItem('token');

    // the guard 
    if (!token) {               // nobody is logged in...
      if (onLoginRequired) {    // ... so if App gave us a way to send them to log in, 
        onLoginRequired();      // use it, 
      }
      return;                   // ... and stop here, so the fetch below never runs
    }

    try {
      const response = await fetch(`/api/posts/${post.id}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // requireAuth on the server needs this to know who's reacting
        },
        body: JSON.stringify({ type }),
      });
      const data = await response.json(); // { likes, dislikes, userReaction } on success, or { error }

      if (response.ok) {
        // the server's numbers replace ours - they include everyone's reactions, and are exactly what's stored
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setUserReaction(data.userReaction);
      } else {
        setReactionError(data.error || 'Could not save your reaction. Please try again.');
      }
    } catch (err) {
      setReactionError('Could not connect to the server. Please try again.');
    }
  };

  // share handler function 
  const handleShare = () => {
    const link = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(link);
  };

  // post display <article> is a semantically appropriate tag for a self-contained piece of content
  return (
    <article className="post">
      <div className="post-posted-by">{post.postedBy}</div> {/* displays username */}
      <div className="post-heading">{post.postHeading}</div> {/* displays post heading */}

      <div className="post-content">{post.content}</div> {/* displays post content */}

      <div className="post-actions"> {/* like, dislike, comments and share buttons */}
        {/* aria-pressed tells screen readers (and the CSS) which reaction is the user's - the same approach as the category buttons */}
        <button className="btn" aria-label="like" aria-pressed={userReaction === 'like'} onClick={() => handleReaction('like')}>
          Like <span className="like-count">{likes}</span>
        </button>
        <button className="btn" aria-label="dislike" aria-pressed={userReaction === 'dislike'} onClick={() => handleReaction('dislike')}>
          Dislike <span className="dislike-count">{dislikes}</span>
        </button>
        <button
          className="btn"
          aria-label="comments"
          onClick={() => setIsCommentsOpen(true)}
        >
          Comments
        </button>
        <button className="btn" aria-label="share" onClick={handleShare}>
          Share
        </button>
      </div>

      {reactionError && <p className="form-error">{reactionError}</p>} {/* form-error is the shared red error style from LoginForm.css */}

      {isCommentsOpen && (
        <DetailedPost post={post} onClose={() => setIsCommentsOpen(false)} />
      )} {/* conditional rendering - if truthy DetailedPost renders if falsy it does not */}
    </article>
  );
}

export default Post;