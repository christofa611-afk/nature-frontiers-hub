import fs from 'fs';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
// CONFIGURATION
// This fetches EVERY video from your main channel
const CHANNEL_ID = 'UC41xXhw22o6Q2I2pTKB2kOg'; 
const USER_HANDLE = '@naturefrontiers-life';
// We prioritize the Channel ID feed as it is the most complete
const VIDEO_FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
// Optional: Add specific playlists if you want to ensure they are included too
const PLAYLIST_FEEDS = [
  'https://www.youtube.com/feeds/videos.xml?playlist_id=PLhErNUuDxs_2F8ayJ_XDrgCbH-CiAqRcd',
  'https://www.youtube.com/feeds/videos.xml?playlist_id=PLhErNUuDxs_04gGj-HoaSkXNQ1bno89I8',
  'https://www.youtube.com/feeds/videos.xml?playlist_id=PLhErNUuDxs_0OFY1a8itinxcWutV7oN78',
  'https://www.youtube.com/feeds/videos.xml?playlist_id=PLhErNUuDxs_3s5P3kfBg1wZdWJY_PmAfC'
];
// News Feeds to keep the site active
const NEWS_FEEDS = [
  'https://www.nationalgeographic.com/animals/rss',
  'https://www.bbcearth.com/feed/',
  'https://africageographic.com/feed/',
  'https://www.worldwildlife.org/feeds/news'
];
async function fetchXML(url) {
  try {
    const { data } = await axios.get(url);
    const result = await parseStringPromise(data);
    // Handle both Channel feeds (entry) and RSS feeds (item)
    if (result.feed && result.feed.entry) return result.feed.entry;
    if (result.rss && result.rss.channel && result.rss.channel[0].item) return result.rss.channel[0].item;
    return [];
  } catch (e) {
    console.log(`⚠️ Failed to fetch ${url}: ${e.message}`);
    return [];
  }
}
async function main() {
  console.log('🌿 Starting Full Channel Sync...');
  let allContent = [];
  // 1. Fetch MAIN CHANNEL (This gets EVERY video)
  console.log('📺 Fetching full channel history...');
  const channelEntries = await fetchXML(VIDEO_FEED_URL);
  channelEntries.forEach(entry => {
    const id = entry.id ? entry.id[0].split(':').pop() : Math.random().toString(36);
    const link = entry.link ? (entry.link[0].$.href || entry.link[0]) : '#';
      allContent.push({
      type: 'video',
      id: id,
      title: entry.title ? entry.title[0] : 'Nature Video',
      link: link,
      image: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      date: new Date(entry.published ? entry.published[0] : Date.now()).toLocaleDateString(),
      source: 'Channel'
    });
  });
  // 2. Fetch Playlists (To catch any stragglers or specific collections)
  console.log('📂 Fetching specific playlists...');
  for (const url of PLAYLIST_FEEDS) {
    const items = await fetchXML(url);
    items.forEach(item => {
      const id = item.id ? item.id[0].split(':').pop() : Math.random().toString(36);
      // Avoid duplicates by checking if ID already exists
      if (!allContent.some(v => v.id === id)) {
        const link = item.link ? (item.link[0].$.href || item.link[0]) : '#';
        allContent.push({
          type: 'video',
          id: id,
          title: item.title ? item.title[0] : 'Playlist Video',
          link: link,
          image: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
          date: new Date(item.published ? item.published[0] : Date.now()).toLocaleDateString(),
          source: 'Playlist'
        });
      }
    });
  }
  // 3. Fetch News (To boost SEO and traffic)
  console.log('📰 Fetching global nature news...');
  for (const url of NEWS_FEEDS) {
    const items = await fetchXML(url);
    items.slice(0, 5).forEach(item => {
      allContent.push({
        type: 'news',
        id: Math.random().toString(36),
        title: item.title ? item.title[0] : 'Nature News',
        link: item.link ? (item.link[0] || item.link) : '#',
        image: 'https://images.pexels.com/photos/3225521/pexels-photo-3225521.jpeg?auto=compress&cs=tinysrgb&w=600',
        date: 'Latest',
        source: 'News'
      });
    });
  }
  // Sort: Newest first
  allContent.sort((a, b) => {
    // Prioritize videos over news if dates are similar, then by date
    if (a.type === 'video' && b.type === 'news') return -1;
    if (a.type === 'news' && b.type === 'video') return 1;
    return new Date(b.date) - new Date(a.date);
  });
  // Remove exact duplicate titles/links just in case
  const uniqueContent = [];
  const seenLinks = new Set();
  allContent.forEach(item => {
    if (!seenLinks.has(item.link)) {
      seenLinks.add(item.link);
      uniqueContent.push(item);
    }
  });
  console.log(`✅ Successfully processed ${uniqueContent.length} items (${uniqueContent.filter(i=>i.type==='video').length} videos).`);
  // Save to public folder
  if (!fs.existsSync('public/data')) fs.mkdirSync('public/data', { recursive: true });
  fs.writeFileSync('public/data/content.json', JSON.stringify(uniqueContent, null, 2));
}
main().catch(console.error);
