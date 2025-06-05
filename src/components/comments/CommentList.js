"use client";

import CommentItem from './CommentItem';

export default function CommentList({ comments, postOwnerId, onUpdate, onDelete }) {
  if (comments.length === 0) {
    return (
      <div className="py-4 text-center text-text-secondary">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postOwnerId={postOwnerId}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}