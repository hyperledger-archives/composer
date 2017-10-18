import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { dragDropFile } from '../utils/fileUtils';
import { OperationsHelper } from '../utils/operations-helper';
import { Constants } from '../utils/constants';

// Initialise known tile orderings
let baseTiles = ['basic-sample-network', 'empty-business-network', 'drag-drop'];

let npmTiles = ['animaltracking-network', 'bond-network', 'carauction-network',
                'digitalproperty-network', 'marbles-network', 'perishable-network',
                'pii-network', 'trade-network', 'vehicle-lifecycle-network'];

export class Import {

  // Select BND from BNA file drop
  static selectBusinessNetworkDefinitionFromFile(filePath: string) {
    // Import slide out should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.drawer'))), Constants.longWait)
    .then(() => {
        // must have file drag drop visible
        OperationsHelper.retriveMatchingElementsByCSS('.sample-network-list-container', '.sample-network-list-item', 3);
        return browser.wait(ExpectedConditions.visibilityOf(element(by.id('file-importer_input'))), Constants.longWait);
    })
    .then(() => {
        let inputFileElement = element(by.id('file-importer_input'));
        return dragDropFile(inputFileElement, filePath);
    })
    .then(() => {
        let importElement = element(by.id('import_confirm'));
        return browser.wait(ExpectedConditions.elementToBeClickable(importElement), Constants.longWait)
        .then(() => {
            return importElement.click();
        });
    });
  }

  // Deploy default Tile option
  static selectDefaultBusinessDefinitionTileOption() {
    // Wait for poplation of sample-network-list-item(s)
    this.retrieveBaseTileOptions()
    .then((options) => {
        let confirmElement = element(by.id('import_confirm'));
        browser.executeScript('arguments[0].scrollIntoView();', confirmElement.getWebElement());
        OperationsHelper.click(confirmElement);
    });
  }

  // Deploy selected Tile option from Base tiles
  static selectBaseImportOption(importOption: string) {
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
        OperationsHelper.click(confirmElement);
    });
  }

  // Deploy selected Tile option from NPM tiles
  static selectNpmImportOption(importOption: string) {
    // Wait for poplation of sample-network-list-item(s)
    this.retrieveNpmTileOptions()
    .then((options) => {
        // Figure out which one we want
        let index = npmTiles.findIndex((tile) => tile === importOption);
        let optionElement = options[index].getWebElement();
        // Scroll into view
        browser.executeScript('arguments[0].scrollIntoView();', optionElement);

        // Click
        optionElement.click();

        // Confirm
        let confirmElement = element(by.id('import_confirm'));
        browser.executeScript('arguments[0].scrollIntoView();', confirmElement);
        OperationsHelper.click(confirmElement);
    });
  }

  // Confirm import
  static confirmImport() {
    // Import drawer should be present and populated with chosen-network div
    browser.wait(ExpectedConditions.visibilityOf(element(by.css('.chosen-network'))), Constants.longWait);

    // Wait for poplation of sample-network-list-item(s)
    OperationsHelper.retriveMatchingElementsByCSS('.sample-network-list-container', '.sample-network-list-item', 3)
    .then(() => {
        let confirmElement = element(by.id('import_confirm'));
        browser.executeScript('arguments[0].scrollIntoView();', confirmElement.getWebElement());
        OperationsHelper.click(confirmElement);
    });
  }

  // Cancel import
  static cancelImport() {
      // Import drawer should be present, button should be visible within chosen-network div
      browser.wait(ExpectedConditions.visibilityOf(element(by.css('.chosen-network'))), Constants.longWait);

      // Wait for poplation of sample-network-list-item(s)
      OperationsHelper.retriveMatchingElementsByCSS('.sample-network-list-container', '.sample-network-list-item', 3)
      .then(() => {
        let cancelElement = element(by.id('import_cancel'));
        browser.executeScript('arguments[0].scrollIntoView();', cancelElement.getWebElement());
        OperationsHelper.click(cancelElement);
        browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.drawer'))), Constants.longWait);
      });
  }

  static waitToAppear() {
      browser.wait(ExpectedConditions.visibilityOf(element(by.css('.drawer'))), Constants.longWait);
  }

  static waitToDisappear() {
      browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.drawer'))), Constants.longWait);
  }

  static waitToLoadBaseOptions() {
      browser.wait(OperationsHelper.elementsPresent(element(by.id('base-samples')).all(by.css('.sample-network-list-item')), baseTiles.length), Constants.mlongwait);
  }

  static waitToLoadNpmOptions() {
      browser.wait(OperationsHelper.elementsPresent(element(by.id('npm-samples')).all(by.css('.sample-network-list-item')), npmTiles.length), Constants.mlongwait);
  }

  static retrieveBaseTileOptions() {
    this.waitToLoadBaseOptions();
    return element(by.id('base-samples')).all(by.css('.sample-network-list-item'));
  }

  static retrieveNpmTileOptions() {
    this.waitToLoadNpmOptions();
    return element(by.id('npm-samples')).all(by.css('.sample-network-list-item'));
  }

}
