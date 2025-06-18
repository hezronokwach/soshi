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

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.eventDate) return;

    try {
      await groups.createEvent(params.id, newEvent);
      setNewEvent({ title: '', description: '', eventDate: '' });
      fetchGroup(); // Refresh to get new event
    } catch (error) {
      console.error('Error creating event:', error);
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

  return (
    <div className="space-y-6">
      {/* Create Event Form */}
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
            onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
            className="bg-background text-white"
            required
          />
          <Button type="submit">Create Event</Button>
        </form>
      </Card>

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