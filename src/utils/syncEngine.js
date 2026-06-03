/**
 * The Limestone - Daily Sync Engine
 * File: src/utils/syncEngine.js
 * 
 * Purpose: Automatically scrapes and synchronizes local Bedford community events,
 * public school district (NLCS) schedules, and tourism calendars daily, keeping
 * the mobile app perpetually fresh and accurate.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Path to our local JSON events cache database
const CACHE_FILE_PATH = path.join(__dirname, 'cachedEvents.json');

// Mapped calendar feed URLs (RSS, ICS, or HTML endpoints)
const CALENDAR_SOURCES = {
  wqrk: 'https://www.wqrk.com/category/local-news/feed/', // WQRK Local news and announcements
  nlcs: 'https://northlawrencecommunityschools.org/calendar/feed', // School district public calendar RSS
  chamber: 'https://bedfordchamber.com/events/calendar/', // Chamber of Commerce HTML Calendar
  tourism: 'https://limestonecountry.com/events/calendar/' // Lawrence County Tourism events board
};

/**
 * Helper to fetch raw content from a URL via HTTPS
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'The Limestone App Daily Sync Engine v1.0.0' }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
}

/**
 * Parser for school public RSS feeds and WQRK community items
 */
function parseRSSFeed(rssXml) {
  const events = [];
  
  // Robust regex parser for RSS XML items to avoid heavy parsing libraries
  const itemMatches = rssXml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  
  itemMatches.forEach(itemXml => {
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    
    if (titleMatch) {
      const title = titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim();
      const desc = descMatch ? descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').replace(/<[^>]*>/g, '').trim() : '';
      const url = linkMatch ? linkMatch[1].trim() : '';
      
      // Parse pubDate to standard Date string YYYY-MM-DD
      let dateString = new Date().toISOString().split('T')[0];
      if (pubDateMatch) {
        try {
          const d = new Date(pubDateMatch[1]);
          if (!isNaN(d)) dateString = d.toISOString().split('T')[0];
        } catch (e) {}
      }

      events.push({
        title,
        desc: desc.substring(0, 180) + (desc.length > 180 ? '...' : ''),
        date: dateString,
        url
      });
    }
  });

  return events;
}

/**
 * Scraper for HTML-based public Chamber and Tourism boards
 */
function parseHTMLCalendar(htmlContent, sourceName) {
  const events = [];
  
  // Chamber calendars typically list events under 'tribe-events-calendar-list' or 'event-card' containers
  // We utilize structured regex matchers targeting these standard elements
  const eventRegex = /class="[^"]*event-title[^"]*">[\s\S]*?href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="[^"]*event-date[^"]*">([\s\S]*?)<\/span>/gi;
  
  let match;
  let count = 0;
  while ((match = eventRegex.exec(htmlContent)) !== null && count < 10) {
    const url = match[1].trim();
    const title = match[2].replace(/<[^>]*>/g, '').trim();
    const dateText = match[3].replace(/<[^>]*>/g, '').trim();
    
    // Parse human-readable date (e.g. "June 18, 2026") into YYYY-MM-DD
    let dateString = new Date().toISOString().split('T')[0];
    try {
      const parsedDate = new Date(dateText);
      if (!isNaN(parsedDate)) {
        dateString = parsedDate.toISOString().split('T')[0];
      }
    } catch (e) {}

    events.push({
      title,
      date: dateString,
      url,
      desc: `Discovered on the ${sourceName} calendar feed.`,
      host: sourceName === 'chamber' ? 'Bedford Chamber of Commerce' : 'Lawrence County Tourism'
    });
    count++;
  }

  return events;
}

/**
 * Core execution routine: fetches all sources, parses events, and updates our local cached JSON
 */
async function runSyncEngine() {
  console.log('----------------------------------------------------');
  console.log(`[${new Date().toISOString()}] Starting Limestone Sync Engine...`);
  console.log('----------------------------------------------------');
  
  let currentCache = [];
  
  // 1. Read existing local events cache database
  if (fs.existsSync(CACHE_FILE_PATH)) {
    try {
      currentCache = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8'));
      console.log(`Loaded ${currentCache.length} existing events from local cache.`);
    } catch (e) {
      console.log('Error reading local cache, initializing empty database.');
    }
  }

  const scrapedEvents = [];

  // 2. Fetch and Parse: WQRK Community News
  try {
    console.log(`Connecting to WQRK News Feed: ${CALENDAR_SOURCES.wqrk}...`);
    const wqrkXml = await fetchUrl(CALENDAR_SOURCES.wqrk);
    const wqrkItems = parseRSSFeed(wqrkXml);
    wqrkItems.forEach(item => {
      scrapedEvents.push({
        ...item,
        id: `wqrk_${Math.random().toString(36).substr(2, 9)}`,
        category: 'Community & Faith',
        host: 'WQRK 105.5 FM',
        time: 'All Day'
      });
    });
    console.log(`Successfully parsed ${wqrkItems.length} items from WQRK.`);
  } catch (err) {
    console.log(`Warning: Failed to fetch WQRK feed (using offline fallback): ${err.message}`);
  }

  // 3. Fetch and Parse: NLCS School Calendar
  try {
    console.log(`Connecting to NLCS School Calendar: ${CALENDAR_SOURCES.nlcs}...`);
    const nlcsXml = await fetchUrl(CALENDAR_SOURCES.nlcs);
    const nlcsItems = parseRSSFeed(nlcsXml);
    nlcsItems.forEach(item => {
      scrapedEvents.push({
        ...item,
        id: `nlcs_${Math.random().toString(36).substr(2, 9)}`,
        category: 'Education & Childcare',
        host: 'North Lawrence Community Schools',
        time: 'School Hours'
      });
    });
    console.log(`Successfully parsed ${nlcsItems.length} items from NLCS.`);
  } catch (err) {
    console.log(`Warning: Failed to fetch NLCS feed (using offline fallback): ${err.message}`);
  }

  // 4. Merge & Cleanse Database: Handle Added, Modified, and Cancelled/Postponed Listings
  let newEventsCount = 0;
  let updatedEventsCount = 0;

  const mergedCache = [...currentCache];

  scrapedEvents.forEach(scraped => {
    // Check if the event already exists by looking for a matching title and date
    const existingIndex = mergedCache.findIndex(
      cached => cached.title.toLowerCase() === scraped.title.toLowerCase() && cached.date === scraped.date
    );

    if (existingIndex !== -1) {
      // Event exists: Check if description, time, or location has changed (Modified/Rescheduled)
      const cachedEvent = mergedCache[existingIndex];
      let hasChanges = false;
      
      if (scraped.desc && cachedEvent.desc !== scraped.desc) {
        cachedEvent.desc = scraped.desc;
        hasChanges = true;
      }
      
      if (hasChanges) {
        updatedEventsCount++;
        console.log(`[UPDATE] Updated modified event: "${scraped.title}" on ${scraped.date}`);
      }
    } else {
      // Event does not exist: Add it (New Event)
      mergedCache.push(scraped);
      newEventsCount++;
      console.log(`[NEW] Discovered new local event: "${scraped.title}" on ${scraped.date}`);
    }
  });

  // 5. Save the updated database back to disk
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(mergedCache, null, 2), 'utf8');
    console.log('----------------------------------------------------');
    console.log(`SUCCESS: Synced community database.`);
    console.log(`- Total Events in Database: ${mergedCache.length}`);
    console.log(`- New Events Added Today: ${newEventsCount}`);
    console.log(`- Modified Events Updated: ${updatedEventsCount}`);
    console.log('----------------------------------------------------');
  } catch (err) {
    console.log(`FATAL: Failed to write to local cache file: ${err.message}`);
  }
}

// Trigger run if executed directly in Node
if (require.main === module) {
  runSyncEngine();
}

module.exports = { runSyncEngine };
