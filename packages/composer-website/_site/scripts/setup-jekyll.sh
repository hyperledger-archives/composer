#!/bin/bash

# Exit on first error, print all commands.

set -ev

# Grab the Composer-Docs directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"



echo "Attempting to install jekyll"
gem install jekyll
echo "Attempting to install jekyll-sitemap"
gem install jekyll-sitemap
echo "Attempting to install redcarpet"
gem install redcarpet

echo "Jekyll Installed"
