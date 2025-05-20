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

  const backgroundStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #0F1624 0%, #1A2333 25%, #1E2A3D 50%, #1A2333 75%, #0F1624 100%)',
    backgroundSize: '400% 400%',
    animation: 'gradientAnimation 15s ease infinite',
    zIndex: -1
  };

  const subtleOverlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'radial-gradient(rgba(58, 134, 255, 0.03) 1px, transparent 1px)',
    backgroundSize: '30px 30px',
    zIndex: -1
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Animated Background */}
      <div style={backgroundStyles}></div>
      <div style={subtleOverlayStyles}></div>

      <Navbar />

      <div style={{ display: 'flex', flex: 1, paddingTop: '64px' }}>
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Main Content */}
        <main style={{
          flex: 1,
          marginLeft: 0,
          marginRight: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 64px)'
        }}>
          <div style={{
            maxWidth: '800px',
            width: '100%',
            margin: '0 auto',
            padding: '2rem 1.5rem',
            flex: 1
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
