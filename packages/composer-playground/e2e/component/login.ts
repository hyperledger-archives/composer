import { browser, element, by, ElementFinder, WebElement } from 'protractor';
import { ExpectedConditions } from 'protractor';

import { Constants } from '../utils/constants';
import { OperationsHelper } from '../utils/operations-helper';
import { BusyAlert } from "./alert";

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

    // Connect to Playground via named ID Card under named connectino profile
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
}
