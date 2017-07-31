import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper';

export class ImportError {

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
}
