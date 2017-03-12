#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"


if [ "${SYSTEST}" = "hlf" ] && [ "${SYSTEST_HLF}" = "ibm" ]; then

  if [ "${TRAVIS_EVENT_TYPE}" = "cron" ]; then
	echo Valid to run hlf with ibm systest as CRON build
  else
    echo Not running as a PR or merge build
    exit 0
  fi
fi