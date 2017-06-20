import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';

import * as chai from 'chai';

let should = chai.should();

describe('Welcome Splash', (() => {

    // Navigate to Editor base page
    beforeEach(() => {
        return browser.get(browser.baseUrl)
            .then(() => {
                return browser.executeScript('window.localStorage.clear();');
            })
            .then(() => {
                return browser.refresh();
            });
    });

    it('should welcome the user to Composer Playground', (() => {
        let myElement = element(by.css('.welcome')).getText()
            .then((myText) => {
                myText.should.contain('Welcome to Hyperledger Composer Playground!');
            });
    }));

    it('should dissappear when the user clicks cancel button', (() => {
        let myButton = element(by.id('welcome_exit')).click()
            .then(() => {
                browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.welcome'))), 5000);
            });
    }));

    it('should dissappear when the user clicks "Let\'s Blockchain" button', (() => {
        let myButton = element(by.id('welcome_start')).click()
            .then(() => {
                browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.welcome'))), 5000);
            });
    }));

}));
