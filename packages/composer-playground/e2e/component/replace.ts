import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper';

export class Replace {

  // Cancel replace
  static cancelReplace() {
    // Replace modal should be present
    browser.wait(ExpectedConditions.visibilityOf(element(by.css('.replace'))), 5000);
    OperationsHelper.click(element(by.id('replace_cancel')));
  }

  // Confirm Replace
  static confirmReplace() {
    // Replace modal should be present
    browser.wait(ExpectedConditions.visibilityOf(element(by.css('.replace'))), 5000);
    OperationsHelper.click(element(by.id('replace_confirm')));
    browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.replace'))), 5000);
  }
}
