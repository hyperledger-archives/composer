---
layout: default
title: ClassDeclaration (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1224
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# ClassDeclaration

ClassDeclaration defines the structure (model/schema) of composite data.
It is composed of a set of Properties, may have an identifying field, and may
have a super-type.
A ClassDeclaration is conceptually owned by a ModelFile which
defines all the classes that are part of a namespace.

### Details

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [_resolveSuperType](#_resolvesupertype) | `ClassDeclaration` | Resolve the super type on this class and store it as an internal property  |
| [constructor](#constructor) | `void` | Create a ClassDeclaration from an Abstract Syntax Tree  |
| [getAllSuperTypeDeclarations](#getallsupertypedeclarations) | `ClassDeclaration[]` | Get all the super-type declarations for this type  |
| [getAssignableClassDeclarations](#getassignableclassdeclarations) | `ClassDeclaration[]` | Get the class declarations for all subclasses of this class, including this class  |
| [getFullyQualifiedName](#getfullyqualifiedname) | `string` | Returns the fully qualified name of this class  |
| [getIdentifierFieldName](#getidentifierfieldname) | `string` | Returns the name of the identifying field for this class  |
| [getModelFile](#getmodelfile) | `ModelFile` | Returns the ModelFile that defines this class  |
| [getName](#getname) | `string` | Returns the short name of a class  |
| [getNamespace](#getnamespace) | `String` | Return the namespace of this class  |
| [getNestedProperty](#getnestedproperty) | `Property` | Get a nested property using a dotted property path  |
| [getOwnProperties](#getownproperties) | `Property[]` | Returns the fields directly defined by this class  |
| [getOwnProperty](#getownproperty) | `Property` | Returns the field with a given name or null if it does not exist  |
| [getProperties](#getproperties) | `Property[]` | Returns the properties defined in this class and all super classes  |
| [getProperty](#getproperty) | `Property` | Returns the property with a given name or null if it does not exist  |
| [getSuperType](#getsupertype) | `string` | Returns the FQN of the super type for this class or null if this class does not have a super type  |
| [getSuperTypeDeclaration](#getsupertypedeclaration) | `ClassDeclaration` | Get the super type class declaration for this class  |
| [getSystemType](#getsystemtype) | `string` | Returns the base system type for this type of class declaration  |
| [isAbstract](#isabstract) | `boolean` | Returns true if this class is declared as abstract in the model file  |
| [isConcept](#isconcept) | `boolean` | Returns true if this class is the definition of a concept  |
| [isEnum](#isenum) | `boolean` | Returns true if this class is an enumeration  |
| [isEvent](#isevent) | `boolean` | Returns true if this class is the definition of an event  |
| [isRelationshipTarget](#isrelationshiptarget) | `boolean` | Returns true if this class can be pointed to by a relationship  |
| [isSystemCoreType](#issystemcoretype) | `boolean` | Returns true if this class is a system core type - both in the system namespace, and also one of the system core types (Asset, Participant, etc)  |
| [isSystemRelationshipTarget](#issystemrelationshiptarget) | `boolean` | Returns true if this class can be pointed to by a relationship in a system model  |
| [isSystemType](#issystemtype) | `boolean` | Returns true is this type is in the system namespace  |
| [toString](#tostring) | `String` | Returns the string representation of this class  |





# Method Details


## new ClassDeclaration()


Create a ClassDeclaration from an Abstract Syntax Tree. The AST is the result of parsing.







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**modelFile**| ModelFile |*Yes*|the ModelFile for this class|
|**ast**| string |*Yes*|the AST created by the parser|










## getModelFile
_ModelFile getModelFile(  )_


Returns the ModelFile that defines this class.





### Returns
**{@link common-ModelFile}** - the owning ModelFile




### See also






### Parameters

No parameters









## _resolveSuperType
_ClassDeclaration _resolveSuperType(  )_


Resolve the super type on this class and store it as an internal property.





### Returns
**{@link common-ClassDeclaration}** - The super type, or null if non specified.




### See also






### Parameters

No parameters









## getSystemType
_string getSystemType(  )_


Returns the base system type for this type of class declaration. Override this method in derived classes to specify a base system type.





### Returns
**{@link string}** - the short name of the base system type or null




### See also






### Parameters

No parameters









## isAbstract
_boolean isAbstract(  )_


Returns true if this class is declared as abstract in the model file





### Returns
**{@link boolean}** - true if the class is abstract




### See also






### Parameters

No parameters









## isEnum
_boolean isEnum(  )_


Returns true if this class is an enumeration.





### Returns
**{@link boolean}** - true if the class is an enumerated type




### See also






### Parameters

No parameters









## isConcept
_boolean isConcept(  )_


Returns true if this class is the definition of a concept.





### Returns
**{@link boolean}** - true if the class is a concept




### See also






### Parameters

No parameters









## isEvent
_boolean isEvent(  )_


Returns true if this class is the definition of an event.





### Returns
**{@link boolean}** - true if the class is an event




### See also






### Parameters

No parameters









## isRelationshipTarget
_boolean isRelationshipTarget(  )_


Returns true if this class can be pointed to by a relationship





### Returns
**{@link boolean}** - true if the class may be pointed to by a relationship




### See also






### Parameters

No parameters









## isSystemRelationshipTarget
_boolean isSystemRelationshipTarget(  )_


Returns true if this class can be pointed to by a relationship in a system model





### Returns
**{@link boolean}** - true if the class may be pointed to by a relationship




### See also






### Parameters

No parameters









## isSystemType
_boolean isSystemType(  )_


Returns true is this type is in the system namespace





### Returns
**{@link boolean}** - true if the class may be pointed to by a relationship




### See also






### Parameters

No parameters









## isSystemCoreType
_boolean isSystemCoreType(  )_


Returns true if this class is a system core type - both in the system namespace, and also one of the system core types (Asset, Participant, etc).





### Returns
**{@link boolean}** - true if the class may be pointed to by a relationship




### See also






### Parameters

No parameters









## getName
_string getName(  )_


Returns the short name of a class. This name does not include the namespace from the owning ModelFile.





### Returns
**{@link string}** - the short name of this class




### See also






### Parameters

No parameters









## getNamespace
_String getNamespace(  )_


Return the namespace of this class.





### Returns
**{@link String}** - namespace - a namespace.




### See also






### Parameters

No parameters









## getFullyQualifiedName
_string getFullyQualifiedName(  )_


Returns the fully qualified name of this class. The name will include the namespace if present.





### Returns
**{@link string}** - the fully-qualified name of this class




### See also






### Parameters

No parameters









## getIdentifierFieldName
_string getIdentifierFieldName(  )_


Returns the name of the identifying field for this class. Note that the identifying field may come from a super type.





### Returns
**{@link string}** - the name of the id field for this class




### See also






### Parameters

No parameters









## getOwnProperty
_Property getOwnProperty( string name )_


Returns the field with a given name or null if it does not exist. The field must be directly owned by this class -- the super-type is not introspected.





### Returns
**{@link common-Property}** - the field definition or null if it does not exist.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**| string |*Yes*|the name of the field|










## getOwnProperties
_Property[] getOwnProperties(  )_


Returns the fields directly defined by this class.





### Returns
**{@link Property[]}** - the array of fields




### See also






### Parameters

No parameters









## getSuperType
_string getSuperType(  )_


Returns the FQN of the super type for this class or null if this class does not have a super type.





### Returns
**{@link string}** - the FQN name of the super type or null




### See also






### Parameters

No parameters









## getSuperTypeDeclaration
_ClassDeclaration getSuperTypeDeclaration(  )_


Get the super type class declaration for this class.





### Returns
**{@link common-ClassDeclaration}** - the super type declaration, or null if there is no super type.




### See also






### Parameters

No parameters









## getAssignableClassDeclarations
_ClassDeclaration[] getAssignableClassDeclarations(  )_


Get the class declarations for all subclasses of this class, including this class.





### Returns
**{@link ClassDeclaration[]}** - subclass declarations.




### See also






### Parameters

No parameters









## getAllSuperTypeDeclarations
_ClassDeclaration[] getAllSuperTypeDeclarations(  )_


Get all the super-type declarations for this type.





### Returns
**{@link ClassDeclaration[]}** - super-type declarations.




### See also






### Parameters

No parameters









## getProperty
_Property getProperty( string name )_


Returns the property with a given name or null if it does not exist. Fields defined in super-types are also introspected.





### Returns
**{@link common-Property}** - the field, or null if it does not exist




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**| string |*Yes*|the name of the field|










## getProperties
_Property[] getProperties(  )_


Returns the properties defined in this class and all super classes.





### Returns
**{@link Property[]}** - the array of fields




### See also






### Parameters

No parameters









## getNestedProperty
_Property getNestedProperty( string propertypath )_


Get a nested property using a dotted property path





### Returns
**{@link common-Property}** - the property




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**propertyPath**| string |*Yes*|The property name or name with nested structure e.g a.b.c|










## toString
_String toString(  )_


Returns the string representation of this class





### Returns
**{@link String}** - the string representation of the class




### See also






### Parameters

No parameters







 

##Inherited methods

 