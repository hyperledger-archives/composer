import { browser, element, by, ElementFinder } from 'protractor';
import { ExpectedConditions } from 'protractor';

import { OperationsHelper } from '../utils/operations-helper';

export class Identity {

    // Connect to Playground via named ID Card
    static connectViaNamedCard(name: string) {
        // Should have identities visible
        return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.identities'))), 10000)
        .then(() => {
            // retrieve all by css 'identity-card'
            let identityElement = element(by.css('.identities'));
            browser.wait(ExpectedConditions.presenceOf(identityElement), 10000);
            browser.wait(ExpectedConditions.visibilityOf(identityElement), 10000);
            return element(by.css('.identities')).all(by.css('.identity-card')).filter((item) => {
                return item.getWebElement().findElement(by.css('.user-details')).getText()
                .then((text) => { if (text.includes(name)) { return true; } });
            })
            .then((elements: ElementFinder[]) => {
                let connect = elements[0].getWebElement().findElement(by.css('.connect'));
                browser.wait(() => { return browser.isElementPresent(connect); }, 5000);
                connect.click();
            });
        });
    }
}
