import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';

import { OperationsHelper } from '../utils/operations-helper';
import { dragDropFile } from '../utils/fileUtils';
import { Constants } from '../utils/constants';

export class AddFile {

  // Wait for modal to appear
  static waitToAppear() {
      browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), Constants.shortWait);
      return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), Constants.shortWait);
  }

  // Wait for modal to disappear
  static waitToDisappear() {
      browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import'))), Constants.shortWait);
  }

  // Cancel Add
  static clickCancelAdd() {
    browser.wait(ExpectedConditions.visibilityOf(element(by.id('add-file_cancel'))), Constants.shortWait);
    return OperationsHelper.click(element(by.id('add-file_cancel')));
  }

  // Exit Add
  static clickExitAdd() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), Constants.shortWait)
    .then(() => {
        return OperationsHelper.click(element(by.id('add-file_exit')));
    });
  }

  // Confirm Add
  static clickConfirmAdd() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), Constants.shortWait)
    .then(() => {
        return OperationsHelper.click(element(by.id('add-file_confirm')));
    });
  }

  // Select Script file via Radio Button
  static selectAddScriptViaRadioOption() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), Constants.shortWait)
    .then(() => {
        return OperationsHelper.click(element(by.css('[for="file-type-js"]')));
    });
  }

  // Select Model file via Radio Button
  static selectAddModelViaRadioOption() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), Constants.shortWait)
    .then(() => {
        return OperationsHelper.click(element(by.css('[for="file-type-cto"]')));
    });
  }

  // Select ACL file via Radio Button
  static selectAddAclViaRadioOption() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), Constants.shortWait)
    .then(() => {
        return OperationsHelper.click(element(by.css('[for="file-type-acl"]')));
    });
  }

  // Select Query file via Radio Button
  static selectAddQueryViaRadioOption() {
    // AddFile modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), Constants.shortWait)
    .then(() => {
        return OperationsHelper.click(element(by.css('[for="file-type-qry"]')));
    });
  }

  // Select BND from BNA file drop
  static selectFromFile(filePath: string) {
    // Import modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), Constants.shortWait)
    .then(() => {
        let inputFileElement = element(by.id('file-importer_input'));
        dragDropFile(inputFileElement, filePath);
        return true;
    });
  }

  // Get all radio buttons
  static retrieveAddFileRadioButtons() {
    return OperationsHelper.retriveMatchingElementsByCSS('.file-types-list', '[type="radio"]', 0)
    .map((elm) => { return {name: elm.getAttribute('id'), enabled: elm.isEnabled()}; });
  }

}
