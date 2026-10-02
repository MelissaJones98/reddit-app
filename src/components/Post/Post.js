import { useState } from 'react';
import DetailedPost from '../DetailedPost/DetailedPost';
import './Post.css';

function Post({ post }) { // prop is the full post object 
  const [likes, setLikes] = useState(post.likes);
  const [dislikes, setDislikes] = useState(post.dislikes);
  const [userReaction, setUserReaction] = useState(null); // 'like' | 'dislike' | null
  const [isCommentsOpen, setIsCommentsOpen] = useState(false); // controls whether the DetailedPost modal is currently shown

  // like handler function
  const handleLike = () => {
    if (userReaction === 'like') {
      // undo the like
      setLikes((prev) => prev - 1);
      setUserReaction(null);
    } else if (userReaction === 'dislike') {
      // switch from dislike to like
      setDislikes((prev) => prev - 1);
      setLikes((prev) => prev + 1);
      setUserReaction('like');
    } else {
      // no prior reaction — add a like
      setLikes((prev) => prev + 1);
      setUserReaction('like');
    }
  };

  // dislike handler function 
  const handleDislike = () => {
    if (userReaction === 'dislike') {
      setDislikes((prev) => prev - 1);
      setUserReaction(null);
    } else if (userReaction === 'like') {
      setLikes((prev) => prev - 1);
      setDislikes((prev) => prev + 1);
      setUserReaction('dislike');
    } else {
      setDislikes((prev) => prev + 1);
      setUserReaction('dislike');
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
        <button className="btn" aria-label="like" onClick={handleLike}>
          Like <span className="like-count">{likes}</span>
        </button>
        <button className="btn" aria-label="dislike" onClick={handleDislike}>
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

      {isCommentsOpen && (
        <DetailedPost post={post} onClose={() => setIsCommentsOpen(false)} />
      )} {/* conditional rendering - if truthy DetailedPost renders if falsy it does not */}
    </article>
  );
}

export default Post;