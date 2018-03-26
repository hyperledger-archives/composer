---
layout: default
title: Factory (Runtime API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1251
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# Factory

Use the Factory to create instances of Resource: transactions, participants and assets.

Do not attempt to create an instance of this class.<br>
You must use the {@link runtime-api#getFactory getFactory}
method instead.

### Details

- **Module** runtime



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [newConcept](#newconcept) | `Concept` | Create a new concept with a given namespace, type, and identifier  |
| [newEvent](#newevent) | `Resource` | Create a new type with a given namespace and type  |
| [newRelationship](#newrelationship) | `Relationship` | Create a new relationship with a given namespace, type, and identifier  |
| [newResource](#newresource) | `Resource` | Create a new resource (an instance of an asset, participant, or transaction)  |





# Method Details


## newResource
_Resource newResource( string ns, string type, string id )_


Create a new resource (an instance of an asset, participant, or transaction). The properties of the new instance should be set as standard JavaScript object properties. The new instance can then be stored in a registry using the appropriate registry APIs, for example {@link AssetRegistry}.



### Example
```javascript
// Get the factory.
var factory = getFactory();
// Create a new vehicle.
var vehicle = factory.newResource('org.acme', 'Vehicle', 'VEHICLE_1');
// Set the properties of the new vehicle.
vehicle.colour = 'BLUE';
vehicle.manufacturer = 'Toyota';
```



### Returns
**{@link common-Resource}** - The new instance of the resource.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**| string |*Yes*|The namespace of the resource to create.|
|**type**| string |*Yes*|The type of the resource to create.|
|**id**| string |*Yes*|The identifier of the new resource.|








### Example
```javascript
// Get the factory.
var factory = getFactory();
// Create a new vehicle.
var vehicle = factory.newResource('org.acme', 'Vehicle', 'VEHICLE_1');
// Set the properties of the new vehicle.
vehicle.colour = 'BLUE';
vehicle.manufacturer = 'Toyota';
```



## newRelationship
_Relationship newRelationship( string ns, string type, string id )_


Create a new relationship with a given namespace, type, and identifier. A relationship is a typed pointer to an instance. For example, a new relationship with namespace 'org.acme', type 'Vehicle' and identifier 'VEHICLE_1' creates` a pointer that points at an existing instance of org.acme.Vehicle with the identifier 'VEHICLE_1'.



### Example
```javascript
// The existing driver of the vehicle.
var driver;
// Get the factory.
var factory = getFactory();
// Create a new relationship to the vehicle.
var vehicle = factory.newRelationship('org.acme', 'Vehicle', 'VEHICLE_1');
// Set the relationship as the value of the vehicle property of the driver.
driver.vehicle = vehicle;
```



### Returns
**{@link common-Relationship}** - The new instance of the relationship.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**| string |*Yes*|The namespace of the resource referenced by the relationship.|
|**type**| string |*Yes*|The type of the resource referenced by the relationship.|
|**id**| string |*Yes*|The identifier of the resource referenced by the relationship.|








### Example
```javascript
// The existing driver of the vehicle.
var driver;
// Get the factory.
var factory = getFactory();
// Create a new relationship to the vehicle.
var vehicle = factory.newRelationship('org.acme', 'Vehicle', 'VEHICLE_1');
// Set the relationship as the value of the vehicle property of the driver.
driver.vehicle = vehicle;
```



## newConcept
_Concept newConcept( string ns, string type )_


Create a new concept with a given namespace, type, and identifier. A concept is an advanced data structure



### Example
```javascript
// The existing driver of the vehicle.
var person;
// Get the factory.
var factory = getFactory();
// Create a new relationship to the vehicle.
var record = factory.newConcept('org.acme', 'Record');
// Add the record to the persons array of records.
person.records.push(record);
```



### Returns
**{@link common-Concept}** - The new instance of the concept.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**| string |*Yes*|The namespace of the concept.|
|**type**| string |*Yes*|The type of the concept.|








### Example
```javascript
// The existing driver of the vehicle.
var person;
// Get the factory.
var factory = getFactory();
// Create a new relationship to the vehicle.
var record = factory.newConcept('org.acme', 'Record');
// Add the record to the persons array of records.
person.records.push(record);
```



## newEvent
_Resource newEvent( string ns, string type )_


Create a new type with a given namespace and type





### Returns
**{@link common-Resource}** - The new instance of the event.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**| string |*Yes*|The namespace of the event.|
|**type**| string |*Yes*|The type of the event.|








 

##Inherited methods

 