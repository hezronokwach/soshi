'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    avatar: '',
    nickname: '',
    about_me: ''
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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
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
      await register(formData);
      // Redirect is handled in the register function
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glassmorphism p-6 rounded-lg shadow-lg max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-gradient">Create an Account</h2>

      {submitError && (
        <div className="bg-opacity-20 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="md:col-span-2">
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
          <div className="md:col-span-2">
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

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full bg-background-lighter border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="John"
            />
            {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full bg-background-lighter border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Doe"
            />
            {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
          </div>

          {/* Date of Birth */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="w-full bg-background-lighter border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
          </div>

          {/* Optional Fields */}
          <div className="md:col-span-2 mt-4">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-primary">Optional Information</summary>
              <div className="mt-4 space-y-4">
                {/* Avatar */}
                <div>
                  <label className="block text-sm font-medium mb-1">Avatar URL</label>
                  <input
                    type="text"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    className="w-full bg-background-lighter border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                {/* Nickname */}
                <div>
                  <label className="block text-sm font-medium mb-1">Nickname</label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    className="w-full bg-background-lighter border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="JohnnyD"
                  />
                </div>

                {/* About Me */}
                <div>
                  <label className="block text-sm font-medium mb-1">About Me</label>
                  <textarea
                    name="about_me"
                    value={formData.about_me}
                    onChange={handleChange}
                    className="w-full bg-background-lighter border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tell us about yourself..."
                    rows="3"
                  />
                </div>
              </div>
            </details>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-gradient mt-6 py-2 rounded-md font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
