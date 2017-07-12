#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Composer directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Check for the system tests.
case ${TEST_SUITE} in
system*)
    echo Not executing as running system tests.
    exit 0
    ;;
esac

echo $(date) Generating documentation.js
echo $DIR
#documentation build -f md --output ~/github/composer/packages/composer-website/out/common-api.md ~/github/composer/packages/composer-common/lib/**
documentation build --format md --output "$DIR/out/composer-client.md" "$DIR/node_modules/composer-client/lib/**"
#documentation build --format md --output "$DIR/out/common-admin.md" "$DIR/node_modules/composer-admin/lib/**"
#documentation build --format md --output "$DIR/out/common-runtime.md" "$DIR/node_modules/composer-runtime/lib/**"

