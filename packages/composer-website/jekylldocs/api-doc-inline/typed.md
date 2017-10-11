---
layout: default
title: Typed (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1239
---
# Typed

Object is an instance with a namespace and a type.

This class is abstract.

### Details
- **Extends** 
- **Module** common

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `void` | [addArrayValue](#addarrayvalue-string-string) | Adds a value to an array property on this Resource  |
| `string` | [getFullyQualifiedType](#getfullyqualifiedtype) | Get the fully-qualified type name of the instance (including namespace).  |
| `string` | [getNamespace](#getnamespace) | Get the namespace of the instance.  |
| `string` | [getType](#gettype) | Get the type of the instance (a short name, not including namespace).  |
| `boolean` | [instanceOf](#instanceof-string) | Check to see if this instance is an instance of the specified fully qualified  |
| `void` | [setPropertyValue](#setpropertyvalue-string-string) | Sets a property on this Resource  |


## Method Details


## getType() 




Get the type of the instance (a short name, not including namespace).






### Returns
`string` - The type of this object





### Parameters


No parameters



## getFullyQualifiedType() 




Get the fully-qualified type name of the instance (including namespace).






### Returns
`string` - The fully-qualified type name of this object





### Parameters


No parameters



## getNamespace() 




Get the namespace of the instance.






### Returns
`string` - The namespace of this object





### Parameters


No parameters



## setPropertyValue(string,string) 




Sets a property on this Resource







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**propName**|`string`|true|the name of the field|
|**value**|`string`|true|the value of the property|




## addArrayValue(string,string) 




Adds a value to an array property on this Resource







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**propName**|`string`|true|the name of the field|
|**value**|`string`|true|the value of the property|




## instanceOf(string) 




Check to see if this instance is an instance of the specified fully qualified
type name.






### Returns
`boolean` - True if this instance is an instance of the specified fully
qualified type name, false otherwise.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**fqt**|`String`|true|The fully qualified type name.|


 
