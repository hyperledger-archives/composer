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

 /* tslint:disable max-classes-per-file */

import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { Constants } from '../constants';

export class BusyAlert {

    // wait to disappear
    static waitToAppear() {
        return browser.wait(ExpectedConditions.visibilityOf(element(by.css('busy'))), Constants.shortWait);
    }

    // wait to disappear
    static waitToDisappear() {
        return browser.wait(ExpectedConditions.invisibilityOf(element(by.css('busy'))), Constants.vvlongwait);
    }

}

export class SuccessAlert {

    // wait to disappear
    static waitToAppear() {
        return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.notification-text'))), Constants.shortWait);
    }

    // wait to disappear
    static waitToDisappear() {
        return browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.notification-text'))), Constants.shortWait);
    }

}
