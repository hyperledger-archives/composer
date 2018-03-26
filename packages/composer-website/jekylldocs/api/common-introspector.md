---
layout: default
title: Introspector (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1235
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# Introspector

Provides access to the structure of transactions, assets and participants.

### Details

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [constructor](#constructor) | `void` | Create the Introspector  |
| [getClassDeclaration](#getclassdeclaration) | `ClassDeclaration` | Returns the class declaration with the given fully qualified name  |
| [getClassDeclarations](#getclassdeclarations) | `ClassDeclaration[]` | Returns all the class declarations for the business network  |





# Method Details


## new Introspector()


Create the Introspector. <p> <strong>Note: Only to be called by framework code. Applications should retrieve instances from {@link BusinessNetworkDefinition}</strong> </p>







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**modelManager**| ModelManager |*Yes*|the ModelManager that backs this Introspector|










## getClassDeclarations
_ClassDeclaration[] getClassDeclarations(  )_


Returns all the class declarations for the business network.





### Returns
**{@link ClassDeclaration[]}** - the array of class declarations




### See also






### Parameters

No parameters









## getClassDeclaration
_ClassDeclaration getClassDeclaration( String fullyqualifiedtypename )_


Returns the class declaration with the given fully qualified name. Throws an error if the class declaration does not exist.





### Returns
**{@link common-ClassDeclaration}** - the class declaration




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**fullyQualifiedTypeName**| String |*Yes*|the fully qualified name of the type|








 

##Inherited methods

 