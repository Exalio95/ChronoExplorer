const fs = require('fs');
const path = require('path');

// 1. Parse Master List
const masterPriorities = [];
const masterContent = fs.readFileSync('master_episode_list.md', 'utf-8');
const masterLines = masterContent.split('\n');
masterLines.forEach(line => {
    // - [x] **-18 000** : La grotte de Lascaux (P1)
    const match = line.match(/\*\*([^\*]+)\*\*\s*:\s*(.+?)\s*\((P\d+)\)/);
    if (match) {
        masterPriorities.push({
            yearStr: match[1].trim(),
            title: match[2].trim(),
            priority: int(match[3].replace('P', ''))
        });
    }
});

function int(str) {
    return parseInt(str, 10);
}

function normalize(str) {
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, '');
}

// 2. Scan Data Files
const dataDir = '.';
const files = fs.readdirSync(dataDir).filter(f => f.startsWith('data_episode_') && f.endsWith('.js'));

const idPriorityMap = {};

files.forEach(file => {
    // data_episode_104_tang.js
    const idMatch = file.match(/data_episode_(\d+)_/);
    if (!idMatch) return;
    const id = int(idMatch[1]);

    // Read file to get title
    const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    // const episodeTitle_104 = "618 : Dynastie Tang ";
    const titleMatch = content.match(/const episodeTitle_\d+\s*=\s*["'](.+)["']/);

    if (titleMatch) {
        let fullTitle = titleMatch[1];

        // Extract year from title "618 : Dynastie Tang"
        let yearPart = "";
        let textPart = fullTitle;
        const parts = fullTitle.split(':');
        if (parts.length > 1) {
            yearPart = parts[0].trim(); // "618" or "-18 000"
            textPart = parts.slice(1).join(' ').trim();
        }

        // Find match in master list
        // Strategy: Match Year AND fuzzy match Title
        let bestMatch = null;

        // Try exact year match first
        const potentialMatches = masterPriorities.filter(mp => mp.yearStr.replace(/\s/g, '') === yearPart.replace(/\s/g, ''));

        if (potentialMatches.length > 0) {
            // Find best text match
            const normTitle = normalize(textPart);
            bestMatch = potentialMatches.find(mp => normalize(mp.title).includes(normTitle) || normTitle.includes(normalize(mp.title)));

            // Fallback: if only one match for year, take it
            if (!bestMatch && potentialMatches.length === 1) {
                bestMatch = potentialMatches[0];
            }
        }

        if (bestMatch) {
            idPriorityMap[id] = bestMatch.priority;
        } else {
            console.log(`No match for ID ${id}: ${fullTitle}. Assigning default based on Boucheron logic.`);
            // Auto-judgement logic (fallback)
            // If keywords like "Rome", "Empire", "Chute", "Révolution" -> P1 or P2
            // Else P3
            const keywordsP1 = ['rome', 'chute', 'révolution', 'guerre', 'empire', 'découverte', 'premier', 'fondation'];
            if (keywordsP1.some(k => normalize(fullTitle).includes(k))) {
                idPriorityMap[id] = 2; // Conservative P2
            } else {
                idPriorityMap[id] = 3;
            }
        }
    }
});

// Write output
const output = `const manualEpisodePriorities = ${JSON.stringify(idPriorityMap, null, 4)};`;
fs.writeFileSync('generated_priorities.js', output);
console.log("Map generated.");
