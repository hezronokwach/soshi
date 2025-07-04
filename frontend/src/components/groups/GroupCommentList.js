"use client";
import React from 'react';

import GroupCommentItem from './GroupCommentItem';

const GroupCommentList = React.memo(({ comments, groupId, groupPostId, onUpdate, onDelete }) => {
  console.log('Rendering GroupCommentList with comments:', comments);
  
  if (!comments || comments.length === 0) {
    return (
      <div className="py-4 text-center text-text-secondary">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map(comment => {
        // Skip comments that are actually replies (they should be rendered by their parent)
        if (comment.parent_id) {
          console.log('Skipping reply in top level:', comment.id);
          return null;
        }
        
        return (
          <GroupCommentItem
            key={comment.id}
            comment={comment}
            groupId={groupId}
            groupPostId={groupPostId}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
});

GroupCommentList.displayName = 'GroupCommentList';

export default GroupCommentList;
