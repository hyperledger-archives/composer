---
layout: default
title: API Class Index
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1205
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# Index of Classes

- [Common API](#common-api)
- [Client API](#client-api)
- [Admin API](#admin-api)
- [Runtime API](#runtime-api)

## Common API
| Name  | Description |
| :---- | :----------- |
| [AssetDeclaration](common-assetdeclaration.html) | AssetDeclaration defines the schema (aka model or class) for an Asset |
| [BusinessNetworkCardStore](common-businessnetworkcardstore.html) | Manages persistence of business network cards |
| [BusinessNetworkDefinition](common-businessnetworkdefinition.html) | A BusinessNetworkDefinition defines a set of Participants that exchange Assets by sending Transactions |
| [BusinessNetworkMetadata](common-businessnetworkmetadata.html) | Defines the metadata for a BusinessNeworkDefinition |
| [ClassDeclaration](common-classdeclaration.html) | ClassDeclaration defines the structure (model/schema) of composite data |
| [Concept](common-concept.html) | Resource is an instance that has a type |
| [ConceptDeclaration](common-conceptdeclaration.html) | ConceptDeclaration defines the schema (aka model or class) for an Concept |
| [EnumDeclaration](common-enumdeclaration.html) | EnumDeclaration defines an enumeration of static values |
| [EnumValueDeclaration](common-enumvaluedeclaration.html) | Class representing a value from a set of enumerated values |
| [EventDeclaration](common-eventdeclaration.html) | Class representing the definition of an Event |
| [Factory](common-factory.html) | Use the Factory to create instances of Resource: transactions, participants and assets |
| [FileSystemCardStore](common-filesystemcardstore.html) | Manages persistence of business network cards to a Node file system implementation |
| [FunctionDeclaration](common-functiondeclaration.html) | FunctionDeclaration defines a function that has been defined in a model file |
| [IdCard](common-idcard.html) | Business Network Card |
| [Identifiable](common-identifiable.html) | Identifiable is an entity with a namespace, type and an identifier |
| [Introspector](common-introspector.html) | Provides access to the structure of transactions, assets and participants |
| [MemoryCardStore](common-memorycardstore.html) | Transient in-memory storage of business network cards, useful for testing |
| [ModelFile](common-modelfile.html) | Class representing a Model File |
| [ModelManager](common-modelmanager.html) | Manages the Composer model files |
| [ParticipantDeclaration](common-participantdeclaration.html) | Class representing the definition of a Participant |
| [Property](common-property.html) | Property representing an attribute of a class declaration, either a Field or a Relationship |
| [Relationship](common-relationship.html) | A Relationship is a typed pointer to an instance |
| [RelationshipDeclaration](common-relationshipdeclaration.html) | Class representing a relationship between model elements |
| [Resource](common-resource.html) | Resource is an instance that has a type |
| [Serializer](common-serializer.html) | Serialize Resources instances to/from various formats for long-term storage (e |
| [TransactionDeclaration](common-transactiondeclaration.html) | Class representing the definition of an Transaction |
| [Typed](common-typed.html) | Object is an instance with a namespace and a type |
| [ValidatedConcept](common-validatedconcept.html) | Resource is an instance that has a type |
| [ValidatedResource](common-validatedresource.html) | ValidatedResource is a Resource that can validate that property changes (or the whole instance) do not violate the structure of the type information associated with the instance |

## Client API
| Name  | Description |
| :---- | :----------- |
|[AssetRegistry](client-assetregistry) | The AssetRegistry is used to manage a set of assets stored on the Blockchain |
|[BusinessNetworkConnection](client-businessnetworkconnection) | Use this class to connect to and then interact with a deployed BusinessNetworkDefinition |
|[Historian](client-historian) | The Historian records the history of actions taken using Composer |
|[IdentityRegistry](client-identityregistry) | The IdentityRegistry is used to store a set of identities on the blockchain |
|[ParticipantRegistry](client-participantregistry) | The ParticipantRegistry is used to manage a set of participants stored on the blockchain |
|[Query](client-query) | The Query class represents a built query |
|[Registry](client-registry) | Class representing an Abstract Registry |
|[TransactionRegistry](client-transactionregistry) | The TransactionRegistry is used to store a set of transactions on the blockchain |

## Admin API
| Name  | Description |
| :---- | :----------- |
| [AdminConnection](admin-adminconnection)| This class creates an administration connection to a Hyperledger Composer runtime |

## Runtime API
| Name  | Description |
| :---- | :----------- |
| [Api](runtime-api) | A class that contains the root of the transaction processor API |
| [AssetRegistry](runtime-assetregistry) | The AssetRegistry is used to manage a set of assets stored on the Blockchain |
| [Factory](runtime-factory) | Use the Factory to create instances of Resource: transactions, participants and assets |
| [ParticipantRegistry](runtime-participantregistry) | The ParticipantRegistry is used to manage a set of participants stored on the blockchain |
| [Query](runtime-query) | The Query class represents a built query |
| [Serializer](runtime-serializer) | Do not attempt to create an instance of this class |


