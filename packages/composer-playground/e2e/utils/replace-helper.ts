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

export class ReplaceModalHelper {

  // Cancel replace
  static cancelReplace() {
    // Replace modal should be present
    browser.wait(ExpectedConditions.visibilityOf(element(by.css('.replace'))), Constants.longWait);
    return element(by.id('replace_cancel')).click();
  }

  // Confirm Replace
  static confirmReplace() {
    // Replace modal should be present
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.replace'))), Constants.longWait)
    .then(() => {
        return element(by.id('replace_confirm')).click();
    });
  }
}
