#!/bin/sh
# Release a new version: ./bump.sh  -> increments version everywhere so users see the update banner
set -e
cd "$(dirname "$0")"
OLD=$(sed -n 's/.*"v": *"\([0-9]*\)".*/\1/p' version.json)
NEW=$((OLD + 1))
sed -i "s/?v=$OLD/?v=$NEW/g" index.html js/app.js sw.js
sed -i "s/ghada-v$OLD/ghada-v$NEW/" sw.js
sed -i "s/const APP_V = '$OLD'/const APP_V = '$NEW'/" js/app.js
echo "{\"v\": \"$NEW\"}" > version.json
echo "v$OLD -> v$NEW"
