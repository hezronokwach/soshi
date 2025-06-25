'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Save, 
  X, 
  Upload,
  User,
  Mail,
  Calendar,
  FileText,
  AtSign,
  Globe,
  Lock
} from 'lucide-react';

// Validation schema
const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  nickname: z.string().max(30, 'Nickname too long').optional().or(z.literal('')),
  about_me: z.string().max(500, 'About me section too long').optional().or(z.literal('')),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  is_public: z.boolean()
});

export default function ProfileEditForm({ 
  user, 
  onSave, 
  onCancel, 
  loading = false 
}) {
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      nickname: user?.nickname || '',
      about_me: user?.about_me || '',
      date_of_birth: user?.date_of_birth ? user.date_of_birth.split('T')[0] : '',
      is_public: user?.is_public !== false // Default to public if not specified
    }
  });

  const isPublic = watch('is_public');

  // Handle avatar file selection
  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit handler
  const onSubmit = async (data) => {
    try {
      const formData = {
        ...data,
        avatar: avatarFile
      };
      await onSave(formData);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="bg-[#1A2333] border border-[#2A3343] rounded-lg p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#FFFFFF] font-outfit">Edit Profile</h2>
        <button
          onClick={onCancel}
          className="text-[#B8C1CF] hover:text-[#FFFFFF] p-2 hover:bg-[#0F1624] rounded-lg transition-all duration-250 hover:scale-110"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar section */}
        <div className="flex items-center gap-6 bg-[#0F1624] p-4 rounded-lg border border-[#2A3343]">
          <div className="relative">
            <div className="w-20 h-20 bg-[#1A2333] rounded-full flex items-center justify-center overflow-hidden border-2 border-[#2A3343] hover:border-[#3A86FF] transition-all duration-250">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-semibold text-[#B8C1CF] font-outfit">
                  {getInitials(watch('first_name'), watch('last_name'))}
                </span>
              )}
            </div>
            <label 
              htmlFor="avatar-upload"
              className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#3A86FF] to-[#8338EC] hover:shadow-[0_0_15px_rgba(58,134,255,0.5)] 
                       text-white p-2 rounded-full cursor-pointer transition-all duration-250 hover:scale-110"
            >
              <Upload size={14} />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#FFFFFF] font-outfit">Profile Picture</h3>
            <p className="text-[#B8C1CF] text-sm font-inter">Click the upload button to change your avatar</p>
          </div>
        </div>

        {/* Privacy toggle */}
        <div className="bg-[#0F1624] p-4 rounded-lg border border-[#2A3343] hover:border-[#3A86FF] transition-all duration-250">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPublic ? <Globe size={20} className="text-[#06D6A0]" /> : <Lock size={20} className="text-[#FFD166]" />}
              <div>
                <h4 className="font-semibold text-[#FFFFFF] font-outfit">Profile Visibility</h4>
                <p className="text-[#B8C1CF] text-sm font-inter">
                  {isPublic ? 'Your profile is visible to everyone' : 'Your profile is private'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('is_public')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#2A3343] peer-focus:outline-none rounded-full peer 
                           peer-checked:after:translate-x-full peer-checked:after:border-white 
                           after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                           after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all duration-250 
                           peer-checked:bg-[#06D6A0] hover:shadow-[0_0_10px_rgba(6,214,160,0.5)]"></div>
            </label>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label className="block text-[#FFFFFF] font-medium mb-2 font-inter">
              <User size={16} className="inline mr-2 text-[#3A86FF]" />
              First Name *
            </label>
            <input
              {...register('first_name')}
              className="w-full px-4 py-3 bg-[#0F1624] border border-[#2A3343] rounded-lg 
                       text-[#FFFFFF] placeholder-[#6C7A89] focus:border-[#3A86FF] 
                       focus:outline-none focus:shadow-[0_0_0_3px_rgba(58,134,255,0.25)] transition-all duration-250 font-inter"
              placeholder="Enter your first name"
            />
            {errors.first_name && (
              <p className="text-[#EF476F] text-sm mt-1 font-inter">{errors.first_name.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-[#FFFFFF] font-medium mb-2 font-inter">
              <User size={16} className="inline mr-2 text-[#3A86FF]" />
              Last Name *
            </label>
            <input
              {...register('last_name')}
              className="w-full px-4 py-3 bg-[#0F1624] border border-[#2A3343] rounded-lg 
                       text-[#FFFFFF] placeholder-[#6C7A89] focus:border-[#3A86FF] 
                       focus:outline-none focus:shadow-[0_0_0_3px_rgba(58,134,255,0.25)] transition-all duration-250 font-inter"
              placeholder="Enter your last name"
            />
            {errors.last_name && (
              <p className="text-[#EF476F] text-sm mt-1 font-inter">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        {/* Nickname */}
        <div>
          <label className="block text-[#FFFFFF] font-medium mb-2 font-inter">
            <AtSign size={16} className="inline mr-2 text-[#8338EC]" />
            Nickname
          </label>
          <input
            {...register('nickname')}
            className="w-full px-4 py-3 bg-[#0F1624] border border-[#2A3343] rounded-lg 
                     text-[#FFFFFF] placeholder-[#6C7A89] focus:border-[#8338EC] 
                     focus:outline-none focus:shadow-[0_0_0_3px_rgba(131,56,236,0.25)] transition-all duration-250 font-inter"
            placeholder="Enter a nickname (optional)"
          />
          {errors.nickname && (
            <p className="text-[#EF476F] text-sm mt-1 font-inter">{errors.nickname.message}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-[#FFFFFF] font-medium mb-2 font-inter">
            <Calendar size={16} className="inline mr-2 text-[#FF006E]" />
            Date of Birth *
          </label>
          <input
            type="date"
            {...register('date_of_birth')}
            className="w-full px-4 py-3 bg-[#0F1624] border border-[#2A3343] rounded-lg 
                     text-[#FFFFFF] focus:border-[#FF006E] focus:outline-none 
                     focus:shadow-[0_0_0_3px_rgba(255,0,110,0.25)] transition-all duration-250 font-inter"
          />
          {errors.date_of_birth && (
            <p className="text-[#EF476F] text-sm mt-1 font-inter">{errors.date_of_birth.message}</p>
          )}
        </div>

        {/* About Me */}
        <div>
          <label className="block text-[#FFFFFF] font-medium mb-2 font-inter">
            <FileText size={16} className="inline mr-2 text-[#118AB2]" />
            About Me
          </label>
          <textarea
            {...register('about_me')}
            rows={4}
            className="w-full px-4 py-3 bg-[#0F1624] border border-[#2A3343] rounded-lg 
                     text-[#FFFFFF] placeholder-[#6C7A89] focus:border-[#118AB2] 
                     focus:outline-none focus:shadow-[0_0_0_3px_rgba(17,138,178,0.25)] transition-all duration-250 resize-vertical font-inter"
            placeholder="Tell us about yourself..."
          />
          {errors.about_me && (
            <p className="text-[#EF476F] text-sm mt-1 font-inter">{errors.about_me.message}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 pt-6 border-t border-[#2A3343]">
          <button
            type="submit"
            disabled={loading || !isDirty}
            className="bg-gradient-to-r from-[#3A86FF] to-[#8338EC] hover:shadow-[0_0_15px_rgba(58,134,255,0.5)] disabled:bg-[#2A3343] 
                     text-white px-6 py-3 rounded-lg flex items-center gap-2 
                     transition-all duration-250 disabled:cursor-not-allowed hover:scale-105 font-medium"
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#0F1624] hover:bg-[#2A3343] text-[#FFFFFF] px-6 py-3 
                     rounded-lg border border-[#2A3343] hover:border-[#3A86FF] transition-all duration-250 hover:scale-105 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
