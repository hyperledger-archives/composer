import { Component, Input } from '@angular/core';

import { ClientService } from '../../services/client.service';

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
        scrollbarStyle: 'native'
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

    constructor(private clientService: ClientService) {
    }

    loadFile() {
        this.changingCurrentFile = true;
        this.currentError = null;
        if (this._editorFile.model) {
            let modelFile = this.clientService.getModelFile(this._editorFile.id);
            if (modelFile) {
                this.editorContent = modelFile.getDefinitions();
                this.editorType = 'code';
                this.currentError = this.clientService.validateFile(this._editorFile.id, this.editorContent, 'model');
            } else {
                this.editorContent = null;
            }
        } else if (this._editorFile.script) {
            let script = this.clientService.getScriptFile(this._editorFile.id);
            if (script) {
                this.editorContent = script.getContents();
                this.editorType = 'code';
                this.currentError = this.clientService.validateFile(this._editorFile.id, this.editorContent, 'script');
            } else {
                this.editorContent = null;
            }
        } else if (this._editorFile.acl) {
            let aclFile = this.clientService.getAclFile();
            if (aclFile) {
                this.editorContent = aclFile.getDefinitions();
                this.editorType = 'code';
                this.currentError = this.clientService.validateFile(this._editorFile.id, this.editorContent, 'acl');
            } else {
                this.editorContent = null;
            }
        } else if (this._editorFile.package) {
            let packageJson = this.clientService.getMetaData().getPackageJson();
            this.editorContent = JSON.stringify(packageJson, null, 2);
            this.editorType = 'code';
        } else if (this._editorFile.readme) {
            let readme = this.clientService.getMetaData().getREADME();
            if (readme) {
                this.editorContent = marked(readme);
                this.editorType = 'readme';
            }
        } else {
            this.editorContent = null;
        }

        this.changingCurrentFile = false;
    }

    setCurrentCode() {
        let type: string;
        try {
            if (this._editorFile.model) {
                type = 'model';
            } else if (this._editorFile.script) {
                type = 'script';
            } else if (this._editorFile.acl) {
                type = 'acl';
            } else if (this._editorFile.package) {
                let packageObject = JSON.parse(this.editorContent);
                this.clientService.setBusinessNetworkPackageJson(packageObject);
                this.clientService.businessNetworkChanged$.next(true);
            }
            this.currentError = this.clientService.updateFile(this._editorFile.id, this.editorContent, type);
        } catch (e) {
            this.currentError = e.toString();

            this.clientService.businessNetworkChanged$.next(false);
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
