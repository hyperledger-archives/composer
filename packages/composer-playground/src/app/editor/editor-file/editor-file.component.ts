import { Component, Input } from '@angular/core';

import { FileService } from '../../services/file.service';
import { ClientService } from '../../services/client.service';
import { EditorComponent } from '../editor.component';

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
    set editorFile(editorFile: any) {
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

    constructor(private fileService: FileService, private clientService: ClientService) {
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
    }

    setCurrentCode() {
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
            } else {
                throw new Error('unknown file type');
            }

            let updatedFile = this.fileService.updateFile(this._editorFile.id, this.editorContent, type);
            // read me isn't validated
            if (!this._editorFile.isReadMe()) {
                this.currentError = this.fileService.validateFile(updatedFile.getId(), type);
            }

            if (!this.currentError) {
                // update the stored business network
                this.fileService.updateBusinessNetwork(this._editorFile.id, updatedFile);
            }

            this.fileService.businessNetworkChanged$.next(true);
        } catch (e) {
            this.currentError = e.toString();
            this.fileService.businessNetworkChanged$.next(false);
        }
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
}
