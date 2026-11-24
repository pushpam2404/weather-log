const YOUTUBE = 'https://www.googleapis.com/youtube/v3/search';

const entities = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
// The YouTube search API returns titles with HTML entities already applied.
const unescapeTitle = (s) => s.replace(/&(amp|lt|gt|quot|#39);/g, (m) => entities[m]);

export function getMap({ lat, lon }) {
  const point = `${lat},${lon}`;
  return {
    lat,
    lon,
    embedUrl: `https://maps.google.com/maps?q=${point}&z=12&output=embed`,
    link: `https://www.google.com/maps/search/?api=1&query=${point}`,
    linkLabel: 'Open in Google Maps',
  };
}

// Each search costs 100 of the 10,000 daily quota units, so keep good results until the server restarts.
const cache = new Map();

// Never throws. Without a key, or on quota and network errors, the caller still gets a search link.
export async function getVideos({ name, country }) {
  const term = [name, country].filter(Boolean).join(' ');
  const cacheKey = term.toLowerCase();
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const searchUrl = `https://www.youtube.com/results?${new URLSearchParams({ search_query: `${term} travel` })}`;
  const fallback = (note) => ({ fallback: true, note, videos: [], searchUrl, linkLabel: 'Search on YouTube' });

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return fallback('YouTube API key is not set.');

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: `${term} travel weather`,
    maxResults: '4',
    videoEmbeddable: 'true',
    safeSearch: 'moderate',
    key,
  });

  let res;
  try {
    res = await fetch(`${YOUTUBE}?${params}`, { signal: AbortSignal.timeout(8_000) });
  } catch {
    return fallback('YouTube did not respond. Try again later.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const reason = body.error?.errors?.[0]?.reason || '';
    if (reason.includes('quota') || reason.includes('rateLimit')) {
      return fallback('The YouTube daily quota is used up. Try again tomorrow.');
    }
    console.error(`YouTube returned ${res.status}: ${reason || body.error?.message || ''}`);
    return fallback('YouTube is not available now.');
  }

  const data = await res.json();
  const videos = (data.items || []).map((item) => ({
    id: item.id.videoId,
    title: unescapeTitle(item.snippet.title),
    channel: unescapeTitle(item.snippet.channelTitle).trim(),
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || null,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));
  if (!videos.length) return fallback('YouTube found no videos for this place.');
  const result = { fallback: false, videos, searchUrl, linkLabel: 'Search on YouTube' };
  cache.set(cacheKey, result);
  return result;
}

export async function getExtras(place) {
  return { map: getMap(place), youtube: await getVideos(place) };
}
