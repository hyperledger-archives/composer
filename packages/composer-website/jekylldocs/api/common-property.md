---
layout: default
title: Property (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1240
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# Property

Property representing an attribute of a class declaration,
either a Field or a Relationship.

### Details

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [constructor](#constructor) | `void` | Create a Property  |
| [getFullyQualifiedName](#getfullyqualifiedname) | `string` | Returns the fully name of a property (ns + class name + property name)  |
| [getFullyQualifiedTypeName](#getfullyqualifiedtypename) | `string` | Returns the fully qualified type name of a property  |
| [getName](#getname) | `string` | Returns the name of a property  |
| [getNamespace](#getnamespace) | `string` | Returns the namespace of the parent of this property  |
| [getParent](#getparent) | `ClassDeclaration` | Returns the owner of this property  |
| [getType](#gettype) | `string` | Returns the type of a property  |
| [isArray](#isarray) | `boolean` | Returns true if the field is declared as an array type  |
| [isOptional](#isoptional) | `boolean` | Returns true if the field is optional  |
| [isPrimitive](#isprimitive) | `boolean` | Returns true if this property is a primitive type  |
| [isTypeEnum](#istypeenum) | `boolean` | Returns true if the field is declared as an enumerated value  |





# Method Details


## new Property()


Create a Property.







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**parent**| ClassDeclaration |*Yes*|the owner of this property|
|**ast**| Object |*Yes*|The AST created by the parser|










## getParent
_ClassDeclaration getParent(  )_


Returns the owner of this property





### Returns
**{@link common-ClassDeclaration}** - the parent class declaration




### See also






### Parameters

No parameters









## getName
_string getName(  )_


Returns the name of a property





### Returns
**{@link string}** - the name of this field




### See also






### Parameters

No parameters









## getType
_string getType(  )_


Returns the type of a property





### Returns
**{@link string}** - the type of this field




### See also






### Parameters

No parameters









## isOptional
_boolean isOptional(  )_


Returns true if the field is optional





### Returns
**{@link boolean}** - true if the field is optional




### See also






### Parameters

No parameters









## getFullyQualifiedTypeName
_string getFullyQualifiedTypeName(  )_


Returns the fully qualified type name of a property





### Returns
**{@link string}** - the fully qualified type of this property




### See also






### Parameters

No parameters









## getFullyQualifiedName
_string getFullyQualifiedName(  )_


Returns the fully name of a property (ns + class name + property name)





### Returns
**{@link string}** - the fully qualified name of this property




### See also






### Parameters

No parameters









## getNamespace
_string getNamespace(  )_


Returns the namespace of the parent of this property





### Returns
**{@link string}** - the namespace of the parent of this property




### See also






### Parameters

No parameters









## isArray
_boolean isArray(  )_


Returns true if the field is declared as an array type





### Returns
**{@link boolean}** - true if the property is an array type




### See also






### Parameters

No parameters









## isTypeEnum
_boolean isTypeEnum(  )_


Returns true if the field is declared as an enumerated value





### Returns
**{@link boolean}** - true if the property is an enumerated value




### See also






### Parameters

No parameters









## isPrimitive
_boolean isPrimitive(  )_


Returns true if this property is a primitive type.





### Returns
**{@link boolean}** - true if the property is a primitive type.




### See also






### Parameters

No parameters







 

##Inherited methods

 