import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { UpdateComponent } from '../import/update.component';
import { AddFileComponent } from './add-file/add-file.component';
import { DeleteComponent } from '../basic-modals/delete-confirm/delete-confirm.component';
import { ReplaceComponent } from '../basic-modals/replace-confirm';
import { DrawerService } from '../common/drawer/drawer.service';

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { AlertService } from '../basic-modals/alert.service';
import { FileService } from '../services/file.service';
import { EditorFile } from '../services/editor-file';

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

@Component({
    selector: 'app-editor',
    templateUrl: './editor.component.html',
    styleUrls: [
        './editor.component.scss'.toString()
    ]
})

export class EditorComponent implements OnInit, OnDestroy {

    private files: any = [];
    private currentFile: any = null;
    private deletableFile: boolean = false;

    private addModelNamespace: string = 'models/org.acme.model';
    private addScriptFileName: string = 'lib/script';
    private addScriptFileExtension: string = '.js';
    private addModelFileExtension: string = '.cto';

    private deploying: boolean = false;
    private noError: boolean = true;

    private editActive: boolean = false; // Are the input boxes visible?
    private editingPackage: boolean = false; // Is the package.json being edited?
    private previewReadme: boolean = true; // Are we in preview mode for the README.md file?

    private deployedPackageVersion; // This is the deployed BND's package version
    private inputPackageVersion; // This is the input 'Version' before the BND is updated

    private alive: boolean = true; // used to prevent memory leaks on subscribers within ngOnInit/ngOnDestory

    private inputFileNameArray: string[] = null; // This is the input 'FileName' before the currentFile is updated
    private fileNameError: string = null;

    private listItem; // Used in html passage for auto scroll action

    constructor(private adminService: AdminService,
                private clientService: ClientService,
                private modalService: NgbModal,
                private alertService: AlertService,
                private drawerService: DrawerService,
                private fileService: FileService) {
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
                } else {
                    this.files = this.fileService.getEditorFiles();
                }

                this.updatePackageInfo();

                if (this.fileService.getCurrentFile() !== null) {
                    this.setCurrentFile(this.fileService.getCurrentFile());
                } else {
                    this.setInitialFile();
                }
            })
            .catch((error) => {
                this.alertService.errorStatus$.next(error);
            });
    }

    ngOnDestroy() {
        this.alive = false;
    }

    updatePackageInfo() {
        let metaData = this.fileService.getMetaData();
        this.deployedPackageVersion = metaData.getVersion(); // Set Version
        this.inputPackageVersion = metaData.getVersion();
    }

    setInitialFile() {
        if (this.files && this.files.length > 0) {
            let initialFile = this.files.find((file) => {
                return file.isReadMe();
            });
            if (!initialFile) {
                initialFile = this.files[0];
            }
            this.setCurrentFile(initialFile);
        }
    }

    setCurrentFile(file) {
        this.listItem = 'editorFileList' + this.findFileIndex(true, file.id);
        let always = (this.currentFile === null || file.isPackage() || file.isReadMe() || file.isAcl() || file.isQuery());
        let conditional = (always || this.currentFile.id !== file.id || this.currentFile.displayID !== file.displayID);
        if (always || conditional) {
            if (this.editingPackage) {
                this.updatePackageInfo();
                this.editingPackage = false;
            }
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

    updateFiles() {
        this.files = this.fileService.getEditorFiles();
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
        this.setCurrentFile(newFile);
        try {
            let error = this.fileService.validateFile(newFile.getId(), newFile.getType());
            if (!error) {
                this.fileService.updateBusinessNetwork(newFile.getId(), newFile);
            }
        } finally {
            this.files = this.fileService.getEditorFiles();
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
        this.setCurrentFile(newFile);
        try {
            let error = this.fileService.validateFile(newFile.getId(), newFile.getType());
            if (!error) {
                this.fileService.updateBusinessNetwork(newFile.getId(), newFile);
            }
        } finally {
            this.files = this.fileService.getEditorFiles();
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
        this.setCurrentFile(newFile);
        try {
            let error = this.fileService.validateFile(newFile.getId(), newFile.getType());
            if (!error) {
                this.fileService.updateBusinessNetwork(newFile.getId(), newFile);
            }
        } finally {
            this.files = this.fileService.getEditorFiles();
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
                this.files = this.fileService.getEditorFiles();
                this.setCurrentFile(this.files[0]);
            }, (reason) => {
                if (reason && reason !== 1) {
                    this.alertService.errorStatus$.next(reason);
                }
            });
        } else {
            this.fileService.setBusinessNetworkReadme(readme);
            this.files = this.fileService.getEditorFiles();
            this.setCurrentFile(this.files[0]);
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
        this.setCurrentFile(newFile);
        try {
            let error = this.fileService.validateFile(newFile.getId(), newFile.getType());
            if (!error) {
                this.fileService.updateBusinessNetwork(newFile.getId(), newFile);
            }
        } finally {
            this.files = this.fileService.getEditorFiles();
            this.noError = this.editorFilesValidate();
        }
    }

    openImportModal() {
        const importModalRef = this.drawerService.open(UpdateComponent);
        importModalRef.componentInstance.finishedSampleImport.subscribe((result) => {
            if (result.deployed) {
                this.files = this.fileService.loadFiles();
                this.updatePackageInfo();
                if (this.files.length) {
                    let currentFile = this.files.find((file) => {
                        return file.isReadMe();
                    });
                    if (!currentFile) {
                        currentFile = this.files[0];
                    }
                    this.setCurrentFile(currentFile);
                    this.alertService.successStatus$.next({
                        title: 'Import Successful',
                        text: 'Business network imported successfully',
                        icon: '#icon-deploy_24'
                    });
                }
            } else {
                importModalRef.close();
                if (result.error) {
                    this.alertService.errorStatus$.next(result.error);
                }
            }
        });
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
        // Gets the definition for the currently deployed business network
        this.alertService.busyStatus$.next({
            title: 'Updating updated business network',
            text: 'updating ' + this.fileService.getBusinessNetworkName()
        });
        return Promise.resolve()
            .then(() => {
                if (this.deploying) {
                    return;
                }
                this.deploying = true;
                return this.adminService.update(this.fileService.getBusinessNetwork());
            })
            .then(() => {
                this.deploying = false;
                return this.clientService.refresh();
            })
            .then(() => {
                this.updatePackageInfo();
                this.updateFiles();
                this.fileService.changesDeployed();
                this.alertService.busyStatus$.next(null);
                this.alertService.successStatus$.next({
                    title: 'Update Successful',
                    text: 'Business network updated successfully',
                    icon: '#icon-deploy_24'
                });
            })
            .catch((error) => {
                this.deploying = false;
                // if failed on update should go back to what was there before
                this.updatePackageInfo();
                this.updateFiles();
                this.alertService.busyStatus$.next(null);
                this.alertService.errorStatus$.next(error);
            });
    }

    /*
     * Sets the current README file editor state (from editor to previewer)
     */
    setReadmePreview(preview: boolean) {
        this.previewReadme = preview;
    }

    /*
     * Swaps the toggle state. Used when editing Name and Version, will show input boxes.
     */
    toggleEditActive() {
        this.editActive = !this.editActive;
        if (this.editActive && this.fileType(this.currentFile) === 'Readme') {
            let mockPackageFile = new EditorFile('package', 'package.json', JSON.stringify(this.fileService.getMetaData().packageJson), 'package');
            this.setCurrentFile(mockPackageFile);
            this.hideEdit();
        }
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

    hideEdit() {
        this.editActive = false;
        this.editingPackage = true;
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
                    this.files = this.fileService.getEditorFiles();

                    // Make sure we set a file to remove the deleted file from the view
                    this.setInitialFile();

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
        } else {
            return 'Readme';
        }
    }

    preventNameEdit(resource: EditorFile): boolean {
        if (resource.isAcl() || resource.isQuery()) {
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
            }
        }

        if (this.fileService.validateFile('package', 'package') !== null) {
            allValid = false;
        }

        if (allValid) {
            for (let file of this.files) {
                this.fileService.updateBusinessNetwork(file.id, file);
            }
        }
        return allValid;
    }
}
