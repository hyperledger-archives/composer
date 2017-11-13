import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { Constants } from '../utils/constants';

export class BusyAlert {

    // wait to disappear
    static waitToAppear() {
        return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.busy-text'))), Constants.shortWait);
    }

    // wait to disappear
    static waitToDisappear() {
        return browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.busy-text'))), Constants.shortWait);
    }

}
