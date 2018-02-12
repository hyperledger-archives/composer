---
layout: default
title: Tuning
section: performance
sidebar: sidebars/accordion-toc0.md
excerpt: "{{site.data.conrefs.composer_full}} Tuning"
index-order: 1402
---
# {{site.data.conrefs.composer_full}} Tuning
## Business Network Considerations
To obtain the maximum transaction rate for a business network, review the following areas:

- Transaction Processor Function (TPF) design: a single TPF can perform a wide range of operations and interactions with the underlying blockchain platform. Care should be taken when using the available Composer APIs and use recommended practice for JavaScript performance. Points to note are:

  - Reduce the number of interactions with asset registries, for instance, when updating assets perform an `updateAll()` operation whenever possible instead of updating each asset in turn.
  - Favour the use of factories over serialisation.
  - Only use queries listed in the `queries.qry` file. To improve performance {{site.data.conrefs.composer_full}} creates a CouchDB index for all queries listed in the `queries.qry` file. Without indexing, the CouchDB search phase takes longer; introducing latency in all rich query operations and globally impacting CouchDB performance. 
  - Log Level: when a business network is deployed, it will be in debug mode unless otherwise specified. Debug mode writes large amounts of data to log files, slowing the operation of the business network. During standard operation, the debug mode for the business network should be set to `Error` or `Info`.

## {{site.data.conrefs.hlf_full}} Considerations
Blockchain platform configuration has a significant impact on the performance of a business network. Within our reports we repeat the same performance tests against multiple configurations to observe the impact of different {{site.data.conrefs.hlf_full}} configurations. Note that within all tests the possible tuning parameters for the underlying blockchain platform are unchanged.

### {{site.data.conrefs.hlf_full}} Configuration
A {{site.data.conrefs.hlf_full}} configuration to consists of:

 - Organizations - a participating entity within a {{site.data.conrefs.hlf_full}} network that may or may not maintain peers.
 - Channels - an independent partition that contains a separate ledger to which which member peers may access.
 - Peers - commits transactions, maintains the ledger and state (may or may not be an endorsing peer)
 - Orderer - approves the inclusion of transaction blocks into the ledger and communicates with peer nodes

When considering the impact of configuration upon performance, it is necessary to understand the underlying transaction processes that occur. A single {{site.data.conrefs.hlf_full}} transaction consists of eight stages:

 - Transaction proposal - a client submits a transaction proposal to endorsing peers.
 - Proposal execution - each endorsing peer executes the proposed transaction, capturing read/write sets, but not updating the ledger.
 - Proposal response - all read/write sets are signed and returned to the client.
 - Transaction ordering - client submits the responses as a transaction to be ordered based upon a chosen algorithm.
 - Transaction delivery - ordering collects transactions into blocks for distribution to committing peers.
 - Transaction validation - all committing peers validate against the endorsement policy and ensure that the read/write sets are still valid agains the current world state.
 - Transaction application - committing peers update the ledger with the block and apply all validated transactions to the world state.
 - Transaction notification - committing peers notify registered listeners.
 
 The number of peers involved in a transaction has an impact on the performance of a deployed business network. More peers will result in a greater number of read/write sets that must be generated, moved through the system, validated, and conditionally applied.
 
 The available bandwidth for network I/O has an impact on the speed at which the read/write sets may be distributed through the system, this impact may be worsened by geographic distribution of client applications and peers.

### Optimizing {{site.data.conrefs.hlf_full}} for your business network
Optimal {{site.data.conrefs.hlf_full}} settings vary depending on the business network deployed to the network. When deployed, a business network exists as chaincode, which has its own memory requirements, CPU computation requirements, policies including the number of endorsers and signatures for various transactions.

Knowing the transaction sizes and the expected transaction rate in the network can assist in tuning the network by modifying the [`configtx.yaml`](https://github.com/hyperledger/fabric/blob/release/sampleconfig/configtx.yaml) file. Note that if you change the `configtx.yaml`, the crypto-material must be regenerated before deploying the {{site.data.conrefs.hlf_full}} network, or update the existing network using the `configtxlator`.

The orderer can be optimized for business network performance by changing the `BatchTimeout` and `BatchSize` variables. `BatchTimeout` defines how long to wait before creating a batch, and `BatchSize` defines the number of messages batched into one block, taking into account the maximum permissible message count, absolute maximum bytes and preferred maximum bytes for each batch. For example, given a `maxmessagecount` of 500, a `BatchTimeout` of 10s, if each transaction was 1MB, the orderer would deliver blocks with one transaction each, because the transaction exceeds the `PreferredMaxBytes` size of 512K.

In tuning the network, it is important to understand where any potential bottlenecks for the deployed chaincode may reside: it may be CPU, network, or disc bound.

 - CPU binding occurs in the peers and ordering service. Due to the CPU intensive nature of validation and ordering, if inbound transactions are small, using a larger `maxmessagecount` can optimize the ordering service. Bottlenecks in the committing peers may still exist due to the need to commit larger numbers of transactions to the ledger.
 - Network binding occurs when the bandwidth of messages flowing between components of the {{site.data.conrefs.hlf_full}} system is saturated. Colocation of components can reduce network latency. The message size is also relevant when considering network latency.
 - Disc binding may occur at the update stage of the transaction cycle. It is here that `batchsize` is important: each block header can be 2KB - 4KB, writing fewer blocks will cumulatively save a large amount of data. When considering the transactions within each block, we must consider the endorsement policy and the working data within each transaction. Since endorser signatures are included in the writing of each transaction within each block, the endorsement policy in place will also impact the resulting disc I/O. Updating large blocks of information is clearly disc I/O intensive and can imply an inefficient business network asset definition.

## Transactions Per Block
Multiple factors affect the size of each {{site.data.conrefs.hlf_full}} transaction, including:

 - The endorsement policies used in the channels. This affects the number of endorser signatures attached to each transaction.
 - The size of each signature attached by each requested endorser peer and by the orderer that delivers the transaction block (an estimated size for one signature with identity and root cert is 1KB).
 - The average size of data stored for each transaction of the specific chaincode, which will range depending what is processed by the deployed chaincode and can vary from a few KB updwards.
 - The batch size; a larger batchsize for the orderer service would mean fewer blocks, which disc I/O overhead since a simple block header could be 2KB - 4KB.
## Determining Transactions Per Block
The easiest way to determine the number of transactions per block within {{site.data.conrefs.hlf_full}} is through use of the [Hyperledger Explorer](https://github.com/hyperledger/blockchain-explorer).
The Hyperledger Explorer, once connected, provides a UI to view the artifacts within the underlying blockchain network; in particular it gives easy access to the blocks, and the transactions within them.


<img src="./images/BlockchainExplorer.png" width="100%">
