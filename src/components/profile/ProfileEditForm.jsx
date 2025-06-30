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
      // Reset avatar state after successful save
      setAvatarFile(null);
      setAvatarPreview(user?.avatar || '');
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-8 shadow-lg">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-text-primary font-display">Edit Profile</h2>
        <button
          onClick={onCancel}
          className="text-text-secondary hover:text-text-primary p-3 hover:bg-background rounded-xl transition-all duration-normal hover:scale-105"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar section */}
        <div className="bg-background/30 backdrop-blur-glass rounded-xl p-6 border border-border/50">
          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="w-28 h-28 bg-background rounded-full flex items-center justify-center overflow-hidden border-4 border-border group-hover:border-primary/50 transition-colors duration-normal shadow-lg">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Avatar preview failed to load:', avatarPreview);
                    }}
                  />
                ) : (
                  <span className="text-2xl font-bold text-text-secondary">
                    {getInitials(watch('first_name'), watch('last_name'))}
                  </span>
                )}
              </div>
              <label 
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 bg-primary hover:bg-primary-hover 
                         text-white p-3 rounded-full cursor-pointer transition-all duration-normal
                         hover:scale-110 shadow-lg border-2 border-surface"
              >
                <Upload size={16} />
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
              <h3 className="text-xl font-bold text-text-primary mb-2 font-display">Profile Picture</h3>
              <p className="text-text-secondary">Click the upload button to change your avatar</p>
            </div>
          </div>
        </div>

        {/* Privacy toggle */}
        <div className="bg-background/50 backdrop-blur-glass p-6 rounded-xl border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${isPublic ? 'bg-success/20' : 'bg-warning/20'}`}>
                {isPublic ? <Globe size={24} className="text-success" /> : <Lock size={24} className="text-warning" />}
              </div>
              <div>
                <h4 className="font-bold text-text-primary text-lg font-display">Profile Visibility</h4>
                <p className="text-text-secondary">
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
              <div className="w-14 h-8 bg-border peer-focus:outline-none rounded-full peer 
                           peer-checked:after:translate-x-full peer-checked:after:border-white 
                           after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                           after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all 
                           peer-checked:bg-success shadow-inner"></div>
            </label>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label className="block text-text-primary font-semibold mb-3 flex items-center gap-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <User size={18} className="text-primary" />
              </div>
              First Name *
            </label>
            <input
              {...register('first_name')}
              className="w-full px-4 py-4 bg-background/50 backdrop-blur-glass border border-border rounded-xl 
                       text-text-primary placeholder-text-disabled focus:border-primary focus:bg-background
                       focus:outline-none transition-all duration-normal shadow-sm hover:border-primary/50"
              placeholder="Enter your first name"
            />
            {errors.first_name && (
              <p className="text-error text-sm mt-2 flex items-center gap-1">
                <span className="w-1 h-1 bg-error rounded-full"></span>
                {errors.first_name.message}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-text-primary font-semibold mb-3 flex items-center gap-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <User size={18} className="text-primary" />
              </div>
              Last Name *
            </label>
            <input
              {...register('last_name')}
              className="w-full px-4 py-4 bg-background/50 backdrop-blur-glass border border-border rounded-xl 
                       text-text-primary placeholder-text-disabled focus:border-primary focus:bg-background
                       focus:outline-none transition-all duration-normal shadow-sm hover:border-primary/50"
              placeholder="Enter your last name"
            />
            {errors.last_name && (
              <p className="text-error text-sm mt-2 flex items-center gap-1">
                <span className="w-1 h-1 bg-error rounded-full"></span>
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>

        {/* Nickname */}
        <div>
          <label className="block text-text-primary font-semibold mb-3 flex items-center gap-2">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <AtSign size={18} className="text-secondary" />
            </div>
            Nickname
          </label>
          <input
            {...register('nickname')}
            className="w-full px-4 py-4 bg-background/50 backdrop-blur-glass border border-border rounded-xl 
                     text-text-primary placeholder-text-disabled focus:border-secondary focus:bg-background
                     focus:outline-none transition-all duration-normal shadow-sm hover:border-secondary/50"
            placeholder="Enter a nickname (optional)"
          />
          {errors.nickname && (
            <p className="text-error text-sm mt-2 flex items-center gap-1">
              <span className="w-1 h-1 bg-error rounded-full"></span>
              {errors.nickname.message}
            </p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-text-primary font-semibold mb-3 flex items-center gap-2">
            <div className="p-2 bg-tertiary/20 rounded-lg">
              <Calendar size={18} className="text-tertiary" />
            </div>
            Date of Birth *
          </label>
          <input
            type="date"
            {...register('date_of_birth')}
            className="w-full px-4 py-4 bg-background/50 backdrop-blur-glass border border-border rounded-xl 
                     text-text-primary focus:border-tertiary focus:bg-background focus:outline-none 
                     transition-all duration-normal shadow-sm hover:border-tertiary/50"
          />
          {errors.date_of_birth && (
            <p className="text-error text-sm mt-2 flex items-center gap-1">
              <span className="w-1 h-1 bg-error rounded-full"></span>
              {errors.date_of_birth.message}
            </p>
          )}
        </div>

        {/* About Me */}
        <div>
          <label className="block text-text-primary font-semibold mb-3 flex items-center gap-2">
            <div className="p-2 bg-info/20 rounded-lg">
              <FileText size={18} className="text-info" />
            </div>
            About Me
          </label>
          <textarea
            {...register('about_me')}
            rows={5}
            className="w-full px-4 py-4 bg-background/50 backdrop-blur-glass border border-border rounded-xl 
                     text-text-primary placeholder-text-disabled focus:border-info focus:bg-background
                     focus:outline-none transition-all duration-normal resize-vertical shadow-sm hover:border-info/50"
            placeholder="Tell us about yourself..."
          />
          {errors.about_me && (
            <p className="text-error text-sm mt-2 flex items-center gap-1">
              <span className="w-1 h-1 bg-error rounded-full"></span>
              {errors.about_me.message}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 pt-8 border-t border-border/50">
          <button
            type="submit"
            disabled={loading || (!isDirty && !avatarFile)}
            className="bg-primary-gradient hover:shadow-glow disabled:bg-border disabled:opacity-50
                     text-white px-8 py-4 rounded-xl flex items-center gap-3 font-semibold text-lg
                     transition-all duration-normal disabled:cursor-not-allowed hover:scale-105
                     shadow-lg disabled:hover:scale-100"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-background/50 backdrop-blur-glass hover:bg-border text-text-primary px-8 py-4 
                     rounded-xl border border-border transition-all duration-normal hover:scale-105
                     font-semibold text-lg shadow-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
