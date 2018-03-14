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

'use strict';

const assert = require('yeoman-assert');
const fs = require('fs');
const helpers = require('yeoman-test');
const path = require('path');
const version = require('../package.json').version;

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
            assert.fail('Error found:', error);
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
            assert.fail('Error found:', error);
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

    it('should create a package.json file that contains mapped input', () => {
        let packageFile = tmpDir + '/CarAuction-Network/package.json';
        assert(fs.existsSync(packageFile), 'No package.json file detected in test run');

        let myPackage = require(packageFile);
        assert.equal(myPackage.name, 'CarAuction-Network', 'incorrect name in packaage file');
        assert.equal(myPackage.description, 'A CarAuction-Network application', 'incorrect description in packaage file');
        assert.equal(myPackage.author, 'TestUser', 'incorrect author in packaage file');
        assert.equal(myPackage.email, 'TestUser@TestApp.com', 'incorrect email in packaage file');
        assert.equal(myPackage.license, 'Apache-2.0', 'incorrect license in packaage file');
        assert.equal(myPackage.start, undefined, 'incorrect start in packaage file');
        assert.equal(myPackage.app, undefined, 'incorrect app in packaage file');
        assert.deepStrictEqual(myPackage.dependencies,        {
            '@angular/common': '^4.0.0',
            '@angular/compiler': '^4.0.0',
            '@angular/core': '^4.0.0',
            '@angular/forms': '^4.0.0',
            '@angular/http': '^4.0.0',
            '@angular/platform-browser': '^4.0.0',
            '@angular/platform-browser-dynamic': '^4.0.0',
            '@angular/router': '^4.0.0',
            bootstrap: '^3.3.7',
            'composer-client': `^${version}`,
            'composer-rest-server': `^${version}`,
            concurrently: '^3.1.0',
            config: '^1.21.0',
            'core-js': '^2.4.1',
            jquery: '^3.2.1',
            rxjs: '^5.1.0',
            tether: '^1.4.0',
            'zone.js': '^0.8.4',
        }, 'incorrect production dependencies in package file');
        assert.deepStrictEqual(myPackage.devDependencies, {
            '@angular/cli': '1.0.1',
            '@angular/compiler-cli': '^4.0.0',
            '@types/jasmine': '2.5.52',
            '@types/node': '7.0.5',
            codelyzer: '~2.0.0',
            'jasmine-core': '~2.5.2',
            'jasmine-spec-reporter': '~3.2.0',
            karma: '~1.4.1',
            'karma-chrome-launcher': '~2.0.0',
            'karma-cli': '~1.0.1',
            'karma-coverage-istanbul-reporter': '^0.2.0',
            'karma-jasmine': '~1.1.0',
            'karma-jasmine-html-reporter': '^0.2.2',
            protractor: '~5.1.0',
            'ts-node': '~2.0.0',
            tslint: '~4.5.0',
            typescript: '~2.2.0',
        }, 'incorrect development dependencies in package file');
    });

});



