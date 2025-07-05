"use client";
import React from 'react';

import CommentItem from './CommentItem';

const CommentList = React.memo(({ comments, postOwnerId, onUpdate, onDelete }) => {
  console.log('Rendering CommentList with comments:', comments);
  
  if (!comments || comments.length === 0) {
    return (
      <div className="py-4 text-center text-text-secondary">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment, index) => {
        // Skip comments that are actually replies (they should be rendered by their parent)
        if (comment.parent_id) {
          console.log('Skipping reply in top level:', comment.id);
          return null;
        }
        
        return (
          <div 
            key={comment.id} 
            className={`animate-fadeIn ${index > 0 ? 'pt-4 border-t border-border/10' : ''}`}
            style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
          >
            <CommentItem
              comment={comment}
              postOwnerId={postOwnerId}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          </div>
        );
      })}
    </div>
  );
});

CommentList.displayName = 'CommentList';

export default CommentList;