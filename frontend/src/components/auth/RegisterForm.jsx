'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

// Public upload function for registration (no auth required)
const uploadFilePublic = async (file) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/upload/public`, {
    method: "POST",
    body: formData,
    credentials: "include",
    mode: "cors",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${errorText}`);
  }

  const result = await response.json();
  if (!result || !result.url) {
    throw new Error("Invalid response from server");
  }

  return result;
};

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    nickname: '',
    about_me: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, avatar: 'Please select an image file' }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, avatar: 'Image must be less than 5MB' }));
        return;
      }

      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Clear any previous errors
      if (errors.avatar) {
        setErrors((prev) => ({ ...prev, avatar: '' }));
      }
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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const minAge = new Date();
      minAge.setFullYear(today.getFullYear() - 13); // Minimum age 13
      const maxAge = new Date();
      maxAge.setFullYear(today.getFullYear() - 120); // Maximum age 120

      if (birthDate > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      } else if (birthDate > minAge) {
        newErrors.date_of_birth = 'You must be at least 13 years old';
      } else if (birthDate < maxAge) {
        newErrors.date_of_birth = 'Please enter a valid date of birth';
      }
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
      let avatarUrl = '';

      // Handle avatar upload if a file was selected
      if (avatarFile) {
        try {
          // Use public upload endpoint for registration
          const uploadResponse = await uploadFilePublic(avatarFile);
          avatarUrl = uploadResponse.url;
        } catch (uploadError) {
          console.error('Avatar upload failed:', uploadError);
          setSubmitError('Failed to upload avatar. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registrationData } = formData;
      if (avatarUrl) {
        registrationData.avatar = avatarUrl;
      }

      await register(registrationData);
      // Redirect is handled in the register function
    } catch (error) {
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
          <div className="md:col-span-1">
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

          {/* Confirm Password */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-background-lighter border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
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
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
              min={new Date(new Date().getFullYear() - 120, 0, 1).toISOString().split('T')[0]} // Reasonable minimum
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
                  <label className="block text-sm font-medium mb-1">Avatar (Optional)</label>

                  {/* Avatar Preview */}
                  {avatarPreview && (
                    <div className="mb-3 flex justify-center">
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-border"
                      />
                    </div>
                  )}

                  {/* File Upload */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="w-full bg-background-lighter border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    Upload an image file (JPEG, PNG, GIF) - Max 5MB
                  </p>

                  {errors.avatar && <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>}
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
