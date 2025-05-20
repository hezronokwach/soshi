"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    // If user is authenticated, redirect to feed
    if (!loading && isAuthenticated) {
      router.push('/feed');
    }
  }, [isAuthenticated, router, loading]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem 1rem'
    }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '2rem 0' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          <span style={{
            backgroundImage: 'linear-gradient(135deg, #3A86FF 0%, #8338EC 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}>Soshi</span> Social Network
        </h1>
        <p style={{
          color: '#B8C1CF',
          fontSize: '1.25rem',
          maxWidth: '600px',
          margin: '0 auto 2rem'
        }}>
          Connect with friends, share moments, and discover new communities.
        </p>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <Link href="/feed" style={{
            backgroundColor: '#3A86FF',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            textDecoration: 'none'
          }}>
            Explore Feed
            <ArrowRight size={18} />
          </Link>
          <div style={{
            display: 'flex',
            gap: '1rem',
            width: '100%'
          }}>
            <Link href="/login" style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: '1px solid #3A86FF',
              color: '#FFFFFF',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              textAlign: 'center',
              textDecoration: 'none'
            }}>
              Login
            </Link>
            <Link href="/register" style={{
              flex: 1,
              backgroundColor: 'rgba(26, 35, 51, 0.7)',
              color: '#FFFFFF',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              textAlign: 'center',
              textDecoration: 'none'
            }}>
              Register
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        backgroundColor: 'rgba(26, 35, 51, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          textAlign: 'center',
          color: '#FFFFFF'
        }}>
          A Modern Social Experience
        </h2>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            color: '#FFFFFF'
          }}>
            <div style={{
              minWidth: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#3A86FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>✓</div>
            <span>Connect with friends and build your network</span>
          </li>
          <li style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            color: '#FFFFFF'
          }}>
            <div style={{
              minWidth: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#8338EC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>✓</div>
            <span>Share posts, photos, and updates with your followers</span>
          </li>
          <li style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            color: '#FFFFFF'
          }}>
            <div style={{
              minWidth: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#FF006E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>✓</div>
            <span>Join groups based on your interests</span>
          </li>
          <li style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: '#FFFFFF'
          }}>
            <div style={{
              minWidth: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#06D6A0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>✓</div>
            <span>Chat with friends in real-time</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
