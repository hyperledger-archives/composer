---
layout: default
title: ModelFile (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1237
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# ModelFile

Class representing a Model File. A Model File contains a single namespace
and a set of model elements: assets, transactions etc.

### Details

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [getAllDeclarations](#getalldeclarations) | `ClassDeclaration[]` | Get all declarations in this ModelFile  |
| [getAssetDeclaration](#getassetdeclaration) | `AssetDeclaration` | Get the AssetDeclarations defined in this ModelFile or null  |
| [getAssetDeclarations](#getassetdeclarations) | `AssetDeclaration[]` | Get the AssetDeclarations defined in this ModelFile  |
| [getConceptDeclarations](#getconceptdeclarations) | `ConceptDeclaration[]` | Get the ConceptDeclarations defined in this ModelFile  |
| [getDeclarations](#getdeclarations) | `ClassDeclaration[]` | Get the instances of a given type in this ModelFile  |
| [getDefinitions](#getdefinitions) | `string` | Get the definitions for this model  |
| [getEnumDeclarations](#getenumdeclarations) | `EnumDeclaration[]` | Get the EnumDeclarations defined in this ModelFile  |
| [getEventDeclaration](#geteventdeclaration) | `EventDeclaration` | Get the EventDeclaration defined in this ModelFile or null  |
| [getEventDeclarations](#geteventdeclarations) | `EventDeclaration[]` | Get the EventDeclarations defined in this ModelFile  |
| [getImports](#getimports) | `string[]` | Returns the types that have been imported into this ModelFile  |
| [getLocalType](#getlocaltype) | `ClassDeclaration` | Returns the type with the specified name or null  |
| [getModelManager](#getmodelmanager) | `ModelManager` | Returns the ModelManager associated with this ModelFile  |
| [getName](#getname) | `string` | Get the filename for this model file  |
| [getNamespace](#getnamespace) | `string` | Get the Namespace for this model file  |
| [getParticipantDeclaration](#getparticipantdeclaration) | `ParticipantDeclaration` | Get the ParticipantDeclaration defined in this ModelFile or null  |
| [getParticipantDeclarations](#getparticipantdeclarations) | `ParticipantDeclaration[]` | Get the ParticipantDeclarations defined in this ModelFile  |
| [getTransactionDeclaration](#gettransactiondeclaration) | `TransactionDeclaration` | Get the TransactionDeclaration defined in this ModelFile or null  |
| [getTransactionDeclarations](#gettransactiondeclarations) | `TransactionDeclaration[]` | Get the TransactionDeclarations defined in this ModelFile  |
| [isDefined](#isdefined) | `boolean` | Returns true if the type is defined in the model file  |
| [isSystemModelFile](#issystemmodelfile) | `boolean` | Returns true if this ModelFile is a system model  |





# Method Details


## getModelManager
_ModelManager getModelManager(  )_


Returns the ModelManager associated with this ModelFile





### Returns
**{@link common-ModelManager}** - The ModelManager for this ModelFile




### See also






### Parameters

No parameters









## getImports
_string[] getImports(  )_


Returns the types that have been imported into this ModelFile.





### Returns
**{@link string[]}** - The array of imports for this ModelFile




### See also






### Parameters

No parameters









## isDefined
_boolean isDefined( string type )_


Returns true if the type is defined in the model file





### Returns
**{@link boolean}** - true if the type (asset or transaction) is defined




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**type**| string |*Yes*|the name of the type|










## getLocalType
_ClassDeclaration getLocalType( string type )_


Returns the type with the specified name or null





### Returns
**{@link common-ClassDeclaration}** - the ClassDeclaration, or null if the type does not exist




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**type**| string |*Yes*|the short OR FQN name of the type|










## getAssetDeclaration
_AssetDeclaration getAssetDeclaration( string name )_


Get the AssetDeclarations defined in this ModelFile or null





### Returns
**{@link common-AssetDeclaration}** - the AssetDeclaration with the given short name




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**| string |*Yes*|the name of the type|










## getTransactionDeclaration
_TransactionDeclaration getTransactionDeclaration( string name )_


Get the TransactionDeclaration defined in this ModelFile or null





### Returns
**{@link common-TransactionDeclaration}** - the TransactionDeclaration with the given short name




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**| string |*Yes*|the name of the type|










## getEventDeclaration
_EventDeclaration getEventDeclaration( string name )_


Get the EventDeclaration defined in this ModelFile or null





### Returns
**{@link common-EventDeclaration}** - the EventDeclaration with the given short name




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**| string |*Yes*|the name of the type|










## getParticipantDeclaration
_ParticipantDeclaration getParticipantDeclaration( string name )_


Get the ParticipantDeclaration defined in this ModelFile or null





### Returns
**{@link common-ParticipantDeclaration}** - the ParticipantDeclaration with the given short name




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**| string |*Yes*|the name of the type|










## getNamespace
_string getNamespace(  )_


Get the Namespace for this model file.





### Returns
**{@link string}** - The Namespace for this model file




### See also






### Parameters

No parameters









## getName
_string getName(  )_


Get the filename for this model file. Note that this may be null.





### Returns
**{@link string}** - The filename for this model file




### See also






### Parameters

No parameters









## getAssetDeclarations
_AssetDeclaration[] getAssetDeclarations( Boolean includesystemtype )_


Get the AssetDeclarations defined in this ModelFile





### Returns
**{@link AssetDeclaration[]}** - the AssetDeclarations defined in the model file




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystemType**| Boolean |*Yes*|Include the decalarations of system type in returned data|










## getTransactionDeclarations
_TransactionDeclaration[] getTransactionDeclarations( Boolean includesystemtype )_


Get the TransactionDeclarations defined in this ModelFile





### Returns
**{@link TransactionDeclaration[]}** - the TransactionDeclarations defined in the model file




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystemType**| Boolean |*Yes*|Include the decalarations of system type in returned data|










## getEventDeclarations
_EventDeclaration[] getEventDeclarations( Boolean includesystemtype )_


Get the EventDeclarations defined in this ModelFile





### Returns
**{@link EventDeclaration[]}** - the EventDeclarations defined in the model file




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystemType**| Boolean |*Yes*|Include the decalarations of system type in returned data|










## getParticipantDeclarations
_ParticipantDeclaration[] getParticipantDeclarations( Boolean includesystemtype )_


Get the ParticipantDeclarations defined in this ModelFile





### Returns
**{@link ParticipantDeclaration[]}** - the ParticipantDeclaration defined in the model file




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystemType**| Boolean |*Yes*|Include the decalarations of system type in returned data|










## getConceptDeclarations
_ConceptDeclaration[] getConceptDeclarations( Boolean includesystemtype )_


Get the ConceptDeclarations defined in this ModelFile





### Returns
**{@link ConceptDeclaration[]}** - the ParticipantDeclaration defined in the model file




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystemType**| Boolean |*Yes*|Include the decalarations of system type in returned data|










## getEnumDeclarations
_EnumDeclaration[] getEnumDeclarations( Boolean includesystemtype )_


Get the EnumDeclarations defined in this ModelFile





### Returns
**{@link EnumDeclaration[]}** - the EnumDeclaration defined in the model file




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystemType**| Boolean |*Yes*|Include the decalarations of system type in returned data|










## getDeclarations
_ClassDeclaration[] getDeclarations( Function type, Boolean includesystemtype )_


Get the instances of a given type in this ModelFile





### Returns
**{@link ClassDeclaration[]}** - the ClassDeclaration defined in the model file




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**type**| Function |*Yes*|the type of the declaration|
|**includeSystemType**| Boolean |*Yes*|Include the decalarations of system type in returned data|










## getAllDeclarations
_ClassDeclaration[] getAllDeclarations(  )_


Get all declarations in this ModelFile





### Returns
**{@link ClassDeclaration[]}** - the ClassDeclarations defined in the model file




### See also






### Parameters

No parameters









## getDefinitions
_string getDefinitions(  )_


Get the definitions for this model.





### Returns
**{@link string}** - The definitions for this model.




### See also






### Parameters

No parameters









## isSystemModelFile
_boolean isSystemModelFile(  )_


Returns true if this ModelFile is a system model





### Returns
**{@link boolean}** - true of this ModelFile is a system model




### See also






### Parameters

No parameters







 

##Inherited methods

 