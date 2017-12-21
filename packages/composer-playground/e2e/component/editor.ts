import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper';
import { Constants } from '../utils/constants';
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

  static makeFileActive(filename: string) {
    let startFileData = EditorFile.retrieveEditorCodeMirrorText();
    return OperationsHelper.retrieveMatchingElementsByCSS('.side-bar-nav', '.flex-container', 0)
    .then((elements) => {
        for (var i = 0; i < elements.length; i++) {
            let elm = elements[i];
            browser.executeScript(scrollMe, elm);
            OperationsHelper.retrieveTextFromElement(elm)
            .then((text) => {
                if(text.toString().split(/\r\n|\n/)[1] === filename) {
                    return OperationsHelper.click(elm)
                }
            });
        }
    });
  }

  // Wait for editor files to load
  static waitForProjectFilesToLoad() {
    return OperationsHelper.retrieveMatchingElementsByCSS('.side-bar-nav', '.flex-container', 0);
  }

  // Retrieve Editor Side Navigation FileNames
  static retrieveNavigatorFileNames() {
      // Due to scroll bar, need to scroll element into view in order to inspect text
      return OperationsHelper.retrieveMatchingElementsByCSS('.side-bar-nav', '.flex-container', 0)
      .map((elm) => { browser.executeScript(scrollMe, elm);
                      return OperationsHelper.retrieveTextFromElement(elm); });
  }

  // Retrieve Editor Side Navigation File Action buttons (Add/Deploy)
  static retrieveNavigatorFileActionButtons() {
    return OperationsHelper.retrieveMatchingElementsByCSS('.files', '[type="button"]', 0)
    .map((elm) => { return {text: elm.getText(), enabled: elm.isEnabled()}; });
  }

  // Retrieve Editor Side Navigation Action Buttons
  static retrieveBusinessArchiveActionButtons() {
      return OperationsHelper.retrieveMatchingElementsByCSS('.actions', '[type="button"]', 0)
      .map((elm) => { return {text: elm.getText(), enabled: elm.isEnabled()}; });
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
    .map((elm) => { browser.executeScript(scrollMe, elm);
                    browser.wait(ExpectedConditions.visibilityOf(elm), Constants.shortWait);
                    return elm.getText(); });
  }

}
