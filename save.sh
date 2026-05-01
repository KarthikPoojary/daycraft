#!/bin/bash
msg=${1:-"wip: $(date '+%b %d %H:%M')"}
git add .
git commit -m "$msg"
git push
echo "✅ Deployed — check Vercel in ~30 seconds"
