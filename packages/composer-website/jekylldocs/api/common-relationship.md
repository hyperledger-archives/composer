---
layout: default
title: Relationship (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1241
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# Relationship

A Relationship is a typed pointer to an instance. I.e the relationship
with namespace = 'org.acme', type = 'Vehicle' and id = 'ABC' creates
a pointer that points at an instance of org.acme.Vehicle with the id
ABC.

Applications should retrieve instances from {@link Factory}

### Details

- **Extends** Identifiable

- **Module** common



### See also
- See {@link Identifiable}



## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [fromURI](#fromuri) | `Relationship` | Contructs a Relationship instance from a URI representation (created using toURI)  |
| [isRelationship](#isrelationship) | `boolean` | Determine if this identifiable is a relationship  |
| [toString](#tostring) | `String` | Returns the string representation of this class  |



## Inherited Method Summary
| Supertype | Name | Returns | Description |
| :-------- | :--- | :-------- | :----------- |
| Typed |[getType](#gettype) | `string` | Get the type of the instance (a short name, not including namespace)  |
| Identifiable |[getIdentifier](#getidentifier) | `string` | Get the identifier of this instance  |
| Identifiable |[getFullyQualifiedIdentifier](#getfullyqualifiedidentifier) | `string` | Get the fully qualified identifier of this instance  |
| Identifiable |[isResource](#isresource) | `boolean` | Determine if this identifiable is a resource  |
| Identifiable |[toURI](#touri) | `String` | Returns a URI representation of a reference to this identifiable  |
| Identifiable |[setIdentifier](#setidentifier) | `void` | Set the identifier of this instance  |
| Typed |[getFullyQualifiedType](#getfullyqualifiedtype) | `string` | Get the fully-qualified type name of the instance (including namespace)  |
| Typed |[getNamespace](#getnamespace) | `string` | Get the namespace of the instance  |
| Typed |[setPropertyValue](#setpropertyvalue) | `void` | Sets a property on this Resource  |
| Typed |[addArrayValue](#addarrayvalue) | `void` | Adds a value to an array property on this Resource  |
| Typed |[instanceOf](#instanceof) | `boolean` | Check to see if this instance is an instance of the specified fully qualified type name  |



# Method Details


## toString
_String toString(  )_


Returns the string representation of this class





### Returns
**{@link String}** - the string representation of the class




### See also






### Parameters

No parameters









## isRelationship
_boolean isRelationship(  )_


Determine if this identifiable is a relationship.





### Returns
**{@link boolean}** - True if this identifiable is a relationship, false if not.




### See also






### Parameters

No parameters









## fromURI
_Relationship fromURI( ModelManager modelmanager, String uriasstring, [String defaultnamespace], [String defaulttype] )_


Contructs a Relationship instance from a URI representation (created using toURI).





### Returns
**{@link common-Relationship}** - the relationship




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**modelManager**| ModelManager |*Yes*|the model manager to bind the relationship to|
|**uriAsString**| String |*Yes*|the URI as a string, generated using Identifiable.toURI()|
|**defaultNamespace**| String |*Yes*|default namespace to use for backwards compatability (optional)|
|**defaultType**| String |*Yes*|default type to use for backwards compatability (optional)|








 

##Inherited methods




## getIdentifier
_string getIdentifier(  )_


**Inherited from:**  Identifiable

Get the identifier of this instance





### Returns
{@link string} - The identifier for this object




### See also






### Parameters

No parameters










## setIdentifier
_void setIdentifier( string id )_


**Inherited from:**  Identifiable

Set the identifier of this instance







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|the new identifier for this object|











## getFullyQualifiedIdentifier
_string getFullyQualifiedIdentifier(  )_


**Inherited from:**  Identifiable

Get the fully qualified identifier of this instance. (namespace '.' type '#' identifier).





### Returns
{@link string} - the fully qualified identifier of this instance




### See also






### Parameters

No parameters










## isResource
_boolean isResource(  )_


**Inherited from:**  Identifiable

Determine if this identifiable is a resource.





### Returns
{@link boolean} - True if this identifiable is a resource, false if not.




### See also






### Parameters

No parameters










## toURI
_String toURI(  )_


**Inherited from:**  Identifiable

Returns a URI representation of a reference to this identifiable





### Returns
{@link String} - the URI for the identifiable




### See also






### Parameters

No parameters










## getType
_string getType(  )_


**Inherited from:**  Typed

Get the type of the instance (a short name, not including namespace).





### Returns
{@link string} - The type of this object




### See also






### Parameters

No parameters










## getFullyQualifiedType
_string getFullyQualifiedType(  )_


**Inherited from:**  Typed

Get the fully-qualified type name of the instance (including namespace).





### Returns
{@link string} - The fully-qualified type name of this object




### See also






### Parameters

No parameters










## getNamespace
_string getNamespace(  )_


**Inherited from:**  Typed

Get the namespace of the instance.





### Returns
{@link string} - The namespace of this object




### See also






### Parameters

No parameters










## setPropertyValue
_void setPropertyValue( string propname, string value )_


**Inherited from:**  Typed

Sets a property on this Resource







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**propName**| string |*Yes*|the name of the field|
|**value**| string |*Yes*|the value of the property|











## addArrayValue
_void addArrayValue( string propname, string value )_


**Inherited from:**  Typed

Adds a value to an array property on this Resource







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**propName**| string |*Yes*|the name of the field|
|**value**| string |*Yes*|the value of the property|











## instanceOf
_boolean instanceOf( String fqt )_


**Inherited from:**  Typed

Check to see if this instance is an instance of the specified fully qualified type name.





### Returns
{@link boolean} - True if this instance is an instance of the specified fully qualified type name, false otherwise.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**fqt**| String |*Yes*|The fully qualified type name.|








 