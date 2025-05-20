'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      await login(formData.email, formData.password);
      router.push('/feed');
    } catch (error) {
      console.error('Login error:', error);
      setSubmitError('Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="glassmorphism p-6 rounded-lg shadow-lg max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-gradient">Welcome Back</h2>
      
      {submitError && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
          {submitError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-background-lighter border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="your.email@example.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        
        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full bg-background-lighter border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-gradient py-2 rounded-md font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
