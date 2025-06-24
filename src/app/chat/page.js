'use client';

import Layout from '@/components/layout/Layout';
import ChatInterface from '@/components/chat/ChatInterface';
import './chat.module.css';

export default function ChatPage() {
  return (
    <Layout>
      <div className="chat-page-container">
        <h1 className="chat-page-title">Messages</h1>
        <div className="chat-page-content">
          <div className="chat-page-inner">
            <ChatInterface />
          </div>
        </div>
      </div>
    </Layout>
  );
}
