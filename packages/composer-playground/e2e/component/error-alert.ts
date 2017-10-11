import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';

import { OperationsHelper } from '../utils/operations-helper';
import { dragDropFile } from '../utils/fileUtils';
import { Constants } from '../utils/constants';

export class ErrorAlert {

  // Close
  static clickCloseError() {
    browser.wait(ExpectedConditions.visibilityOf(element(by.css('.error'))), Constants.shortWait);
    return OperationsHelper.click(element(by.id('error_close')));
  }

  // wait to disappear
  static waitToDisappear() {
    browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.error'))), Constants.shortWait);
  }

}
