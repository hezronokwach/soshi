// export default function NotificationComponent() {
//   return (
//     <div className="border p-4 rounded-lg shadow-sm">
//       <h2 className="text-lg font-semibold mb-2">Notification Component</h2>
//       <p>This is a placeholder for the notification component.</p>
//     </div>
//   );
// }

// src/components/notifications/NotificationComponent.js

const renderGroupNotification = (notification) => {
  const handleGroupAction = async (action) => {
    if (notification.type === 'group_join_request') {
      await fetch(`/api/groups/${notification.related_id}/members/${notification.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      // Mark notification as read and refresh
      markAsRead(notification.id);
    } else if (notification.type === 'group_invitation') {
      await fetch(`/api/groups/${notification.related_id}/members/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      markAsRead(notification.id);
    }
  };

  return (
    <div className="flex justify-between items-center">
      <p>{notification.message}</p>
      {(notification.type === 'group_join_request' || notification.type === 'group_invitation') && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleGroupAction('accept')}>
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleGroupAction('decline')}>
            Decline
          </Button>
        </div>
      )}
    </div>
  );
};