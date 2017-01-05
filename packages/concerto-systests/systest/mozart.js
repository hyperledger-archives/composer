/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';
// COMMENTED OUT UNTIL TRANSACTIONS WORK

// const path = require('path');
// const fs = require('fs');
// const TestUtil = require('./testutil');
// const BusinessNetwork = require('@ibm/ibm-concerto-common').BusinessNetwork;
// const FIELD_COUNT = 2;
// const ANIMAL_COUNT = 2;
// const FARMER_COUNT = 2;
// const REGULATOR_COUNT = 1;
//
// let businessNetwork;
// let admin;
// let client;
// const MOZART_NS = 'com.ibm.concerto.mozart';
//
// describe.only('Mozart', () => {
//
//     before(function () {
//         const modelFiles = [
//             fs.readFileSync(path.resolve(__dirname, 'data/mozart.cto'), 'utf8')
//         ];
//         businessNetwork = new BusinessNetwork(MOZART_NS, 'Mozart business network');
//         modelFiles.forEach((modelFile) => {
//             businessNetwork.getModelManager().addModelFile(modelFile);
//         });
//         admin = TestUtil.getAdmin();
//         return admin.deploy(businessNetwork)
//         .then(() => {
//             return TestUtil.getClient(MOZART_NS)
//                 .then((result) => {
//                     client = result;
//                 });
//         });
//     });
//
//
//
//
//     it('test1', () => {
//         let factory = client.getBusinessNetwork().getFactory();
//         let serializer = client.getBusinessNetwork().getSerializer();
//
//         return client.getAssetRegistry(MOZART_NS + '.Regulator')
//             .catch(() => {
//                 // add regulator registry
//                 console.error('Creating Regulator registry ...');
//                 return client.addAssetRegistry(MOZART_NS + '.Regulator', 'Regulator Registry' );
//             })
//             .then((regulatorRegistry) => {
//                 const regulators = [];
//                 // create regulators
//                 for(let n=0; n < REGULATOR_COUNT; n++) {
//                     const regulator = factory.newInstance(MOZART_NS, 'Regulator', 'REGULATOR_' + n + '@defra.gov.uk');
//                     regulator.firstName = 'Regulator';
//                     regulator.lastName = '' + n;
//                     console.log('Registered Regulator ' + regulator.$identifier);
//                     regulators.push(regulator);
//                 }
//                 return regulatorRegistry.addAll(regulators);
//             })
//             .then(() => {
//                 // get farm registry
//                 return client.getAssetRegistry(MOZART_NS + '.Farmer')
//                 .catch(() => {
//                     // add farm registry
//                     console.error('Creating Farmer registry ...');
//                     return client.addAssetRegistry(MOZART_NS + '.Farmer', 'Farmer Registry' );
//                 });
//             })
//             .then((farmRegistry) => {
//                 const farmers = [];
//
//                 // create farmers
//                 for(let n=0; n < FARMER_COUNT; n++) {
//                     const farmer = factory.newInstance(MOZART_NS, 'Farmer', 'FARMER_' + n);
//                     if(n === 0) {
//                         farmer.firstName = 'Alice';
//                     }
//                     else {
//                         farmer.firstName = 'Bob';
//                     }
//                     farmer.lastName = 'MacDonald';
//                     farmer.address1 = 'Oak Tree Farm';
//                     farmer.address2 = '';
//                     farmer.county = 'Hampshire';
//                     farmer.postcode = 'SO31 6TB';
//                     farmer.business = factory.newRelationship(MOZART_NS, 'Business', 'FARM_' + n);
//                     console.log('Registered Farmer ' + farmer.$identifier);
//                     farmers.push(farmer);
//                 }
//
//                 return farmRegistry.addAll(farmers);
//             })
//             .then(() => {
//                 // get business registry
//                 return client.getAssetRegistry(MOZART_NS + '.Business')
//                 .catch(() => {
//                     // add business registry
//                     console.error('Creating Business registry ...');
//                     return client.addAssetRegistry(MOZART_NS + '.Business', 'Business Registry' );
//                 });
//             })
//             .then((businessRegistry) => {
//                 const businesses = [];
//
//                 // create businesses
//                 for(let n=0; n < FARMER_COUNT; n++) {
//                     const business = factory.newInstance(MOZART_NS, 'Business', 'FARM_' + n);
//                     business.address1 = 'Oak Tree Farm';
//                     business.address2 = '';
//                     business.county = 'Hampshire';
//                     business.postcode = 'SO31 6TB';
//                     business.owner = factory.newRelationship(MOZART_NS, 'Farmer', 'FARMER_' + n);
//                     console.log('Registered Business ' + business.$identifier);
//                     businesses.push(business);
//                 }
//
//                 return businessRegistry.addAll(businesses);
//             })
//             .then(() => {
//                 // get field registry
//                 return client.getAssetRegistry(MOZART_NS + '.Field')
//                 .catch(() => {
//                     // add field registry
//                     console.error('Creating Field registry ...');
//                     return client.addAssetRegistry(MOZART_NS + '.Field', 'Field Registry' );
//                 });
//             })
//             .then((fieldRegistry) => {
//                 const fields = [];
//
//                 // create fields and assign to farms
//                 for(let n=0; n < FIELD_COUNT; n++) {
//                     const field = factory.newInstance(MOZART_NS, 'Field', 'FIELD_' + n);
//                     field.name = field.$identifier;
//                     const businessIndex = n % FARMER_COUNT;
//                     field.business = factory.newRelationship(MOZART_NS, 'Business', 'FARM_' + businessIndex);
//                     console.log('Registered Field ' + field.$identifier);
//                     fields.push(field);
//                 }
//
//                 return fieldRegistry.addAll(fields);
//             })
//             .then(() => {
//                 // get animal registry
//                 return client.getAssetRegistry(MOZART_NS + '.Animal')
//                 .catch(() => {
//                     // add animal registry
//                     console.error('Creating Animal registry ...');
//                     return client.addAssetRegistry(MOZART_NS + '.Animal', 'Animal Registry' );
//                 });
//             })
//             .catch(() => {
//                 // add animal registry
//                 return client.addAssetRegistry(MOZART_NS + '.Animal', 'Animal Registry' );
//             })
//             .then((animalRegistry) => {
//                 // create animals and assign to fields
//                 const animals = [];
//                 for(let n=0; n < ANIMAL_COUNT; n++) {
//                     const animal = factory.newInstance(MOZART_NS, 'Animal', 'ANIMAL_' + n);
//                     animal.species = 'SHEEP_GOAT';
//                     animal.movementStatus = 'IN_FIELD';
//                     animal.productionType = 'MEAT';
//                     const fieldIndex = n % FIELD_COUNT;
//                     const businessIndex = fieldIndex % FARMER_COUNT;
//                     animal.location = factory.newRelationship(MOZART_NS, 'Field', 'FIELD_' + fieldIndex);
//                     animal.owner = factory.newRelationship(MOZART_NS, 'Farmer', 'FARMER_' + businessIndex);
//                     console.log('Registered Animal ' + animal.$identifier);
//                     animals.push(animal);
//                 }
//
//                 return animalRegistry.addAll(animals);
//             })
//             .then(() => {
//                 console.log('Finished uploading resources');
//                 return client.getAssetRegistry(MOZART_NS + '.Animal');
//
//             })
//             .then(animalRegistry => {
//                 console.log('animalRegistry is:',animalRegistry);
//                 return animalRegistry.get('ANIMAL_0');
//             })
//             .then(animal => {
//                 console.log('What is ANIMAL0?',animal);
//
//
//             //     let transaction = {
//             //     $class : "com.ibm.concerto.mozart.AnimalMovementDeparture",
//             //     fromField : this.animals[x].location.cph,
//             //     animal : this.animals[x].animalId,
//             //     from : this.animals[x].location.business.sbi,
//             //     to : this.selectedBusinessId,
//             //     timestamp : new Date().toISOString()
//             // };
//
//                 let transaction = {
//                     $class : MOZART_NS + '.AnimalMovementDeparture',
//                     fromField : 'FIELD_0',
//                     animal : animal.animalId,
//                     from : 'FARM_0',
//                     to : 'FARM_1',
//                     timestamp : new Date().toISOString()
//                 };
//                 let newtx = serializer.fromJSON(transaction);
//                 console.log('what is tx',transaction);
//                 return client.submitTransaction(newtx);
//
//             })
//             .then(result => {
//                 console.log('what is result',result);
//             });
//     });
// });
