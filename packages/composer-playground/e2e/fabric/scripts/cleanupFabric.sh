# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

DOCKER_FILE=${DIR}/hlfv1/docker-compose.yml

ARCH=$ARCH docker-compose -f ${DOCKER_FILE} kill
ARCH=$ARCH docker-compose -f ${DOCKER_FILE} down

pkill verdaccio | true

rm -rf ${HOME}/.composer/cards/Test*
rm -rf ${HOME}/.composer/client-data/Test*
rm -rf ${HOME}/.composer/cards/admin*
rm -rf ${HOME}/.composer/client-data/admin*
rm -rf ${DIR}/../downloads
rm -rf ${DIR}/scripts/storage