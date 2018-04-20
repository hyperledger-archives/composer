Vehicle Manufacture Network

This network tracks the manufacture of vehicles from an initial order request through to their completion by the manufacturer. A regulator is able to provide oversight throughout this whole process.

Models within this business network

Participants
Person Manufacturer Regulator

Assets

Order Vehicle

Transactions

PlaceOrder UpdateOrderStatus SetupDemo

Events

PlaceOrderEvent UpdateOrderStatusEvent

Example use of this business network
A Person uses a manufacturer's application to build their desired car and order it. The application submits a PlaceOrder transaction which creates a new Order asset containing the details of the vehicle the Person wishes to have made for them. The Manufacturer begins work on the car and as it proceeds through stages of production the Manufacturer submits UpdateOrderStatus transactions to mark the change in status for the Order e.g. updating the status from PLACED to SCHEDULEDFORMANUFACTURE. Once the Manufacturer has completed production for the Order they register the car by submitting an UpdateOrderStatus transaction with the status VINASSIGNED (also providing the VIN to register against) and a Vehicle asset is formally added to the registry using the details specified in the Order. Once the car is registered then the Manufacturer submits an UpdateOrderStatus transaction with a status of OWNERASSIGNED at which point the owner field of the Vehicle is set to match the orderer field of the Order. The regulator would perform oversight over this whole process.

Testing this network within playground
Navigate to the Test tab and then submit a SetupDemo transaction:

{
  "$class": "org.acme.vehicle_network.SetupDemo"
}

This will generate three Manufacturer participants, fourteen Person participants, a single Regulator participant and thirteen Vehicle assets.

Next order your car (an orange Arium Gamora) by submitting a PlaceOrder transaction:

{
  "$class": "org.acme.vehicle_network.PlaceOrder",
  "orderId": "1234",
  "vehicleDetails": {
    "$class": "org.acme.vehicle_network.VehicleDetails",
    "make": "resource:org.acme.vehicle_network.Manufacturer#Arium",
    "modelType": "Gamora",
    "colour": "Sunburst Orange"
  },
  "options": {
    "trim": "executive",
    "interior": "red rum",
    "extras": ["tinted windows", "extended warranty"]
  },
  "orderer": "resource:org.acme.vehicle_network.Person#Paul"
}

This PlaceOrder transaction generates a new Order asset in the registry and emits a PlaceOrderEvent event.

Now simulate the order being accepted by the manufacturer by submitting an UpdateOrderStatus transaction:

{
  "$class": "org.acme.vehicle_network.UpdateOrderStatus",
  "orderStatus": "SCHEDULEDFORMANUFACTURE",
  "order": "resource:org.acme.vehicle_network.Order#1234"
}

This UpdateOrderStatus transaction updates the orderStatus of the Order with orderId 1234 in the asset registry and emits an UpdateOrderStatusEvent event.

Simulate the manufacturer registering the vehicle with the regulator by submitting an UpdateOrderStatus transaction:

{
  "$class": "org.acme.vehicle_network.UpdateOrderStatus",
  "orderStatus": "VIN_ASSIGNED",
  "order": "resource:org.acme.vehicle_network.Order#1234",
  "vin": "abc123"
}

This UpdateOrderStatus transaction updates the orderStatus of the Order with orderId 1234 in the asset registry, create a new Vehicle based of that Order in the asset registry and emits an UpdateOrderStatusEvent event. At this stage as the vehicle does not have an owner assigned to it, its status is declared as OFFTHEROAD.

Next assign the owner of the vehicle using an UpdateOrderStatus transaction:

{
  "$class": "org.acme.vehicle_network.UpdateOrderStatus",
  "orderStatus": "OWNER_ASSIGNED",
  "order": "resource:org.acme.vehicle_network.Order#1234",
  "vin": 'abc123'
}

This UpdateOrderStatus transaction updates the orderStatus of the Order with orderId 1234 in the asset registry, update the Vehicle asset with VIN abc123 to have an owner of Paul (who we intially marked as the orderer in the PlaceOrder transaction) and status of ACTIVE and also emits an UpdateOrderStatusEvent event.

Finally complete the ordering process by marking the order as DELIVERED through submitting another UpdateOrderStatus transaction:

{
  "$class": "org.acme.vehicle_network.UpdateOrderStatus",
  "orderStatus": "DELIVERED",
  "order": "resource:org.acme.vehicle_network.Order#1234"
}

This UpdateOrderStatus transaction updates the orderStatus of the Order with orderId 1234 in the asset registry and emits an UpdateOrderStatusEvent event.

This Business Network definition has been used to create demo applications that simulate the scenario outlined above. You can find more detail on these at https://github.com/hyperledger/composer-sample-applications/tree/master/packages/vehicle-manufacture

Permissions in this business network for modelled participants
Within this network permissions are outlines for the participants outlining what they can and can't do. The rules in the permissions.acl file explicitly ALLOW participants to perform actions. Actions not written for a participant in that file are blocked.
Regulator
RegulatorAdminUser - Gives the regulator permission to perform ALL actions on ALL resources

Manufacturer
ManufacturerUpdateOrder - Allows a manufacturer to UPDATE an Order asset's data only using an UpdateOrderStatus transaction. The manufacturer must also be specified as the vehicleDetails.make in the Order asset.

ManufacturerUpdateOrderStatus - Allows a manufacturer to CREATE and READ UpdateOrderStatus transactions that refer to an order that they are specified as the vehicleDetails.make in.

ManufacturerReadOrder - Allows a manufacturer to READ an Order asset that they are specified as the vehicleDetails.make in.

ManufacturerCreateVehicle - Allows a manufacturer to CREATE a vehicle asset only using a UpdateOrderStatus transaction. The transaction must have an orderStatus of VIN_ASSIGNED and the Order asset have the manufacturer specified as the vehicleDetails.make.

ManufacturerReadVehicle - Allows a manufacturer to READ a Vehicle asset that they are specified as the vehicleDetails.make in.

Person
PersonMakeOrder - Gives the person permission to CREATE an Order asset only using a PlaceOrder transaction. The person must also be specified as the orderer in the Order asset.

PersonPlaceOrder - Gives the person permission to CREATE and READ PlaceOrder transactions that refer to an order that they are specified as orderer in.

PersonReadOrder - Gives the person permission to READ an Order asset that they are specified as the orderer in.