import { useState } from 'react';
import { POST_CATEGORIES } from '../../constants/categories'; // the same list the feed's filter buttons use, minus 'All' and 'Most Visited'
import './CreatePostForm.css';

function CreatePostForm({ onPostCreated }) { // onPostCreated comes from App - it's given the new post so App can add it to the feed
  const [postHeading, setPostHeading] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(''); // '' = nothing chosen yet (the "Choose a category" option)
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // disables the button while waiting, so a double click can't create the post twice

  const handleSubmit = async (e) => {
    e.preventDefault(); // stops the browser reloading the page
    setError('');

    // checked in the browser first - .trim() so a heading of only spaces doesn't count as filled in
    if (!postHeading.trim() || !content.trim() || !category) {
      setError('Please fill in the heading, content and choose a category');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`, // proves who's posting - requireAuth on the server checks this, and takes the author from it
        },
        body: JSON.stringify({ postHeading, content, category }), // no postedBy - the server decides that from the token
      });
      const data = await response.json(); // the new post on success, or { error } on failure

      if (response.ok) {
        onPostCreated(data); // hand the new post up to App
      } else {
        setError(data.error || 'Could not create your post. Please try again.'); // e.g. 401 "Your session has expired, please log in again"
      }
    } catch (err) {
      setError('Could not connect to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="create-post-form" onSubmit={handleSubmit}>
      <h2>Create a Post</h2>

      <label htmlFor="create-heading">Heading</label>
      <input
        id="create-heading"
        type="text"
        value={postHeading}
        onChange={(e) => setPostHeading(e.target.value)}
        maxLength={255} // matches heading VARCHAR(255) in schema.sql - the browser stops typing at the limit rather than the database rejecting it
      />

      <label htmlFor="create-content">Content</label>
      <textarea // a textarea is a multi-line text box, for longer writing than an input allows
        id="create-content"
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <label htmlFor="create-category">Category</label>
      <select // a dropdown - controlled like the inputs: value comes from state, onChange updates it
        id="create-category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">Choose a category</option> {/* the empty value means "nothing chosen" - the check above catches it */}
        {POST_CATEGORIES.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn" disabled={isSubmitting}>
        {isSubmitting ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}

export default CreatePostForm;
