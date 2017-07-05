import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';

import { dragDropFile } from '../utils/fileUtils.ts';

export class AddFileModalHelper {

  // Wait for modal to appear
  static waitForAddFileModalToAppear() {
      return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000);
  }

  // Cancel Add
  static cancelAdd() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000)
    .then(() => {
        return element(by.id('add-file_cancel')).click();
    });
  }

  // Exit Add
  static exitAdd() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000)
    .then(() => {
        return element(by.id('add-file_exit')).click();
    });
  }

  // Confirm Add
  static confirmAdd() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000)
    .then(() => {
        let addElement = element(by.id('add-file_confirm'));
        browser.wait(ExpectedConditions.elementToBeClickable(addElement), 5000);
        return addElement.click();
    });
  }

  // Select Script file via Radio Button
  static selectScriptRadioOption() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000)
    .then(() => {
        let selectElement = element(by.css('[for="file-type-js"]'));
        browser.wait(ExpectedConditions.elementToBeClickable(selectElement), 5000);
        return selectElement.click();
    });
  }

  // Select Model file via Radio Button
  static selectModelRadioOption() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000)
    .then(() => {
        let selectElement = element(by.css('[for="file-type-cto"]'));
        browser.wait(ExpectedConditions.elementToBeClickable(selectElement), 5000);
        return selectElement.click();
    });
  }

  // Select BND from BNA file drop
  static selectFromFile(filePath: string) {
    // Import modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000)
    .then(() => {
        // Import empty-network
        let inputFileElement = element(by.id('file-importer_input'));
        let importElement = element(by.id('add-file_confirm'));
        dragDropFile(inputFileElement, filePath);
        browser.wait(ExpectedConditions.elementToBeClickable(importElement), 5000);
        return importElement.click();
    });
  }

}
