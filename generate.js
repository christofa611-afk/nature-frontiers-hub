import fs from 'fs';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
// --- YOUR YOUTUBE SOURCES ---
const VIDEO_FEEDS = [
  'https://www.youtube.com/feeds/videos.xml?channel_id=UC41xXhw22o6Q2I2pTKB2kOg',
  'https://www.youtube.com/feeds/videos.xml?user=@naturefrontiers-life',
  // Specific Playlists
  'https://www.youtube.com/feeds/videos.xml?playlist_id=PLhErNUuDxs_2F8ayJ_XDrgCbH-CiAqRcd',
  'https://www.youtube.com/feeds/videos.xml?playlist_id=PLhErNUuDxs_04gGj-HoaSkXNQ1bno89I8',
  'https://www.youtube.com/feeds/videos.xml?playlist_id=PLhErNUuDxs_0OFY1a8itinxcWutV7oN78',
  'https://www.youtube.com/feeds/videos.xml?playlist_id=PLhErNUuDxs_3s5P3kfBg1wZdWJY_PmAfC'
];
// --- LEGITIMATE NEWS SOURCES (We pull their headlines to attract traffic) ---
const NEWS_FEEDS = [
  'https://www.nationalgeographic.com/animals/rss',
  'https://www.bbcearth.com/feed/',
  'https://www.worldwildlife.org/feeds/news',
  'https://africageographic.com/feed/',
  'https://www.krugerpark.co.za/feed/',
  'https://www.audubon.org/rss',
  'https://www.earthtouchnews.com/feed/',
  'https://www.treehugger.com/animals-wildlife-4127792/feed',
  'https://www.oceana.org/feed/',
  'https://www.smithsonianmag.com/rss/animals/',
  'https://www.sciencedaily.com/rss/plants_animals.xml',
  'https://phys.org/rss-feed/biology-news/plants-animals/',
  'https://news.mongabay.com/feed/',
  'https://africafreak.com/feed',
  'https://www.africanconservation.org/feed',
  'https://latestsightings.com/feed/',
  'https://wildambience.com/feed/',
  'https://www.janegoodall.org/feed/',
  'https://blog.wcs.org/feed/'
  // Added top sources to keep load times fast. Adding all 40+ may cause timeouts.
];
async function fetchXML(url) {
  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    const result = await parseStringPromise(data);
    // Handle different RSS/Atom formats
    if (result.feed) return result.feed.entry || [];
    if (result.rss && result.rss.channel) return result.rss.channel[0].item || [];
    return [];
  } catch (e) {
    console.log(`⚠️ Failed to fetch ${url}`);
    return [];
  }
}
async function main() {
  console.log('🌿 Starting Nature Frontiers Hub Generator...');
  let content = [];
    // 1. Fetch Your Videos
  console.log('📹 Fetching your YouTube videos...');
  for (const url of VIDEO_FEEDS) {
    const entries = await fetchXML(url);
    entries.forEach(entry => {
      const id = entry.id ? entry.id[0].split(':').pop() : Math.random().toString(36);
      const link = entry.link ? (entry.link[0].$.href || entry.link[0]) : '#';
            content.push({
        type: 'video',
        source: 'Nature Frontiers',
        id: id,
        title: entry.title ? entry.title[0] : 'New Wildlife Video',
        link: link,
        image: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
        date: new Date(entry.published ? entry.published[0] : Date.now()).toLocaleDateString(),
        timestamp: new Date(entry.published ? entry.published[0] : Date.now()).getTime()
      });
    });
  }
  // 2. Fetch Global News (To attract visitors)
  console.log('📰 Fetching global nature news...');
  for (const url of NEWS_FEEDS) {
    const items = await fetchXML(url);
    items.slice(0, 2).forEach(item => { // Get top 2 from each source to prevent overload
      content.push({
        type: 'news',
        source: 'Global News',
        id: Math.random().toString(36),
        title: item.title ? item.title[0] : 'Nature News Update',
        link: item.link ? (item.link[0] || item.link) : '#',
        image: 'https://images.pexels.com/photos/3225521/pexels-photo-3225521.jpeg?auto=compress&cs=tinysrgb&w=600',
        date: 'Latest',
        timestamp: Date.now()
      });
    });
  }
  // 3. Sort: Newest first
  content.sort((a, b) => b.timestamp - a.timestamp);
  // Remove duplicates based on ID
  const uniqueContent = Array.from(new Map(content.map(item => [item.id, item])).values());
  // 4. Save to public folder
  if (!fs.existsSync('public/data')) fs.mkdirSync('public/data', { recursive: true });
  fs.writeFileSync('public/data/content.json', JSON.stringify(uniqueContent, null, 2));
console.log(`✅ SUCCESS! Generated ${uniqueContent.length} items (${content.filter(i=>i.type==='video').length} videos, ${content.filter(i=>i.type==='news').length} news items).`);
}
main().catch(console.error);
