import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiCalendar, FiShield, FiEdit2 } from 'react-icons/fi';
import { getUserAvatar } from '../utils/avatar';

const ProfileCard = ({ profile, completion = 0 }) => {
  const avatarUrl = getUserAvatar(profile);

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—';

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
        <img
          src={avatarUrl}
          alt={profile?.name}
          className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/10"
        />

        <div className="mt-4 sm:mt-0 sm:ml-6 sm:flex-1">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-secondary">{profile?.name}</h2>
              <p className="text-sm capitalize text-muted">{profile?.role} account</p>
            </div>
            <Link
              to="/profile"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-secondary transition hover:bg-gray-50"
            >
              <FiEdit2 className="h-3.5 w-3.5" /> Edit
            </Link>
          </div>

          {profile?.bio && (
            <p className="mt-3 text-sm text-muted">{profile.bio}</p>
          )}

          {/* Completion bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-secondary">Profile completion</span>
              <span className="text-primary font-semibold">{completion}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3">
          <FiMail className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Email</p>
            <p className="truncate text-sm text-secondary">{profile?.email || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3">
          <FiPhone className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Phone</p>
            <p className="text-sm text-secondary">{profile?.phone || 'Not set'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3">
          <FiMapPin className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Location</p>
            <p className="text-sm text-secondary">
              {[profile?.city, profile?.state].filter(Boolean).join(', ') || 'Not set'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3">
          <FiCalendar className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Member since</p>
            <p className="text-sm text-secondary">{fmtDate(profile?.createdAt)}</p>
          </div>
        </div>
      </div>

      {profile?.isVerified && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
          <FiShield className="h-3.5 w-3.5" /> Verified account
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
