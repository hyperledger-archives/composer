import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';

import { OperationsHelper } from '../utils/operations-helper';
import { dragDropFile } from '../utils/fileUtils';

export class AddFile {

  // Wait for modal to appear
  static waitForAddFileModalToAppear() {
      browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000);
      return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000);
  }

  // Cancel Add
  static clickCancelAdd() {
    browser.wait(ExpectedConditions.visibilityOf(element(by.id('add-file_cancel'))), 5000);
    return OperationsHelper.click(element(by.id('add-file_cancel')));
  }

  // Exit Add
  static clickExitAdd() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 10000)
    .then(() => {
        return OperationsHelper.click(element(by.id('add-file_exit')));
    });
  }

  // Confirm Add
  static clickConfirmAdd() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 10000)
    .then(() => {
        return OperationsHelper.click(element(by.id('add-file_confirm')));
    });
  }

  // Select Script file via Radio Button
  static selectAddScriptViaRadioOption() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 10000)
    .then(() => {
        return OperationsHelper.click(element(by.css('[for="file-type-js"]')));
    });
  }

  // Select Model file via Radio Button
  static selectAddModelViaRadioOption() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 10000)
    .then(() => {
        return OperationsHelper.click(element(by.css('[for="file-type-cto"]')));
    });
  }

  // Select BND from BNA file drop
  static selectFromFile(filePath: string) {
    // Import modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 10000)
    .then(() => {
        let inputFileElement = element(by.id('file-importer_input'));
        dragDropFile(inputFileElement, filePath);
        return true;
    });
  }

}
