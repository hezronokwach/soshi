"use client";

import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import Footer from "./Footer";

export default function Layout({ children }) {
  const [mounted, setMounted] = useState(false);

  // This ensures hydration mismatch is avoided
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#0F1624'
    }}>
      <Navbar />

      <div style={{ display: 'flex', flex: 1, paddingTop: '64px' }}>
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Main Content */}
        <main style={{
          flex: 1,
          marginLeft: 0,
          marginRight: 0
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1.5rem 1rem'
          }}>
            {children}
          </div>
          <Footer />
        </main>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
}
