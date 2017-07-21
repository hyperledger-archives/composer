import { browser, element, by } from 'protractor';
import { ExpectedConditions, ElementFinder } from 'protractor';

export class OperationsHelper {

  // Perform a 'safe' click action on an element
  static click(elm: ElementFinder) {
    browser.wait(ExpectedConditions.presenceOf(elm), 10000);
    browser.wait(ExpectedConditions.visibilityOf(elm), 10000);
    browser.wait(ExpectedConditions.elementToBeClickable(elm), 10000);
    return browser.wait(() => {
        return elm.click()
        .then(() => true)
        .catch(() => false);
    });
  }

  // Retrieve text
  static retriveTextFromElement(elm: ElementFinder) {
      browser.wait(ExpectedConditions.presenceOf(elm), 10000);
      browser.wait(ExpectedConditions.visibilityOf(elm), 10000);
      return browser.wait(() => {
        return elm.getText();
    });
  }

  // Retrieve text
  static retriveMatchingElementsByCSS(type: string, subset: string) {
      let elm = element(by.css(type));
      browser.wait(ExpectedConditions.presenceOf(elm), 10000);
      browser.wait(ExpectedConditions.visibilityOf(elm), 10000);
      return element(by.css(type)).all(by.css(subset));
  }

  // Navigate to Editor base page and move past welcome splash
  static navigatePastWelcome() {
    browser.get(browser.baseUrl);
    let elm = element(by.id('welcome_start'));
    browser.wait(ExpectedConditions.presenceOf(elm), 10000);
    browser.wait(ExpectedConditions.visibilityOf(elm), 10000);
    this.click(elm);
    browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.welcome'))), 10000);
  };

  // Wait for success message to appear and disappear
  static processExpectedSuccess() {
    browser.wait(ExpectedConditions.visibilityOf(element(by.id('success_notify'))), 5000);
    browser.wait(ExpectedConditions.invisibilityOf(element(by.id('success_notify'))), 5000);
  };
}
