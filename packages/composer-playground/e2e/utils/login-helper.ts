import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';

export class LoginHelper {

    // Click login button
    static login() {
        return element(by.id('login-0-admin')).click();
    }
}
