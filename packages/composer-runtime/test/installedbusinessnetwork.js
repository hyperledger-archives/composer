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

const InstalledBusinessNetwork = require('../lib/installedbusinessnetwork');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const BusinessNetworkMetadata = require('composer-common').BusinessNetworkMetadata;

const chai = require('chai');
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('InstalledBusinessNetwork', () => {
    describe('#constructor', () => {

        let mockBusinessNetworkDefinition;
        let mockBusinessNetworkMetadata;
        let mockNetworkInfo;
        beforeEach(() => {
            mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            mockBusinessNetworkMetadata = sinon.createStubInstance(BusinessNetworkMetadata);
            mockBusinessNetworkDefinition.getMetadata.returns(mockBusinessNetworkMetadata);
            mockNetworkInfo = {
                definition: mockBusinessNetworkDefinition,
                compiledScriptBundle: 'scriptBundle',
                compiledQueryBundle: 'queryBundle',
                compiledAclBundle: 'aclBundle',
                archive: 'archive'
            };
        });

        it('should enable historian if no request to disable is present', () => {
            mockBusinessNetworkMetadata.getPackageJson.returns({'something': 'text'});
            const installedBusinessNetwork = new InstalledBusinessNetwork(mockNetworkInfo);
            installedBusinessNetwork.historianEnabled.should.be.true;
        });

        it('should disable historian if disableHistorian set to true', () => {
            mockBusinessNetworkMetadata.getPackageJson.returns({'disableHistorian': true});
            const installedBusinessNetwork = new InstalledBusinessNetwork(mockNetworkInfo);
            installedBusinessNetwork.historianEnabled.should.be.false;
        });

        it('should enable historian if disableHistorian set to false', () => {
            mockBusinessNetworkMetadata.getPackageJson.returns({'disableHistorian': false});
            const installedBusinessNetwork = new InstalledBusinessNetwork(mockNetworkInfo);
            installedBusinessNetwork.historianEnabled.should.be.true;
        });

        it('should disable historian if disableHistorian set to a non boolean', () => {
            mockBusinessNetworkMetadata.getPackageJson.returns({'disableHistorian': 1});
            const installedBusinessNetwork = new InstalledBusinessNetwork(mockNetworkInfo);
            installedBusinessNetwork.historianEnabled.should.be.true;
        });
    });
});
