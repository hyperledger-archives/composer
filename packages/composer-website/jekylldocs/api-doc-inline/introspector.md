---
layout: default
title: Introspector (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1227
---
# Introspector

<p>
Provides access to the structure of transactions, assets and participants.
</p>

### Details
- **Extends** 
- **Module** common

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `void` | [constructor](#constructor-modelmanager) | Create the Introspector.  |
| `ClassDeclaration` | [getClassDeclaration](#getclassdeclaration-string) | Returns the class declaration with the given fully qualified name.  |
| `ClassDeclaration[]` | [getClassDeclarations](#getclassdeclarations) | Returns all the class declarations for the business network.  |


## Method Details


## new Introspector() 




Create the Introspector.
<p>
<strong>Note: Only to be called by framework code. Applications should
retrieve instances from {@link BusinessNetworkDefinition}</strong>
</p>







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**modelManager**|`ModelManager`|true|the ModelManager that backs this Introspector|




## getClassDeclarations() 




Returns all the class declarations for the business network.






### Returns
`` - the array of class declarations





### Parameters


No parameters



## getClassDeclaration(string) 




Returns the class declaration with the given fully qualified name.
Throws an error if the class declaration does not exist.






### Returns
`ClassDeclaration` - the class declaration





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**fullyQualifiedTypeName**|`String`|true|the fully qualified name of the type|


 
