---
layout: default
title: ModelManager (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1238
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# ModelManager

Manages the Composer model files.


The structure of {@link Resource}s (Assets, Transactions, Participants) is modelled
in a set of Composer files. The contents of these files are managed
by the {@link ModelManager}. Each Composer file has a single namespace and contains
a set of asset, transaction and participant type definitions.


Composer applications load their Composer files and then call the {@link ModelManager#addModelFile addModelFile}
method to register the Composer file(s) with the ModelManager. The ModelManager
parses the text of the Composer file and will make all defined types available
to other Composer services, such as the {@link Serializer} (to convert instances to/from JSON)
and {@link Factory} (to create instances).

### Details

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [addModelFile](#addmodelfile) | `Object` | Adds a Composer file (as a string) to the ModelManager  |
| [addModelFiles](#addmodelfiles) | `Object[]` | Add a set of Composer files to the model manager  |
| [clearModelFiles](#clearmodelfiles) | `void` | Remove all registered Composer files  |
| [deleteModelFile](#deletemodelfile) | `void` | Remove the Composer file for a given namespace  |
| [getAssetDeclarations](#getassetdeclarations) | `AssetDeclaration[]` | Get the AssetDeclarations defined in this model manager  |
| [getConceptDeclarations](#getconceptdeclarations) | `ConceptDeclaration[]` | Get the Concepts defined in this model manager  |
| [getEnumDeclarations](#getenumdeclarations) | `EnumDeclaration[]` | Get the EnumDeclarations defined in this model manager  |
| [getEventDeclarations](#geteventdeclarations) | `EventDeclaration[]` | Get the EventDeclarations defined in this model manager  |
| [getNamespaces](#getnamespaces) | `string[]` | Get the namespaces registered with the ModelManager  |
| [getParticipantDeclarations](#getparticipantdeclarations) | `ParticipantDeclaration[]` | Get the ParticipantDeclarations defined in this model manager  |
| [getSystemTypes](#getsystemtypes) | `ClassDeclaration[]` | Get all class declarations from system namespaces  |
| [getTransactionDeclarations](#gettransactiondeclarations) | `TransactionDeclaration[]` | Get the TransactionDeclarations defined in this model manager  |
| [updateModelFile](#updatemodelfile) | `Object` | Updates a Composer file (as a string) on the ModelManager  |
| [validateModelFile](#validatemodelfile) | `void` | Validates a Composer file (as a string) to the ModelManager  |





# Method Details


## validateModelFile
_ validateModelFile( string modelfile, string filename )_


Validates a Composer file (as a string) to the ModelManager. Composer files have a single namespace.
Note that if there are dependencies between multiple files the files must be added in dependency order, or the addModelFiles method can be used to add a set of files irrespective of dependencies.







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**modelFile**| string |*Yes*|The Composer file as a string|
|**fileName**| string |*Yes*|an optional file name to associate with the model file|










## addModelFile
_Object addModelFile( string modelfile, string filename )_


Adds a Composer file (as a string) to the ModelManager. Composer files have a single namespace. If a Composer file with the same namespace has already been added to the ModelManager then it will be replaced. Note that if there are dependencies between multiple files the files must be added in dependency order, or the addModelFiles method can be used to add a set of files irrespective of dependencies.





### Returns
**{@link Object}** - The newly added model file (internal).




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**modelFile**| string |*Yes*|The Composer file as a string|
|**fileName**| string |*Yes*|an optional file name to associate with the model file|










## updateModelFile
_Object updateModelFile( string modelfile, string filename )_


Updates a Composer file (as a string) on the ModelManager. Composer files have a single namespace. If a Composer file with the same namespace has already been added to the ModelManager then it will be replaced.





### Returns
**{@link Object}** - The newly added model file (internal).




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**modelFile**| string |*Yes*|The Composer file as a string|
|**fileName**| string |*Yes*|an optional file name to associate with the model file|










## deleteModelFile
_ deleteModelFile( string namespace )_


Remove the Composer file for a given namespace







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**namespace**| string |*Yes*|The namespace of the model file to delete.|










## addModelFiles
_Object[] addModelFiles(  modelfiles,  filenames )_


Add a set of Composer files to the model manager.





### Returns
**{@link Object[]}** - The newly added model files (internal).




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**modelFiles**|  |*Yes*|An array of Composer files as strings.|
|**fileNames**|  |*Yes*|An optional array of file names to associate with the model files|










## clearModelFiles
_ clearModelFiles(  )_


Remove all registered Composer files







### See also






### Parameters

No parameters









## getNamespaces
_string[] getNamespaces(  )_


Get the namespaces registered with the ModelManager.





### Returns
**{@link string[]}** - namespaces - the namespaces that have been registered.




### See also






### Parameters

No parameters









## getSystemTypes
_ClassDeclaration[] getSystemTypes(  )_


Get all class declarations from system namespaces





### Returns
**{@link ClassDeclaration[]}** - the ClassDeclarations from system namespaces




### See also






### Parameters

No parameters









## getAssetDeclarations
_AssetDeclaration[] getAssetDeclarations( Boolean includesystemtype )_


Get the AssetDeclarations defined in this model manager





### Returns
**{@link AssetDeclaration[]}** - the AssetDeclarations defined in the model manager




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystemType**| Boolean |*Yes*|Include the decalarations of system type in returned data|










## getTransactionDeclarations
_TransactionDeclaration[] getTransactionDeclarations( Boolean includesystemtype )_


Get the TransactionDeclarations defined in this model manager





### Returns
**{@link TransactionDeclaration[]}** - the TransactionDeclarations defined in the model manager




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystemType**| Boolean |*Yes*|Include the decalarations of system type in returned data|










## getEventDeclarations
_EventDeclaration[] getEventDeclarations( Boolean includesystemtype )_


Get the EventDeclarations defined in this model manager





### Returns
**{@link EventDeclaration[]}** - the EventDeclaration defined in the model manager




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystemType**| Boolean |*Yes*|Include the decalarations of system type in returned data|










## getParticipantDeclarations
_ParticipantDeclaration[] getParticipantDeclarations( Boolean includesystemtype )_


Get the ParticipantDeclarations defined in this model manager





### Returns
**{@link ParticipantDeclaration[]}** - the ParticipantDeclaration defined in the model manager




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystemType**| Boolean |*Yes*|Include the decalarations of system type in returned data|










## getEnumDeclarations
_EnumDeclaration[] getEnumDeclarations( Boolean includesystemtype )_


Get the EnumDeclarations defined in this model manager





### Returns
**{@link EnumDeclaration[]}** - the EnumDeclaration defined in the model manager




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystemType**| Boolean |*Yes*|Include the decalarations of system type in returned data|










## getConceptDeclarations
_ConceptDeclaration[] getConceptDeclarations( Boolean includesystemtype )_


Get the Concepts defined in this model manager





### Returns
**{@link ConceptDeclaration[]}** - the ConceptDeclaration defined in the model manager




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**includeSystemType**| Boolean |*Yes*|Include the decalarations of system type in returned data|








 

##Inherited methods

 