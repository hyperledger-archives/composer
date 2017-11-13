import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';

import { OperationsHelper } from '../utils/operations-helper';
import { dragDropFile } from '../utils/fileUtils';
import { Constants } from '../utils/constants';

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
    static waitToDisappear() {
        return browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.choose-network'))), Constants.shortWait);
    }

    // Name the network
    static clearBusinessNetworkName() {
            return element(by.id('import-businessNetworkName')).clear();
    }

    // Name the network
    static nameBusinessNetwork(name: string) {
            return element(by.id('import-businessNetworkName')).sendKeys(name);
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

    static retrieveBaseTileOptions() {
        this.waitToLoadDeployBasisOptions();
        return element(by.css('.sample-network-list-container')).all(by.css('.sample-network-list-item'));

    }

    // Deploy
    static clickDeploy() {
       return OperationsHelper.click(element(by.id('import_confirm')));
    }
}
