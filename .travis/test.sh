# Exit on first error, print all commands.
set -ev
set -o pipefail


echo "ABORT_BUILD=true" > build.cfg