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

const AdminConnection = require('composer-admin').AdminConnection;
const assert = require('yeoman-assert');
const { BusinessNetworkDefinition, NetworkCardStoreManager } = require('composer-common');
const fs = require('fs');
const helpers = require('yeoman-test');
const IdCard = require('composer-common').IdCard;
const path = require('path');
const version = require('../package.json').version;

describe('hyperledger-composer:angular for digitalPropertyNetwork running against a deployed business network', function () {

    let tmpDir; // This is the directory which we will create our app into

    before(function() {
        let idCard_PeerAdmin = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw' }, {'x-type' : 'embedded',name:'generatorProfile'});
        require('composer-common').NetworkCardStoreManager;
        const cardStore = NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );
        const adminConnection = new AdminConnection({ cardStore });

        const deployCardName = 'deployer-card';
        return adminConnection.importCard(deployCardName, idCard_PeerAdmin)
        .then(() => {
            return adminConnection.connect(deployCardName);
        })
        .then(() => {
            const banana = fs.readFileSync(path.resolve(__dirname+'/data/', 'digitalPropertyNetwork.bna'));
            return BusinessNetworkDefinition.fromArchive(banana);
        })
        .then((businessNetworkDefinition) => {
            return adminConnection.deploy(businessNetworkDefinition, {networkAdmins :[{userName:'admin',enrollmentSecret :'adminpw'}] });
        })
        .then(() => {
            const idCard = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw', businessNetwork: 'digitalproperty-network' }, { name: 'generatorProfile', 'x-type': 'embedded' });
            return adminConnection.importCard('admin@digitalproperty-network', idCard);
        })
        .then(() => {
            return helpers.run(path.join(__dirname, '../generators/angular'))
            .inTmpDir(function (dir) {
                tmpDir = dir;
            })
            .withOptions({ skipInstall: true, cardStore })
            .withPrompts({
                liveNetwork: true,
                appName: 'digitalPropertyNetwork',
                appDescription: 'A digitalPropertyNetwork application',
                authorName: 'TestUser',
                authorEmail: 'TestUser@TestApp.com',
                cardName: 'admin@digitalproperty-network',
                apiServer: 'generate',
                apiPort: 3000,
                apiNamespace: 'always'
            })
            .on('error', function (error) {
                assert.fail('Error found:', error);
            });
        });

    });

    it('creates typescript classes', function(){
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/net.biz.digitalPropertyNetwork.ts');
    });

    it('creates LandTitle component typescript', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/LandTitle/LandTitle.component.ts');
    });

    it('creates LandTitle component test', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/LandTitle/LandTitle.component.spec.ts');
    });

    it('creates LandTitle service', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/LandTitle/LandTitle.service.ts');
    });

    it('creates LandTitle component html', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/LandTitle/LandTitle.component.html');
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

    it('should create a package.json file that contains mapped input', () => {
        let packageFile = tmpDir + '/digitalPropertyNetwork/package.json';
        assert(fs.existsSync(packageFile), 'No package.json file detected in test run');

        let myPackage = require(packageFile);
        assert.equal(myPackage.name, 'digitalPropertyNetwork', 'incorrect name in packaage file');
        assert.equal(myPackage.description, 'A digitalPropertyNetwork application', 'incorrect description in packaage file');
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
