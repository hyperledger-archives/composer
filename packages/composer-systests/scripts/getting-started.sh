#!/bin/bash

# Exit on first error, print all commands.
set -ev

# Grab the Composer directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
TMP=$DIR/tmp

echo $DIR
echo $TMP

# Get all hlf docker images
DOCKER_FILE=${DIR}/hlf-docker-compose.yml
echo $DOCKER_FILE
docker pull hyperledger/fabric-membersrvc:x86_64-0.6.1-preview
docker tag hyperledger/fabric-membersrvc:x86_64-0.6.1-preview hyperledger/fabric-membersrvc:latest
docker pull hyperledger/fabric-peer:x86_64-0.6.1-preview
docker tag hyperledger/fabric-peer:x86_64-0.6.1-preview hyperledger/fabric-peer:latest
docker pull hyperledger/fabric-baseimage:x86_64-0.2.0
docker tag hyperledger/fabric-baseimage:x86_64-0.2.0 hyperledger/fabric-baseimage:latest

# Start any required Docker images.
if [ "${DOCKER_FILE}" != "" ]; then
    docker-compose -f ${DOCKER_FILE} kill
    docker-compose -f ${DOCKER_FILE} down
    docker-compose -f ${DOCKER_FILE} up -d
fi

# Install cli
npm install -g composer-cli

cd $DIR

TMP=$DIR/tmp

mkdir -p $TMP

cd $TMP

git clone https://github.com/fabric-composer/sample-applications

GETTING_STARTED=$TMP/sample-applications/packages/getting-started

cd $GETTING_STARTED

npm install

npm test

composer network list -n digitalproperty-network --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d

# Leave Composer-GettingStarted back to tmp
cd $TMP

git clone https://github.com/fabric-composer/sample-networks

cd $TMP/sample-networks/packages/DigitalProperty-Network

npm install

TRANSACTION_FILE=$TMP/sample-networks/packages/DigitalProperty-Network/lib/DigitalLandTitle.js

rm $TRANSACTION_FILE

touch $TRANSACTION_FILE

cat <<EOF > $TRANSACTION_FILE

'use strict';

/** Process a property that is held for sale
 * @param {net.biz.digitalPropertyNetwork.RegisterPropertyForSale} propertyForSale the property to be sold
 * @transaction
 */
function onRegisterPropertyForSale(propertyForSale) {
    console.log('### onRegisterPropertyForSale ' + propertyForSale.toString());
    propertyForSale.title.forSale = true;
    propertyForSale.title.information = propertyForSale.title.information + ' Updated at: ' + new Date().toDateString();

    return getAssetRegistry('net.biz.digitalPropertyNetwork.LandTitle').then(function(result) {
            return result.update(propertyForSale.title);
        }
    );
}
EOF

composer archive create --inputDir . --archiveFile digitalproperty-network.bna

composer network update --archiveFile digitalproperty-network.bna  --enrollId WebAppAdmin --enrollSecret DJY27pEnl16d

npm test

cd $GETTING_STARTED

npm run submitTransaction

rm -rf $TMP
