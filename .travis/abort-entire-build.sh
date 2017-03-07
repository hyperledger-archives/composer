#!/bin/bash
# This script will use the travis command line to totally abort the entire build (all jobs)
# Exit on first error, print all commands.
set -ev


# Grab the Fabric Composer directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo Build to abort is ${TRAVIS_BUILD_NUMBER}

travis login --no-interactive --github-token f6008654988371c41ccc1661eaa800fcbe520420

travis cancel ${TRAVIS_BUILD_NUMBER} --no-interactive --repo ${TRAVIS_REPO_SLUG}