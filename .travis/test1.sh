# Exit on first error, print all commands.
set -ev
set -o pipefail
source build.cfg

echo ${ABORT_BUILD}
