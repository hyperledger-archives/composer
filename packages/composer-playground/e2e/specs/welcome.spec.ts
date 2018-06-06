/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { Constants } from '../constants';
import { OperationsHelper } from '../utils/operations-helper';

describe('Welcome Splash', (() => {

    beforeAll(() => {
        browser.waitForAngularEnabled(false);
    });

    afterAll(() => {
        browser.waitForAngularEnabled(true);
        browser.executeScript('window.sessionStorage.clear();');
        browser.executeScript('window.localStorage.clear();');
    });

    // Navigate to Editor base page
    beforeEach(() => {
        browser.get(browser.baseUrl);
    });

    it('should welcome the user to Composer Playground', (() => {
        let elm = element(by.id('welcome_start'));
        browser.wait(ExpectedConditions.presenceOf(elm), Constants.longWait);
        browser.wait(ExpectedConditions.visibilityOf(elm), Constants.longWait);
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
