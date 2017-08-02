import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { dragDropFile } from '../utils/fileUtils';
import { OperationsHelper } from '../utils/operations-helper';

let scrollMe = (target) => {
    target.scrollIntoView(true);
};

export class Import {

  // Select BND from BNA file drop
  static selectBusinessNetworkDefinitionFromFile(filePath: string) {
    // Import slide out should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.drawer'))), 10000)
    .then(() => {
        // must have file drag drop visible
        OperationsHelper.retriveMatchingElementsByCSS('.sample-network-list-container', '.sample-network-list-item', 3);
        return browser.wait(ExpectedConditions.visibilityOf(element(by.id('file-importer_input'))), 10000);
    })
    .then(() => {
        let inputFileElement = element(by.id('file-importer_input'));
        return dragDropFile(inputFileElement, filePath);
    })
    .then(() => {
        let importElement = element(by.id('import_confirm'));
        return browser.wait(ExpectedConditions.elementToBeClickable(importElement), 10000)
        .then(() => {
            return importElement.click();
        });
    });
  }

  // Deploy default Tile option
  static selectDefaultBusinessDefinitionTileOption() {
    // Wait for poplation of sample-network-list-item(s)
    OperationsHelper.retriveMatchingElementsByCSS('.sample-network-list-container', '.sample-network-list-item', 3)
    .then((options) => {
        let confirmElement = element(by.id('import_confirm'));
        browser.executeScript('arguments[0].scrollIntoView();', confirmElement.getWebElement());
        OperationsHelper.click(confirmElement);
    });
  }

  // Deploy selected Tile option
  static selectBusinessDefinitionTileOption(option) {
    // Wait for poplation of sample-network-list-item(s)
    OperationsHelper.retriveMatchingElementsByCSS('.sample-network-list-container', '.sample-network-list-item', 3)
    .then((options) => {
        options[option].getWebElement().click();
        let confirmElement = element(by.id('import_confirm'));
        browser.executeScript('arguments[0].scrollIntoView();', confirmElement.getWebElement());
        OperationsHelper.click(confirmElement);
    });
  }

  // Confirm import
  static confirmImport() {
    // Import drawer should be present and populated
    browser.wait(ExpectedConditions.visibilityOf(element(by.css('.drawer'))), 10000)

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
      // Import drawer should be present, button should be visible
      browser.wait(ExpectedConditions.visibilityOf(element(by.css('.drawer'))), 5000);

      // Wait for poplation of sample-network-list-item(s)
      OperationsHelper.retriveMatchingElementsByCSS('.sample-network-list-container', '.sample-network-list-item', 3)
      .then(() => {
        let cancelElement = element(by.id('import_cancel'));
        browser.executeScript('arguments[0].scrollIntoView();', cancelElement.getWebElement());
        OperationsHelper.click(cancelElement);
        browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.drawer'))), 5000);
      });
  }

  static waitToAppear() {
      browser.wait(ExpectedConditions.visibilityOf(element(by.css('.drawer'))), 5000);
  }

  static waitToDisappear() {
      browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.drawer'))), 5000);
  }

}
