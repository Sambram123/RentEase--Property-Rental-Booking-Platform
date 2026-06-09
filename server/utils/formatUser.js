const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
  bio: user.bio,
  city: user.city,
  state: user.state,
  isVerified: user.isVerified,
  preferences: user.preferences,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getProfileCompletion = (user) => {
  const fields = ['name', 'email', 'phone', 'avatar', 'bio', 'city', 'state'];
  const filled = fields.filter((f) => {
    const val = user[f];
    return val && String(val).trim() !== '';
  }).length;
  return Math.round((filled / fields.length) * 100);
};

export default formatUser;
