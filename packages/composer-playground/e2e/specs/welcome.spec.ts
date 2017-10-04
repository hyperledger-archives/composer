import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper';

import { Constants } from '../utils/constants';

describe('Welcome Splash', (() => {

  beforeAll(() =>  {
    browser.waitForAngularEnabled(false);
  });

  afterAll(() =>  {
    browser.waitForAngularEnabled(true);
    browser.executeScript('window.sessionStorage.clear();');
    browser.executeScript('window.localStorage.clear();');
  });

  // Navigate to Editor base page
  beforeEach(() =>  {
    browser.get(browser.baseUrl);
  });

  it('should welcome the user to Composer Playground', (() => {
    expect(element(by.css('.welcome')).getText()).toContain('Welcome to Hyperledger Composer Playground!');
  }));

  it('should dissappear when the user clicks cancel button', (() => {
    OperationsHelper.click(element(by.id('welcome_exit')));
    browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.welcome'))), Constants.shortWait);
  }));

  it('should dissappear when the user clicks "Let\'s Blockchain" button', (() => {
    OperationsHelper.click(element((by.id('welcome_start'))));
    browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.welcome'))), Constants.shortWait);
  }));

}));
