import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';

import { LoginHelper } from '../utils/login-helper.ts';

export class OperationsHelper {

    // Navigate to Editor base page and move past welcome splash and login
    static navigatePastWelcomeAndLogin() {
        return browser.get(browser.baseUrl)
            .then(() => {
                return browser.isElementPresent(element(by.css('.welcome')));
            })
            .then((welcomeOpen) => {
                if (welcomeOpen) {
                    return element(by.id('welcome_start')).click()
                        .then(() => {
                            return browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.welcome'))), 5000);
                        })
                        .then(() => {
                            return LoginHelper.login();
                        })
                        .then(() => {
                            return browser.wait(ExpectedConditions.invisibilityOf(element(by.tagName('login'))), 5000);
                        });
                }
            });

    }
}
