import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { dragDropFile } from '../utils/fileUtils.ts';

export class ImportModalHelper {

  // Select BND from BNA file drop
  static selectBusinessNetworkDefinitionFromFile(filePath: string) {
    // Import modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000)
    .then(() => {
        let inputFileElement = element(by.id('file-importer_input'));
        return dragDropFile(inputFileElement, filePath);
    })
    .then(() => {
        let importElement = element(by.id('import_confirm'));
        return browser.wait(ExpectedConditions.elementToBeClickable(importElement), 5000)
        .then(() => {
            return importElement.click();
        });
    });
  }

  // Confirm import
  static confirmImport() {
    // Import modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000)
    .then(() => {
        return element(by.id('import_confirm')).click();
    });
  }

  // Cancel import
  static cancelImport() {
      // Import modal should be present
      return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000)
      .then(() => {
        return element(by.id('import_cancel')).click();
      });
  }

  static waitForImportModalToAppear() {
      return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.import'))), 5000);
  }
}
