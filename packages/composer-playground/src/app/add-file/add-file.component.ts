import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { BusinessNetworkDefinition, ModelFile } from 'composer-common';
import { AlertService } from '../services/alert.service';

@Component({
    selector: 'add-file-model',
    templateUrl: './add-file.component.html',
    styleUrls: ['./add-file.component.scss'.toString()]
})
export class AddFileComponent {

    @Input() businessNetwork: BusinessNetworkDefinition;

    currentFile = null;
    currentFileName = null;
    fileType = '';
    newFile = false;

    expandInput: boolean = false;

    maxFileSize: number = 5242880;
    supportedFileTypes: string[] = ['.js', '.cto'];

    addModelNamespace: string = 'org.acme.model';
    addModelFileName: string = 'lib/org.acme.model';
    addModelFileExtension: string = '.cto';
    addScriptFileName: string = 'lib/script';
    addScriptFileExtension: string = '.js';

    error = null;

    constructor(private alertService: AlertService,
                private activeModal: NgbActiveModal) {
    }

    removeFile() {
        this.expandInput = false;
        this.currentFile = null;
        this.currentFileName = null;
        this.fileType = '';
    }

    fileDetected() {
        this.expandInput = true;
    }

    fileLeft() {
        this.expandInput = false;
    }

    fileAccepted(file: File) {
        let type = file.name.substr(file.name.lastIndexOf('.') + 1);
        this.getDataBuffer(file)
        .then((data) => {
            switch (type) {
                case 'js':
                    this.expandInput = true;
                    this.createScript(file, data);
                    break;
                case 'cto':
                    this.expandInput = true;
                    this.createModel(file, data);
                    break;
                default:
                    throw new Error('Unexpected File Type');
            }
        })
        .catch((err) => {
            this.fileRejected(err);
        });
    }

    getDataBuffer(file: File) {
        return new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            fileReader.readAsArrayBuffer(file);
            fileReader.onload = () => {
                let dataBuffer = Buffer.from(fileReader.result);
                resolve(dataBuffer);
            };

            fileReader.onerror = (err) => {
                reject(err);
            };
        });
    }

    createScript(file: File, dataBuffer) {
        this.fileType = 'js';
        let scriptManager = this.businessNetwork.getScriptManager();
        this.currentFile = scriptManager.createScript(file.name || this.addScriptFileName, 'JS', dataBuffer.toString());
        this.currentFileName = this.currentFile.getIdentifier();
    }

    createModel(file: File, dataBuffer) {
        this.fileType = 'cto';
        let modelManager = this.businessNetwork.getModelManager();
        this.currentFile = new ModelFile(modelManager, dataBuffer.toString(), file.name || this.addModelFileName);
        this.currentFileName = this.currentFile.getFileName();
    }

    fileRejected(reason: string) {
        this.alertService.errorStatus$.next(reason);
    }

    changeCurrentFileType() {
        this.newFile = true;
        this.currentFile = null;
        if (this.fileType === 'js') {
            let code =
                `/**
 * New script file
 */`;
            let scriptManager = this.businessNetwork.getScriptManager();
            let existingScripts = scriptManager.getScripts();
            let increment = 0;

            let scriptName = this.addScriptFileName;

            while ( existingScripts.findIndex((file) => file.getIdentifier() === scriptName) !== -1 ) {
                scriptName = this.addScriptFileName + increment;
                increment++;
            }

            this.currentFile = scriptManager.createScript(scriptName, 'JS', code);
            this.currentFileName = this.currentFile.getIdentifier();
        } else {
            let modelManager = this.businessNetwork.getModelManager();
            let existingModels = modelManager.getModelFiles();
            let increment = 0;

            let newModelNamespace = this.addModelNamespace;
            while ( existingModels.findIndex((file) => file.getNamespace() === newModelNamespace) !== -1 ) {
                newModelNamespace = this.addModelNamespace + increment;
                increment++;
            }

            let code =
                `/**
 * New model file
 */

namespace ${newModelNamespace}`;

            this.currentFile = new ModelFile(modelManager, code, newModelNamespace + this.addModelFileExtension);
            this.currentFileName = this.currentFile.getFileName();
        }
    }
}
