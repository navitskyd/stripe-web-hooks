#!/bin/bash

# Prompt for commit message
echo "Enter commit message:"
read commit_msg

git add .
git commit -m "$commit_msg"
npm run build-info
git add .
git commit -m "update build info"
git push

