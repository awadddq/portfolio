#!/bin/bash

# Check if git is available
if ! command -v git &>/dev/null; then
    echo "Error: Git is not installed. Please install Git to deploy to GitHub Pages."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    echo "Error: Not in a Git repository. Please initialize a Git repository first."
    exit 1
fi

# Update the database
echo "Updating the database..."
./update-db.sh

# Add all files to git
echo "Adding files to Git..."
git add .

# Commit changes
echo "Committing changes..."
read -p "Enter commit message: " commit_message
git commit -m "$commit_message"

# Push to GitHub
echo "Pushing to GitHub..."
git push origin main

echo "Deployment complete! Your site should be available at your GitHub Pages URL shortly."
echo "If you haven't set up GitHub Pages yet, go to your repository settings and enable GitHub Pages." 