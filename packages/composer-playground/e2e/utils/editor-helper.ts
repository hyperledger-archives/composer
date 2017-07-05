import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';


let scrollMe = (target) => {
    target.scrollIntoView(true);
};

export class EditorHelper {

  // CLICK ACTIONS
  // Click AddFile button
  static addFile() {
      return element(by.id('editor_addfile')).click();
  }

  // Click Export button
  static exportBND() {
      return element(by.id('editor_export')).click();
  }

  // Click deploy button
  static deployBND() {
    return element(by.id('editor_deploy')).click();
  }

  // Click import button
  static importBND() {
    return element(by.id('editor_import')).click();
  }

  // RETRIEVE ACTIONS
  // Retrieve Editor Side Navigation FileNames
  static retrieveNavigatorFileNames() {
      // Due to scroll bar, need to scroll element into view in order to inspect text
      return element(by.css('.side-bar-nav')).all(by.css('.flex-container')).map((elm) => { browser.executeScript(scrollMe, elm);
                                                                                            browser.wait(ExpectedConditions.visibilityOf(elm), 5000);
                                                                                            return elm.getText(); });
  }

  // Retrieve Editor Side Navigation File Action buttons (Add/Deploy)
  static retrieveNavigatorFileActionButtons() {
    return element(by.css('.files')).all(by.css('[type="button"]')).map((elm) => { return {text: elm.getText(), enabled: elm.isEnabled()}; });
  }

  // Retrieve Editor Side Navigation Action Buttons
  static retrieveBusinessArchiveActionButtons() {
      return element(by.css('.actions')).all(by.css('[type="button"]')).map((elm) => { return {text: elm.getText(), enabled: elm.isEnabled()}; });
  }

  // Retrieve Editor Side Navigation File Elements
  static retrieveNavigatorFileElements() {
      return element(by.css('.side-bar-nav')).all(by.css('.flex-container'));
  }

  // Retrieve Editor Deployed Package Name, visible only when readme is selected
  static retrieveDeployedPackageName() {
      return element(by.id('editor_deployedPackageName')).getText();
  }

  // Retrieve current 'active' file from navigator
  static retrieveNavigatorActiveFile() {
    return element(by.css('.files')).all(by.css('.active')).map((elm) => { browser.executeScript(scrollMe, elm);
                                                                           browser.wait(ExpectedConditions.visibilityOf(elm), 5000);
                                                                           return elm.getText(); });
  }

}
