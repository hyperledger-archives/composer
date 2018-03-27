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
import { OperationsHelper } from '../utils/operations-helper';
import { Constants } from '../constants';
import { EditorFile } from './editor-file';

let scrollMe = (target) => {
    target.scrollIntoView(true);
};

export class Editor {

    // Wait to appear
    static waitToAppear() {
        return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.main-view'))), Constants.shortWait);
    }

    // Click AddFile button
    static clickAddFile() {
        return OperationsHelper.click(element(by.id('editor_addfile')));
    }

    // Click Export button
    static clickExportBND() {
        return OperationsHelper.click(element(by.id('editor_export')));
    }

    // Click deploy button
    static clickDeployBND() {
        return OperationsHelper.click(element(by.id('editor_deploy')));
    }

    // Click import button
    static clickImportBND() {
        return OperationsHelper.click(element(by.id('editor_import')));
    }

    static makePackageJsonActive() {
        return this.makeFileActive('README.md, package.json')
            .then(() => {
                return OperationsHelper.click(element(by.id('editPackageButton')));
            });
    }

    static makeFileActive(filename: string) {
        return OperationsHelper.retrieveMatchingElementsByCSS('.side-bar-nav', '.flex-container', 0)
            .then((elements) => {
                for (let i = 0; i < elements.length; i++) {
                    let elm = elements[i];
                    browser.executeScript(scrollMe, elm);
                    OperationsHelper.retrieveTextFromElement(elm)
                        .then((text) => {
                            if (text.toString().split(/\r\n|\n/)[1] === filename) {
                                return OperationsHelper.click(elm);
                            }
                        });
                }
            });
    }

    // Wait for editor files to load
    static waitForProjectFilesToLoad() {
        return OperationsHelper.retrieveMatchingElementsByCSS('.side-bar-nav', '.flex-container', 3);
    }

    // Retrieve Editor Side Navigation FileNames
    static retrieveNavigatorFileNames() {
        // Due to scroll bar, need to scroll element into view in order to inspect text
        return OperationsHelper.retrieveMatchingElementsByCSS('.side-bar-nav', '.flex-container', 0)
            .map((elm) => {
                browser.executeScript(scrollMe, elm);
                return OperationsHelper.retrieveTextFromElement(elm);
            });
    }

    // Retrieve Editor Side Navigation Action buttons (Add/Export)
    static retrieveNavigatorActions() {
        return OperationsHelper.retrieveMatchingElementsByCSS('.actions', '[type="button"]', 0)
            .map((elm) => { return { text: elm.getText(), enabled: elm.isEnabled() }; });
    }

    // Retrieve Editor Update Business Network Buttons
    static retrieveUpdateBusinessNetworkButtons() {
        return OperationsHelper.retrieveMatchingElementsByCSS('.deploy', '[type="button"]', 0)
            .map((elm) => { return { text: elm.getText(), enabled: elm.isEnabled() }; });
    }

    // Retrieve Editor Side Navigation File Elements
    static retrieveNavigatorFileElements() {
        return OperationsHelper.retrieveMatchingElementsByCSS('.side-bar-nav', '.flex-container', 0);
    }

    // Retrieve Editor Deployed Package Name from navlogo section
    static retrieveDeployedPackageName() {
        return OperationsHelper.retrieveTextFromElement(element(by.id('network-name')));
    }

    // Retrieve current 'active' file from navigator
    static retrieveNavigatorActiveFiles() {
        return OperationsHelper.retrieveMatchingElementsByCSS('.files', '.active', 0)
            .map((elm) => {
                browser.executeScript(scrollMe, elm);
                browser.wait(ExpectedConditions.visibilityOf(elm), Constants.shortWait);
                return elm.getText();
            });
    }

}
