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

export class IssueIdentity {
    static waitToAppear() {
        return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.issue-identity'))), Constants.shortWait);
    }

    static inputUserId(userId) {
        return element(by.id('userID')).sendKeys(userId);
    }

    static inputParticipant(participant) {
        return element(by.id('participantFQI')).sendKeys(participant);
    }

    static selectParticipantType(identifiedBy, type) {
        return OperationsHelper.retrieveMatchingElementsByCSSFromParentByID('ngb-typeahead-0', '.dropdown-item', 0)
        .then((items) => {
            let promises = [];

            for (let i = 0; i < items.length; i++) {
                promises.push(OperationsHelper.retrieveTextFromElement(items[i]));
            }

            return protractor.promise.all(promises).then((texts) => {
                let id = -1;
                texts.forEach((text, index) => {
                    text = text.split(' ');
                    if (text[0] === identifiedBy && text[1] === type) {
                        id = index;
                    }
                });
                if (id === -1) {
                    throw new Error('Particpant not found: ' + identifiedBy + ', ' + type);
                }
                return items[id];
            });
        })
        .then((el) => {
            return OperationsHelper.click(el);
        })
    }
}