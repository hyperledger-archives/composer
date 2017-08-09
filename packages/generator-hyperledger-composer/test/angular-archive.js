'use strict';
let path = require('path');
let assert = require('yeoman-assert');
let helpers = require('yeoman-test');

describe('hyperledger-composer:angular for digitalPropertyNetwork running against a business network archive file', function () {

    let tmpDir; // This is the directory which we will create our app into
    before(function() {
        return helpers.run(path.join(__dirname, '../generators/angular'))
        .inTmpDir(function (dir) {
            tmpDir = dir;
        })
        .withOptions({ skipInstall: true })
        .withPrompts({
            liveNetwork: false,
            appName: 'digitalPropertyNetwork',
            appDescription: 'A digitalPropertyNetwork application',
            authorName: 'TestUser',
            authorEmail: 'TestUser@TestApp.com',
            fileName: __dirname+'/data/digitalPropertyNetwork.bna',
            apiIP: 'http://localhost',
            apiPort: 3000,
            apiNamespace: 'never'
        })
        .on('error', function (error) {
            console.log('Error found:', error);
        })
        .on('ready', function (generator) {
            console.log('About to start generating files..');
            console.log('Creating temporary directory:',tmpDir);

        })
        .on('end', function(){
            console.log('Finished generating files');
        });

    });

    it('creates typescript classes', function(){
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/net.biz.digitalPropertyNetwork.ts');
        assert.fileContent(tmpDir+'/digitalPropertyNetwork/src/app/net.biz.digitalPropertyNetwork.ts',
`import {Asset} from './org.hyperledger.composer.system';
import {Participant} from './org.hyperledger.composer.system';
import {Transaction} from './org.hyperledger.composer.system';
import {Event} from './org.hyperledger.composer.system';
// export namespace net.biz.digitalPropertyNetwork{
   export class LandTitle extends Asset {
      titleId: string;
      owner: Person;
      information: string;
      forSale: boolean;
   }
   export class SalesAgreement extends Asset {
      salesId: string;
      buyer: Person;
      seller: Person;
      title: LandTitle;
   }
   export class Person extends Participant {
      personId: string;
      firstName: string;
      lastName: string;
   }
   export class RegisterPropertyForSale extends Transaction {
      seller: Person;
      title: LandTitle;
   }
// }`
        );
    });

    it('creates LandTitle component typescript', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/LandTitle/LandTitle.component.ts');
    });

    it('creates LandTitle component css', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/LandTitle/LandTitle.component.css');
    });

    it('creates SalesAgreement component typescript', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.component.ts');
    });

    it('creates SalesAgreement component test', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.component.spec.ts');
    });

    it('creates SalesAgreement service', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.service.ts');
    });

    it('creates SalesAgreement component html', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.component.html');
    });

    it('creates SalesAgreement component css', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.component.css');
    });

});


describe('hyperledger-composer:angular for CarAuction-Network running against a business network archive file', function () {

    let tmpDir; // This is the directory which we will create our app into

    before(function() {
        return helpers.run(path.join(__dirname, '../generators/angular'))
        .inTmpDir(function (dir) {
            tmpDir = dir;
        })
        .withPrompts({
            liveNetwork: false,
            appName: 'CarAuction-Network',
            appDescription: 'A CarAuction-Network application',
            authorName: 'TestUser',
            authorEmail: 'TestUser@TestApp.com',
            fileName: __dirname+'/data/carAuction.bna'
        })
        .on('error', function (error) {
            console.log('Error found:', error);
        })
        .on('ready', function (generator) {
            console.log('About to start generating files..');
            console.log('Creating temporary directory:',tmpDir);

        }).on('end', function(){
            console.log('Finished generating files');
        });

    });

    it('creates typescript classes', function(){
        assert.file(tmpDir+'/CarAuction-Network/src/app/org.acme.vehicle.auction.ts');
        assert.fileContent(tmpDir+'/CarAuction-Network/src/app/org.acme.vehicle.auction.ts',
        `import {Asset} from './org.hyperledger.composer.system';
import {Participant} from './org.hyperledger.composer.system';
import {Transaction} from './org.hyperledger.composer.system';
import {Event} from './org.hyperledger.composer.system';
// export namespace org.acme.vehicle.auction{
   export class Vehicle extends Asset {
      vin: string;
      owner: Member;
   }
   export enum ListingState {
      FOR_SALE,
      RESERVE_NOT_MET,
      SOLD,
   }
   export class VehicleListing extends Asset {
      listingId: string;
      reservePrice: number;
      description: string;
      state: ListingState;
      offers: Offer[];
      vehicle: Vehicle;
   }
   export abstract class User extends Participant {
      email: string;
      firstName: string;
      lastName: string;
   }
   export class Member extends User {
      balance: number;
   }
   export class Auctioneer extends User {
   }
   export class Offer extends Transaction {
      bidPrice: number;
      listing: VehicleListing;
      member: Member;
   }
   export class CloseBidding extends Transaction {
      listing: VehicleListing;
   }
// }`);
    });

    it('creates VehicleListing component typescript', function () {
        assert.file(tmpDir+'/CarAuction-Network/src/app/VehicleListing/VehicleListing.component.ts');
    });

    it('creates VehicleListing component test', function () {
        assert.file(tmpDir+'/CarAuction-Network/src/app/VehicleListing/VehicleListing.component.spec.ts');
    });

    it('creates VehicleListing service', function () {
        assert.file(tmpDir+'/CarAuction-Network/src/app/VehicleListing/VehicleListing.service.ts');
    });

    it('creates VehicleListing component html', function () {
        assert.file(tmpDir+'/CarAuction-Network/src/app/VehicleListing/VehicleListing.component.html');
    });

    it('creates VehicleListing component css', function () {
        assert.file(tmpDir+'/CarAuction-Network/src/app/VehicleListing/VehicleListing.component.css');
    });

    it('creates Vehicle component typescript', function () {
        assert.file(tmpDir+'/CarAuction-Network/src/app/Vehicle/Vehicle.component.ts');
    });

    it('creates Vehicle component test', function () {
        assert.file(tmpDir+'/CarAuction-Network/src/app/Vehicle/Vehicle.component.spec.ts');
    });

    it('creates Vehicle service', function () {
        assert.file(tmpDir+'/CarAuction-Network/src/app/Vehicle/Vehicle.service.ts');
    });

    it('creates Vehicle component html', function () {
        assert.file(tmpDir+'/CarAuction-Network/src/app/Vehicle/Vehicle.component.html');
    });

    it('creates Vehicle component css', function () {
        assert.file(tmpDir+'/CarAuction-Network/src/app/Vehicle/Vehicle.component.css');
    });

});



