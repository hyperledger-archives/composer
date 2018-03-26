---
layout: default
title: Typed (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1246
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# Typed

Object is an instance with a namespace and a type.

This class is abstract.

### Details

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [addArrayValue](#addarrayvalue) | `void` | Adds a value to an array property on this Resource  |
| [getFullyQualifiedType](#getfullyqualifiedtype) | `string` | Get the fully-qualified type name of the instance (including namespace)  |
| [getNamespace](#getnamespace) | `string` | Get the namespace of the instance  |
| [getType](#gettype) | `string` | Get the type of the instance (a short name, not including namespace)  |
| [instanceOf](#instanceof) | `boolean` | Check to see if this instance is an instance of the specified fully qualified type name  |
| [setPropertyValue](#setpropertyvalue) | `void` | Sets a property on this Resource  |





# Method Details


## getType
_string getType(  )_


Get the type of the instance (a short name, not including namespace).





### Returns
**{@link string}** - The type of this object




### See also






### Parameters

No parameters









## getFullyQualifiedType
_string getFullyQualifiedType(  )_


Get the fully-qualified type name of the instance (including namespace).





### Returns
**{@link string}** - The fully-qualified type name of this object




### See also






### Parameters

No parameters









## getNamespace
_string getNamespace(  )_


Get the namespace of the instance.





### Returns
**{@link string}** - The namespace of this object




### See also






### Parameters

No parameters









## setPropertyValue
_ setPropertyValue( string propname, string value )_


Sets a property on this Resource







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**propName**| string |*Yes*|the name of the field|
|**value**| string |*Yes*|the value of the property|










## addArrayValue
_ addArrayValue( string propname, string value )_


Adds a value to an array property on this Resource







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**propName**| string |*Yes*|the name of the field|
|**value**| string |*Yes*|the value of the property|










## instanceOf
_boolean instanceOf( String fqt )_


Check to see if this instance is an instance of the specified fully qualified type name.





### Returns
**{@link boolean}** - True if this instance is an instance of the specified fully qualified type name, false otherwise.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**fqt**| String |*Yes*|The fully qualified type name.|








 

##Inherited methods

 