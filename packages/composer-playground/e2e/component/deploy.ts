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
import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';

import { OperationsHelper } from '../utils/operations-helper';
import { dragDropFile } from '../utils/fileUtils';
import { Constants } from '../constants';

let baseTiles = ['basic-sample-network', 'empty-business-network', 'drag-drop'];

export class Deploy {

    // Wait for appear
    static waitToAppear() {
        return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.choose-network'))), Constants.shortWait);
    }

    static waitToLoadDeployBasisOptions() {
        return browser.wait(OperationsHelper.elementsPresent(element(by.css('.sample-network-list-container')).all(by.css('.sample-network-list-item')), baseTiles.length), Constants.shortWait);
    }

    // Wait for disappear
    static waitToDisappear(fabric?) {
        let wait = fabric ? Constants.vlongwait : Constants.shortWait;
        return browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.choose-network'))), wait);
    }

    // Name the network
    static clearBusinessNetworkName() {
            return element(by.id('import-businessNetworkName')).clear();
    }

    // Name the network
    static nameBusinessNetwork(name: string) {
            return element(by.id('import-businessNetworkName')).sendKeys(name);
    }

    static selectDeployFile(filePath: string) {
        this.retrieveBaseTileOptions()
        .then(() => {
            let inputFileElement = element(by.id('file-importer_input'));
            return dragDropFile(inputFileElement, filePath);
        });
    }

    // Deploy selected Tile option from Base tiles
    static selectDeployBasisOption(importOption: string) {
        // Wait for poplation of sample-network-list-item(s)
        this.retrieveBaseTileOptions()
        .then((options) => {
            // Figure out which one we want
            let index = baseTiles.findIndex((tile) => tile === importOption);
            return options[index].getWebElement();
        })
        .then((option) => {
            // Scroll into view and click
            browser.wait(browser.executeScript('arguments[0].scrollIntoView();', option), Constants.shortWait);
            return option.click();
        });
    }

    static selectUsernameAndSecret(username, secret) {
        let radioButton = element(by.css('.radio-label[for=noCert]'));
        let userId = element(by.id('userId'));
        let userSecret = element(by.id('userSecret'));

        return browser.wait(ExpectedConditions.visibilityOf(radioButton), Constants.shortWait)
        .then(() => {
            return radioButton.click();
        })
        .then(() => {
            return browser.wait(ExpectedConditions.visibilityOf(userId), Constants.shortWait);
        })
        .then(() => {
            return userId.sendKeys(username);
        })
        .then(() => {
            return browser.wait(ExpectedConditions.visibilityOf(userSecret), Constants.shortWait);
        })
        .then(() => {
            return userSecret.sendKeys(secret);
        });
    };

    static retrieveBaseTileOptions() {
        this.waitToLoadDeployBasisOptions();
        return element(by.css('.sample-network-list-container')).all(by.css('.sample-network-list-item'));

    }

    // Deploy
    static clickDeploy() {
       return OperationsHelper.click(element(by.id('import_confirm')));
    }
}
