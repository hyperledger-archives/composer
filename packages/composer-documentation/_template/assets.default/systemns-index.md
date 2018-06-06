---
layout: default
title: System Namespace Reference
section: sns
sidebar: sidebars/accordion-toc0.md
excerpt: System Namespace
index-order: 1500
---

# The {{site.data.conrefs.composer_full}} system namespace

The {{site.data.conrefs.composer_full}} system namespace is the base definition of all business network class definitions. All asset, participant, and transaction definitions extend those defined here.

## Summary

In the [summary section](./01_summary.html) there is a full list of all {{site.data.conrefs.composer}} system namespace class definitions, along with their associated namespaces, names, and descriptions. For more information on an individual class definition, check the appropriate page.

## Assets

The system namespace assets are:

- Asset
- Registry
- AssetRegistry
- ParticipantRegistry
- TransactionRegistry
- Network
- HistorianRecord
- Identity

## Participants

The system namespace participants are:

- Participant
- NetworkAdmin

## Transactions

The system namespace transactions are:

- Transaction
- RegistryTransaction
- AssetTransaction
- ParticipantTransaction
- AddAsset
- UpdateAsset
- RemoveAsset
- AddParticipant
- UpdateParticipant
- RemoveParticipant
- IssueIdentity
- BindIdentity
- ActivateCurrentIdentity
- RevokeIdentity
- StartBusinessNetwork
- ResetBusinessNetwork
- SetLogLevel

## Events

The system namespace events are:

- Event

## Enumerations

The system namespace enumerations are:

- IdentityState