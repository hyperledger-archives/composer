import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';

export class ReplaceModalHelper {

  // Cancel replace
  static cancelReplace() {
    // Replace modal should be present
    browser.wait(ExpectedConditions.visibilityOf(element(by.css('.replace'))), 5000);
    return element(by.id('replace_cancel')).click();
  }

  // Confirm Replace
  static confirmReplace() {
    // Replace modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.replace'))), 5000)
    .then(() => {
        return element(by.id('replace_confirm')).click();
    });
  }
}
