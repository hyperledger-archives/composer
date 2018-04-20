/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getFactory getAssetRegistry getParticipantRegistry emit */

// MANUFACTURER FUNCTIONS
/**
 * Place an order for a vehicle
 * @param {org.acme.vehicle_network.PlaceOrder} placeOrder - the PlaceOrder transaction
 * @transaction
 */
async function placeOrder(orderRequest) { // eslint-disable-line no-unused-vars
    console.log('placeOrder');

    const factory = getFactory();
    const namespace = 'org.acme.vehicle_network';

    const order = factory.newResource(namespace, 'Order', orderRequest.orderId);
    order.vehicleDetails = orderRequest.vehicleDetails;
    order.orderStatus = 'PLACED';
    order.orderer = factory.newRelationship(namespace, 'Person', orderRequest.orderer.getIdentifier());
    order.options = orderRequest.options;

    // save the order
    const assetRegistry = await getAssetRegistry(order.getFullyQualifiedType());
    await assetRegistry.add(order);

    // emit the event
    const placeOrderEvent = factory.newEvent(namespace, 'PlaceOrderEvent');
    placeOrderEvent.orderId = order.orderId;
    placeOrderEvent.vehicleDetails = order.vehicleDetails;
    placeOrderEvent.options = order.options;
    placeOrderEvent.orderer = order.orderer;
    emit(placeOrderEvent);
}

/**
 * Update the status of an order
 * @param {org.acme.vehicle_network.UpdateOrderStatus} updateOrderStatus - the UpdateOrderStatus transaction
 * @transaction
 */
async function updateOrderStatus(updateOrderRequest) { // eslint-disable-line no-unused-vars
    console.log('updateOrderStatus');

    const factory = getFactory();
    const namespace = 'org.acme.vehicle_network';

    // get vehicle registry
    const vehicleRegistry = await getAssetRegistry(namespace + '.Vehicle');
    if (updateOrderRequest.orderStatus === 'VIN_ASSIGNED') {
        if (!updateOrderRequest.vin) {
            throw new Error('Value for VIN was expected');
        }
        // create a vehicle
        const vehicle = factory.newResource(namespace, 'Vehicle', updateOrderRequest.vin );
        vehicle.vehicleDetails = updateOrderRequest.order.vehicleDetails;
        vehicle.vehicleStatus = 'OFF_THE_ROAD';
        await vehicleRegistry.add(vehicle);
    } else if(updateOrderRequest.orderStatus === 'OWNER_ASSIGNED') {
        if (!updateOrderRequest.vin) {
            throw new Error('Value for VIN was expected');
        }

        // assign the owner of the vehicle to be the person who placed the order
        const vehicle = await vehicleRegistry.get(updateOrderRequest.vin);
        vehicle.vehicleStatus = 'ACTIVE';
        vehicle.owner = factory.newRelationship(namespace, 'Person', updateOrderRequest.order.orderer.username);
        await vehicleRegistry.update(vehicle);
    }

    // update the order
    const order = updateOrderRequest.order;
    order.orderStatus = updateOrderRequest.orderStatus;
    const orderRegistry = await getAssetRegistry(namespace + '.Order');
    await orderRegistry.update(order);

    // emit the event
    const updateOrderStatusEvent = factory.newEvent(namespace, 'UpdateOrderStatusEvent');
    updateOrderStatusEvent.orderStatus = updateOrderRequest.order.orderStatus;
    updateOrderStatusEvent.order = updateOrderRequest.order;
    emit(updateOrderStatusEvent);
}

// DEMO SETUP FUNCTIONS
/**
 * Create the participants to use in the demo
 * @param {org.acme.vehicle_network.SetupDemo} setupDemo - the SetupDemo transaction
 * @transaction
 */
async function setupDemo() { // eslint-disable-line no-unused-vars
    console.log('setupDemo');

    const factory = getFactory();
    const namespace = 'org.acme.vehicle_network';

    let people = ['Paul', 'Andy', 'Hannah', 'Sam', 'Caroline', 'Matt', 'Fenglian', 'Mark', 'James', 'Dave', 'Rob', 'Kai', 'Ellis', 'LesleyAnn'];
    let manufacturers;

    const vehicles = {
        'Arium': {
            'Nova': [
                {
                    'vin': 'ea290d9f5a6833a65',
                    'colour': 'Royal Purple',
                    'vehicleStatus': 'ACTIVE'
                }
            ],
            'Nebula': [
                {
                    'vin': '39fd242c2bbe80f11',
                    'colour': 'Statement Blue',
                    'vehicleStatus': 'ACTIVE'
                }
            ]
        },
        'Morde': {
            'Putt': [
                {
                    'vin': '835125e50bca37ca1',
                    'colour': 'Black',
                    'vehicleStatus': 'ACTIVE'
                },
                {
                    'vin': '0812e6d8d486e0464',
                    'colour': 'Red',
                    'vehicleStatus': 'ACTIVE'
                },
                {
                    'vin': 'c4aa418f26d4a0403',
                    'colour': 'Silver',
                    'vehicleStatus': 'ACTIVE'
                }
            ],
            'Pluto': [
                {
                    'vin': '7382fbfc083f696e5',
                    'colour': 'White',
                    'vehicleStatus': 'ACTIVE'
                },
                {
                    'vin': '01a9cd3f8f5db5ef7',
                    'colour': 'Green',
                    'vehicleStatus': 'ACTIVE'
                },
                {
                    'vin': '97f305df4c2881e71',
                    'colour': 'Grey',
                    'vehicleStatus': 'ACTIVE'
                }
            ]
        },
        'Ridge': {
            'Cannon': [
                {
                    'vin': 'af462063fb901d0e6',
                    'colour': 'Red',
                    'vehicleStatus': 'ACTIVE'
                },
                {
                    'vin': '3ff3395ecfd38f787',
                    'colour': 'White',
                    'vehicleStatus': 'ACTIVE'
                },
                {
                    'vin': 'de701fcf2a78d8086',
                    'colour': 'Silver',
                    'vehicleStatus': 'ACTIVE'
                }
            ],
            'Rancher': [
                {
                    'vin': '2fcdd7b5131e81fd0',
                    'colour': 'Blue',
                    'vehicleStatus': 'ACTIVE'
                },
                {
                    'vin': '79540e5384c970321',
                    'colour': 'White',
                    'vehicleStatus': 'ACTIVE'
                }
            ]
        }
    };

    // convert array names of people to be array of participant resources of type Person with identifier of that name
    people = people.map(function (person) {
        return factory.newResource(namespace, 'Person', person);
    });

    // create array of Manufacturer particpant resources identified by the top level keys in vehicles const
    manufacturers = Object.keys(vehicles).map(function (manufacturer) {
        const manufacturerResource = factory.newResource(namespace, 'Manufacturer', manufacturer);
        manufacturerResource.name = manufacturer;
        return manufacturerResource;
    });

    // create a Regulator participant resource
    const regulator = factory.newResource(namespace, 'Regulator', 'VDA');
    regulator.name = 'VDA';

    // add the regulator
    const regulatorRegistry = await getParticipantRegistry(namespace + '.Regulator');
    await regulatorRegistry.add(regulator);

    // add the manufacturers
    const manufacturerRegistry = await getParticipantRegistry(namespace + '.Manufacturer');
    await manufacturerRegistry.addAll(manufacturers);

    // add the persons
    const personRegistry = await getParticipantRegistry(namespace + '.Person');
    await personRegistry.addAll(people);

    // add the vehicles
    const vehicleRegistry = await getAssetRegistry(namespace + '.Vehicle');
    const vehicleResources = [];

    for (const manufacturer in vehicles) {
        for (const model in vehicles[manufacturer]) {
            const vehicconstemplatesForModel = vehicles[manufacturer][model];
            vehicconstemplatesForModel.forEach(function(vehicconstemplate) {
                const vehicle = factory.newResource(namespace, 'Vehicle', vehicconstemplate.vin);
                vehicle.owner = people[vehicleResources.length+1];
                vehicle.vehicleStatus = vehicconstemplate.vehicleStatus;
                vehicle.vehicleDetails = factory.newConcept(namespace, 'VehicleDetails');
                vehicle.vehicleDetails.make = factory.newResource(namespace, 'Manufacturer', manufacturer);
                vehicle.vehicleDetails.modelType = model;
                vehicle.vehicleDetails.colour = vehicconstemplate.colour;

                vehicleResources.push(vehicle);
            });
        }
    }
    await vehicleRegistry.addAll(vehicleResources);
}