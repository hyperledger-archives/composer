import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';

export class OperationsHelper {

  // Navigate to Editor base page and move past welcome splash
  static navigatePastWelcome() {
    browser.get(browser.baseUrl)
    .then(() => {
        return element(by.id('welcome_start')).click()
        .then(() => {
            return browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.welcome'))), 10000);
        });
    });
  };
}
