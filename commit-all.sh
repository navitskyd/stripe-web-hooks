#!/bin/bash


# Prompt for commit message
echo "Enter commit message:"
read commit_msg


# Update build-info.json directly in this script
current_date=$(date '+%Y-%m-%d %H:%M:%S %Z')
comment="$commit_msg"


# Get and increment minor version from build-info.json
current_version=$(grep '"version"' build-info.json | head -1 | awk -F '"' '{print $4}')
major=$(echo $current_version | cut -d. -f1)
minor=$(echo $current_version | cut -d. -f2)
patch=$(echo $current_version | cut -d. -f3)
minor=$((minor + 1))
new_version="$major.$minor.0"

# Write build-info.json
cat > build-info.json <<EOL
{
	"date": "$current_date",
	"comment": "$comment",
	"version": "$new_version"
}
EOL

git add .
git commit -m "$commit_msg"
git push

