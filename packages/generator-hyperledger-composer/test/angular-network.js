'use strict';
let path = require('path');
let assert = require('yeoman-assert');
let helpers = require('yeoman-test');
const fs = require('fs');
const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const BrowserFS = require('browserfs/dist/node/index');
const bfs_fs = BrowserFS.BFSRequire('fs');
const IdCard = require('composer-common').IdCard;

describe('hyperledger-composer:angular for digitalPropertyNetwork running against a deployed business network', function () {

    let tmpDir; // This is the directory which we will create our app into
    before(function() {
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
        const adminConnection = new AdminConnection({ fs: bfs_fs });
        return adminConnection.createProfile('generatorProfile',{type : 'embedded'})
        .then(() => {
            return adminConnection.connectWithDetails('generatorProfile', 'admin', 'Xurw3yU9zI0l');
        })
        .then(() => {
            const banana = fs.readFileSync(path.resolve(__dirname+'/data/', 'digitalPropertyNetwork.bna'));
            return BusinessNetworkDefinition.fromArchive(banana);
        })
        .then((businessNetworkDefinition) => {
            return adminConnection.deploy(businessNetworkDefinition);
        })
        .then(() => {
            const idCard = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw', businessNetwork: 'digitalproperty-network' }, { name: 'generatorProfile', type: 'embedded' });
            return adminConnection.importCard('admin@digitalproperty-network', idCard);
        })
        .then(() => {
            return helpers.run(path.join(__dirname, '../generators/angular'))
            .inTmpDir(function (dir) {
                tmpDir = dir;
            })
            .withOptions({ skipInstall: true, embeddedRuntime: adminConnection })
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
                console.log('Error found:', error);
            })
            .on('ready', function (generator) {
                console.log('About to start generating files..');
                console.log('Creating temporary directory:',tmpDir);

            })
            .on('end', function(){
                console.log('Finished generating files');
                return adminConnection.disconnect();
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

});
