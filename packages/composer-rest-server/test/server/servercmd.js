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
const BrowserFS = require('browserfs/dist/node/index');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const fs = require('fs');
const path = require('path');
const startRestServer = require('../../server/servercmd').startRestServer;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

const bfs_fs = BrowserFS.BFSRequire('fs');

describe('servercmd', () => {

    let composerConfig;

    before(() => {
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
        const adminConnection = new AdminConnection({ fs: bfs_fs });
        return adminConnection.createProfile('defaultProfile', {
            type : 'embedded'
        })
        .then(() => {
            return adminConnection.connect('defaultProfile', 'admin', 'Xurw3yU9zI0l');
        })
        .then(() => {
            const banana = fs.readFileSync(path.resolve(__dirname, '..', 'bond-network.bna'));
            return BusinessNetworkDefinition.fromArchive(banana);
        })
        .then((businessNetworkDefinition) => {
            return adminConnection.deploy(businessNetworkDefinition);
        });
    });

    beforeEach(() => {
        composerConfig = {
            connectionProfileName: 'defaultProfile',
            businessNetworkIdentifier: 'bond-network',
            participantId: 'admin',
            participantPwd: 'adminpw',
            fs: bfs_fs
        };
        delete process.env.COMPOSER_DATASOURCES;
        delete process.env.COMPOSER_PROVIDERS;
    });

    afterEach(() => {
        delete process.env.COMPOSER_DATASOURCES;
        delete process.env.COMPOSER_PROVIDERS;
    });

    it('should throw if composer not specified', () => {
        (() => {
            startRestServer(null);
        }).should.throw(/composer not specified/);
    });

    it('test the index.js', () => {
        require('../../index.js');
        // (() => {
        //     require('../../index.js').restserver(null);
        // }).should.throw(/composer not specified/);
    });

    it('should create an application without security enabled', () => {
        return startRestServer(composerConfig)
            .then(() => {
                sinon.assert.pass(true);
            }).catch( (error)=>{
                sinon.assert.fail(error);
            } );
    });



});
