---
layout: default
title: Participants and identities
category: concepts
section: managing
sidebar: sidebars/managing.md
excerpt: Participants and identities are core concepts of Hyperledger Composer. A participant is a member of business networks and might represent individuals or organizations. Participants have identity documents which can be validated to prove their identity. For more information, see [**participants and identities**](../managing/participantsandidentities.html).
index-order: 1
---

# Participants and Identities

---

A `Participant` is an actor in a business network. A participant might be an individual or an organization. A participant can create assets, and also exchange assets with other participants. A participant works with assets by submitting transactions.


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

In {{site.data.conrefs.composer_full}}, the structure of a participant is modelled in a
model file. This structure may include various information about the participant,
for example the participants name, address, e-mail address, date of birth, etc.
New instances of that modelled participant can then be created and stored in a
participant registry.

{{site.data.conrefs.composer_full}} uses Hyperledger Fabric enrollment certificates as
identity documents. APIs and command line applications are provided to issue and
revoke enrollment certificates to participants that are stored in a participant
registry. When transactions are submitted using those enrollment certificates, the
participant is identified and is made available for the transaction processor
function to use.

## Related Concepts

[Business Network](../introduction/businessnetwork.html)

## Related Tasks

[Create a Business Domain Model](../business-network/model-define.html)  
[Add a Participant](../managing/participant-add.html)  
[Issue an Identity to a Participant](../managing/identity-issue.html)  
[Revoke an Identity from a Participant](../managing/identity-revoke.html)

## Related Reference

[Participant add command](../reference/participant-add.html)  
[Identity issue command](../reference/identity-issue.html)  
[Identity revoke command](../reference/identity-revoke.html)  
