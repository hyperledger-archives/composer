import { browser, element, by } from 'protractor';

export class AngularTestPage {
  navigateTo(url) {
    return browser.get(url);
  }

}
