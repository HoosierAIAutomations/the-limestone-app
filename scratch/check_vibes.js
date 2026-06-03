const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:/Dev/Company Files/Hoosier AI Automations/Private Builds/GOOGLE PLAY STORE/The Limestone/src/utils/cachedDirectory.json', 'utf8'));

const counts = {};
data.forEach(item => {
  const vibe = item.ageFilter;
  counts[vibe] = (counts[vibe] || 0) + 1;
});

console.log('Unique ageFilter values and counts:', counts);
