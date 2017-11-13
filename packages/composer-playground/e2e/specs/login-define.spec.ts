import { browser } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper';
import { Login } from '../component/login';
import { Deploy } from '../component/deploy';
import { Editor } from '../component/editor';
import { BusyAlert } from '../component/alert';

import * as chai from 'chai';

let expect = chai.expect;

describe('Login Define', (() => {

    // Navigate to Playground base page and move past welcome splash
    beforeAll(() => {
        // Important angular configuration and intial step passage to reach login
        browser.waitForAngularEnabled(false);
        OperationsHelper.navigatePastWelcome();
    });

    afterAll(() => {
        browser.waitForAngularEnabled(true);
        browser.executeScript('window.sessionStorage.clear();');
        browser.executeScript('window.localStorage.clear();');
    });

    describe('Create BusinessNetwork', (() => {
        it('should enable a default Business Network to be deployed on a named connection profile', (() => {

            let networkName = 'test-network';
            let profile = 'Web Browser';

            // Click to deploy on desired profile
            return Login.deployNewToProfile(profile)
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
                return Deploy.nameBusinessNetwork(networkName);
            })
            .then(() => {
                return Deploy.clickDeploy();
            })
            .then(() => {
                return Deploy.waitToDisappear();
            })
            .then(() => {
                return BusyAlert.waitToDisappear();
            })
            .then(() => {
                // Should now have an ID Card with the business network name defined above
                return Login.connectViaIdCard(profile, networkName);
            })
            .then(() => {
                // Should now be on main editor page for the business network
                return Editor.waitToAppear();
            })
            .then(() => {
                // Should have the correct named busnet once loaded
                Editor.waitForProjectFilesToLoad()
                .then(() => {
                    return Editor.retrieveDeployedPackageName()
                    .then((packageName) => {
                        expect(packageName).to.be.equal(networkName);
                    });
                });
            });
        }));
    }));

}));
