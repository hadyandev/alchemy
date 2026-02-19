import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Notion Database IDs
const DB_IDS = {
    JOURNEY: "30b79a34-e7c9-8113-ae45-cbdce3efc096",
    STATS: "30b79a34-e7c9-8163-84e4-ef0946f39344",
    EVOLUTION: "30c79a34-e7c9-81a5-b942-eb9bbff1b41e",
};

const NOTION_API_KEY = process.env.NOTION_API_KEY;

async function fetchNotionDB(dbId) {
    const response = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });
    const data = await response.json();
    return data.results || [];
}

async function syncAtelier() {
    console.log("⚗️ Initiating Deep Sync with The Grimoire...");
    
    try {
        const dataPath = path.join(__dirname, '../src/data');
        if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true });

        // 1. Fetch Stats
        const statsResults = await fetchNotionDB(DB_IDS.STATS);
        const stats = statsResults.map(page => {
            const props = page.properties;
            return {
                name: props["Stat Name"]?.title?.[0]?.plain_text || "Unknown",
                level: props["Current Level"]?.number || 1,
                title: props["Current Title"]?.rich_text?.[0]?.plain_text || "The Initiate",
                exp: props["Total EXP"]?.number || 0,
                wisdom: props["Total Wisdom"]?.number || 0,
                class: props["Class"]?.select?.name || "None",
                skills: props["Skills"]?.multi_select?.map(s => s.name) || [],
                elements: props["Elements"]?.multi_select?.map(e => e.name) || [],
                paths: [
                    { name: 'Code Alchemy', level: props["Code Level"]?.number || 0 },
                    { name: 'Infra Alchemy', level: props["Infra Level"]?.number || 0 },
                    { name: 'Soul Alchemy', level: props["Soul Level"]?.number || 0 },
                    { name: 'Turath Alchemy', level: props["Turath Level"]?.number || 0 }
                ]
            };
        });

        // 2. Fetch Journey
        const journeyResults = await fetchNotionDB(DB_IDS.JOURNEY);
        const journey = journeyResults.map(page => {
            const props = page.properties;
            return {
                title: props["Title"]?.title?.[0]?.plain_text || "Untitled",
                date: props["Date"]?.date?.start || "2026-02-18",
                description: props["Description"]?.rich_text?.[0]?.plain_text || "",
                exp: props["EXP"]?.number || 0,
                wisdom: props["Wisdom"]?.number || 0,
                path: props["Alchemist Path"]?.multi_select?.[0]?.name || "General",
                member: props["Alchemist"]?.select?.name?.toLowerCase() || "hadyan",
                format: props["Format"]?.select?.name || "Insight",
                solution: props["Solution Path"]?.rich_text?.[0]?.plain_text || ""
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        // 3. Fetch Evolution
        const evolutionResults = await fetchNotionDB(DB_IDS.EVOLUTION);
        const evolution = evolutionResults.map(page => {
            const props = page.properties;
            return {
                level: props["Rank / Level"]?.title?.[0]?.plain_text || "N/A",
                title: props["Title Name"]?.rich_text?.[0]?.plain_text || "Unknown Rank",
                reqExp: props["Required EXP"]?.number || 0,
                reqWisdom: props["Required Wisdom"]?.number || 0
            };
        }).sort((a, b) => (a.reqExp || 0) - (b.reqExp || 0));

        // Save manifested files
        fs.writeFileSync(path.join(dataPath, 'stats.json'), JSON.stringify(stats, null, 2));
        fs.writeFileSync(path.join(dataPath, 'journey.json'), JSON.stringify(journey, null, 2));
        fs.writeFileSync(path.join(dataPath, 'evolution.json'), JSON.stringify(evolution, null, 2));
        
        console.log("✅ Manifestation Complete: Full Character Stats & Collaborative Journey synced.");
    } catch (error) {
        console.error("❌ Transmutation Failed:", error);
    }
}

syncAtelier();
