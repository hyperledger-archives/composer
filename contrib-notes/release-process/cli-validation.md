# CLI Verification
The CLI should be verified against the following platforms:
 - Ubuntu 14:04 & Ubuntu 16:04
 - MacOS 10

A fresh virtualised image should be used where possible, to ensure that the process will be as that of a new user with a fresh machine. This does however preclude this process from detecting issues where a user already has some components (dependancies etc) pre-installed and may cause a conflict with script files provided.

## CLI Testing

On a fresh VM it is necessary to install the current unstable cli package, stand up a fabric (local), then deploy and interact with a BNA on that fabric.

Obtain the unstable cli package:
```bash
$ npm install -g composer-cli@unstable
```

Stand up a local fabric:
```
# Execute the following 5 steps, to stand up a runtime Fabric 
$ mkdir fabric-tools && cd fabric-tools
$ curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.zip
$ unzip fabric-dev-servers.zip
$ ./startFabric.sh # will remove containers that exist previously including dev-* containers
$ ./createPeerAdminCard.sh
```

Obtain two BNA files from the [Composer Playground on Bluemix](http://composer-playground-unstable.mybluemix.net/). Import a sample and the export the original sample, and an edited sample that has included a new Asset and Participant. This guide will assume that the basic-sample-network has been exported.

### CLI Commands

1) Build and deploy the original BNA file
    - unzip the exported BNA file
    - delete the original BNA file
    - build a BNA by targetting the folder that was created on unzip ``` composer archive create -t dir -a v1_bna -n network ```
    - deploy the new BNA ``` composer network deploy -a v1_bna --card PeerAdmin@hlfv1 ```

2) Check the network
    - ping: ``` composer network ping --card admin@basic-sample-network ```
    - list assets ``` composer network list --card admin@basic-sample-network -r org.acme.sample.SampleAsset ```

3) Update with the edited BNA
    - update ``` composer network update -i admin -s silent -p hlfv1 -a v2_bna ```
    - ping ``` composer network ping -n basic-sample-network -p hlfv1 -i admin -s mySecret ```
    - list all ``` composer network list -n basic-sample-network -p hlfv1 -i admin -s mySecret ```
    - check that the new items are listed

4) Create and check participants
    - create first ``` composer participant add --card admin@basic-sample-network -d '{"$class":"org.acme.sample.SampleParticipant","participantId":"bob","firstName":"bob","lastName":"bobbington"}' ```
    - create second ``` composer participant add --card admin@basic-sample-network -d '{"$class": "org.acme.sample.SampleParticipant","participantId": "participantId:111","firstName": "sally","lastName": "sallyington"}' ```
    - check ``` composer network list --card admin@basic-sample-network ```

5) Submit a transaction
    - submit a system transaction to add asset ```composer transaction submit --card admin@basic-sample-network -d '{"$class": "org.hyperledger.composer.system.AddAsset","registryType": "Asset","registryId": "org.acme.sample.SampleAsset", "targetRegistry" : "resource:org.hyperledger.composer.system.AssetRegistry#org.acme.sample.SampleAsset", "resources": [{"$class": "org.acme.sample.SampleAsset","assetId": "newAsset","owner": "resource:org.acme.sample.SampleParticipant#bob","value": "101"}]}'```
    - Submit a user transaction ```composer transaction submit --card admin@basic-sample-network -d '{"$class": "org.acme.sample.SampleTransaction",  "asset": "resource:org.acme.sample.SampleAsset#newAsset",  "newValue": "5"}'```
    - list all ``` composer network list -n basic-sample-network -p hlfv1 -i admin -s mySecret ```
    - list assets ``` composer network list --card admin@basic-sample-network -r org.acme.sample.SampleAsset ```

6) Work with IDs
    - list current IDs ``` composer identity list  --card admin@basic-sample-network  ```
    - issue to bob ``` composer identity issue --card admin@basic-sample-network -u newUser1 -a "resource:org.acme.sample.SampleParticipant#bob" ```
    - record the output userid and secret for later. 
    - list current IDs again ``` composer identity list --card admin@basic-sample-network ``` (looking for ID status)
    - import the card just created ``` composer card import --file newUser1@basic-sample-network.card ```
    - check the card has been imported ``` composer card list   ```
    - connect to the business network using the above userId and secret ``` composer network list --card newUser1@basic-sample-network ```
    - list current IDs again ``` composer identity list --card admin@basic-sample-network ``` (looking for ID status changes)
    - Obtain the long uuid for newUser1
    - revoke the id ``` composer identity revoke --card admin@basic-sample-network -u theLongUUID ```
    - list current IDs again ``` composer identity list --card admin@basic-sample-network ``` (looking for ID status changes)
    - check that the id can't do anything ``` composer network list --card newUser1@basic-sample-network ```


