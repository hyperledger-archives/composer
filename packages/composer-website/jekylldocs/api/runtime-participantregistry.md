---
layout: default
title: ParticipantRegistry (Runtime API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1252
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# ParticipantRegistry

The ParticipantRegistry is used to manage a set of participants stored on the blockchain.

Do not attempt to create an instance of this class. You must use the {@link runtime-api#getParticipantRegistry getParticipantRegistry}
method instead.

### Details

- **Module** runtime



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [add](#add) | `Promise` | Add the specified participant to this participant registry  |
| [addAll](#addall) | `Promise` | Add all of the specified participants to this participant registry  |
| [exists](#exists) | `Promise` | Determines whether a specific participant exists in this participant registry  |
| [get](#get) | `Promise` | Get the specified participant in this participant registry using the unique identifier of the participant  |
| [getAll](#getall) | `Promise` | Get a list of all of the existing participants in this participant registry  |
| [remove](#remove) | `Promise` | Remove the specified participant from this participant registry  |
| [removeAll](#removeall) | `Promise` | Remove all of the specified participants from this participant registry  |
| [update](#update) | `Promise` | Update the specified participant in this participant registry  |
| [updateAll](#updateall) | `Promise` | Update all of the specified participants in this participant registry  |





# Method Details


## getAll
_Promise getAll(  )_


Get a list of all of the existing participants in this participant registry.



### Example
```javascript
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get all of the drivers in the driver participant registry.
    return participantRegistry.getAll();
  })
  .then(function (drivers) {
    // Process the array of driver objects.
    drivers.forEach(function (driver) {
      console.log(driver.driverId);
    });
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved with an array of {@link common-Resource} instances representing all of the participants stored in this participant registry. If the participant registry does not exist, or the current user does not have access to the participant registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters

No parameters







### Example
```javascript
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get all of the drivers in the driver participant registry.
    return participantRegistry.getAll();
  })
  .then(function (drivers) {
    // Process the array of driver objects.
    drivers.forEach(function (driver) {
      console.log(driver.driverId);
    });
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## get
_Promise get( string id )_


Get the specified participant in this participant registry using the unique identifier of the participant.



### Example
```javascript
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the specific driver from the driver participant registry.
    return participantRegistry.get('VEHICLE_1');
  })
  .then(function (driver) {
    // Process the the driver object.
    console.log(driver.driverId);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved with a {@link common-Resource} instance representing the specified participant in this participant registry. If the specified participant does not exist, or the current user does not have access to the specified participant, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The ID of the participant.|








### Example
```javascript
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the specific driver from the driver participant registry.
    return participantRegistry.get('VEHICLE_1');
  })
  .then(function (driver) {
    // Process the the driver object.
    console.log(driver.driverId);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## exists
_Promise exists( string id )_


Determines whether a specific participant exists in this participant registry.



### Example
```javascript
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Determine if the specific driver exists in the driver participant registry.
    return participantRegistry.exists('VEHICLE_1');
  })
  .then(function (exists) {
    // Process the the boolean result.
    console.log('Driver exists', exists);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved with a boolean which is true if the specified participant exists in this participant registry, and false if the specified participant does not exist.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The ID of the participant.|








### Example
```javascript
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Determine if the specific driver exists in the driver participant registry.
    return participantRegistry.exists('VEHICLE_1');
  })
  .then(function (exists) {
    // Process the the boolean result.
    console.log('Driver exists', exists);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## addAll
_Promise addAll(  participants )_


Add all of the specified participants to this participant registry.



### Example
```javascript
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the factory for creating new participant instances.
    var factory = getFactory();
    // Create the first driver.
    var driver1 = factory.newResource('org.acme', 'Driver', 'VEHICLE_1');
    driver1.location = 'Southampton';
    // Create the second driver.
    var driver2 = factory.newResource('org.acme', 'Driver', 'VEHICLE_2');
    driver2.location = 'GREEN';
    // Add the drivers to the driver participant registry.
    return participantRegistry.addAll([driver1, driver2]);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved when all of the participants have been added to this participant registry. If the participants cannot be added to this participant registry, or if the participants already exist in the participant registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**participants**|  |*Yes*|The participants to add to this participant registry.|








### Example
```javascript
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the factory for creating new participant instances.
    var factory = getFactory();
    // Create the first driver.
    var driver1 = factory.newResource('org.acme', 'Driver', 'VEHICLE_1');
    driver1.location = 'Southampton';
    // Create the second driver.
    var driver2 = factory.newResource('org.acme', 'Driver', 'VEHICLE_2');
    driver2.location = 'GREEN';
    // Add the drivers to the driver participant registry.
    return participantRegistry.addAll([driver1, driver2]);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## add
_Promise add( Resource participant )_


Add the specified participant to this participant registry.



### Example
```javascript
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the factory for creating new participant instances.
    var factory = getFactory();
    // Create the driver.
    var driver = factory.newResource('org.acme', 'Driver', 'VEHICLE_1');
    driver.location = 'Southampton';
    // Add the driver to the driver participant registry.
    return participantRegistry.add(driver);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved when the participant has been added to this participant registry. If the participant cannot be added to this participant registry, or if the participant already exists in the participant registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**participant**| Resource |*Yes*|The participants to add to this participant registry.|








### Example
```javascript
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the factory for creating new participant instances.
    var factory = getFactory();
    // Create the driver.
    var driver = factory.newResource('org.acme', 'Driver', 'VEHICLE_1');
    driver.location = 'Southampton';
    // Add the driver to the driver participant registry.
    return participantRegistry.add(driver);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## updateAll
_Promise updateAll(  participants )_


Update all of the specified participants in this participant registry.



### Example
```javascript
// The existing drivers that have come from elsewhere.
var driver1;
var driver2;
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the factory for creating new participant instances.
    var factory = getFactory();
    // Modify the properties of the first driver.
    driver1.location = 'Hursley';
    // Modify the properties of the second driver.
    driver2.location = 'London';
    // Update the drivers in the driver participant registry.
    return participantRegistry.updateAll([driver1, driver2]);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved when all of the participants have been updated in this participant registry. If the participants cannot be updated in this participant registry, or if the participants do not exist in the participant registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**participants**|  |*Yes*|The participants to update in this participant registry.|








### Example
```javascript
// The existing drivers that have come from elsewhere.
var driver1;
var driver2;
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the factory for creating new participant instances.
    var factory = getFactory();
    // Modify the properties of the first driver.
    driver1.location = 'Hursley';
    // Modify the properties of the second driver.
    driver2.location = 'London';
    // Update the drivers in the driver participant registry.
    return participantRegistry.updateAll([driver1, driver2]);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## update
_Promise update( Resource participant )_


Update the specified participant in this participant registry.



### Example
```javascript
// The existing driver that has come from elsewhere.
var driver;
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the factory for creating new participant instances.
    var factory = getFactory();
    // Modify the properties of the driver.
    driver.location = 'Hursley';
    // Update the driver in the driver participant registry.
    return participantRegistry.update(driver);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved when the participant have been updated in this participant registry. If the participant cannot be updated in this participant registry, or if the participant does not exist in the participant registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**participant**| Resource |*Yes*|The participant to update in this participant registry.|








### Example
```javascript
// The existing driver that has come from elsewhere.
var driver;
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the factory for creating new participant instances.
    var factory = getFactory();
    // Modify the properties of the driver.
    driver.location = 'Hursley';
    // Update the driver in the driver participant registry.
    return participantRegistry.update(driver);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## removeAll
_Promise removeAll( ;  participants )_


Remove all of the specified participants from this participant registry.



### Example
```javascript
// The existing drivers that have come from elsewhere.
var driver1;
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the factory for creating new participant instances.
    var factory = getFactory();
    // Remove the drivers from the driver participant registry. Note that
    // one driver is specified as a driver instance, and the other
    // driver is specified by the ID of the driver.
    return participantRegistry.removeAll([driver1, 'VEHICLE_2']);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved when all of the participants have been removed from this participant registry. If the participants cannot be removed from this participant registry, or if the participants do not exist in the participant registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**participants**| ;  |*Yes*|The participants, or the IDs of the participants, to remove from this participant registry.|








### Example
```javascript
// The existing drivers that have come from elsewhere.
var driver1;
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the factory for creating new participant instances.
    var factory = getFactory();
    // Remove the drivers from the driver participant registry. Note that
    // one driver is specified as a driver instance, and the other
    // driver is specified by the ID of the driver.
    return participantRegistry.removeAll([driver1, 'VEHICLE_2']);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## remove
_Promise remove( string; Resource participant )_


Remove the specified participant from this participant registry.



### Example
```javascript
// The existing driver that has come from elsewhere.
var driver;
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the factory for creating new participant instances.
    var factory = getFactory();
    // Remove the driver from the driver participant registry.
    return participantRegistry.remove(driver);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved when the participant has been removed from this participant registry. If the participant cannot be removed from this participant registry, or if the participant does not exist in the participant registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**participant**| string; Resource |*Yes*|The participant, or ID of the participant, to remove from this participant registry.|








### Example
```javascript
// The existing driver that has come from elsewhere.
var driver;
// Get the driver participant registry.
return getParticipantRegistry('org.acme.Driver')
  .then(function (participantRegistry) {
    // Get the factory for creating new participant instances.
    var factory = getFactory();
    // Remove the driver from the driver participant registry.
    return participantRegistry.remove(driver);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```

 

##Inherited methods

 