#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Set ARCH
ARCH=`uname -m`

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Switch into the integration tests directory.
cd "${DIR}"

# Delete any existing configuration.
rm -rf ./pm2
rm -rf ./scripts/storage
rm -rf ${HOME}/.config/verdaccio
rm -rf ${HOME}/.composer/cards/Test*
rm -rf ${HOME}/.composer/client-data/Test*
rm -rf ${HOME}/.composer/cards/bob*
rm -rf ${HOME}/.composer/client-data/bob*
rm -rf ${HOME}/.composer/cards/admin*
rm -rf ${HOME}/.composer/client-data/admin*
rm -rf ${HOME}/.composer/cards/fred*
rm -rf ${HOME}/.composer/client-data/fred*
rm -rf ${HOME}/.composer/cards/sal*
rm -rf ${HOME}/.composer/client-data/sal*
rm -rf ${HOME}/.composer/cards/ange*
rm -rf ${HOME}/.composer/client-data/ange*
rm -rf ${HOME}/.composer/cards/charlie*
rm -rf ${HOME}/.composer/client-data/charlie*
rm -rf ./tmp/*           # temp folder for BNA files that are generated
rm -rf ./my-bus-net      # business network created from generator
rm -f ./networkadmin.card
rm -f ./composer-report-*

rm -rf ${HOME}/.npmrc
if [ "${DOCKER_FILE}" != "" ]; then
    cd ../composer-runtime-hlfv1
    rm .npmrc
    cd "${DIR}"
fi

# Barf if we don't recognize this test suite.
if [ "${INTEST}" = "" ]; then
    echo You must set INTEST to 'hlfv1' as it is the only supported test item
    echo For example:
    echo  export INTEST=hlfv1
    echo If you want to skip the HSM tests, you can set INTEST to 'hlfv1_nohsm'
    echo however it is recommended you do not skip the tests but ensure you
    echo has softhsm installed so the tests can be run.
    exit 1
fi

# Run for all specified configurations.
for INTEST in $(echo ${INTEST} | tr "," " "); do

    ("${DIR}/scripts/run-start-fabric.sh" && "${DIR}/scripts/run-config-fabric.sh") &

    # Switch back to the integration tests directory.
    cd "${DIR}"

    # Verdaccio server requires a dummy user if publishing via npm
    echo '//localhost:4873/:_authToken="foo"' > ${HOME}/.npmrc
    echo fetch-retries=10 >> ${HOME}/.npmrc
    export npm_config_registry=http://localhost:4873

    # Start all test programs.
    (npm run stop_ldap &&  npm run start_ldap) &
    
    ((docker rm -f mongo || true) &&  docker run -d --name mongo -p 27017:27017 mongo) &

    # wait for the background processes
    wait

    # Run the integration tests.
    if [[ ${INTEST} == *nohsm ]]; then
        npm run int-test-nohsm 2>&1 | tee
    else
        npm run int-test 2>&1 | tee
    fi

    # Stop all test programs.
    docker rm -f mongo || true
    npm run stop_ldap

    # Kill and remove any started Docker images.
    if [ "${DOCKER_FILE}" != "" ]; then
        ARCH=$ARCH docker-compose -f ${DOCKER_FILE} kill
        ARCH=$ARCH docker-compose -f ${DOCKER_FILE} down
    fi

    # Delete any written configuration.
    rm -rf ./pm2
    rm -rf ./scripts/storage
    rm -rf ${HOME}/.config/verdaccio
    rm -rf ${HOME}/.composer/cards/Test*
    rm -rf ${HOME}/.composer/client-data/Test*
    rm -rf ${HOME}/.composer/cards/bob*
    rm -rf ${HOME}/.composer/client-data/bob*
    rm -rf ${HOME}/.composer/cards/admin*
    rm -rf ${HOME}/.composer/client-data/admin*
    rm -rf ${HOME}/.composer/cards/fred*
    rm -rf ${HOME}/.composer/client-data/fred*
    rm -rf ${HOME}/.composer/cards/sal*
    rm -rf ${HOME}/.composer/client-data/sal*
    rm -rf ${HOME}/.composer/cards/ange*
    rm -rf ${HOME}/.composer/client-data/ange*
    rm -rf ./tmp/*
    rm -rf ./my-bus-net
    rm -rf ./networkadmin
    rm -rf ${HOME}/.npmrc
    rm -f ./networkadmin.card
    rm -f ./composer-report-*
    if [ "${DOCKER_FILE}" != "" ]; then
        cd ../composer-runtime-hlfv1
        rm .npmrc
        cd "${DIR}"
    fi

    # Delete any crypto-config material
    if [ -d ./hlfv1/crypto-config ]; then
        rm -rf ./hlfv1/crypto-config
    fi

done

