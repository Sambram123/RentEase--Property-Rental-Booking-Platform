export const AVATAR_STYLES = [
  'avataaars',
  'adventurer',
  'bottts',
  'fun-emoji',
  'lorelei',
  'micah',
  'notionists',
  'pixel-art',
];

export const DEFAULT_AVATAR_STYLE = 'avataaars';

export const getDiceBearUrl = (seed, style = DEFAULT_AVATAR_STYLE) =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(String(seed))}`;

export const getUserAvatar = (user) => {
  if (user?.avatar) return user.avatar;
  const seed = user?.avatarSeed || user?.email || user?._id || 'guest';
  const style = user?.avatarStyle || DEFAULT_AVATAR_STYLE;
  return getDiceBearUrl(seed, style);
};
