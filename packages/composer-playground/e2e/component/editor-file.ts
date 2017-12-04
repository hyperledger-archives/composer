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
