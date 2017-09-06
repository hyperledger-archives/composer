---
layout: default
title: Participants and identities
category: concepts
section: managing
sidebar: sidebars/accordion-toc0.md
excerpt: Participants and identities are core concepts of Hyperledger Composer. A participant is a member of business networks and might represent individuals or organizations. Participants have identity documents which can be validated to prove their identity. For more information, see [**participants and identities**](../managing/participantsandidentities.html).
index-order: 801
---

# Participants and identities

## Concepts

A `Participant` is an actor in a business network. A participant might be an individual an organization. A participant can create assets, and also exchange assets with other participants. A participant works with assets by submitting transactions.

A participant has a set of `Identity` documents that can be validated to prove the identity of that participant. For example, an individual may have one or more of the following identity documents that prove who they are:

* Passport
* Driving license
* Fingerprints
* Retina scan
* SSL certificate

In {{site.data.conrefs.composer_full}}, participants are separated from the set of identity documents that they can use to interact with a business network.

In order for a new participant to join a business network, a new instance of that participant must be created in the business network. The participant instance stores all of the required information about that participant, but it does not give that participant access to interact with the business network.

In order to grant the participant access to interact with the business network, an identity document must then be `Issued` to that participant. The new participant can then use that identity document to interact with the business network.

A participant may have an existing identity document that they use to interact with other business networks or other external systems. These identity documents can be reused and `Bound` to that participant. The new participant can then use their existing identity document to interact with the business network.

Identity documents usually expire after a set period of time. Identity documents may also be lost or stolen. If the identity document expires, or if it needs to be replaced, then it must be `Revoked` so it can no longer be used to interact with the business network.

However, revoking an identity document does not remove the information about that participant and any assets that they own. Revoking the identity document simply removes the participants ability to interact with the business network using that identity document. Access to the business network can be restored by issuing the participant with a new identity document.

These participant and identity management actions are performed by an existing participant in the business network, for example a regulatory body, or a participant in the same organization who has been trusted to manage participants/identities in
that organization.

## Participants and identities in {{site.data.conrefs.composer_full}}

In {{site.data.conrefs.composer_full}}, the structure of a participant is modeled in a model file. This structure may include various information about the participant, for example the participants name, address, e-mail address, date of birth, etc. New instances of that modeled participant can then be created and added to a participant registry.

{{site.data.conrefs.composer_full}} requires the use Blockchain identities as the form of identity documents. For example, when deploying a business network to {{site.data.conrefs.hlf_full}}, enrollment certificates are used as the form of identity document. These enrollment certificates are used to cryptographically sign the transactions that are submitted to the deployed business network.

A deployed business network maintains a set of mappings of identities to participants in the `Identity Registry`. When an identity is `Issued` or `Bound` to a participant, a new mapping is added to the identity registry. When that participant uses that identity to submit transactions to the deployed business network, the Composer runtime looks for a valid mapping for that identity in the identity registry. This lookup is done using the public key signature or fingerprint, essentially a hash of the certificate contents that is unique to that certificate and identity.

Once a mapping is found in the identity registry, the participant for that identity is retrieved from that mapping. That participant becomes the `Current Participant`, the participant who submitted the transaction. All access control in {{site.data.conrefs.composer_full}} is based around the current participant. Access control rules that define which participants can perform which operations on which resources all operate on the current participant.

When a participant uses an identity to submit a transaction to the deployed business network for the first time, that identity is `Activated`. This means that the entry in the identity registry is updated to record the fact that the identity was used for the first time. Additional information about the identity, such as the certificate, may also be recorded in the identity registry during activation if it was not available when the identity was issued or bound to the participant.

If and when an identity is revoked, the entry in the identity registry for that identity is updated to change the status to `Revoked`. After an identity is revoked, if a participant tries to use that identity to submit a transaction to the deployed business network, that transaction will be rejected.

## Identities and ID cards in the {{site.data.conrefs.composer_full}} Playground

In the {{site.data.conrefs.composer_full}} Playground, there is a wallet containing locally stored ID cards. An ID card is an access card to a business network, comprising identity data, a connection profile, and the correct certificates for business network access. ID cards can be exported to allow the assignment of identities to others.


## Performing identity management tasks in {{site.data.conrefs.composer_full}}

The {{site.data.conrefs.composer_full}} Node.js client APIs, REST APIs, and command line interfaces can all be used to perform identity management operations. For example, the following identity management operations are available through all {{site.data.conrefs.composer_full}} interfaces:

- Adding a new participant to a participant registry
- Issuing a new identity to a participant
- Binding an existing identity to a participant
- Revoking an identity from a participant
- Listing all identities in a deployed business network

For more information, see the related tasks and reference material at the bottom of this document.

## Related Concepts

[Business Network](../business-network/business-network-index.html)  

## Related Tasks

[Create a Business Network Definition](../business-network/bnd-create.html)  
[Adding participants](participant-add.html)  
[Issuing an new identity to a participant](identity-issue.html)  
[Binding an existing identity to a participant](identity-bind.html)  
[Listing all identities in a business network](identity-list.html)  
[Revoking an identity from a participant](identity-revoke.html)  

## Related Reference

[composer participant add](../reference/composer.participant.add.html)  
[composer identity issue](../reference/composer.identity.issue.html)  
[composer identity bind](../reference/composer.identity.bind.html)  
[composer identity revoke](../reference/composer.identity.revoke.html)  
[composer identity list](../reference/composer.identity.list.html)  
