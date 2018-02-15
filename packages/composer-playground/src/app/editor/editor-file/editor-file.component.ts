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
import { Component, Input } from '@angular/core';

import { FileService } from '../../services/file.service';
import { EditorFile } from '../../services/editor-file';

import * as marked from 'marked';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/markdown-fold';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/scroll/simplescrollbars';

@Component({
    selector: 'editor-file',
    templateUrl: './editor-file.component.html',
    styleUrls: [
        './editor-file.component.scss'.toString()
    ]
})
export class EditorFileComponent {

    private changingCurrentFile: boolean = false;
    private code: string = null;
    private readme = null;
    private previousCode: string = null;

    private codeConfig = {
        lineNumbers: true,
        lineWrapping: true,
        readOnly: false,
        mode: 'javascript',
        autofocus: true,
        extraKeys: {
            'Ctrl-Q': (cm) => {
                cm.foldCode(cm.getCursor());
            }
        },
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        scrollbarStyle: 'simple'
    };

    private mdCodeConfig = {
        lineNumbers: true,
        lineWrapping: true,
        readOnly: false,
        mode: 'markdown',
        autofocus: true,
        extraKeys: {
            'Ctrl-Q': (cm) => {
                cm.foldCode(cm.getCursor());
            }
        },
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        scrollbarStyle: 'simple'
    };

    private currentError: string = null;

    private _editorFile;
    private editorContent;
    private editorType;

    @Input()
    set editorFile(editorFile: EditorFile) {
        if (editorFile) {
            this._editorFile = editorFile;
            this.loadFile();
        }
    }

    private _previewReadmeActive: boolean = false;
    private previewContent; // used for the README marked() version

    @Input()
    set previewReadmeActive(previewReadme: boolean) {
        this._previewReadmeActive = previewReadme;
    }

    constructor(private fileService: FileService) {
    }

    loadFile() {
        this.changingCurrentFile = true;
        this.currentError = null;
        if (this._editorFile.isModel()) {
            let modelFile = this.fileService.getFile(this._editorFile.id, 'model');
            if (modelFile) {
                this.editorContent = modelFile.getContent();
                this.editorType = 'code';
                this.currentError = this.fileService.validateFile(this._editorFile.id, 'model');
            } else {
                this.editorContent = null;
            }
        } else if (this._editorFile.isScript()) {
            let script = this.fileService.getFile(this._editorFile.id, 'script');
            if (script) {
                this.editorContent = script.getContent();
                this.editorType = 'code';
                this.currentError = this.fileService.validateFile(this._editorFile.id, 'script');
            } else {
                this.editorContent = null;
            }
        } else if (this._editorFile.isAcl()) {
            let aclFile = this.fileService.getFile(this._editorFile.id, 'acl');
            if (aclFile) {
                this.editorContent = aclFile.getContent();
                this.editorType = 'code';
                this.currentError = this.fileService.validateFile(this._editorFile.id, 'acl');
            } else {
                this.editorContent = null;
            }
        } else if (this._editorFile.isPackage()) {
            let packageJson = this.fileService.getFile(this._editorFile.id, 'package');
            this.editorContent = JSON.stringify(packageJson.getContent(), null, 2);
            this.editorType = 'code';
            this.currentError = this.fileService.validateFile(this._editorFile.id, 'package');
        } else if (this._editorFile.isReadMe()) {
            let readme = this.fileService.getFile(this._editorFile.id, 'readme');
            if (readme) {
                this.editorContent = readme.getContent();
                this.previewContent = marked(readme.getContent());
                this.editorType = 'readme';
            }
        } else if (this._editorFile.isQuery()) {
            let queryFile = this.fileService.getFile(this._editorFile.id, 'query');
            if (queryFile) {
                this.editorContent = queryFile.getContent();
                this.editorType = 'code';
                this.currentError = this.fileService.validateFile(this._editorFile.id, 'query');
            } else {
                this.editorContent = null;
            }
        } else {
            this.editorContent = null;
        }

        this.changingCurrentFile = false;
        this.previousCode = this.editorContent;
    }

    onCodeChanged() {
        if (this.changingCurrentFile) {
            return;
        } else if (this.editorContent === this.previousCode) {
            return;
        }
        this.previousCode = this.editorContent;
        this.setCurrentCode();
    }

    private setCurrentCode() {
        let type: string;
        this.currentError = null;
        try {
            if (this._editorFile.isModel()) {
                type = 'model';
            } else if (this._editorFile.isScript()) {
                type = 'script';
            } else if (this._editorFile.isAcl()) {
                type = 'acl';
            } else if (this._editorFile.isQuery()) {
                type = 'query';
            } else if (this._editorFile.isPackage()) {
                type = 'package';
            } else if (this._editorFile.isReadMe()) {
                type = 'readme';
                this.previewContent = marked(this.editorContent);
            }

            let updatedFile = this.fileService.updateFile(this._editorFile.id, this.editorContent, type);

            this.fileService.updateBusinessNetwork(this._editorFile.id, updatedFile);

            this.fileService.businessNetworkChanged$.next(true);
        } catch (e) {
            this.currentError = e.toString();
            this.fileService.businessNetworkChanged$.next(false);
        }
    }
}
