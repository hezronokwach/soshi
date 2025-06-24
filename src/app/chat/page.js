'use client';

import Layout from '@/components/layout/Layout';
import ChatInterface from '@/components/chat/ChatInterface';

export default function ChatPage() {
  return (
    <Layout>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#FFFFFF',
          padding: '1.5rem 2rem 1rem 2rem',
          fontFamily: "'Outfit', sans-serif",
          margin: 0,
          flexShrink: 0
        }}>
          Messages
        </h1>
        <div style={{
          flex: 1,
          padding: '0 2rem 1.5rem 2rem',
          overflow: 'hidden',
          minHeight: 0
        }}>
          <ChatInterface />
        </div>
      </div>
    </Layout>
  );
}
