import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';

import { OperationsHelper } from '../utils/operations-helper';
import { dragDropFile } from '../utils/fileUtils';

let baseTiles = ['basic-sample-network', 'empty-business-network', 'drag-drop'];

export class Deploy {

    // Wait for appear
    static waitToAppear() {
        return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.choose-network'))), 5000);
    }

    static waitToLoadDeployBasisOptions() {
        return browser.wait(OperationsHelper.elementsPresent(element(by.css('.sample-network-list-container')).all(by.css('.sample-network-list-item')), baseTiles.length), 10000);
    }

    // Wait for disappear
    static waitToDisappear() {
        return browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.choose-network'))), 5000);
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
            let optionElement = options[index].getWebElement();
            // Scroll into view
            browser.executeScript('arguments[0].scrollIntoView();', optionElement);

            // Click
            optionElement.click();

            // Confirm
            let confirmElement = element(by.id('import_confirm'));
            browser.executeScript('arguments[0].scrollIntoView();', confirmElement);
            return OperationsHelper.click(confirmElement);
        });
    }

    static retrieveBaseTileOptions() {
        this.waitToLoadDeployBasisOptions();
        return element(by.css('.sample-network-list-container')).all(by.css('.sample-network-list-item'));
    }

    // Deploy
    static clickDeploy() {
        let deployElement = element(by.id('import_confirm'));
        return OperationsHelper.click(deployElement);
    }
}
