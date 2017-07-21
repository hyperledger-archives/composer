import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper';

let scrollMe = (target) => {
    target.scrollIntoView(true);
};

export class Editor {

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

  // RETRIEVE ACTIONS
  // Retrieve Editor Side Navigation FileNames
  static retrieveNavigatorFileNames() {
      // Due to scroll bar, need to scroll element into view in order to inspect text
      return OperationsHelper.retriveMatchingElementsByCSS('.side-bar-nav', '.flex-container')
      .map((elm) => { browser.executeScript(scrollMe, elm);
                      browser.wait(ExpectedConditions.visibilityOf(elm), 5000);
                      return elm.getText(); });
  }

  // Retrieve Editor Side Navigation File Action buttons (Add/Deploy)
  static retrieveNavigatorFileActionButtons() {
    return OperationsHelper.retriveMatchingElementsByCSS('.files', '[type="button"]')
    .map((elm) => { return {text: elm.getText(), enabled: elm.isEnabled()}; });
  }

  // Retrieve Editor Side Navigation Action Buttons
  static retrieveBusinessArchiveActionButtons() {
      return OperationsHelper.retriveMatchingElementsByCSS('.actions', '[type="button"]')
      .map((elm) => { return {text: elm.getText(), enabled: elm.isEnabled()}; });
  }

  // Retrieve Editor Side Navigation File Elements
  static retrieveNavigatorFileElements() {
      return OperationsHelper.retriveMatchingElementsByCSS('.side-bar-nav', '.flex-container');
  }

  // Retrieve Editor Deployed Package Name, visible only when readme is selected
  static retrieveDeployedPackageName() {
      return OperationsHelper.retriveTextFromElement(element(by.id('editor_deployedPackageName')));
  }

  // Retrieve current 'active' file from navigator
  static retrieveNavigatorActiveFile() {
    return OperationsHelper.retriveMatchingElementsByCSS('.files', '.active')
    .map((elm) => { browser.executeScript(scrollMe, elm);
                    browser.wait(ExpectedConditions.visibilityOf(elm), 5000);
                    return elm.getText(); });
  }

}
