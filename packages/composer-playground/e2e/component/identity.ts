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
import { dragDropFile } from '../utils/fileUtils';
import { Constants } from '../constants';

export class Identity {
    static waitToAppear() {
        return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.identity-title'))), Constants.shortWait);
    }

    static getMyIds() {
        return OperationsHelper.retrieveMatchingElementsByCSSFromParentByID('myIDs', '.identity', 0)
        .then((values) => {
            let promises = [];

            for (let i = 0; i < values.length; i++) {
                promises.push(OperationsHelper.retrieveTextFromElement(values[i]));
            }

            return protractor.promise.all(promises).then((texts) => {
                let IDs = [];
                texts.forEach((text) => {
                    text = text.split('\n');
                    IDs.push({id: text[0], status: text[1]});
                });
                return IDs;
            });
        });
    }

    static getAllIds() {
        return OperationsHelper.retrieveMatchingElementsByCSSFromParentByID('allIDs', '.identity', 0)
        .then((values) => {
            let promises = [];

            for (let i = 0; i < values.length; i++) {
                promises.push(OperationsHelper.retrieveTextFromElement(values[i]));
            }

            return protractor.promise.all(promises).then((texts) => {
                let IDs = [];
                texts.forEach((text) => {
                    text = text.split('\n');
                    IDs.push({id: text[0], issued: text[1], status: text[2]});
                });
                return IDs;
            });
        });
    }
}
