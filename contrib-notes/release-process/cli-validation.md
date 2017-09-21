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
$./startFabric.sh # will remove containers that exist previously including dev-* containers
$./createComposerProfile.sh
```

Obtain two BNA files from the [Composer Playground on Bluemix](http://composer-playground-unstable.mybluemix.net/). Import a sample and the export the original sample, and an edited sample that has included a new Asset and Participant. This guide will assume that the basic-sample-network has been exported.

### CLI Commands

1) Build and deploy the original BNA file
    - unzip the exported BNA file
    - delete the original BNA file
    - build a BNA by targetting the folder that was created on unzip ``` composer archive create -t dir -a v1_bna -n basic-sample-network_V1 ```
    - deploy the new BNA ``` composer network deploy -a v1_bna -i PeerAdmin -s mySecret -p hlfv1 ```

2) Check the network
    - ping: ``` composer network ping -n basic-sample-network -p hlfv1 -i admin -s adminpw ```
    - list all ``` composer network list -n basic-sample-network -p hlfv1 -i admin -s mySecret ```
    - list assets ``` composer network list -n basic-sample-network -p hlfv1 -i admin -s silent -r org.acme.sample.SampleAsset ```

3) Update with the edited BNA
    - update ``` composer network update -i PeerAdmin -s silent -p hlfv1 -a v2_bna ```
    - ping ``` composer network ping -n basic-sample-network -p hlfv1 -i admin -s mySecret ```
    - list all ``` composer network list -n basic-sample-network -p hlfv1 -i admin -s mySecret ```
    - check that the new items are listed

4) Create and check participants
    - create first ``` composer participant add -n basic-sample-network -p hlfv1 -i admin -s secret -d '{"$class":"org.acme.sample.SampleParticipant","participantId":"bob","firstName":"bob","lastName":"bobbington"}' ```
    - create second ``` composer participant add -n basic-sample-network -p hlfv1 -i admin -s secret -d '{"$class": "org.acme.sample.SampleParticipant","participantId": "participantId:111","firstName": "sally","lastName": "sallyington"}' ```
    - check ``` composer network list -n basic-sample-network -p hlfv1 -i admin -s silent ```

5) Submit a transaction
    - formulate a valid transaction, eg ``` {"$class": "org.acme.sample.SampleAsset","assetId": "newAsset","owner": "resource:org.acme.sample.SampleParticipant#bob","value": "101"} ``` for basic-sample-network asset creation
    - run it ``` composer transaction submit -p hlfv1 -n basic-sample-network -i admin -s mySecret -d '{the transaction}' ```
    - formulate an interaction transaction eg ``` {"$class": "org.acme.sample.SampleTransaction","asset": "resource:org.acme.sample.SampleAsset#newAsset","newValue": "1300"} ```
    - run it ``` composer transaction submit -p hlfv1 -n basic-sample-network -i admin -s admin pw -d '{the transaction}' ```
    - list all ``` composer network list -n basic-sample-network -p hlfv1 -i admin -s mySecret ```
    - list assets ``` composer network list -n basic-sample-network -p hlfv1 -i admin -s silent -r org.acme.sample.SampleAsset ```

6) Work with IDs
    - list current IDs ``` composer identity list -i admin -n basic-sample-network -p hlfv1 -s secret ```
    - issue to bob ``` composer identity issue -p hlfv1 -n basic-sample-network -i admin -u newUser1 -x false -s adminpw -a "resource:org.acme.sample.SampleParticipant#bob" ```
    - record the output userid and secret for later. 
    - list current IDs again ``` composer identity list -i admin -n basic-sample-network -p hlfv1 -s secret ``` (looking for ID status)
    - connect to the business network using the above userId and secret ``` composer network list -n basic-sample-network -p hlfv1 -i newUser1 -s myProvidedSecret ```
    - list current IDs again ``` composer identity list -i admin -n basic-sample-network -p hlfv1 -s secret ``` (looking for ID status changes)
    - Obtain the long uuid for newUser1
    - revoke the id ``` composer identity revoke -p hlfv1 -n basic-sample-network -i admin -s adsf -u theLongUUID ```
    - list current IDs again ``` composer identity list -i PeerAdmin -n basic-sample-network -p hlfv1 -s secret ``` (looking for ID status changes)


