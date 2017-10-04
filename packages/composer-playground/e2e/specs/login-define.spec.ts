import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper';
import { Login } from '../component/login';
import { Deploy } from '../component/deploy';
import { Editor } from '../component/editor';

import * as chai from 'chai';
import * as  fs from 'fs';
import * as JSZip from 'jszip';

let expect = chai.expect;

describe('Login Define', (() => {

// Navigate to Playground base page and move past welcome splash
beforeAll(() =>  {
    // Important angular configuration and intial step passage to reach login
    browser.waitForAngularEnabled(false);
    OperationsHelper.navigatePastWelcome();
  });

  afterAll(() =>  {
    browser.waitForAngularEnabled(true);
    browser.executeScript('window.sessionStorage.clear();');
    browser.executeScript('window.localStorage.clear();');
  });

  describe('Create BusinessNetwork', (() =>{
    it('should enable default BNetwork deploy on named connection profile', (() => {

        let networkName = 'test-network';
        let profile = 'Web Browser';

        // Click to deploy on desired profile
        Login.deployNewToProfile(profile)

        // Deploy item should appear
        Deploy.waitToAppear();
        Deploy.waitToLoadDeployBasisOptions();

        // Name the network and base it on empty network
        Deploy.nameBusinessNetwork(networkName);
        Deploy.selectDeployBasisOption('empty-business-network');

        // Deploy
        Deploy.clickDeploy();

        // Should disappear and return to login page
        Deploy.waitToDisappear();

        // Should now have an ID Card with the business network name defined above
        Login.connectViaIdCard(profile, networkName);

        // Should now be on main editor page for the business network
        Editor.waitToAppear();

        // Should have the correct named busnet once loaded
        Editor.waitForProjectFilesToLoad();
        Editor.retrieveDeployedPackageName()
        .then((packageName) => {
            expect(packageName).to.be.equal(networkName);
        });

    }));
  }));

}));
