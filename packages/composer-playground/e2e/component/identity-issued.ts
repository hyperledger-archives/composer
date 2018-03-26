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
import { browser, element, by, protractor } from 'protractor';
import { ExpectedConditions } from 'protractor';

import { OperationsHelper } from '../utils/operations-helper';
import { Constants } from '../constants';

export class IdentityIssued {
    static waitToAppear() {
        return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.issue-identity'))), Constants.shortWait);
    }

    static addToWallet(cardName) {
        return OperationsHelper.click(element(by.id('option-1')))
        .then(() => {
            browser.wait(ExpectedConditions.visibilityOf(element(by.id('cardName'))), Constants.shortWait);
            if (cardName) {
                return element(by.id('cardName')).clear()
                .then(() => {
                    return element(by.id('cardName')).sendKeys(cardName);
                });
            } else {
                return;
            }
        })
        .then(() => {
            return element(by.id('option-1')).element(by.css('.primary'));
        })
        .then((button) => {
            return OperationsHelper.click(button);
        });
    }
}