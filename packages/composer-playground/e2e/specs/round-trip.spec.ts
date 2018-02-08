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

import { Login } from '../component/login';
import { OperationsHelper } from '../utils/operations-helper';
import { browser, element, by, ElementFinder, WebElement } from 'protractor';
import * as  fs from 'fs';
import { Deploy } from '../component/deploy';
import { BusyAlert, SuccessAlert } from '../component/alert';
import * as child from 'child_process';
import { CliHelper } from '../utils/cli-helper';
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
        return Login.importBusinessNetworkCard('/tmp/TestPeerAdmin.card')
        .then(() => {
            return SuccessAlert.waitToDisappear();
        });
    });

    it('should be able to deploy a business network against TestPeerAdmin', () => {
        return Login.deployNewToProfile(JSON.parse(fs.readFileSync(__dirname + '/../fabric/hlfv1/profiles/basic-connection-org1.json').toString()).name)
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
    });

    it('should be able to download the created card', () => {
        return Login.exportBusinessNetworkCard('admin@fabric-business-network');
    });

    it('should be able to import the downloaded card into composer-cli and ping', () => {
        const cardName = 'adminCLI@fabric-business-network';
        return CliHelper.importCard(__dirname + '/../downloads/admin.card', cardName)
        .then((out) => {
            expect(out).to.include(`Card name: ${cardName}`);
            expect(out).to.include('Command succeeded');
            return CliHelper.pingCard(cardName);
        })
        .then((out) => {
            expect(out).to.include('participant: org.hyperledger.composer.system.NetworkAdmin#admin');
            expect(out).to.include('Command succeeded');
        });
    });
}));
