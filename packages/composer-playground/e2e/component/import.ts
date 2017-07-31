import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { dragDropFile } from '../utils/fileUtils';
import { OperationsHelper } from '../utils/operations-helper';

export class Import {

  // Select BND from BNA file drop
  static selectBusinessNetworkDefinitionFromFile(filePath: string) {
    // Import modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 10000)
    .then(() => {
        let inputFileElement = element(by.id('file-importer_input'));
        return dragDropFile(inputFileElement, filePath);
    })
  }

  // Confirm import
  static confirmImport() {
    // Import modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 10000)
    .then(() => {
        return OperationsHelper.click(element(by.id('import_confirm')));
    });
  }

  static confirmImportWithWait() {
    // Import modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 10000)
    .then(() => {
        let importElement = element(by.id('import_confirm'));
        return browser.wait(ExpectedConditions.elementToBeClickable(importElement), 10000)
        .then(() => {
            return importElement.click();
        });
    });
  }

  // Cancel import
  static cancelImport() {
      // Import modal should be present
      browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000);
      OperationsHelper.click(element(by.id('import_cancel')));
      browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import'))), 5000);
  }

  // Confirm import broken dialog
  static confirmImportBroken() {
    // Import modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import-error'))), 10000)
    .then(() => {
        return OperationsHelper.click(element(by.id('import_anyway')));
    });
  }

  // Cancel import broken
  static cancelImportBroken() {
      // Import Broken modal should be present
      browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import-error'))), 5000);
      OperationsHelper.click(element(by.id('import_cancel')));
      browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import-error'))), 5000);
  }

  static waitToAppear() {
      browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000);
  }

  static waitToDisappear() {
      browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import'))), 5000);
  }
}
