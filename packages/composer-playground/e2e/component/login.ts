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
import { browser, element, by, ElementFinder, WebElement } from 'protractor';
import { dragDropFile } from '../utils/fileUtils';
import { ExpectedConditions } from 'protractor';

import { Constants } from '../constants';
import { OperationsHelper } from '../utils/operations-helper';
import { BusyAlert } from './alert';
import * as fs from 'fs';
import * as path from 'path';

export class Login {

    static deployNewToProfile(profile: string) {
        // Wish to find named connection profile and then select/click the 'empty' deploy card
        return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.connection-profile'))), Constants.longWait)
            .then(() => {
                return element.all(by.css('.connection-profile')).filter((item) => {
                    return item.element(by.css('.connection-profile-title')).getText()
                        .then((text) => {
                            if (text.includes(profile)) {
                                return true;
                            }
                        });
                })
            .then((matchedItems: [ElementFinder]) => {
                if (matchedItems.length > 1) {
                    return Promise.reject('Multiple conection profile name match occured');
                } else {
                    return matchedItems[0].element(by.css('.connection-profile-card'));
                }
            })
            .then((deployCard: ElementFinder) => {
                return OperationsHelper.click(deployCard);
            });
        });
    }

    // Connect to Playground via named ID Card under named connection profile
    static connectViaIdCard(profile: string, networkName: string) {
        return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.connection-profile'))), Constants.longWait)
            .then(() => {
                // Retrieve components under named connection-profile
                return element.all(by.css('.connection-profile')).filter((item) => {
                    return item.element(by.css('.connection-profile-title')).getText()
                        .then((text) => {
                            if (text.includes(profile)) {
                                return true;
                            }
                        });
                })
                .then((matchedItems) => {
                    if (matchedItems.length > 1) {
                        return Promise.reject('Multiple conection profile name match occured');
                    } else {
                        return matchedItems[0];
                    }
                })
                .then((matchedItem) => {
                    return matchedItem.all(by.css('.identity-card')).filter((item) => {
                        return item.element(by.css('.business-network-details')).getText()
                            .then((text) => {
                                if (text.includes(networkName)) {
                                    return true;
                                }
                            });
                    });
                })
                .then((cards) => {
                    let connect = cards[0].getWebElement().findElement(by.css('.connect'));
                    browser.wait(() => {
                        return browser.isElementPresent(connect);
                    }, Constants.longWait);
                    connect.click();
                    });
            });
    }

    static importBusinessNetworkCard(filePath: string) {
        let cardName = path.basename(filePath, path.extname(filePath));
        let importButton = element(by.id('importIdCard'));
        let importElement;
        return browser.wait(ExpectedConditions.elementToBeClickable(importButton), Constants.longWait)
        .then(() => {
            return OperationsHelper.click(importButton);
        })
        .then(() => {
            return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.drawer'))), Constants.longWait);
        })
        .then(() => {
            let inputFileElement = element(by.id('file-importer_input'));
            return dragDropFile(inputFileElement, filePath);
        })
        .then(() => {
            return browser.wait(ExpectedConditions.visibilityOf(element(by.id('cardName'))), Constants.longWait);
        })
        .then(() => {
            return element(by.id('cardName')).sendKeys(cardName);
        })
        .then(() => {
            importElement = element(by.id('importBtn'));
            return browser.wait(ExpectedConditions.elementToBeClickable(importElement), Constants.longWait);
        })
        .then(() => {
            return importElement.click();
        })
        .then(() => {
            return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.user-name[title=TestPeerAdmin]'))));
        });
    }

    static exportBusinessNetworkCard(cardName: string) {
        return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.connection-profile'))), Constants.longWait)
        .then(() => {
            return element.all(by.css('.identity-card')).filter((item) => {
                return item.element(by.css('.user-name')).getText()
                .then((text) => {
                    if (text === cardName) {
                        return true;
                    }
                });
            })
            .then((matchedItems: [ElementFinder]) => {
                if (matchedItems.length > 1) {
                    return Promise.reject('Multiple identity card name match occured');
                } else {
                    return matchedItems[0].element(by.css('button.export'));
                }
            })
            .then((exportCard: ElementFinder) => {
                return OperationsHelper.click(exportCard);
            })
            .then(() => {
                return browser.driver.wait(() => {
                    return fs.existsSync(__dirname + '/../downloads/' + cardName.split('@')[0] + '.card');
                }, Constants.shortWait);
            })
            .then(() => {
                return __dirname + '/../downloads/' + cardName.split('@')[0] + '.card';
            });
        });
    }
}
