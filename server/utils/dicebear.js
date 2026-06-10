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

export const applyDiceBearAvatar = (user, { style, seed } = {}) => {
  if (style && AVATAR_STYLES.includes(style)) {
    user.avatarStyle = style;
  }
  if (seed) {
    user.avatarSeed = String(seed);
  } else if (!user.avatarSeed) {
    user.avatarSeed = user._id?.toString() || user.email;
  }
  user.avatar = getDiceBearUrl(user.avatarSeed, user.avatarStyle || DEFAULT_AVATAR_STYLE);
  return user;
};
