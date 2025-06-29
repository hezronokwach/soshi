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

      <div className="flex flex-1 pt-16">
        {/* Left Sidebar - Hidden on mobile and tablet, visible on desktop */}
        <div className="hidden lg:block">
          <LeftSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
          <div className="flex-1 lg:ml-sidebar xl:mr-80">
            <div className="max-w-2xl mx-auto px-4 lg:px-6">
              {children}
            </div>
          </div>
          <Footer />
        </main>

        {/* Right Sidebar - Hidden on mobile, tablet, and small desktop, visible on large desktop */}
        <div className="hidden xl:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
