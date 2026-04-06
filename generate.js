import fs from 'fs';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

// YOUR YOUTUBE SOURCES
const VIDEO_FEEDS = [
  'https://www.youtube.com/feeds/videos.xml?channel_id=UC41xXhw22o6Q2I2pTKB2kOg',
  'https://www.youtube.com/feeds/videos.xml?user=@naturefrontiers-life'
];

// LEGITIMATE NEWS SOURCES TO ATTRACT VISITORS
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
    // Handle different RSS formats
    return result.feed ? (result.feed.entry || []) : (result.rss?.channel?.[0]?.item || []);
  } catch (e) {
    console.log(`Failed to fetch ${url}`);
    return [];
  }
}

async function main() {
  console.log('🌿 Fetching Videos...');
  let content = [];
  
  // 1. Process Video Feeds
  for (const url of VIDEO_FEEDS) {
    const entries = await fetchXML(url);
    entries.forEach(entry => {
      const id = entry.id ? entry.id[0].split(':').pop() : Math.random().toString(36);
      content.push({
        type: 'video',
        id: id,
        title: entry.title ? entry.title[0] : 'Nature Video',
        link: entry.link ? entry.link[0].$.href : '#',
        image: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
        date: new Date(entry.published ? entry.published[0] : Date.now()).toLocaleDateString()
      });
    });
  }

  // 2. Process News Feeds (To make site look active and attract traffic)
  console.log('📰 Fetching News Headlines...');
  for (const url of NEWS_FEEDS) {
    const items = await fetchXML(url);
    items.slice(0, 3).forEach(item => { // Get top 3 from each source
      content.push({
        type: 'news',
        id: Math.random().toString(36),
        title: item.title ? item.title[0] : 'Nature News',
        link: item.link ? (item.link[0] || item.link) : '#',
        image: 'https://images.pexels.com/photos/3225521/pexels-photo-3225521.jpeg?auto=compress&cs=tinysrgb&w=600',
        date: 'Latest News'
      });
    });
  }

  // Sort by newest (approximate since news dates vary)
  content.sort((a, b) => (a.type === 'video' ? -1 : 1));

  // Save to public folder
  if (!fs.existsSync('public/data')) fs.mkdirSync('public/data', { recursive: true });
  fs.writeFileSync('public/data/content.json', JSON.stringify(content));
  console.log(`✅ Generated ${content.length} items.`);
}

main();
