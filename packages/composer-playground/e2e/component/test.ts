/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { browser, element, by, promise, ElementFinder } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper';
import { Constants } from '../constants';

let scrollMe = (target) => {
    target.scrollIntoView(true);
};

export class Test {
  // Wait to appear
  static waitToAppear() {
    return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.main-view'))), Constants.shortWait);
  }

  static retrieveHeader() {
    return OperationsHelper.retrieveMatchingElementsByCSS('.resource-header', 'h1', 0)
    .map((elm) => { browser.executeScript(scrollMe, elm);
                    return OperationsHelper.retrieveTextFromElement(elm); });
  }

  // Retrieve Test Side Navigation Participants
  static retrieveAssetTypes() {
      // Due to scroll bar, need to scroll element into view in order to inspect text
      return OperationsHelper.retrieveMatchingElementsByCSS('.side-bar-nav:nth-of-type(2)', 'h3', 0)
      .map((elm) => { browser.executeScript(scrollMe, elm);
                      return OperationsHelper.retrieveTextFromElement(elm); });
  }

  // Retrieve Test Side Navigation Participants
  static retrieveParticipantTypes() {
      // Due to scroll bar, need to scroll element into view in order to inspect text
      return OperationsHelper.retrieveMatchingElementsByCSS('.side-bar-nav:first-of-type', 'h3', 0)
      .map((elm) => { browser.executeScript(scrollMe, elm);
                      return OperationsHelper.retrieveTextFromElement(elm); });
  }

  static selectRegistry(type: string, name: string) {
    let sideBar: string;
    switch (type) {
      case 'participants': sideBar = '.side-bar-nav:first-of-type'; break;
      case 'assets': sideBar = '.side-bar-nav:nth-of-type(2)'; break;
      default: throw new Error('Invalid type');
    }

    return OperationsHelper.retrieveMatchingElementsByCSS(sideBar, 'h3', 0)
    .then((elements) => {
      for (let i = 0; i < elements.length; i++) {
          let elm = elements[i];
          browser.executeScript(scrollMe, elm);
          OperationsHelper.retrieveTextFromElement(elm)
          .then((text) => {
              if (text.toString() === name) {
                  return OperationsHelper.click(elm);
              }
          });
      }
    });
  }

  // create registry item on selected registry page
  static createRegistryItem(item: string) {
      return OperationsHelper.retrieveMatchingElementsByCSS('.resource-header', '.registry', 0)
      .then((elm) => {
          return OperationsHelper.click(elm[0]);
      })
      .then(() => {
          return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.resource-modal'))), Constants.shortWait);
      })
      .then(() => {
        return browser.executeScript(`
            var editor = document.getElementsByClassName('CodeMirror')[0].CodeMirror;
            editor.focus();
            return editor.setValue('');
        `);
      })
      .then(() => {
          return element(by.css('.CodeMirror textarea')).sendKeys(item);
      })
      .then(() => {
          return OperationsHelper.click(element(by.id('createResourceButton')));
      });
  }

  static deleteRegistryItem(identifier: string) {
      let deleted: ElementFinder;
      return OperationsHelper.retrieveMatchingElementsByCSS('.resource-list', '.resource-container', 0)
        .then((items) => {
            let promises = [];

            for (let i = 0; i < items.length; i++) {
                let id = items[0].element(by.css('.id'));
                promises.push(OperationsHelper.retrieveTextFromElement(id));
            }

            return promise.all(promises).then((texts) => {
                let id = -1;
                texts.forEach((text, index) => {
                    if (text === identifier) {
                        id = index;
                    }
                });
                if (id === -1) {
                    throw new Error('Particpant not found: ' + identifier);
                }
                return items[id];
            });
        })
        .then((el) => {
            deleted = el;
            return OperationsHelper.click(el.element(by.css('.delete-resource')));
        })
        .then(() => {
            return browser.wait(ExpectedConditions.visibilityOf(element(by.css('.delete'))));
        })
        .then(() => {
            return OperationsHelper.click(element(by.css('.delete')).element(by.css('.delete')));
        })
        .then(() => {
            return browser.wait(ExpectedConditions.invisibilityOf(deleted));
        });
  }

  // Get the current list of ids and data from opened registry section
  static retrieveRegistryItem() {
      let idsPromise = OperationsHelper.retrieveMatchingElementsByCSS('.resource-list', '.resource-container .id', 0)
      .map((elm) => {
          browser.executeScript(scrollMe, elm);
          return OperationsHelper.retrieveTextFromElement(elm);
      });

      let dataPromise = OperationsHelper.retrieveMatchingElementsByCSS('.resource-list', '.resource-container .data', 0)
      .map((elm) => {
          browser.executeScript(scrollMe, elm);
          return OperationsHelper.retrieveTextFromElement(elm);
      });

      let promises = [idsPromise, dataPromise];

      return promise.all(promises)
      .then((values) => {
        let ids = values[0];
        let data = values[1];
        let result = ids.map((val, index) => {
          return { id: val, data: data[index] };
        });
        return result;
      });
  }

  static submitTransaction(transaction: string, type: string) {
      return OperationsHelper.click(element(by.className('side-button')).all(by.className('button-item')).all(by.className('primary')).first())
      .then(() => {
          OperationsHelper.click(element(by.className('transaction-modal')).all(by.id('dropdownMenu1')).first());
      })
      .then(() => {
          OperationsHelper.retrieveMatchingElementsByCSS('.transaction-modal', '.dropdown-item', 1)
          .then((elements) => {
              for (let i = 0; i < elements.length; i++) {
                  let elm = elements[i];
                  browser.executeScript(scrollMe, elm);
                  OperationsHelper.retrieveTextFromElement(elm)
                  .then((text) => {
                      if (text.toString() === type) {
                          return OperationsHelper.click(elm);
                      }
                  });
              }
          });
      })
      .then(() => {
        return browser.executeScript(`
            var editor = document.getElementsByClassName('CodeMirror')[0].CodeMirror;
            editor.focus();
            return editor.setValue('');
        `);
      })
      .then(() => {
          return element(by.css('.CodeMirror textarea')).sendKeys(transaction);
      })
      .then(() => {
          return OperationsHelper.click(element(by.id('submitTransactionButton')));
      });
  }
}
