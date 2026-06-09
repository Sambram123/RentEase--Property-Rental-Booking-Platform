import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSettings, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';
import ProfileForm from '../components/ProfileForm';
import { getProfile, updateProfile } from '../services/userService';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProfile();
        setProfile(data.user);
        setCompletion(data.profileCompletion || 0);
      } catch (err) {
        toast.error(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (formData, updatedUser, showToast = true) => {
    if (updatedUser) {
      setProfile(updatedUser);
      updateUser(updatedUser);
      return;
    }

    setSaving(true);
    try {
      const data = await updateProfile(formData);
      setProfile(data.user);
      setCompletion(data.profileCompletion || 0);
      updateUser(data.user);
      setEditing(false);
      if (showToast) toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FiLoader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">My Profile</h1>
          <p className="mt-1 text-sm text-muted">Manage your personal information</p>
        </div>
        <Link
          to="/settings"
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50"
        >
          <FiSettings className="h-4 w-4" /> Settings
        </Link>
      </div>

      {editing ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-secondary">Edit Profile</h2>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm font-medium text-muted hover:text-secondary"
            >
              Cancel
            </button>
          </div>
          <ProfileForm profile={profile} onSave={handleSave} saving={saving} />
        </div>
      ) : (
        <>
          <ProfileCard profile={profile || user} completion={completion} />
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
            >
              Edit Profile
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;
