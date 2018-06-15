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
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

import { AddFileComponent } from './add-file/add-file.component';
import { DeleteComponent } from '../basic-modals/delete-confirm/delete-confirm.component';
import { ReplaceComponent } from '../basic-modals/replace-confirm';
import { UpgradeComponent } from './upgrade/upgrade.component';

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { AlertService } from '../basic-modals/alert.service';
import { FileService } from '../services/file.service';
import { EditorFile } from '../services/editor-file';
import { IdentityCardService } from '../services/identity-card.service';

import {
    ModelFile,
    Script,
    ScriptManager,
    ModelManager,
    AclFile,
    QueryFile,
    QueryManager
} from 'composer-common';

import 'rxjs/add/operator/takeWhile';
import { saveAs } from 'file-saver';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';

@Component({
    selector: 'app-editor',
    templateUrl: './editor.component.html',
    styleUrls: [
        './editor.component.scss'.toString()
    ]
})

export class EditorComponent implements OnInit, OnDestroy {

    private files: any = [];
    private aboutFileNames: any[] = [];
    private invalidAboutFileIDs: any[] = [];
    private currentFile: any = null;
    private deletableFile: boolean = false;

    private addModelNamespace: string = 'models/org.example.model';
    private addScriptFileName: string = 'lib/script';
    private addScriptFileExtension: string = '.js';
    private addModelFileExtension: string = '.cto';

    private deploying: boolean = false;
    private noError: boolean = true;

    private editActive: boolean = false; // Are the input boxes visible?
    private editVersionActive: boolean = false;
    private previewReadme: boolean = true; // Are we in preview mode for the README.md file?

    private businessNetworkName = '';
    private deployedPackageVersion = ''; // This is the deployed BND's package version
    private inputPackageVersion = ''; // This is the input 'Version' before the BND is updated
    private invalidPackage = false;

    private alive: boolean = true; // used to prevent memory leaks on subscribers within ngOnInit/ngOnDestory

    private inputFileNameArray: string[] = null; // This is the input 'FileName' before the currentFile is updated
    private fileNameError: string = null;

    private listItem; // Used in html passage for auto scroll action

    private canDeploy = false;

    constructor(private clientService: ClientService,
                private modalService: NgbModal,
                private alertService: AlertService,
                private fileService: FileService,
                private identityCardService: IdentityCardService,
                private sampleBusinessNetworkService: SampleBusinessNetworkService) {
    }

    ngOnInit(): Promise<any> {
        return this.clientService.ensureConnected()
            .then(() => {
                this.fileService.businessNetworkChanged$.takeWhile(() => this.alive)
                    .subscribe((noError) => {
                        if (this.editorFilesValidate() && noError) {
                            this.noError = noError;
                        } else {
                            this.noError = false;
                        }
                    });

                this.fileService.namespaceChanged$.takeWhile(() => this.alive)
                    .subscribe((newName) => {
                        if (this.currentFile !== null) {
                            this.updateFiles();
                            let index = this.findFileIndex(true, newName);
                            this.setCurrentFile(this.files[index]);
                        }
                    });

                if (this.fileService.getEditorFiles().length === 0) {
                    this.files = this.fileService.loadFiles();
                    this.fileService.incrementBusinessNetworkVersion();
                }

                this.updatePackageInfo();
                this.updateFiles();
                this.checkCanDeploy();
            })
            .catch((error) => {
                this.alertService.errorStatus$.next(error);
            });
    }

    ngOnDestroy() {
        this.alive = false;
    }

    checkCanDeploy() {
        let currentCard = this.identityCardService.getCurrentIdentityCard();
        let connectionProfile = currentCard.getConnectionProfile();

        this.canDeploy = this.identityCardService.canDeploy(this.identityCardService.getQualifiedProfileName(connectionProfile));
    }

    updatePackageInfo() {
        if (this.fileService) {
            this.businessNetworkName = this.clientService.getBusinessNetwork().getName();
            this.deployedPackageVersion = this.clientService.getDeployedBusinessNetworkVersion();
            this.inputPackageVersion = this.fileService.getBusinessNetworkVersion();

            if (this.deployedPackageVersion === this.inputPackageVersion) {
                this.fileService.incrementBusinessNetworkVersion();
                this.inputPackageVersion = this.fileService.getBusinessNetworkVersion();
            }
        }
    }

    setCurrentFile(file) {
        let listItemIndex;
        if (file.isPackage() || file.isReadMe()) {
            listItemIndex = 'About';
        } else {
            listItemIndex = this.findFileIndex(true, file.id) - this.aboutFileNames.length;
        }
        this.listItem = 'editorFileList' + listItemIndex;

        let always = (this.currentFile === null || file.isPackage() || file.isReadMe() || file.isAcl() || file.isQuery());
        let conditional = (always || this.currentFile.id !== file.id || this.currentFile.displayID !== file.displayID);
        if (always || conditional) {
            if (file.isScript() || file.isModel() || file.isQuery()) {
                this.deletableFile = true;
            } else {
                this.deletableFile = false;
            }
            // Reset editActive
            this.editActive = false;
            // Set selected file
            this.fileService.setCurrentFile(file);
            this.currentFile = file;

            // Update inputFileName
            this.inputFileNameArray = this.formatFileName(file.displayID);

            // remove fileError flag
            this.fileNameError = null;
        }
    }

    formatFileName(fullname: string): string[] {
        let name = [];
        let startIdx = fullname.indexOf('/') + 1;
        let endIdx = fullname.lastIndexOf('.');
        name.push(fullname.substring(0, startIdx));
        name.push(fullname.substring(startIdx, endIdx));
        name.push(fullname.substring(endIdx, fullname.length));
        return name;
    }

    updateFiles(selectFile = null) {
        let initialFile;
        this.files = this.fileService.getEditorFiles();

        this.aboutFileNames = [];
        for (let i = 0; i < this.files.length; i++) {
            let file = this.files[i];
            if (file.isPackage() || file.isReadMe()) {
                if (file.isReadMe()) {
                    initialFile = file;
                }
                this.aboutFileNames.push(file.displayID);
            } else {
                if (!initialFile) {
                    initialFile = file;
                }
                break;
            }
        }

        if (selectFile) {
            this.setCurrentFile(selectFile);
        } else if (this.fileService.getCurrentFile()) {
            this.setCurrentFile(this.fileService.getCurrentFile());
        } else if (initialFile) {
            this.setCurrentFile(initialFile);
        }
    }

    addModelFile(contents = null) {
        let code;
        let modelName;
        let newModelNamespace;

        if (!contents) {
            newModelNamespace = this.addModelNamespace;
            let increment = 0;
            while (this.findFileIndex(true, newModelNamespace) !== -1) {
                newModelNamespace = this.addModelNamespace + increment;
                increment++;
            }

            modelName = newModelNamespace + this.addModelFileExtension;
            code =
                `/**
                  * New model file
                  */

                  namespace ${newModelNamespace}`;
        } else {
            newModelNamespace = contents.namespace;
            modelName = contents.fileName;
            code = contents.definitions;
        }

        let newFile = this.fileService.addFile(newModelNamespace, modelName, code, 'model');
        try {
            let error = this.fileService.validateFile(newFile.getId(), newFile.getType());
            if (!error) {
                this.fileService.updateBusinessNetwork(newFile.getId(), newFile);
            }
        } finally {
            this.updateFiles(newFile);
            this.noError = this.editorFilesValidate();
        }
    }

    addScriptFile(content = null) {
        let scriptName;
        let code;

        if (!content) {
            scriptName = this.addScriptFileName + this.addScriptFileExtension;
            let increment = 1;
            while (typeof this.fileService.getFile(scriptName, 'script') !== 'undefined') {
                scriptName = this.addScriptFileName + increment + this.addScriptFileExtension;
                increment++;
            }

            code =
                `/**
          * New script file
          */`;

        } else {
            scriptName = content.getIdentifier();
            let increment = 1;
            while (typeof this.fileService.getFile(scriptName, 'script') !== 'undefined') {
                let fileName = content.getIdentifier();
                let breakPoint = fileName.lastIndexOf('.');
                scriptName = fileName.substring(0, breakPoint) + increment + fileName.substring(breakPoint, fileName.length);
                increment++;
            }
            code = content.contents;
        }

        let newFile = this.fileService.addFile(scriptName, scriptName, code, 'script');
        try {
            let error = this.fileService.validateFile(newFile.getId(), newFile.getType());
            if (!error) {
                this.fileService.updateBusinessNetwork(newFile.getId(), newFile);
            }
        } finally {
            this.updateFiles(newFile);
            this.noError = this.editorFilesValidate();
        }
    }

    addQueryFile(query) {
        if (this.files.findIndex((file) => file.isQuery() === true) !== -1) {
            const confirmModalRef = this.modalService.open(ReplaceComponent);
            confirmModalRef.componentInstance.mainMessage = 'Your current Query file will be replaced with the new one that you are uploading.';
            confirmModalRef.componentInstance.supplementaryMessage = 'Please ensure that you have saved a copy of your Query file to disc.';
            confirmModalRef.componentInstance.resource = 'file';
            confirmModalRef.result.then((result) => {
                this.fileService.deleteFile(null, 'query');
                this.processQueryFileAddition(query);
            }, (reason) => {
                if (reason && reason !== 1) {
                    this.alertService.errorStatus$.next(reason);
                }
            });
        } else {
            this.processQueryFileAddition(query);
        }
    }

    processQueryFileAddition(query) {
        let newFile = this.fileService.addFile(query.getIdentifier(), query.getIdentifier(), query.getDefinitions(), 'query');
        try {
            let error = this.fileService.validateFile(newFile.getId(), newFile.getType());
            if (!error) {
                this.fileService.updateBusinessNetwork(newFile.getId(), newFile);
            }
        } finally {
            this.updateFiles(newFile);
            this.noError = this.editorFilesValidate();
        }
    }

    addReadme(readme) {
        if (this.files[0].isReadMe()) {
            const confirmModalRef = this.modalService.open(ReplaceComponent);
            confirmModalRef.componentInstance.mainMessage = 'Your current README file will be replaced with the new one that you are uploading.';
            confirmModalRef.componentInstance.supplementaryMessage = 'Please ensure that you have saved a copy of your README file to disc.';
            confirmModalRef.componentInstance.resource = 'file';
            confirmModalRef.result.then((result) => {
                this.fileService.setBusinessNetworkReadme(readme);
                this.updateFiles(this.files[0]);
            }, (reason) => {
                if (reason && reason !== 1) {
                    this.alertService.errorStatus$.next(reason);
                }
            });
        } else {
            this.fileService.setBusinessNetworkReadme(readme);
            this.updateFiles(readme);
        }
    }

    addRuleFile(rules) {
        if (this.files.findIndex((file) => file.isAcl() === true) !== -1) {
            const confirmModalRef = this.modalService.open(ReplaceComponent);
            confirmModalRef.componentInstance.mainMessage = 'Your current ACL file will be replaced with the new one that you are uploading.';
            confirmModalRef.componentInstance.supplementaryMessage = 'Please ensure that you have saved a copy of your ACL file to disc.';
            confirmModalRef.componentInstance.resource = 'file';
            confirmModalRef.result.then((result) => {
                this.fileService.deleteFile(null, 'acl');
                this.processRuleFileAddition(rules);
            }, (reason) => {
                if (reason && reason !== 1) {
                    this.alertService.errorStatus$.next(reason);
                }
            });
        } else {
            // Set straight away
            this.processRuleFileAddition(rules);
        }
    }

    processRuleFileAddition(rules) {
        let newFile = this.fileService.addFile(rules.getIdentifier(), rules.getIdentifier(), rules.getDefinitions(), 'acl');
        try {
            let error = this.fileService.validateFile(newFile.getId(), newFile.getType());
            if (!error) {
                this.fileService.updateBusinessNetwork(newFile.getId(), newFile);
            }
        } finally {
            this.updateFiles(newFile);
            this.noError = this.editorFilesValidate();
        }
    }

    exportBNA() {
        return this.fileService.getBusinessNetwork().toArchive().then((exportedData) => {
            let file = new Blob([exportedData],
                {type: 'application/octet-stream'});
            saveAs(file, this.fileService.getBusinessNetworkName() + '.bna');
        });
    }

    openAddFileModal() {
        const confirmModalRef = this.modalService.open(AddFileComponent);
        confirmModalRef.componentInstance.files = this.files;

        confirmModalRef.result
            .then((result) => {
                if (result !== 0) {
                    try {
                        if (result instanceof ModelFile) {
                            this.addModelFile(result);
                        } else if (result instanceof Script) {
                            this.addScriptFile(result);
                        } else if (result instanceof AclFile) {
                            this.addRuleFile(result);
                        } else if (result instanceof QueryFile) {
                            this.addQueryFile(result);
                        } else {
                            this.addReadme(result);
                        }
                        this.fileService.businessNetworkChanged$.next(true);
                    } catch (error) {
                        this.alertService.errorStatus$.next(error);
                    }
                }
            }, (reason) => {
                if (reason && reason !== 1) {
                    this.alertService.errorStatus$.next(reason);
                }
            });
    }

    deploy(): Promise<any> {
        if (this.deploying) {
            return;
        }
        this.deploying = true;

        // Gets the definition for the currently deployed business network
        const networkDefinition = this.fileService.getBusinessNetwork();

        let currentCard = this.identityCardService.getCurrentIdentityCard();
        const connectionProfile = currentCard.getConnectionProfile();
        const qpn = this.identityCardService.getQualifiedProfileName(connectionProfile);

        let upgradePromise;
        if (currentCard.getConnectionProfile()['x-type'] === 'web') {
            let currentCardRef = this.identityCardService.getCurrentCardRef();
            upgradePromise = this.sampleBusinessNetworkService.upgradeBusinessNetwork(networkDefinition, currentCardRef, currentCardRef);
        } else if (!this.identityCardService.canDeploy(qpn)) {
            this.alertService.errorStatus$.next('<p>You must import business network cards with the correct admin rights before you can deploy new versions of a business network.</p>');
        } else {
            const upgradeModalRef = this.modalService.open(UpgradeComponent);

            upgradePromise = upgradeModalRef.result
                .then((result) => {
                    return this.sampleBusinessNetworkService.upgradeBusinessNetwork(networkDefinition, result.peerCardRef, result.channelCardRef);
                }, (reason) => {
                    throw reason;
                });
        }

        if (!upgradePromise) {
            this.deploying = false;
            return Promise.resolve();
        } else {
            return upgradePromise
                .then(() => {
                    this.updatePackageInfo();
                    this.updateFiles();
                    this.fileService.changesDeployed();
                    this.alertService.busyStatus$.next(null);
                    this.alertService.successStatus$.next({
                        title: 'Changes deployed',
                        text: 'Your most recent set of changes were successfully deployed via a chaincode upgrade',
                        icon: '#icon-deploy_24'
                    });
                    this.deploying = false;
                })
                .catch((error) => {
                    this.deploying = false;
                    if (error && error !== ModalDismissReasons.BACKDROP_CLICK && error !== ModalDismissReasons.ESC) {
                        // if failed on update should go back to what was there before
                        this.updatePackageInfo();
                        this.updateFiles();
                        this.alertService.busyStatus$.next(null);
                        this.alertService.errorStatus$.next(error);
                    }
                });
        }
    }

    /*
     * Sets the current README file editor state (from editor to previewer)
     */
    setReadmePreview(preview: boolean) {
        this.previewReadme = preview;
        this.setCurrentFile(this.fileService.getEditorReadMe());
    }

    editPackageJson() {
        this.setCurrentFile(this.fileService.getEditorPackageFile());
    }

    toggleEditVersionActive() {
        this.editVersionActive = !this.editVersionActive;
    }

    /*
     * Swaps the toggle state. Used when editing Name and Version, will show input boxes.
     */
    toggleEditActive() {
        this.editActive = !this.editActive;
    }

    /*
     * When user edits the file name (in the input box), the underlying file needs to be updated, and the BND needs to be updated
     */
    editFileName() {
        this.fileNameError = null;
        let regEx = new RegExp(/^(([a-z_\-0-9\.]|[A-Z_\-0-9\.])+)$/);
        if (regEx.test(this.inputFileNameArray[1]) === true) {
            let inputFileName = this.inputFileNameArray[0] + this.inputFileNameArray[1] + this.inputFileNameArray[2];
            if ((this.findFileIndex(false, inputFileName) !== -1) && (this.currentFile.displayID !== inputFileName)) {
                this.fileNameError = 'Error: Filename already exists';
            } else if (this.currentFile.isScript()) {
                if (this.currentFile.id !== inputFileName) {
                    // Replace Script
                    let contents = this.fileService.getScriptFile(this.currentFile.id).getContents();
                    this.fileService.replaceBusinessNetworkFile(this.currentFile.id, inputFileName, contents, 'script');
                    let newFile = this.fileService.replaceFile(this.currentFile.id, inputFileName, contents, 'script'); // file service uses its own saved contents so can rename an invalid file
                    this.files = this.fileService.getEditorFiles();
                    this.setCurrentFile(newFile);
                } else {
                    this.editActive = false;
                }
            } else if (this.currentFile.isModel()) {
                if (this.currentFile.displayID !== inputFileName) {
                    // Update Model filename
                    let contents = this.fileService.getModelFile(this.currentFile.id).getDefinitions();
                    this.fileService.replaceBusinessNetworkFile(this.currentFile.id, inputFileName, contents, 'model');
                    let newFile = this.fileService.replaceFile(this.currentFile.id, inputFileName, contents, 'model'); // file service uses its own saved contents so it can use an invalid file, needs the last known good contents though so can get namespace if its can't from own contents
                    this.files = this.fileService.getEditorFiles();
                    this.setCurrentFile(newFile);
                } else {
                    this.editActive = false;
                }
            } else {
                this.fileNameError = 'Error: Unable to process rename on current file type';
            }
        } else {
            this.fileNameError = 'Error: Invalid filename, file must be alpha-numeric with no spaces';
        }
    }

    editorFileVersionChange(event) {
        this.inputPackageVersion = event.version;
        this.invalidPackage = event.jsonErr;
    }

    updateVersion() {
        this.toggleEditVersionActive();
        try {
            const updatedPackageFile = this.fileService.updateBusinessNetworkVersion(this.inputPackageVersion);

            this.fileService.updateBusinessNetwork(updatedPackageFile.getId(), updatedPackageFile);
            this.fileService.businessNetworkChanged$.next(true);
        } catch (e) {
            this.fileService.businessNetworkChanged$.next(false);
        }
    }

    /*
     * User selects to delete the current editor file
     */
    openDeleteFileModal() {
        const confirmModalRef = this.modalService.open(DeleteComponent);
        const deleteFile = this.currentFile;
        confirmModalRef.componentInstance.headerMessage = 'Delete File';
        confirmModalRef.componentInstance.deleteFile = deleteFile;
        confirmModalRef.componentInstance.deleteMessage = 'This file will be removed from your business network definition, which may stop your business network from working and may limit access to data that is already stored in the business network.';

        confirmModalRef.result
            .then((result) => {
                if (result) {
                    this.alertService.busyStatus$.next({
                        title: 'Deleting file within business network',
                        text: 'deleting ' + this.fileService.getBusinessNetworkName()
                    });

                    if (deleteFile.isScript()) {
                        let scriptManager: ScriptManager = this.fileService.getBusinessNetwork().getScriptManager();
                        scriptManager.deleteScript(deleteFile.id);
                        this.fileService.deleteFile(deleteFile.id, 'script');
                    } else if (deleteFile.isModel()) {
                        let modelManager: ModelManager = this.fileService.getBusinessNetwork().getModelManager();
                        modelManager.deleteModelFile(deleteFile.id);
                        this.fileService.deleteFile(deleteFile.id, 'model');
                    } else if (deleteFile.isQuery()) {
                        let queryManager: QueryManager = this.fileService.getBusinessNetwork().getQueryManager();
                        queryManager.deleteQueryFile();
                        this.fileService.deleteFile(deleteFile.id, 'query');
                    } else {
                        throw new Error('Unable to process delete on selected file type');
                    }

                    // remove file from list view
                    this.updateFiles();

                    // validate the remaining (acl/cto files and conditionally enable deploy
                    this.noError = this.editorFilesValidate();

                    // Send alert
                    this.alertService.busyStatus$.next(null);
                    this.alertService.successStatus$.next({
                        title: 'Delete Successful',
                        text: this.fileType(deleteFile) + ' File ' + deleteFile.displayID + ' was deleted.',
                        icon: '#icon-bin_icon'
                    });
                }
            }, (reason) => {
                if (reason && reason !== 1) {
                    this.alertService.busyStatus$.next(null);
                    this.alertService.errorStatus$.next(reason);
                }
            })
            .catch((error) => {
                this.alertService.busyStatus$.next(null);
                this.alertService.errorStatus$.next(error);
            });
    }

    fileType(resource: EditorFile): string {
        if (resource.isModel()) {
            return 'Model';
        } else if (resource.isScript()) {
            return 'Script';
        } else if (resource.isAcl()) {
            return 'ACL';
        } else if (resource.isQuery()) {
            return 'Query';
        } else if (resource.isPackage()) {
            return 'Package';
        } else {
            return 'Readme';
        }
    }

    preventNameEdit(resource: EditorFile): boolean {
        if (resource.isReadMe() || resource.isPackage() || resource.isAcl() || resource.isQuery()) {
            return true;
        } else {
            return false;
        }
    }

    findFileIndex(byId: boolean, matcher) {
        if (byId) {
            return this.files.findIndex((file) => file.id === matcher);
        } else {
            return this.files.findIndex((file) => file.displayID === matcher);
        }
    }

    editorFilesValidate(): boolean {
        this.invalidAboutFileIDs = [];
        let allValid: boolean = true;
        for (let file of this.files) {
            if (file.isModel()) {
                if (this.fileService.validateFile(file.id, 'model') !== null) {
                    allValid = false;
                    file.invalid = true;
                } else {
                    file.invalid = false;
                }
            } else if (file.isAcl()) {
                if (this.fileService.validateFile(file.id, 'acl') !== null) {
                    allValid = false;
                    file.invalid = true;
                } else {
                    file.invalid = false;
                }
            } else if (file.isScript()) {
                if (this.fileService.validateFile(file.id, 'script') !== null) {
                    allValid = false;
                    file.invalid = true;
                } else {
                    file.invalid = false;
                }
            } else if (file.isQuery()) {
                if (this.fileService.validateFile(file.id, 'query') !== null) {
                    allValid = false;
                    file.invalid = true;
                } else {
                    file.invalid = false;
                }
            } else if (file.isPackage()) {
                if (this.fileService.validateFile(file.id, 'package') !== null) {
                    allValid = false;
                    file.invalid = true;
                    this.invalidAboutFileIDs.push(file.id);
                } else {
                    file.invalid = false;
                }
            }
        }

        if (allValid) {
            for (let file of this.files) {
                this.fileService.updateBusinessNetwork(file.id, file);
            }
        }
        return allValid;
    }
}
