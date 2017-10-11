---
layout: default
title: Relationship (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1233
---
# Relationship

A Relationship is a typed pointer to an instance. I.e the relationship
with namespace = 'org.acme', type = 'Vehicle' and id = 'ABC' creates
a pointer that points at an instance of org.acme.Vehicle with the id
ABC.

### Details
- **Extends** Identifiable
- **Module** common

### See also
- See [Identifiable](identifiable)


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `Relationship` | [fromURI](#fromuri-modelmanager-string-string-string) | Contructs a Relationship instance from a URI representation (created using toURI).  |
| `boolean` | [isRelationship](#isrelationship) | Determine if this identifiable is a relationship.  |
| `String` | [toString](#tostring) | Returns the string representation of this class  |


## Method Details


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



## fromURI(modelmanager,string,string,string) 




Contructs a Relationship instance from a URI representation (created using toURI).






### Returns
`Relationship` - the relationship





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**modelManager**|`ModelManager`|true|the model manager to bind the relationship to|
|**uriAsString**|`String`|true|the URI as a string, generated using Identifiable.toURI()|
|**defaultNamespace**|`String`|true|default namespace to use for backwards compatability (optional)|
|**defaultType**|`String`|true|default type to use for backwards compatability (optional)|


 
