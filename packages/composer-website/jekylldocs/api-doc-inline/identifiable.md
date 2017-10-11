---
layout: default
title: Identifiable (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1224
---
# Identifiable

Identifiable is an entity with a namespace, type and an identifier.

This class is abstract.

### Details
- **Extends** 
- **Module** common

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `string` | [getFullyQualifiedIdentifier](#getfullyqualifiedidentifier) | Get the fully qualified identifier of this instance.  |
| `string` | [getIdentifier](#getidentifier) | Get the identifier of this instance  |
| `boolean` | [isRelationship](#isrelationship) | Determine if this identifiable is a relationship.  |
| `boolean` | [isResource](#isresource) | Determine if this identifiable is a resource.  |
| `void` | [setIdentifier](#setidentifier-string) | Set the identifier of this instance  |
| `String` | [toString](#tostring) | Returns the string representation of this class  |
| `String` | [toURI](#touri) | Returns a URI representation of a reference to this identifiable  |


## Method Details


## getIdentifier() 




Get the identifier of this instance






### Returns
`string` - The identifier for this object





### Parameters


No parameters



## setIdentifier(string) 




Set the identifier of this instance







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|the new identifier for this object|




## getFullyQualifiedIdentifier() 




Get the fully qualified identifier of this instance.
(namespace '.' type '#' identifier).






### Returns
`string` - the fully qualified identifier of this instance





### Parameters


No parameters



## toString() 




Returns the string representation of this class






### Returns
`String` - the string representation of the class





### Parameters


No parameters



## isRelationship() 




Determine if this identifiable is a relationship.






### Returns
`boolean` - True if this identifiable is a relationship,
false if not.





### Parameters


No parameters



## isResource() 




Determine if this identifiable is a resource.






### Returns
`boolean` - True if this identifiable is a resource,
false if not.





### Parameters


No parameters



## toURI() 




Returns a URI representation of a reference to this identifiable






### Returns
`String` - the URI for the identifiable





### Parameters


No parameters

 
