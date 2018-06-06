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
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AlertService } from '../../basic-modals/alert.service';
import { FileService } from '../../services/file.service';

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
    supportedFileTypes: string[] = ['.js', '.cto', '.md', '.acl', '.qry'];

    addModelNamespace: string = 'org.example.model';
    addModelPath: string = 'models/';
    addModelFileExtension: string = '.cto';
    addScriptFileName: string = 'lib/script';
    addScriptFileExtension: string = '.js';

    error = null;

    constructor(private alertService: AlertService,
                private activeModal: NgbActiveModal,
                private fileService: FileService) {
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
                    case 'qry':
                        this.expandInput = true;
                        this.createQuery(data);
                        break;
                    default:
                        throw new Error('Unexpected File Type: ' + type);
                }
            })
            .catch((err) => {
                this.fileRejected(err);
            });
    }

    fileRejected(reason: string) {
        this.expandInput = false;
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
            let existingScripts = this.fileService.getScripts();
            let increment = 0;

            let scriptName = this.addScriptFileName + this.addScriptFileExtension;

            while (existingScripts.findIndex((file) => file.getIdentifier() === scriptName) !== -1) {
                scriptName = this.addScriptFileName + increment + this.addScriptFileExtension;
                increment++;
            }
            this.currentFile = this.fileService.createScriptFile(scriptName, 'JS', code);
            this.currentFileName = scriptName;
        } else if (this.fileType === 'cto') {
            let existingModels = this.fileService.getModelFiles();
            let increment = 0;

            let newModelNamespace = this.addModelNamespace;
            while (existingModels.findIndex((file) => file.getNamespace() === newModelNamespace) !== -1) {
                newModelNamespace = this.addModelNamespace + increment;
                increment++;
            }

            let code =
                `/**
 * New model file
 */

namespace ${newModelNamespace}`;

            let fileName = this.addModelPath + newModelNamespace + this.addModelFileExtension;
            this.currentFile = this.fileService.createModelFile(code, fileName);
            this.currentFileName = fileName;
        } else if (this.fileType === 'qry') {
            let code =
                `/**
 * New query file
 */`;
            this.currentFileName = 'queries.qry';
            this.currentFile = this.fileService.createQueryFile(this.currentFileName, code);
        } else {
            let code =
                `/**
 * New access control file
 */
 rule AllAccess {
     description: "AllAccess - grant everything to everybody."
     participant: "org.hyperledger.composer.system.Participant"
     operation: ALL
     resource: "org.hyperledger.composer.system.**"
     action: ALLOW
 }`;
            this.currentFileName = 'permissions.acl';
            this.currentFile = this.fileService.createAclFile(this.currentFileName, code);
        }
    }

    private getDataBuffer(file: File) {
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

    private createScript(file: File, dataBuffer) {
        this.fileType = 'js';
        let filename = 'lib/' + file.name;
        this.currentFile = this.fileService.createScriptFile(filename, 'JS', dataBuffer.toString());
        this.currentFileName = this.currentFile.getIdentifier();
    }

    private createModel(file: File, dataBuffer) {
        this.fileType = 'cto';
        let filename = 'models/' + file.name;
        this.currentFile = this.fileService.createModelFile(dataBuffer.toString(), filename);
        this.currentFileName = this.currentFile.getName();
    }

    private createReadme(dataBuffer) {
        this.fileType = 'md';
        this.currentFile = dataBuffer.toString();
        this.currentFileName = 'README.md';
    }

    private createRules(dataBuffer) {
        this.fileType = 'acl';
        let filename = 'permissions.acl';
        this.currentFile = this.fileService.createAclFile(filename, dataBuffer.toString());
        this.currentFileName = filename;
    }

    private createQuery(dataBuffer) {
        this.fileType = 'qry';
        let filename = 'queries.qry';
        this.currentFile = this.fileService.createQueryFile(filename, dataBuffer.toString());
        this.currentFileName = filename;
    }
}
