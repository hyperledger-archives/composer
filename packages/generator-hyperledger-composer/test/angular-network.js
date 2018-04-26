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
const { BusinessNetworkDefinition} = require('composer-common');
const fs = require('fs');
const helpers = require('yeoman-test');
const IdCard = require('composer-common').IdCard;
const path = require('path');
const version = require('../package.json').version;

describe('hyperledger-composer:angular for digitalPropertyNetwork running against a deployed business network', function () {

    let tmpDir; // This is the directory which we will create our app into
    let businessNetworkDefinition;

    before(function() {
        let idCard_PeerAdmin = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw' }, {'x-type' : 'embedded',name:'generatorProfile'});
        require('composer-common').NetworkCardStoreManager;
        const adminConnection = new AdminConnection();

        const deployCardName = 'deployer-card';
        return adminConnection.importCard(deployCardName, idCard_PeerAdmin)
        .then(() => {
            return adminConnection.connect(deployCardName);
        })
        .then(() => {
            const banana = fs.readFileSync(path.resolve(__dirname+'/data/', 'digitalPropertyNetwork.bna'));
            return BusinessNetworkDefinition.fromArchive(banana);
        })
        .then((businessNetworkDefinition_) => {
            businessNetworkDefinition = businessNetworkDefinition_;
            return adminConnection.install(businessNetworkDefinition);
        })
        .then(() => {
            return adminConnection.start(businessNetworkDefinition.getName(), businessNetworkDefinition.getVersion(), {networkAdmins :[{userName:'admin',enrollmentSecret :'adminpw'}] });
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
            .withOptions({ skipInstall: true})
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

    beforeEach(() => {
        delete process.env.REST_SERVER_URL;
        delete process.env.REST_SERVER_URLS;
    });

    afterEach(() => {
        delete process.env.REST_SERVER_URL;
        delete process.env.REST_SERVER_URLS;
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
        assert.deepStrictEqual(myPackage.engines, {
            node: '>=8',
            npm: '>=5'
        }, 'incorrect engines in package file');
        assert.deepStrictEqual(myPackage.bin, {
            'digitalPropertyNetwork': 'app.js'
        }, 'incorrect bin in package file');
        assert.equal(myPackage.scripts.ng, 'ng', 'missing or invalid ng script');
        assert.equal(myPackage.scripts.prepack, 'npm run build', 'missing or invalid prepack script');
        assert.equal(myPackage.scripts.build, 'ng build', 'missing or invalid build script');
        assert.equal(myPackage.scripts.start, 'concurrently "ng serve --proxy-config proxy.conf.js --host 0.0.0.0" "npm run api"', 'missing or invalid start script');
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
            cfenv: '^1.0.4',
            'composer-rest-server': `^${version}`,
            concurrently: '^3.1.0',
            config: '^1.21.0',
            'core-js': '^2.4.1',
            express: '^4.16.3',
            'http-proxy-middleware': '^0.18.0',
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

    it('should create a suitable gitignore file', () => {
        const filePath = tmpDir + '/digitalPropertyNetwork/.gitignore';
        const fileContents = fs.readFileSync(filePath, 'utf8');
        assert(fileContents.length > 0, 'no file contents');
        assert.notEqual(fileContents.indexOf('\n/dist'), -1, '/dist folder ignored');
    });

    it('should create a suitable npmignore file', () => {
        const filePath = tmpDir + '/digitalPropertyNetwork/.npmignore';
        const fileContents = fs.readFileSync(filePath, 'utf8');
        assert(fileContents.length > 0, 'no file contents');
        assert.notEqual(fileContents.indexOf('\n# /dist'), -1, '/dist folder not ignored');
    });

    it('should create a suitable dockerignore file', () => {
        const filePath = tmpDir + '/digitalPropertyNetwork/.dockerignore';
        const fileContents = fs.readFileSync(filePath, 'utf8');
        assert(fileContents.length > 0, 'no file contents');
        assert.notEqual(fileContents.indexOf('\n/dist'), -1, '/dist folder ignored');
    });

    it('should create a suitable cfignore file', () => {
        const filePath = tmpDir + '/digitalPropertyNetwork/.cfignore';
        const fileContents = fs.readFileSync(filePath, 'utf8');
        assert(fileContents.length > 0, 'no file contents');
        assert.notEqual(fileContents.indexOf('\n# /dist'), -1, '/dist folder not ignored');
    });

    it('should create a suitable Dockerfile file', () => {
        const filePath = tmpDir + '/digitalPropertyNetwork/Dockerfile';
        const fileContents = fs.readFileSync(filePath, 'utf8');
        assert(fileContents.length > 0, 'no file contents');
        assert.notEqual(fileContents.indexOf('FROM node:8-alpine', -1, 'missing FROM line - not valid Dockerfile?'));
    });

    it('should create a suitable manifest.yml file', () => {
        const filePath = tmpDir + '/digitalPropertyNetwork/manifest.yml';
        const fileContents = fs.readFileSync(filePath, 'utf8');
        assert(fileContents.length > 0, 'no file contents');
        assert.notEqual(fileContents.indexOf('command: node app.js', -1, 'missing command line - not valid manifest.yml?'));
    });

    it('should create a suitable proxy.conf.js file', () => {
        const filePath = tmpDir + '/digitalPropertyNetwork/proxy.conf.js';
        delete require.cache[require.resolve(filePath)];
        const proxyConfig = require(filePath);
        assert(typeof proxyConfig[1].bypass === 'function', 'no bypass function');
        delete proxyConfig[1].bypass;
        assert.deepStrictEqual(proxyConfig, [
            {
                changeOrigin: true,
                context: [
                    '/auth',
                    '/api'
                ],
                secure: true,
                target: 'http://localhost:3000'
            },
            {
                changeOrigin: true,
                context: '/',
                secure: true,
                target: 'http://localhost:3000',
                ws: true
            }
        ], 'proxy configuration is wrong');
    });

    it('should create a suitable proxy.conf.js file that uses a REST server URL from the environment', () => {
        process.env.REST_SERVER_URL = 'https://doges-other-rest-server.dogecorp.com:9999';
        const filePath = tmpDir + '/digitalPropertyNetwork/proxy.conf.js';
        delete require.cache[require.resolve(filePath)];
        const proxyConfig = require(filePath);
        assert(typeof proxyConfig[1].bypass === 'function', 'no bypass function');
        delete proxyConfig[1].bypass;
        assert.deepStrictEqual(proxyConfig, [
            {
                changeOrigin: true,
                context: [
                    '/auth',
                    '/api'
                ],
                secure: true,
                target: 'https://doges-other-rest-server.dogecorp.com:9999'
            },
            {
                changeOrigin: true,
                context: '/',
                secure: true,
                target: 'https://doges-other-rest-server.dogecorp.com:9999',
                ws: true
            }
        ], 'proxy configuration is wrong');
    });

    it('should create a suitable proxy.conf.js file that uses a REST server URL from the environment for this business network', () => {
        process.env.REST_SERVER_URLS = JSON.stringify({
            'digitalproperty-network': 'https://doges-other-rest-server.dogecorp.com:9999'
        });
        const filePath = tmpDir + '/digitalPropertyNetwork/proxy.conf.js';
        delete require.cache[require.resolve(filePath)];
        const proxyConfig = require(filePath);
        assert(typeof proxyConfig[1].bypass === 'function', 'no bypass function');
        delete proxyConfig[1].bypass;
        assert.deepStrictEqual(proxyConfig, [
            {
                changeOrigin: true,
                context: [
                    '/auth',
                    '/api'
                ],
                secure: true,
                target: 'https://doges-other-rest-server.dogecorp.com:9999'
            },
            {
                changeOrigin: true,
                context: '/',
                secure: true,
                target: 'https://doges-other-rest-server.dogecorp.com:9999',
                ws: true
            }
        ], 'proxy configuration is wrong');
    });

    it('should create a suitable proxy.conf.js file that ignores a REST server URL from the environment for another business network', () => {
        process.env.REST_SERVER_URLS = JSON.stringify({
            'someother-network': 'https://doges-other-rest-server.dogecorp.com:9999'
        });
        const filePath = tmpDir + '/digitalPropertyNetwork/proxy.conf.js';
        delete require.cache[require.resolve(filePath)];
        const proxyConfig = require(filePath);
        assert(typeof proxyConfig[1].bypass === 'function', 'no bypass function');
        delete proxyConfig[1].bypass;
        assert.deepStrictEqual(proxyConfig, [
            {
                changeOrigin: true,
                context: [
                    '/auth',
                    '/api'
                ],
                secure: true,
                target: 'http://localhost:3000'
            },
            {
                changeOrigin: true,
                context: '/',
                secure: true,
                target: 'http://localhost:3000',
                ws: true
            }
        ], 'proxy configuration is wrong');
    });

});
