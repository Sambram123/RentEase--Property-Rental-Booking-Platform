import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiBell, FiShield, FiTrash2, FiLoader, FiLogOut } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import {
  changePassword,
  getPreferences,
  updatePreferences,
  deleteAccount,
} from '../services/userService';

const Toggle = ({ label, description, checked, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition hover:bg-gray-50">
    <div>
      <p className="text-sm font-medium text-secondary">{label}</p>
      {description && <p className="text-xs text-muted">{description}</p>}
    </div>
    <div className="relative">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <div className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-primary" />
      <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
    </div>
  </label>
);

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-500'];
  const label = labels[Math.min(score, 3)];
  const color = colors[Math.min(score, 3)];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < score ? color : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">Strength: {label}</p>
    </div>
  );
};

const inputClass = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

const Settings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState({
    bookingNotifications: true,
    paymentNotifications: true,
    reviewNotifications: true,
    marketingNotifications: false,
  });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ password: '', confirmText: '' });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPreferences();
        setPrefs(data);
      } catch {
        // use defaults
      } finally {
        setPrefsLoading(false);
      }
    };
    load();
  }, []);

  const handlePrefChange = async (key, value) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setPrefsSaving(true);
    try {
      await updatePreferences({ [key]: value });
      toast.success('Preference saved');
    } catch (err) {
      setPrefs(prefs);
      toast.error(err.message || 'Failed to save preference');
    } finally {
      setPrefsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = pwForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setPwSaving(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteForm.confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount({
        password: deleteForm.password,
        confirmText: deleteForm.confirmText,
      });
      toast.success('Account deleted');
      await logout();
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary">Account Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage security, notifications, and account preferences</p>
      </div>

      {/* Security */}
      <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FiLock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-secondary">Security</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary">Current password</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
              className={inputClass}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary">New password</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
              className={inputClass}
              autoComplete="new-password"
            />
            <PasswordStrength password={pwForm.newPassword} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary">Confirm new password</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={pwSaving}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
          >
            {pwSaving && <FiLoader className="h-4 w-4 animate-spin" />}
            Change password
          </button>
        </form>
      </section>

      {/* Notifications */}
      <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FiBell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-secondary">Notification Preferences</h2>
          {prefsSaving && <FiLoader className="ml-auto h-4 w-4 animate-spin text-muted" />}
        </div>
        {prefsLoading ? (
          <div className="flex justify-center py-6">
            <FiLoader className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            <Toggle
              label="Booking notifications"
              description="Updates on booking confirmations, changes, and cancellations"
              checked={prefs.bookingNotifications}
              onChange={(v) => handlePrefChange('bookingNotifications', v)}
            />
            <Toggle
              label="Payment notifications"
              description="Payment receipts and transaction alerts"
              checked={prefs.paymentNotifications}
              onChange={(v) => handlePrefChange('paymentNotifications', v)}
            />
            <Toggle
              label="Review notifications"
              description="When you receive new reviews or review reminders"
              checked={prefs.reviewNotifications}
              onChange={(v) => handlePrefChange('reviewNotifications', v)}
            />
            <Toggle
              label="Marketing notifications"
              description="Promotions, deals, and platform updates"
              checked={prefs.marketingNotifications}
              onChange={(v) => handlePrefChange('marketingNotifications', v)}
            />
          </div>
        )}
      </section>

      {/* Privacy foundation */}
      <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FiShield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-secondary">Privacy & Sessions</h2>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
            <p className="text-sm font-medium text-secondary">Logout all devices</p>
            <p className="mt-1 text-xs text-muted">Coming soon — invalidate all active sessions across devices.</p>
          </div>
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
            <p className="text-sm font-medium text-secondary">Privacy settings</p>
            <p className="mt-1 text-xs text-muted">Coming soon — control profile visibility and data sharing.</p>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-100 bg-red-50/30 p-6">
        <div className="mb-4 flex items-center gap-2">
          <FiTrash2 className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-bold text-red-600">Danger Zone</h2>
        </div>
        <p className="mb-4 text-sm text-muted">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <FiLogOut className="h-4 w-4" /> Delete account
        </button>
      </section>

      <ConfirmModal
        open={deleteOpen}
        title="Delete your account?"
        message="This will permanently remove your account, bookings, payments, reviews, and notifications."
        confirmLabel="Delete account"
        loading={deleting}
        onCancel={() => { setDeleteOpen(false); setDeleteForm({ password: '', confirmText: '' }); }}
        onConfirm={handleDeleteAccount}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-secondary">Password</label>
            <input
              type="password"
              value={deleteForm.password}
              onChange={(e) => setDeleteForm((p) => ({ ...p, password: e.target.value }))}
              className={inputClass}
              placeholder="Enter your password"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-secondary">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteForm.confirmText}
              onChange={(e) => setDeleteForm((p) => ({ ...p, confirmText: e.target.value }))}
              className={inputClass}
              placeholder="DELETE"
            />
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
};

export default Settings;
