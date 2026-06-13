import { apiBaseURL } from './api';

const apiOrigin = new URL(apiBaseURL).origin;

export const resolveAssetUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('/uploads/')) return `${apiOrigin}${url}`;
  return url;
};
