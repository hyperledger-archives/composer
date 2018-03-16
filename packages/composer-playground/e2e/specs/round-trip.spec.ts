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

import { browser } from 'protractor';
import { Login } from '../component/login';
import { OperationsHelper } from '../utils/operations-helper';
import { BusyAlert, SuccessAlert } from '../component/alert';
import { Constants } from '../constants';
import { CliHelper } from '../utils/cli-helper';
import { Deploy } from '../component/deploy';

import * as  fs from 'fs';
import * as chai from 'chai';
let expect = chai.expect;

describe('Fabric round trip', (() => {
    beforeAll(() => {
        browser.waitForAngularEnabled(false);
        OperationsHelper.navigatePastWelcome();
    });

    afterAll(() => {
        browser.waitForAngularEnabled(true);
        browser.executeScript('window.sessionStorage.clear();');
        browser.executeScript('window.localStorage.clear();');
    });

    it('should add the TestPeerAdmin card', () => {
        return Login.importBusinessNetworkCard(Constants.tempDir + '/' + Constants.peerAdminCardName)
        .then(() => {
            return SuccessAlert.waitToDisappear();
        });
    });

    it('should be able to deploy a business network against TestPeerAdmin', () => {
        let connectionProfile = JSON.parse(fs.readFileSync(Constants.fabricConfigDir + '/profiles/basic-connection-org1.json').toString());
        return Login.deployNewToProfile(connectionProfile.name)
        .then(() => {
            return Deploy.waitToAppear();
        })
        .then(() => {
            return Deploy.waitToLoadDeployBasisOptions();
        })
        .then(() => {
            return Deploy.selectDeployBasisOption('empty-business-network');
        })
        .then(() => {
          return Deploy.clearBusinessNetworkName();
        })
        .then(() => {
            return Deploy.nameBusinessNetwork('fabric-business-network');
        })
        .then(() => {
            return Deploy.selectUsernameAndSecret('admin', 'adminpw');
        })
        .then(() => {
            return Deploy.clickDeploy();
        })
        .then(() => {
            return Deploy.waitToDisappear(true);
        });
    }, Constants.vlongwait);

    it('should be able to download the created card', () => {
        return Login.exportBusinessNetworkCard('admin@fabric-business-network');
    });

    it('should be able to import the downloaded card into composer-cli and ping', () => {
        const cardName = 'adminCLI@fabric-business-network';
        const cardPath = Constants.downloadLocation + '/admin.card';

        return CliHelper.importCard(cardPath, cardName)
        .then((repsonse) => {
            expect(repsonse).to.include(`Card name: ${cardName}`);
            expect(repsonse).to.include('Command succeeded');
        })
        .then(() => {
            return CliHelper.pingCard(cardName);
        })
        .then((repsonse) => {
            expect(repsonse).to.include('participant: org.hyperledger.composer.system.NetworkAdmin#admin');
            expect(repsonse).to.include('Command succeeded');
        });
    });
}));
