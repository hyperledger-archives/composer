---
layout: default
title: ValidatedResource (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1248
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# ValidatedResource

ValidatedResource is a Resource that can validate that property
changes (or the whole instance) do not violate the structure of
the type information associated with the instance.

### Details

- **Extends** Resource

- **Module** common



### See also
- See {@link Resource}



## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [addArrayValue](#addarrayvalue) | `void` | Adds an array property value, validating that it does not violate the model  |
| [setPropertyValue](#setpropertyvalue) | `void` | Sets a property, validating that it does not violate the model  |
| [validate](#validate) | `void` | Validates the instance against its model  |



## Inherited Method Summary
| Supertype | Name | Returns | Description |
| :-------- | :--- | :-------- | :----------- |
| Identifiable |[isRelationship](#isrelationship) | `boolean` | Determine if this identifiable is a relationship  |
| Resource |[toString](#tostring) | `String` | Returns the string representation of this class  |
| Identifiable |[getIdentifier](#getidentifier) | `string` | Get the identifier of this instance  |
| Identifiable |[setIdentifier](#setidentifier) | `void` | Set the identifier of this instance  |
| Identifiable |[getFullyQualifiedIdentifier](#getfullyqualifiedidentifier) | `string` | Get the fully qualified identifier of this instance  |
| Identifiable |[toString](#tostring) | `String` | Returns the string representation of this class  |
| Resource |[isResource](#isresource) | `boolean` | Determine if this identifiable is a resource  |
| Identifiable |[isResource](#isresource) | `boolean` | Determine if this identifiable is a resource  |
| Identifiable |[toURI](#touri) | `String` | Returns a URI representation of a reference to this identifiable  |
| Typed |[getType](#gettype) | `string` | Get the type of the instance (a short name, not including namespace)  |
| Typed |[getFullyQualifiedType](#getfullyqualifiedtype) | `string` | Get the fully-qualified type name of the instance (including namespace)  |
| Typed |[getNamespace](#getnamespace) | `string` | Get the namespace of the instance  |
| Typed |[instanceOf](#instanceof) | `boolean` | Check to see if this instance is an instance of the specified fully qualified type name  |



# Method Details


## setPropertyValue
_ setPropertyValue( string propname, string value )_


Sets a property, validating that it does not violate the model







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**propName**| string |*Yes*|the name of the field|
|**value**| string |*Yes*|the value of the property|










## addArrayValue
_ addArrayValue( string propname, string value )_


Adds an array property value, validating that it does not violate the model







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**propName**| string |*Yes*|the name of the field|
|**value**| string |*Yes*|the value of the property|










## validate
_ validate(  )_


Validates the instance against its model.







### See also






### Parameters

No parameters







 

##Inherited methods




## toString
_String toString(  )_


**Inherited from:**  Resource

Returns the string representation of this class





### Returns
{@link String} - the string representation of the class




### See also






### Parameters

No parameters










## isResource
_boolean isResource(  )_


**Inherited from:**  Resource

Determine if this identifiable is a resource.





### Returns
{@link boolean} - True if this identifiable is a resource, false if not.




### See also






### Parameters

No parameters










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










## toString
_String toString(  )_


**Inherited from:**  Identifiable

Returns the string representation of this class





### Returns
{@link String} - the string representation of the class




### See also






### Parameters

No parameters










## isRelationship
_boolean isRelationship(  )_


**Inherited from:**  Identifiable

Determine if this identifiable is a relationship.





### Returns
{@link boolean} - True if this identifiable is a relationship, false if not.




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








 