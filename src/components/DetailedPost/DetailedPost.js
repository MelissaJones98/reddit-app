import { useState, useEffect } from 'react';
import './DetailedPost.css';

// onClose is a function from the parent called to dismiss the modal
// onLoginRequired is App's "send them to the login form" (passed down through Post) - used when a logged out user wants to comment
function DetailedPost({ post, onClose, onLoginRequired }) {
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [newComment, setNewComment] = useState(''); // the text in the comment box
  const [submitError, setSubmitError] = useState('');

  const isLoggedIn = Boolean(localStorage.getItem('token')); // only decides whether to show the comment box - the server still checks the token properly

  // load this post's comments when the modal opens
  // post.id is listed as a dependency so the comments would reload if the modal were ever reused for a different post
  useEffect(() => {
    const loadComments = async () => {
      try {
        const response = await fetch(`/api/posts/${post.id}/comments`);
        const data = await response.json();
        if (response.ok) {
          setComments(data);
        } else {
          setLoadError('Could not load comments. Please try again later.');
        }
      } catch (err) {
        setLoadError('Could not load comments. Please check your connection.');
      } finally {
        setIsLoadingComments(false);
      }
    };
    loadComments();
  }, [post.id]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!newComment.trim()) {
      setSubmitError('Comment cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await response.json(); // the saved comment { id, postedBy, content, createdAt } on success, or { error }

      if (response.ok) {
        const updatedComments = [];
        comments.forEach( (item) => {
          updatedComments.push(item);
        });
        updatedComments.push(data); // the new comment added after the existing ones
        setComments(updatedComments);
        setNewComment(''); // empty the box, ready for another comment
      } else {
        setSubmitError(data.error || 'Could not post your comment. Please try again.'); // the box keeps its text so nothing is lost
      }
    } catch (err) {
      setSubmitError('Could not connect to the server. Please try again.');
    }
  };

  // the comments area: loading, an error, an empty message, or the list itself
  let commentList;
  if (isLoadingComments) {
    commentList = <p className="comments-status">Loading comments...</p>;
  } else if (loadError) {
    commentList = <p className="form-error">{loadError}</p>;
  } else if (comments.length === 0) {
    commentList = <p className="comments-status">No comments yet. Be the first!</p>;
  } else {
    commentList = (
      <ul className="comment-list">
        {comments.map((comment) => (
          <li key={comment.id} className="comment">
            <div className="comment-posted-by">{comment.postedBy}</div>
            <div className="comment-content" data-testid="comment-content">{comment.content}</div> {/* data-testid lets the tests read every comment's text in page order */}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}> {/* the overlay is a full screen div  that sits behind the modal content and dims/darkens the rest of the page via CSS
    onClick={onClose} means clicking anywhere on this dark background closes the modal (standard modal behaviour) */}
      <div
        className="detailed-post"
        role="dialog"
        aria-label={post.postHeading}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" aria-label="close" onClick={onClose}> {/* a second more obvious method to close the modal */}
          ✕
        </button>

        <div className="post-posted-by">{post.postedBy}</div>
        <div className="post-heading">{post.postHeading}</div>
        <div className="post-content">{post.content}</div>

        <div className="post-comments">
          <h3>Comments</h3>
          {commentList}

          {isLoggedIn ? (
            <form className="comment-form" onSubmit={handleSubmitComment}>
              <label htmlFor={`comment-box-${post.id}`}>Add a comment</label> {/* the post id keeps the id unique if more than one modal ever existed */}
              <textarea
                id={`comment-box-${post.id}`}
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              {submitError && <p className="form-error">{submitError}</p>}
              <button type="submit" className="btn">Comment</button>
            </form>
          ) : (
            <button className="btn comment-login" onClick={() => onLoginRequired?.()}> {/* ?.() only calls it if it was passed */}
              Log in to comment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetailedPost;
