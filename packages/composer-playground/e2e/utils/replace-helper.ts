import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { Constants } from './constants';

export class ReplaceModalHelper {

  // Cancel replace
  static cancelReplace() {
    // Replace modal should be present
    browser.wait(ExpectedConditions.visibilityOf(element(by.css('.replace'))), Constants.longWait);
    return element(by.id('replace_cancel')).click();
  }

  // Confirm Replace
  static confirmReplace() {
    // Replace modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.replace'))), Constants.longWait)
    .then(() => {
        return element(by.id('replace_confirm')).click();
    });
  }
}
