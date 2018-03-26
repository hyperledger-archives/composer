---
layout: default
title: AssetRegistry (Runtime API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1250
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# AssetRegistry

The AssetRegistry is used to manage a set of assets stored on the Blockchain.

Do not attempt to create an instance of this class.
You must use the {@link runtime-api#getAssetRegistry getAssetRegistry}
method instead.

### Details

- **Module** runtime



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [add](#add) | `Promise` | Add the specified asset to this asset registry  |
| [addAll](#addall) | `Promise` | Add all of the specified assets to this asset registry  |
| [exists](#exists) | `Promise` | Determines whether a specific asset exists in this asset registry  |
| [get](#get) | `Promise` | Get the specified asset in this asset registry using the unique identifier of the asset  |
| [getAll](#getall) | `Promise` | Get a list of all of the existing assets in this asset registry  |
| [remove](#remove) | `Promise` | Remove the specified asset from this asset registry  |
| [removeAll](#removeall) | `Promise` | Remove all of the specified assets from this asset registry  |
| [update](#update) | `Promise` | Update the specified asset in this asset registry  |
| [updateAll](#updateall) | `Promise` | Update all of the specified assets in this asset registry  |





# Method Details


## getAll
_Promise getAll(  )_


Get a list of all of the existing assets in this asset registry.



### Example
```javascript
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get all of the vehicles in the vehicle asset registry.
    return assetRegistry.getAll();
  })
  .then(function (vehicles) {
    // Process the array of vehicle objects.
    vehicles.forEach(function (vehicle) {
      console.log(vehicle.vehicleId);
    });
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved with an array of {@link common-Resource} instances representing all of the assets stored in this asset registry. If the asset registry does not exist, or the current user does not have access to the asset registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters

No parameters







### Example
```javascript
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get all of the vehicles in the vehicle asset registry.
    return assetRegistry.getAll();
  })
  .then(function (vehicles) {
    // Process the array of vehicle objects.
    vehicles.forEach(function (vehicle) {
      console.log(vehicle.vehicleId);
    });
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## get
_Promise get( string id )_


Get the specified asset in this asset registry using the unique identifier of the asset.



### Example
```javascript
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the specific vehicle from the vehicle asset registry.
    return assetRegistry.get('VEHICLE_1');
  })
  .then(function (vehicle) {
    // Process the the vehicle object.
    console.log(vehicle.vehicleId);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved with a {@link common-Resource} instance representing the specified asset in this asset registry. If the specified asset does not exist, or the current user does not have access to the specified asset, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The ID of the asset.|








### Example
```javascript
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the specific vehicle from the vehicle asset registry.
    return assetRegistry.get('VEHICLE_1');
  })
  .then(function (vehicle) {
    // Process the the vehicle object.
    console.log(vehicle.vehicleId);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## exists
_Promise exists( string id )_


Determines whether a specific asset exists in this asset registry.



### Example
```javascript
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Determine if the specific vehicle exists in the vehicle asset registry.
    return assetRegistry.exists('VEHICLE_1');
  })
  .then(function (exists) {
    // Process the the boolean result.
    console.log('Vehicle exists', exists);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved with a boolean which is true if the specified asset exists in this asset registry, and false if the specified participant does not exist.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The ID of the asset.|








### Example
```javascript
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Determine if the specific vehicle exists in the vehicle asset registry.
    return assetRegistry.exists('VEHICLE_1');
  })
  .then(function (exists) {
    // Process the the boolean result.
    console.log('Vehicle exists', exists);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## addAll
_Promise addAll(  assets )_


Add all of the specified assets to this asset registry.



### Example
```javascript
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the factory for creating new asset instances.
    var factory = getFactory();
    // Create the first vehicle.
    var vehicle1 = factory.newResource('org.acme', 'Vehicle', 'VEHICLE_1');
    vehicle1.colour = 'BLUE';
    // Create the second vehicle.
    var vehicle2 = factory.newResource('org.acme', 'Vehicle', 'VEHICLE_2');
    vehicle2.colour = 'GREEN';
    // Add the vehicles to the vehicle asset registry.
    return vehicleAssetRegistry.addAll([vehicle1, vehicle2]);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved when all of the assets have been added to this asset registry. If the assets cannot be added to this asset registry, or if the assets already exist in the asset registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**assets**|  |*Yes*|The assets to add to this asset registry.|








### Example
```javascript
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the factory for creating new asset instances.
    var factory = getFactory();
    // Create the first vehicle.
    var vehicle1 = factory.newResource('org.acme', 'Vehicle', 'VEHICLE_1');
    vehicle1.colour = 'BLUE';
    // Create the second vehicle.
    var vehicle2 = factory.newResource('org.acme', 'Vehicle', 'VEHICLE_2');
    vehicle2.colour = 'GREEN';
    // Add the vehicles to the vehicle asset registry.
    return vehicleAssetRegistry.addAll([vehicle1, vehicle2]);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## add
_Promise add( Resource asset )_


Add the specified asset to this asset registry.



### Example
```javascript
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the factory for creating new asset instances.
    var factory = getFactory();
    // Create the vehicle.
    var vehicle = factory.newResource('org.acme', 'Vehicle', 'VEHICLE_1');
    vehicle.colour = 'BLUE';
    // Add the vehicle to the vehicle asset registry.
    return vehicleAssetRegistry.add(vehicle);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved when the asset has been added to this asset registry. If the asset cannot be added to this asset registry, or if the asset already exists in the asset registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**asset**| Resource |*Yes*|The assets to add to this asset registry.|








### Example
```javascript
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the factory for creating new asset instances.
    var factory = getFactory();
    // Create the vehicle.
    var vehicle = factory.newResource('org.acme', 'Vehicle', 'VEHICLE_1');
    vehicle.colour = 'BLUE';
    // Add the vehicle to the vehicle asset registry.
    return vehicleAssetRegistry.add(vehicle);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## updateAll
_Promise updateAll(  assets )_


Update all of the specified assets in this asset registry.



### Example
```javascript
// The existing vehicles that have come from elsewhere.
var vehicle1;
var vehicle2;
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the factory for creating new asset instances.
    var factory = getFactory();
    // Modify the properties of the first vehicle.
    vehicle1.colour = 'PURPLE';
    // Modify the properties of the second vehicle.
    vehicle2.colour = 'ORANGE';
    // Update the vehicles in the vehicle asset registry.
    return vehicleAssetRegistry.updateAll([vehicle1, vehicle2]);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved when all of the assets have been updated in this asset registry. If the assets cannot be updated in this asset registry, or if the assets do not exist in the asset registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**assets**|  |*Yes*|The assets to update in this asset registry.|








### Example
```javascript
// The existing vehicles that have come from elsewhere.
var vehicle1;
var vehicle2;
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the factory for creating new asset instances.
    var factory = getFactory();
    // Modify the properties of the first vehicle.
    vehicle1.colour = 'PURPLE';
    // Modify the properties of the second vehicle.
    vehicle2.colour = 'ORANGE';
    // Update the vehicles in the vehicle asset registry.
    return vehicleAssetRegistry.updateAll([vehicle1, vehicle2]);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## update
_Promise update( Resource asset )_


Update the specified asset in this asset registry.



### Example
```javascript
// The existing vehicle that has come from elsewhere.
var vehicle;
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the factory for creating new asset instances.
    var factory = getFactory();
    // Modify the properties of the vehicle.
    vehicle.colour = 'PURPLE';
    // Update the vehicle in the vehicle asset registry.
    return vehicleAssetRegistry.update(vehicle);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved when the asset have been updated in this asset registry. If the asset cannot be updated in this asset registry, or if the asset does not exist in the asset registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**asset**| Resource |*Yes*|The asset to update in this asset registry.|








### Example
```javascript
// The existing vehicle that has come from elsewhere.
var vehicle;
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the factory for creating new asset instances.
    var factory = getFactory();
    // Modify the properties of the vehicle.
    vehicle.colour = 'PURPLE';
    // Update the vehicle in the vehicle asset registry.
    return vehicleAssetRegistry.update(vehicle);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## removeAll
_Promise removeAll( ;  assets )_


Remove all of the specified assets from this asset registry.



### Example
```javascript
// The existing vehicles that have come from elsewhere.
var vehicle1;
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the factory for creating new asset instances.
    var factory = getFactory();
    // Remove the vehicles from the vehicle asset registry. Note that
    // one vehicle is specified as a vehicle instance, and the other
    // vehicle is specified by the ID of the vehicle.
    return vehicleAssetRegistry.removeAll([vehicle1, 'VEHICLE_2']);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved when all of the assets have been removed from this asset registry. If the assets cannot be removed from this asset registry, or if the assets do not exist in the asset registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**assets**| ;  |*Yes*|The assets, or the IDs of the assets, to remove from this asset registry.|








### Example
```javascript
// The existing vehicles that have come from elsewhere.
var vehicle1;
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the factory for creating new asset instances.
    var factory = getFactory();
    // Remove the vehicles from the vehicle asset registry. Note that
    // one vehicle is specified as a vehicle instance, and the other
    // vehicle is specified by the ID of the vehicle.
    return vehicleAssetRegistry.removeAll([vehicle1, 'VEHICLE_2']);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



## remove
_Promise remove( string; Resource asset )_


Remove the specified asset from this asset registry.



### Example
```javascript
// The existing vehicle that has come from elsewhere.
var vehicle;
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the factory for creating new asset instances.
    var factory = getFactory();
    // Remove the vehicle from the vehicle asset registry.
    return vehicleAssetRegistry.remove(vehicle);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```



### Returns
**{@link Promise}** - A promise. The promise is resolved when the asset has been removed from this asset registry. If the asset cannot be removed from this asset registry, or if the asset does not exist in the asset registry, then the promise will be rejected with an error that describes the problem.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**asset**| string; Resource |*Yes*|The asset, or ID of the asset, to remove from this asset registry.|








### Example
```javascript
// The existing vehicle that has come from elsewhere.
var vehicle;
// Get the vehicle asset registry.
return getAssetRegistry('org.acme.Vehicle')
  .then(function (vehicleAssetRegistry) {
    // Get the factory for creating new asset instances.
    var factory = getFactory();
    // Remove the vehicle from the vehicle asset registry.
    return vehicleAssetRegistry.remove(vehicle);
  })
  .catch(function (error) {
    // Add optional error handling here.
  });
```

 

##Inherited methods

 