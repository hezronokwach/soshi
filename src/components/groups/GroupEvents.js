// FILE: src/components/groups/GroupEvents.js
'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { groups } from '@/lib/api';

export default function GroupEvents({ params, group, fetchGroup }) {
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventDate: ''
  });
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.eventDate) return;

    // Validate that the event date is in the future
    const selectedDate = new Date(newEvent.eventDate);
    const now = new Date();

    if (selectedDate <= now) {
      setError('Event date must be in the future');
      return;
    }

    try {
      // Transform variable names for use by the API
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        event_date: selectedDate.toISOString()
      };

      await groups.createEvent(params.id, eventData);
      setNewEvent({ title: '', description: '', eventDate: '' });
      setError(''); // Clear any previous errors
      setShowCreateForm(false); // Hide form after successful creation
      fetchGroup(); // Refresh to get new event
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event. Please try again.');
    }
  };

  const handleEventResponse = async (eventId, response) => {
    try {
      await groups.respondToEvent(eventId, response);
      fetchGroup(); // Refresh to get updated counts
    } catch (error) {
      console.error('Error responding to event:', error);
    }
  };

  // Helper function to get minimum datetime for the input (current time)
  const getMinDateTime = () => {
    const now = new Date();
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      {/* Create Event Toggle Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Events</h2>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? "outline" : "default"}
        >
          {showCreateForm ? 'Cancel' : 'Create Event'}
        </Button>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 text-white">Create New Event</h3>
          <form onSubmit={handleCreateEvent} className="space-y-3">
            <Input
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Event title"
              className="bg-background text-white"
              required
            />
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Event description"
              className="w-full p-2 border rounded-md bg-background text-white"
              rows="2"
            />
            <Input
              type="datetime-local"
              value={newEvent.eventDate}
              onChange={(e) => {
                setNewEvent({ ...newEvent, eventDate: e.target.value });
                setError(''); // Clear error when user changes date
              }}
              min={getMinDateTime()} // Prevent selecting past dates in the UI
              className="bg-background text-white"
              required
            />
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit">Create Event</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewEvent({ title: '', description: '', eventDate: '' });
                  setError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Events List */}
      {group.events?.map((event) => (
        <Card key={event.id} className="p-4">
          <h3 className="font-semibold text-lg mb-2 text-white">{event.title}</h3>
          <p className="text-gray-400 mb-2">{event.description}</p>
          <p className="text-sm text-gray-500 mb-3">
            {new Date(event.event_date).toLocaleString()}
          </p>
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              onClick={() => handleEventResponse(event.id, 'going')}
              className="bg-green-600 hover:bg-green-700"
            >
              Going ({event.going_count || 0})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEventResponse(event.id, 'not_going')}
              className="text-red-400 border-red-400 hover:bg-red-900/20"
            >
              Not Going ({event.not_going_count || 0})
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
