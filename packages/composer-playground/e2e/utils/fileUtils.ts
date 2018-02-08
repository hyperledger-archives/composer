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
import { browser } from 'protractor';
import * as  fs from 'fs';
import * as path from 'path';
import * as JSZip from 'jszip';

let BIND_INPUT = (target) => {
  let input = document.createElement('input');
  input.type = 'file';
  input.style.display = 'none';
  input.addEventListener('change', () => {
    target.scrollIntoView(true);

    let rect = target.getBoundingClientRect();
    let x = rect.left + (rect.width / 2);
    let y = rect.top + (rect.height / 2);
    let data = { files: input.files };

    ['dragenter', 'dragover', 'drop'].forEach((name) => {
      let event = document.createEvent('MouseEvent');
      event.initMouseEvent(name, !0, !0, window, 0, 0, 0, x, y, !1, !1, !1, !1, 0, null);
      (event as any).dataTransfer = data;
      target.dispatchEvent(event);
    });

    document.body.removeChild(input);
  }, false);

  document.body.appendChild(input);
  return input;
};

export function dragDropFile(location, filePath) {
  // get the full path
  filePath = path.resolve(filePath);

  // assert the file is present
  fs.accessSync(filePath, fs.constants.F_OK);

  // resolve the drop area
  return location.getWebElement().then((element) => {
      // bind a new input to the drop area
      browser.executeScript(BIND_INPUT, element).then((input) => {
        // upload the file to the new input
        (input as any).sendKeys(filePath);
    });
  });
}

export function waitForFileToExist(filePath: string) {
    return browser.driver.wait(() => { return fs.existsSync(filePath); }, 30000);
}

export function retrieveZipContentList(filePath: string) {
    return JSZip.loadAsync(fs.readFileSync(filePath, 'binary'))
    .then((zip) => {
        let fileArray = [];
        Object.keys(zip.files).forEach((_filename) => {
            fileArray.push(_filename);
        });
        return fileArray;
    });
}
