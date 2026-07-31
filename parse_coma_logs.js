const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const logsDir = path.join(__dirname, 'logs');
const files = fs.readdirSync(logsDir);

const comaEvents = [];
const victimCounts = {};
const attackerCounts = {};
const causeCounts = {};

console.log(`Scanning ${files.length} log files for [Kutils] [ComaLog] entries...`);

files.forEach(file => {
  if (!file.endsWith('.log.gz') && !file.endsWith('.log')) return;

  const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
  let fileDate = dateMatch ? dateMatch[1] : '';
  const fp = path.join(logsDir, file);

  if (!fileDate) {
    try {
      const stats = fs.statSync(fp);
      fileDate = stats.mtime.toISOString().split('T')[0];
    } catch(e) {
      fileDate = '2026-07-31';
    }
  }

  let content = '';
  try {
    if (file.endsWith('.log.gz')) {
      content = zlib.gunzipSync(fs.readFileSync(fp)).toString('utf8');
    } else {
      content = fs.readFileSync(fp, 'utf8');
    }
  } catch (e) {
    return;
  }

  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.includes('[ComaLog]') || (line.includes('[Kutils]') && line.includes('coma'))) {
      const match = line.match(/\[(\d{2}:\d{2}:\d{2})\].*?\[ComaLog\]\s+(.*?)\s+est tombé dans le coma\.\s+Attaquant\/Cause\s*:\s*(.*)/i);
      
      if (match) {
        const time = match[1];
        const victim = match[2].trim();
        const rawCause = match[3].trim();
        const fullDateTime = `${fileDate} ${time}`;

        let category = 'Environnement';
        let causeClean = rawCause;
        let attackerName = null;

        // Check if attacker is a player: Joueur (Name)
        const pvpMatch = rawCause.match(/Joueur\s*\((.*?)\)/i);
        if (pvpMatch) {
          category = 'PvP (Joueur)';
          attackerName = pvpMatch[1].trim();
          attackerCounts[attackerName] = (attackerCounts[attackerName] || 0) + 1;
        } else if (rawCause.toLowerCase().includes('entite') || rawCause.toLowerCase().includes('entity')) {
          category = 'Mob / Entité';
        } else if (rawCause.toLowerCase().includes('fall')) {
          category = 'Chute';
          causeClean = 'Chute';
        } else if (rawCause.toLowerCase().includes('drowning')) {
          category = 'Noyade';
          causeClean = 'Noyade';
        } else if (rawCause.toLowerCase().includes('lava') || rawCause.toLowerCase().includes('fire') || rawCause.toLowerCase().includes('burning')) {
          category = 'Lave / Feu';
          causeClean = 'Lave / Feu';
        } else if (rawCause.toLowerCase().includes('suffocation')) {
          category = 'Suffocation';
          causeClean = 'Suffocation';
        }

        // Aggregate counts
        victimCounts[victim] = (victimCounts[victim] || 0) + 1;
        causeCounts[causeClean] = (causeCounts[causeClean] || 0) + 1;

        comaEvents.push({
          date: fileDate,
          time: time,
          dateTime: fullDateTime,
          victim: victim,
          attacker: attackerName,
          cause: causeClean,
          category: category,
          rawLine: line.trim()
        });
      }
    }
  });
});

// Sort events newest to oldest
comaEvents.sort((a, b) => b.dateTime.localeCompare(a.dateTime));

// Build Top Rankings arrays
const topVictims = Object.keys(victimCounts)
  .map(name => ({ name, count: victimCounts[name] }))
  .sort((a, b) => b.count - a.count);

const topAttackers = Object.keys(attackerCounts)
  .map(name => ({ name, count: attackerCounts[name] }))
  .sort((a, b) => b.count - a.count);

console.log(`\nDONE! Found ${comaEvents.length} coma events.`);
console.log(`Top 5 Victims (Plus souvent KO):`, topVictims.slice(0, 5));
console.log(`Top 5 Executioners (Plus souvent mis KO):`, topAttackers.slice(0, 5));

// Output JS
const jsOutput = `// Auto-generated Coma Logs Data
var COMA_DATA = {
  totalEvents: ${comaEvents.length},
  victimCounts: ${JSON.stringify(victimCounts)},
  attackerCounts: ${JSON.stringify(attackerCounts)},
  causeCounts: ${JSON.stringify(causeCounts)},
  topVictims: ${JSON.stringify(topVictims)},
  topAttackers: ${JSON.stringify(topAttackers)},
  events: ${JSON.stringify(comaEvents)}
};`;

fs.writeFileSync(path.join(__dirname, 'coma_data.js'), jsOutput, 'utf8');
console.log('Saved data to coma_data.js');
