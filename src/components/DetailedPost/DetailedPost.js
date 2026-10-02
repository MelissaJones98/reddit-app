import './DetailedPost.css';

function DetailedPost({ post, onClose }) { // no useState needed here as this component doesnt have a state of its own
  return ( // onClose is a function from the parent called to dismiss the modal
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
          {/* comment list goes here once comment data exists */}
        </div>
      </div>
    </div>
  );
}

export default DetailedPost;