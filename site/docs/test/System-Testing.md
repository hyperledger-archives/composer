---
layout: default
markdown: 1
title: Concerto - System Testing Information
sidebar: sidebars/learning.md
---
## System Testing

## Overview

The automated build runs a set of system tests that stand up both Concerto and an instance of Hyperledger Fabric to confirm that the system works as a whole. These are end-to-end tests and should be not be confused with the unit tests that are also run in the build.

## Local set up

In order to run the system tests locally, you must follow these steps:

1. Ensure you have Node.js, Docker and Docker Compose installed locally:

  [Node.js](https://nodejs.org/en/) - v4.x  
  [Docker](https://www.docker.com/products/overview)  
  [Docker Compose](https://docs.docker.com/compose/install/) - only required on Linux

1. Fork and clone the Concerto repository:

  `git clone git@github.ibm.com:USERNAME/Concerto.git`

2. Change into the cloned Concerto repository:

  `cd Concerto`

3. Clone the Hyperledger Fabric source, which is configured as a Git submodule:

  `git submodule init`  
  `git submodule update`

4. Pull the appropriate Hyperledger Fabric base image ([hyperledger/fabric-baseimage](https://hub.docker.com/r/hyperledger/fabric-baseimage/tags/)), and tag it as the latest:

  `docker pull hyperledger/fabric-baseimage:x86_64-0.1.0`  
  `docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest`

5. Install all node.js and Go dependencies:

  `./scripts/install-deps.sh`

6. Run all of the unit and system tests:

  `./scripts/run-all-tests.sh`

7. Verify that the system tests pass - you should see something similar to:

  ```
  hfc
Waiting 1 second for vp0 to start ...
Waiting 1 second for vp0 to start ...
Waiting 1 second for vp0 to start ...
Waiting 1 second for vp0 to start ...
chaincodeID 3fa00864c6c2ab4e7cfed03f5b704ba6258af1e7e7ffb6b3b1e3599045743652
    ? should deploy the chaincode (33789ms)
EventQueryComplete { result: <Buffer 35 30> }
    ? should query the chaincode
EventInvokeComplete { result: 'Tx 9a4361f5-140b-4425-91c8-9ed75a84c2f7 complete' }
    ? should invoke the chaincode (5015ms)


  3 passing (43s)
  ```
  
