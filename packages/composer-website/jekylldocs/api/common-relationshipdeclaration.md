---
layout: default
title: RelationshipDeclaration (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1242
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# RelationshipDeclaration

Class representing a relationship between model elements

### Details

- **Extends** Property

- **Module** common



### See also
- See  {@link Property}



## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [constructor](#constructor) | `void` | Create a Relationship  |
| [toString](#tostring) | `String` | Returns a string representation of this property  |



## Inherited Method Summary
| Supertype | Name | Returns | Description |
| :-------- | :--- | :-------- | :----------- |
| Property |[getParent](#getparent) | `ClassDeclaration` | Returns the owner of this property  |
| Property |[getName](#getname) | `string` | Returns the name of a property  |
| Property |[getType](#gettype) | `string` | Returns the type of a property  |
| Property |[isOptional](#isoptional) | `boolean` | Returns true if the field is optional  |
| Property |[getFullyQualifiedTypeName](#getfullyqualifiedtypename) | `string` | Returns the fully qualified type name of a property  |
| Property |[getFullyQualifiedName](#getfullyqualifiedname) | `string` | Returns the fully name of a property (ns + class name + property name)  |
| Property |[getNamespace](#getnamespace) | `string` | Returns the namespace of the parent of this property  |
| Property |[isArray](#isarray) | `boolean` | Returns true if the field is declared as an array type  |
| Property |[isTypeEnum](#istypeenum) | `boolean` | Returns true if the field is declared as an enumerated value  |
| Property |[isPrimitive](#isprimitive) | `boolean` | Returns true if this property is a primitive type  |



# Method Details


## new RelationshipDeclaration()


Create a Relationship.







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**parent**| ClassDeclaration |*Yes*|The owner of this property|
|**ast**| Object |*Yes*|The AST created by the parser|










## toString
_String toString(  )_


Returns a string representation of this property





### Returns
**{@link String}** - the string version of the property.




### See also






### Parameters

No parameters







 

##Inherited methods




## getParent
_ClassDeclaration getParent(  )_


**Inherited from:**  Property

Returns the owner of this property





### Returns
{@link common-ClassDeclaration} - the parent class declaration




### See also






### Parameters

No parameters










## getName
_string getName(  )_


**Inherited from:**  Property

Returns the name of a property





### Returns
{@link string} - the name of this field




### See also






### Parameters

No parameters










## getType
_string getType(  )_


**Inherited from:**  Property

Returns the type of a property





### Returns
{@link string} - the type of this field




### See also






### Parameters

No parameters










## isOptional
_boolean isOptional(  )_


**Inherited from:**  Property

Returns true if the field is optional





### Returns
{@link boolean} - true if the field is optional




### See also






### Parameters

No parameters










## getFullyQualifiedTypeName
_string getFullyQualifiedTypeName(  )_


**Inherited from:**  Property

Returns the fully qualified type name of a property





### Returns
{@link string} - the fully qualified type of this property




### See also






### Parameters

No parameters










## getFullyQualifiedName
_string getFullyQualifiedName(  )_


**Inherited from:**  Property

Returns the fully name of a property (ns + class name + property name)





### Returns
{@link string} - the fully qualified name of this property




### See also






### Parameters

No parameters










## getNamespace
_string getNamespace(  )_


**Inherited from:**  Property

Returns the namespace of the parent of this property





### Returns
{@link string} - the namespace of the parent of this property




### See also






### Parameters

No parameters










## isArray
_boolean isArray(  )_


**Inherited from:**  Property

Returns true if the field is declared as an array type





### Returns
{@link boolean} - true if the property is an array type




### See also






### Parameters

No parameters










## isTypeEnum
_boolean isTypeEnum(  )_


**Inherited from:**  Property

Returns true if the field is declared as an enumerated value





### Returns
{@link boolean} - true if the property is an enumerated value




### See also






### Parameters

No parameters










## isPrimitive
_boolean isPrimitive(  )_


**Inherited from:**  Property

Returns true if this property is a primitive type.





### Returns
{@link boolean} - true if the property is a primitive type.




### See also






### Parameters

No parameters







 