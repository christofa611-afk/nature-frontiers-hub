import fs from 'fs';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import config from './src/config.js';
async function fetchYouTubeVideos() {
  console.log('📺 Fetching YouTube Videos & Playlists...');
  let videos = [];
  const apiKey = config.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ No YouTube API Key found. Skipping API fetch. Using RSS fallback if available.');
    // Fallback to RSS if no key (limited to recent uploads only)
    return fetchYouTubeRSS(); 
  }
  // 1. Fetch Channel Uploads
  try {
    const uploadsUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${config.YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=10`;
    const res = await axios.get(uploadsUrl);
    videos.push(...res.data.items.map(item => ({
      type: 'video',
      id: item.id.videoId,
      title: item.snippet.title,
      link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      image: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      date: new Date(item.snippet.publishedAt).toLocaleDateString(),
      category: categorizeContent(item.snippet.title + " " + item.snippet.description)
    })));
  } catch (e) {
    console.error("Error fetching channel uploads:", e.message);
  }
  // 2. Fetch Playlists
  for (const playlistId of config.PLAYLISTS) {
    try {
      const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${playlistId}&part=snippet&maxResults=10`;
      const res = await axios.get(plUrl);
      videos.push(...res.data.items.map(item => ({
        type: 'video',
        id: item.snippet.resourceId?.videoId,
        title: item.snippet.title,
        link: `https://www.youtube.com/watch?v=${item.snippet.resourceId?.videoId}`,
        image: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        date: new Date(item.snippet.publishedAt).toLocaleDateString(),
        category: categorizeContent(item.snippet.title + " " + item.snippet.description)
      })));
    } catch (e) {
      console.error(`Error fetching playlist ${playlistId}:`, e.message);
    }
  }
  // Remove duplicates based on ID
  return Array.from(new Map(videos.map(v => [v.id, v])).values());
}
// Fallback if API key is missing
async function fetchYouTubeRSS() {
  let videos = [];
  const urls = [
    `https://www.youtube.com/feeds/videos.xml?channel_id=${config.YOUTUBE_CHANNEL_ID}`,
    ...config.PLAYLISTS.map(id => `https://www.youtube.com/feeds/videos.xml?playlist_id=${id}`)
  ];
  for (const url of urls) {
    try {
      const { data } = await axios.get(url);
      const result = await parseStringPromise(data);
      const entries = result.feed?.entry || [];
      entries.forEach(entry => {
        const id = entry.id[0].split(':').pop();
        videos.push({
          type: 'video',
          id: id,
          title: entry.title[0],
          link: entry.link[0].$.href,
          image: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
          date: new Date(entry.published[0]).toLocaleDateString(),
          category: categorizeContent(entry.title[0])
        });
      });
    } catch (e) {
      console.log(`RSS Fetch failed for ${url}`);
    }
  }
  return videos;
}
async function fetchNewsFeeds() {
  console.log('📰 Fetching News Feeds...');
  let news = [];
  
  for (const feed of config.RSS_FEEDS) {
    try {
      const { data } = await axios.get(feed.url, { timeout: 3000 });
      const result = await parseStringPromise(data);
      const items = result.feed ? (result.feed.entry || []) : (result.rss?.channel?.[0]?.item || []);
            items.slice(0, 2).forEach(item => {
        news.push({
          type: 'news',
          id: Math.random().toString(36),
          title: item.title ? item.title[0] : 'Nature News',
          link: item.link ? (item.link[0]?.$?.href || item.link[0]) : '#',
          image: 'https://images.pexels.com/photos/3225521/pexels-photo-3225521.jpeg?auto=compress&cs=tinysrgb&w=600',
          date: 'Latest',
          source: feed.name,
          category: categorizeContent(item.title ? item.title[0] : '')
        });
      });
    } catch (e) {
      // Silent fail for slow feeds
    }
  }
  return news;
}
function categorizeContent(text) {
  const lowerText = text.toLowerCase();
  for (const cat of config.CATEGORIES) {
    if (cat.id === 'all') continue;
    if (cat.keywords.some(k => lowerText.includes(k))) return cat.id;
  }
  return 'all';
}
async function main() {
  const videos = await fetchYouTubeVideos();
  const news = await fetchNewsFeeds();
    // Combine and sort (videos first, then news)
  const allContent = [...videos, ...news].sort((a, b) => {
    if (a.type === b.type) return 0;
    return a.type === 'video' ? -1 : 1;
  });
  if (!fs.existsSync('public/data')) fs.mkdirSync('public/data', { recursive: true });
  fs.writeFileSync('public/data/content.json', JSON.stringify(allContent));
  console.log(`✅ Generated ${allContent.length} items (Videos: ${videos.length}, News: ${news.length})`);
}
main().catch(console.error);
