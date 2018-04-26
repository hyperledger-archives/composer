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

import path = require('path');
import MDCodeExtractor = require('../../composer-tests-integration/lib/md-code-extractor');

export class Constants {

    static readonly shortWait = 5000;

    static readonly longWait = 10000;

    static readonly mlongwait = 30000;

    static readonly vlongwait = 240000;

    static readonly vvlongwait = 320000;

    static readonly webPlaygroundPort = 3001;
    static readonly fabricPlaygroundPort = 3002;

    static readonly downloadLocation = path.join(__dirname, 'downloads');
    static readonly sampleNetworkDir = path.join(__dirname, 'data/sample-networks');
    static readonly tempDir = path.join(__dirname, 'tmp');
    static readonly scriptsDir = path.join(__dirname, 'scripts');

    static readonly fabricBaseDir = path.join(__dirname, 'fabric');
    static readonly fabricConfigDir = path.join(Constants.fabricBaseDir, 'hlfv1');
    static readonly peerAdminCardName = 'TestPeerAdmin.card';

    static readonly addFileActionLabel = 'Add a file...';
    static readonly exportActionLabel = 'Export';
    static readonly deployButtonLabel = 'Deploy changes';

    static readonly defaultACL = path.join(__dirname, 'data/files/defaultACL.acl');

    static readonly sampleNetworks = ['basic-sample-network', 'import-network'];

    static readonly basicSampleNetwork = {
        name: 'basic-sample-network',
        files: ['About\nREADME.md, package.json', 'Model File\nmodels/sample.cto', 'Script File\nlib/sample.js', 'Access Control\npermissions.acl'],
        participants: [{type: 'SampleParticipant', example: path.join(__dirname, 'data/files/identity/participants/CONGA.json')}],
        assets: [{type: 'SampleAsset'}],
        registryHeaders: {
            sampleParticipant: ['Participant registry for org.acme.sample.SampleParticipant']
        }
    };

    static readonly emptyBusinessNetwork = {
        name: 'empty-business-network',
        files: ['About\nREADME.md, package.json', 'Access Control\npermissions.acl', 'Model File\nmodels/model.cto'],
        participants: [],
        assets: [],
        registryHeaders: {}
    };

    static myIDsStatuses = {
        inWallet: 'In my wallet',
        selected: 'In Use',
        participantNotFound: 'Bound participant not found'
    };

    static readonly allIDsStatuses = {
        activated: 'ACTIVATED',
        issued: 'ISSUED',
        participantNotFound: 'BOUND PARTICIPANT NOT FOUND'
    };

    static readonly codeBlocks = {
        playgroundTutorial: MDCodeExtractor.extract(path.join(__dirname, '../..', 'composer-website/jekylldocs/tutorials/playground-tutorial.md'))
    };
}
