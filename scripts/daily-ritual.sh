#!/bin/bash
echo "🌑 Memulai Ritual Transmutasi Harian..."
node scripts/fetch-notion-data.js
git add .
git commit -m "Ritual Transmutasi Harian: Data Synced from The Grimoire ⚗️"
git push origin dev
cd ..
git add .
git commit -m "Soul Backup: Daily Chronicles & Leveling Sync ⚖️"
git push origin main
echo "🌟 Ritual Selesai."
