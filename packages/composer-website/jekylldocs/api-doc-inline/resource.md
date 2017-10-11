---
layout: default
title: Resource (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1234
---
# Resource

<p>
Resource is an instance that has a type. The type of the resource
specifies a set of properites (which themselves have types).
</p>
<p>
Type information in Composer is used to validate the structure of
Resource instances and for serialization.
</p>
<p>
Resources are used in Composer to represent Assets, Participants, Transactions and
other domain classes that can be serialized for long-term persistent storage.
</p>

### Details
- **Extends** Identifiable
- **Module** common

### See also
- See [Resource](resource)


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `boolean` | [isResource](#isresource) | Determine if this identifiable is a resource.  |
| `String` | [toString](#tostring) | Returns the string representation of this class  |


## Method Details


## toString() 




Returns the string representation of this class






### Returns
`String` - the string representation of the class





### Parameters


No parameters



## isResource() 




Determine if this identifiable is a resource.






### Returns
`boolean` - True if this identifiable is a resource,
false if not.





### Parameters


No parameters

 
