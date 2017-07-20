import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';

import { OperationsHelper } from '../utils/operations-helper';
import { dragDropFile } from '../utils/fileUtils';

export class ErrorAlert {

  // Close
  static clickCloseError() {
    browser.wait(ExpectedConditions.visibilityOf(element(by.css('.error'))), 5000);
    return OperationsHelper.click(element(by.id('error_close')));
  }

  // wait to disappear
  static waitToDisappear() {
    browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.error'))), 5000);
  }

}
