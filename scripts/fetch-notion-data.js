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
    GLOSSARY: "30c79a34-e7c9-81a6-8ce7-dc6e3da2474b",
    ARSENAL: "30c79a34-e7c9-8141-b5df-ecd29ebb65ed",
    LABORATORY: "30c79a34-e7c9-8196-8220-c6b04c3a8bae",
    TASKS: "30a79a34-e7c9-813c-85fe-e47f574aeba9",
    SCRIPTS: "30b79a34-e7c9-81d1-9e05-dbe63d4ebc96",
    QUOTES: "30c79a34-e7c9-81e9-bcd5-d03ccf7d37a5"
};

const NOTION_API_KEY = process.env.NOTION_API_KEY;

async function fetchNotionDB(dbId, sort = []) {
    const response = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sorts: sort })
    });
    const data = await response.json();
    return data.results || [];
}

async function syncAtelier() {
    console.log("⚗️ Initiating Deep Sync with The Grimoire...");
    
    try {
        const dataPath = path.join(__dirname, '../src/data');
        if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true });

        // Fetch all datasets in parallel for speed
        const [
            statsRes, journeyRes, evolutionRes, glossaryRes, 
            arsenalRes, laboratoryRes, taskRes, scriptRes, quoteRes
        ] = await Promise.all([
            fetchNotionDB(DB_IDS.STATS),
            fetchNotionDB(DB_IDS.JOURNEY),
            fetchNotionDB(DB_IDS.EVOLUTION),
            fetchNotionDB(DB_IDS.GLOSSARY),
            fetchNotionDB(DB_IDS.ARSENAL),
            fetchNotionDB(DB_IDS.LABORATORY),
            fetchNotionDB(DB_IDS.TASKS),
            fetchNotionDB(DB_IDS.SCRIPTS),
            fetchNotionDB(DB_IDS.QUOTES)
        ]);

        const stats = statsRes.map(page => {
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

        const journey = journeyRes.map(page => {
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

        const evolution = evolutionRes.map(page => {
            const props = page.properties;
            return {
                level: props["Rank / Level"]?.title?.[0]?.plain_text || "N/A",
                title: props["Title Name"]?.rich_text?.[0]?.plain_text || "Unknown Rank",
                reqExp: props["Required EXP"]?.number || 0,
                reqWisdom: props["Required Wisdom"]?.number || 0
            };
        }).sort((a, b) => (a.reqExp || 0) - (b.reqExp || 0));

        const glossary = glossaryRes.map(page => {
            const props = page.properties;
            return {
                term: props["Term"]?.title?.[0]?.plain_text || "Untitled",
                category: props["Category"]?.select?.name || "General",
                description: props["Definition / Meaning"]?.rich_text?.[0]?.plain_text || ""
            };
        });

        const arsenal = arsenalRes.map(page => {
            const props = page.properties;
            return {
                name: props["Artifact Name"]?.title?.[0]?.plain_text || "Unknown Artifact",
                category: props["Category"]?.select?.name || "Tool",
                description: props["Description"]?.rich_text?.[0]?.plain_text || "",
                power: props["Power Level"]?.number || 0,
                status: props["Status"]?.select?.name || "Stored"
            };
        });

        const laboratory = laboratoryRes.map(page => {
            const props = page.properties;
            return {
                name: props["Project Name"]?.title?.[0]?.plain_text || "Untitled Project",
                stability: props["Stability"]?.select?.name || "Unstable",
                elements: props["Element"]?.multi_select?.map(e => e.name) || [],
                repo: props["Repository"]?.url || "",
                date: props["Completion Date"]?.date?.start || ""
            };
        });

        const tasks = taskRes.map(page => {
            const props = page.properties;
            return {
                name: props["Task Name"]?.title?.[0]?.plain_text || "Unknown Task",
                display: props["Display Title"]?.rich_text?.[0]?.plain_text || "",
                status: props["Status"]?.select?.name || "To Do",
                rank: props["Quest Rank"]?.select?.name || "D-Rank",
                type: props["Quest Type"]?.select?.name || "Side Quest",
                reward: props["Reward Element"]?.select?.name || "General"
            };
        });

        const scripts = scriptRes.map(page => {
            const props = page.properties;
            return {
                name: props["Mantra Name"]?.title?.[0]?.plain_text || "Unknown Script",
                category: props["Category"]?.select?.name || "Utility",
                type: props["Type"]?.select?.name || "Shell",
                description: props["Description"]?.rich_text?.[0]?.plain_text || "",
                complexity: props["Complexity"]?.select?.name || "Novice"
            };
        });

        const quotes = quoteRes.map(page => {
            const props = page.properties;
            return {
                text: props["Quote / Mantra"]?.title?.[0]?.plain_text || "Untitled Quote",
                author: props["Orator / Author"]?.rich_text?.[0]?.plain_text || "Unknown",
                origin: props["Origin / Source"]?.select?.name || "General Wisdom",
                alignment: props["Path Alignment"]?.select?.name || "Soul Alchemy",
                reflection: props["Context / Reflection"]?.rich_text?.[0]?.plain_text || ""
            };
        });

        // Save manifested files
        fs.writeFileSync(path.join(dataPath, 'stats.json'), JSON.stringify(stats, null, 2));
        fs.writeFileSync(path.join(dataPath, 'journey.json'), JSON.stringify(journey, null, 2));
        fs.writeFileSync(path.join(dataPath, 'evolution.json'), JSON.stringify(evolution, null, 2));
        fs.writeFileSync(path.join(dataPath, 'glossary.json'), JSON.stringify(glossary, null, 2));
        fs.writeFileSync(path.join(dataPath, 'arsenal.json'), JSON.stringify(arsenal, null, 2));
        fs.writeFileSync(path.join(dataPath, 'laboratory.json'), JSON.stringify(laboratory, null, 2));
        fs.writeFileSync(path.join(dataPath, 'tasks.json'), JSON.stringify(tasks, null, 2));
        fs.writeFileSync(path.join(dataPath, 'scripts.json'), JSON.stringify(scripts, null, 2));
        fs.writeFileSync(path.join(dataPath, 'quotes.json'), JSON.stringify(quotes, null, 2));
        
        console.log("✅ Manifestation Complete: Full Atelier Data synced.");
    } catch (error) {
        console.error("❌ Transmutation Failed:", error);
    }
}

syncAtelier();
