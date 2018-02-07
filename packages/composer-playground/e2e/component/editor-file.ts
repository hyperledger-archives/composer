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
import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper';

export class EditorFile {

    static retrieveEditorCodeMirrorText() {
      return browser.executeScript(`
          var editor = document.getElementsByClassName('CodeMirror')[0].CodeMirror;
          editor.focus();
          return editor.getValue();
      `)
    }

    static setEditorCodeMirrorText(value: string) {
        return browser.executeScript(`
            var editor = document.getElementsByClassName('CodeMirror')[0].CodeMirror;
            editor.focus();
            return editor.setValue('');
        `)
        .then(() => {
            return element(by.css('.CodeMirror textarea')).sendKeys(value)
            .then(() => {
                return browser.sleep(1000); // DEBOUNCE
            })
        });
    }

    static retrieveEditorText() {
        return OperationsHelper.retrieveTextFromElement(element(by.css('.readme')));
    }

}
