import { browser, element, by } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper';

export class EditorFile {

    static retrieveEditorCodeMirrorText() {
        return OperationsHelper.retriveTextFromElement(element(by.id('editor-file_CodeMirror')));
    }

    static retrieveEditorText() {
        return OperationsHelper.retriveTextFromElement(element(by.css('.readme')));
    }

}
