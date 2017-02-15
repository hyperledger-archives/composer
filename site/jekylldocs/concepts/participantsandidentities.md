---
layout: default
title: Fabric Composer - Participants and Identities
category: concepts
sidebar: sidebars/concepts.md
excerpt: Business Network
---

# Participants and Identities

---

A `Participant` is an actor in a business network. A participant might be an
individual or an organization. A participant can create assets, and also exchange
assets with other participants. A participant works with assets by submitting transactions.

A participant has a set of `Identity` documents that can be validated to prove the
identity of that participant. For example, an individual may have one or more of
the following identity documents that prove who they are:

* Passport
* Driving license
* Fingerprints
* Retina scan
* SSL certificate

In order for a new participant to join a business network, a new instance of that
participant must be created in the business network. An identity document must
then be `Issued` to that participant. The new participant can then use that identity
document to interact with the business network.

Identity documents usually expire after a set period of time. Identity documents may
also be lost or stolen. If the identity document expires, or if it needs to be
replaced, then it must be `Revoked` so it can no longer be used to interact with
the business network.

These actions are performed by an existing participant in the business network,
for example a regulatory body, or a participant in the same organization who has
been trusted to manage participants/identities in that organization.

In the IBM Blockchain Framework, the structure of a participant is modelled in a
model file. This structure may include various information about the participant,
for example the participants name, address, e-mail address, date of birth, etc.
New instances of that modelled participant can then be created and stored in a
participant registry.

The IBM Blockchain Framework uses Hyperledger Fabric enrollment certificates as
identity documents. APIs and command line applications are provided to issue and
revoke enrollment certificates to participants that are stored in a participant
registry. When transactions are submitted using those enrollment certificates, the
participant is identified and is made available for the transaction processor
function to use.

## Related Concepts

[Business Network](./businessnetwork.md)

## Related Tasks

[Create a Business Domain Model](../tasks/model-define.md)  
[Add a Participant](../tasks/participant-add.md)  
[Issue an Identity to a Participant](../tasks/identity-issue.md)  
[Revoke an Identity from a Participant](../tasks/identity-revoke.md)

## Related Reference

[Participant add command](../tasks/participant-add.md)  
[Identity issue command](../tasks/identity-issue.md)  
[Identity revoke command](../tasks/identity-revoke.md)  
