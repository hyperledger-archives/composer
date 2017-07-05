import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';


export class EditorFileHelper {

    static retrieveEditorCodeMirrorText() {
        return element(by.id('editor-file_CodeMirror')).getText();
    }

    static retrieveEditorText() {
        return element(by.css('.readme')).getText();
    }

}
