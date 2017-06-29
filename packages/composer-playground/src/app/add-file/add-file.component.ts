import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { BusinessNetworkDefinition, ModelFile, AclFile } from 'composer-common';
import { AlertService } from '../services/alert.service';
import { ClientService } from '../services/client.service';

@Component({
    selector: 'add-file-modal',
    templateUrl: './add-file.component.html',
    styleUrls: ['./add-file.component.scss'.toString()]
})
export class AddFileComponent {

    currentFile = null;
    currentFileName = null;
    fileType = '';
    newFile = false;

    expandInput: boolean = false;

    maxFileSize: number = 5242880;
    supportedFileTypes: string[] = ['.js', '.cto', '.md', '.acl'];

    addModelNamespace: string = 'org.acme.model';
    addModelFileName: string = 'models/org.acme.model';
    addModelPath: string = 'models/';
    addModelFileExtension: string = '.cto';
    addScriptFileName: string = 'lib/script';
    addScriptFileExtension: string = '.js';

    error = null;

    constructor(private alertService: AlertService,
                private activeModal: NgbActiveModal,
                private clientService: ClientService) {
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
                case 'md':
                    this.expandInput = true;
                    this.createReadme(data);
                    break;
                case 'acl':
                    this.expandInput = true;
                    this.createRules(data);
                    break;
                default:
                    throw new Error('Unexpected File Type: ' + type);
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
        let filename = (file && file.name) ? 'lib/' + file.name : this.addScriptFileName;
        this.currentFile = this.clientService.createScriptFile(filename, 'JS', dataBuffer.toString());
        this.currentFileName = this.currentFile.getIdentifier();
    }

    createModel(file: File, dataBuffer) {
        this.fileType = 'cto';
        let filename = (file && file.name) ? 'models/' + file.name : this.addModelFileName;
        this.currentFile = this.clientService.createModelFile(dataBuffer.toString(), filename);
        this.currentFileName = this.currentFile.getName();
    }

    createReadme(dataBuffer) {
        this.fileType = 'md';
        this.currentFile = dataBuffer.toString();
        this.currentFileName = 'README.md';
    }

    createRules(dataBuffer) {
        this.fileType = 'acl';
        let filename = 'permissions.acl';
        this.currentFile = this.clientService.createAclFile(filename, dataBuffer.toString());
        this.currentFileName = filename;
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
            let existingScripts = this.clientService.getScripts();
            let increment = 0;

            let scriptName = this.addScriptFileName + this.addScriptFileExtension;

            while ( existingScripts.findIndex((file) => file.getIdentifier() === scriptName) !== -1 ) {
                scriptName = this.addScriptFileName + increment + this.addScriptFileExtension;
                increment++;
            }
            this.currentFile = this.clientService.createScriptFile(scriptName, 'JS', code);
            this.currentFileName = scriptName;
        } else {
            let existingModels = this.clientService.getModelFiles();
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

            let fileName = this.addModelPath + newModelNamespace + this.addModelFileExtension;
            this.currentFile = this.clientService.createModelFile(code, fileName);
            this.currentFileName = fileName;
        }
    }
}
