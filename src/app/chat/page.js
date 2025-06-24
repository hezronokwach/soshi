'use client';

import ChatInterface from '@/components/chat/ChatInterface';

export default function ChatPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F1624',
      paddingTop: '64px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#FFFFFF',
          padding: '2rem 2rem 1rem 2rem',
          fontFamily: "'Outfit', sans-serif"
        }}>
          Messages
        </h1>

        <div style={{ flex: 1, padding: '0 2rem 2rem 2rem' }}>
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
