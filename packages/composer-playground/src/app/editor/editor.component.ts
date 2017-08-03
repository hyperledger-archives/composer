import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ImportComponent } from '../import/import.component';
import { AddFileComponent } from './add-file/add-file.component';
import { DeleteComponent } from '../basic-modals/delete-confirm/delete-confirm.component';
import { ReplaceComponent } from '../basic-modals/replace-confirm';
import { DrawerService } from '../common/drawer/drawer.service';

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { AlertService } from '../basic-modals/alert.service';
import { EditorService } from './editor.service';

import {
    ModelFile,
    Script,
    ScriptManager,
    ModelManager,
    AclManager,
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

    private noError: boolean = true;
    private dirty: boolean = false;
    private deploying: boolean = false;

    private editActive: boolean = false; // Are the input boxes visible?
    private editingPackage: boolean = false; // Is the package.json being edited?
    private previewReadme: boolean = true; // Are we in preview mode for the README.md file?

    private deployedPackageName; // This is the deployed BND's package name
    private deployedPackageVersion; // This is the deployed BND's package version
    private deployedPackageDescription; // This is the deployed BND's package description

    private inputPackageName; // This is the input 'Name' before the BND is updated
    private inputPackageVersion; // This is the input 'Version' before the BND is updated

    private alive: boolean = true; // used to prevent memory leaks on subscribers within ngOnInit/ngOnDestory

    private inputFileNameArray: string[] = null; // This is the input 'FileName' before the currentFile is updated
    private fileNameError: string = null;

    private listItem; // Used in html passage for auto scroll action

    constructor(private adminService: AdminService,
                private clientService: ClientService,
                private modalService: NgbModal,
                private alertService: AlertService,
                private editorService: EditorService,
                private drawerService: DrawerService) {

    }

    ngOnInit(): Promise<any> {
        return this.clientService.ensureConnected()
            .then(() => {
                this.clientService.businessNetworkChanged$.takeWhile(() => this.alive)
                    .subscribe((noError) => {
                        if (this.editorFilesValidate() && noError) {
                            this.noError = noError;
                            this.dirty = true;
                        } else {
                            this.noError = false;
                        }
                    });

                this.clientService.namespaceChanged$.takeWhile(() => this.alive)
                    .subscribe((newName) => {
                        if (this.currentFile !== null) {
                            this.updateFiles();
                            let index = this.findFileIndex(true, newName);
                            this.setCurrentFile(this.files[index]);
                        }
                    });

                this.updatePackageInfo();
                this.updateFiles();

                if (this.editorService.getCurrentFile() !== null) {
                    this.setCurrentFile(this.editorService.getCurrentFile());
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
        this.deployedPackageName = this.clientService.getMetaData().getName(); // Set Name
        this.deployedPackageVersion = this.clientService.getMetaData().getVersion(); // Set Version
        this.deployedPackageDescription = this.clientService.getMetaData().getDescription(); // Set Description
        this.inputPackageName = this.clientService.getMetaData().getName();
        this.inputPackageVersion = this.clientService.getMetaData().getVersion();
    }

    setInitialFile() {
        if (this.files.length) {
            let initialFile = this.files.find((file) => {
                return file.readme;
            });
            if (!initialFile) {
                initialFile = this.files[0];
            }
            this.setCurrentFile(initialFile);
        }
    }

    setCurrentFile(file) {
        this.listItem = 'editorFileList' + this.findFileIndex(true, file.id);
        let always = (this.currentFile === null || file.readme || file.acl);
        let conditional = (always || this.currentFile.id !== file.id || this.currentFile.displayID !== file.displayID);
        if (always || conditional) {
            if (this.editingPackage) {
                this.updatePackageInfo();
                this.editingPackage = false;
            }
            if (file.script || file.model || file.query) {
                this.deletableFile = true;
            } else {
                this.deletableFile = false;
            }
            // Reset editActive
            this.editActive = false;
            // Set selected file
            this.editorService.setCurrentFile(file);
            this.currentFile = file;

            // Update inputFileName
            this.inputFileNameArray = this.formatFileName(file.displayID);

            // re-validate, since we do not persist bad files- they revert when navigated away
            if (this.editorFilesValidate()) {
                this.noError = true;
            }

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
        let newFiles = [];
        // deal with model files
        let modelFiles = this.clientService.getModelFiles();
        let newModelFiles = [];
        modelFiles.forEach((modelFile) => {
            // ignore system model files
            if (!modelFile.isSystemModelFile()) {
                newModelFiles.push({
                    model: true,
                    id: modelFile.getNamespace(),
                    displayID: modelFile.getName(),
                });
            }
        });
        newModelFiles.sort((a, b) => {
            return a.displayID.localeCompare(b.displayID);
        });
        newFiles.push.apply(newFiles, newModelFiles);

        // deal with script files
        let scriptFiles = this.clientService.getScripts();
        let newScriptFiles = [];
        scriptFiles.forEach((scriptFile) => {
            newScriptFiles.push({
                script: true,
                id: scriptFile.getIdentifier(),
                displayID: scriptFile.getIdentifier()
            });
        });
        newScriptFiles.sort((a, b) => {
            return a.displayID.localeCompare(b.displayID);
        });
        newFiles.push.apply(newFiles, newScriptFiles);

        // deal with acl file
        let aclFile = this.clientService.getAclFile();
        if (aclFile) {
            newFiles.push({
                acl: true,
                id: aclFile.getIdentifier(),
                displayID: aclFile.getIdentifier()
            });
        }

        // deal with query
        let queryFile = this.clientService.getQueryFile();
        if (queryFile) {
            newFiles.push({
                query: true,
                id: queryFile.getIdentifier(),
                displayID: queryFile.getIdentifier()
            });
        }

        // deal with readme
        let readme = this.clientService.getMetaData().getREADME();
        if (readme) {
            // add it first so it appears at the top of the list
            newFiles.unshift({
                readme: true,
                id: 'readme',
                displayID: 'README.md'
            });
        }
        this.files = newFiles;
    }

    addModelFile(contents = null) {
        let businessNetworkDefinition = this.clientService.getBusinessNetwork();
        let modelManager = businessNetworkDefinition.getModelManager();
        let code;

        if (!contents) {
            let newModelNamespace = this.addModelNamespace;
            let increment = 0;
            while (this.findFileIndex(true, newModelNamespace) !== -1) {
                newModelNamespace = this.addModelNamespace + increment;
                increment++;
            }

            code =
                `/**
  * New model file
  */

  namespace ${newModelNamespace}`;
        } else {
            code = contents;
        }

        let newFile = modelManager.addModelFile(code);
        this.updateFiles();
        let index = this.findFileIndex(true, newFile.getNamespace());
        this.setCurrentFile(this.files[index]);
        this.dirty = true;
    }

    addScriptFile(scriptFile = null) {
        let businessNetworkDefinition = this.clientService.getBusinessNetwork();
        let scriptManager = businessNetworkDefinition.getScriptManager();
        let existingScripts = scriptManager.getScripts();
        let code;
        let script;

        if (!scriptFile) {
            let increment = 0;
            let scriptName = this.addScriptFileName + this.addScriptFileExtension;
            while (existingScripts.findIndex((file) => file.getIdentifier() === scriptName) !== -1) {
                scriptName = this.addScriptFileName + increment + this.addScriptFileExtension;
                increment++;
            }

            code =
                `/**
  * New script file
  */`;
            script = scriptManager.createScript(scriptName, 'JS', code);
        } else {
            script = scriptFile;
        }

        scriptManager.addScript(script);
        this.updateFiles();
        let index = this.findFileIndex(true, script.getIdentifier());
        this.setCurrentFile(this.files[index]);
        this.dirty = true;
    }

    addQueryFile(query) {
        if (this.files.findIndex((file) => file.query === true) !== -1) {
            const confirmModalRef = this.modalService.open(ReplaceComponent);
            confirmModalRef.componentInstance.mainMessage = 'Your current Query file will be replaced with the new one that you are uploading.';
            confirmModalRef.componentInstance.supplementaryMessage = 'Please ensure that you have saved a copy of your Query file to disc.';
            confirmModalRef.componentInstance.resource = 'file';
            confirmModalRef.result.then((result) => {
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
        let businessNetworkDefinition = this.clientService.getBusinessNetwork();
        let queryManager: QueryManager = businessNetworkDefinition.getQueryManager();
        queryManager.setQueryFile(query);
        this.updateFiles();
        let index = this.findFileIndex(true, query.getIdentifier());
        this.setCurrentFile(this.files[index]);
        this.dirty = true;
    }

    addReadme(readme) {
        if (this.files[0].readme) {
            const confirmModalRef = this.modalService.open(ReplaceComponent);
            confirmModalRef.componentInstance.mainMessage = 'Your current README file will be replaced with the new one that you are uploading.';
            confirmModalRef.componentInstance.supplementaryMessage = 'Please ensure that you have saved a copy of your README file to disc.';
            confirmModalRef.componentInstance.resource = 'file';
            confirmModalRef.result.then((result) => {
                this.clientService.setBusinessNetworkReadme(readme);
                this.updateFiles();
                this.setCurrentFile(this.files[0]);
                this.dirty = true;
            }, (reason) => {
                if (reason && reason !== 1) {
                    this.alertService.errorStatus$.next(reason);
                }
            });
        } else {
            this.clientService.setBusinessNetworkReadme(readme);
            this.updateFiles();
            this.setCurrentFile(this.files[0]);
            this.dirty = true;
        }
    }

    addRuleFile(rules) {
        if (this.files.findIndex((file) => file.acl === true) !== -1) {
            const confirmModalRef = this.modalService.open(ReplaceComponent);
            confirmModalRef.componentInstance.mainMessage = 'Your current ACL file will be replaced with the new one that you are uploading.';
            confirmModalRef.componentInstance.supplementaryMessage = 'Please ensure that you have saved a copy of your ACL file to disc.';
            confirmModalRef.componentInstance.resource = 'file';
            confirmModalRef.result.then((result) => {
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
        let businessNetworkDefinition = this.clientService.getBusinessNetwork();
        let aclManager: AclManager = businessNetworkDefinition.getAclManager();
        aclManager.setAclFile(rules);
        this.updateFiles();
        let index = this.findFileIndex(true, rules.getIdentifier());
        this.setCurrentFile(this.files[index]);
        this.dirty = true;
    }

    openImportModal() {
        const importModalRef = this.drawerService.open(ImportComponent);
        // only want to update here not deploy
        importModalRef.componentInstance.deployNetwork = false;

        importModalRef.componentInstance.finishedSampleImport.subscribe((result) => {

            importModalRef.close();

            if (result.deployed) {
                this.updatePackageInfo();
                this.updateFiles();
                if (this.files.length) {
                    let currentFile = this.files.find((file) => {
                        return file.readme;
                    });
                    if (!currentFile) {
                        currentFile = this.files[0];
                    }
                    this.setCurrentFile(currentFile);
                    this.alertService.successStatus$.next({
                        title: 'Deploy Successful',
                        text: 'Business network imported deployed successfully',
                        icon: '#icon-deploy_24'
                    });
                }
            } else {
                  if (result.error) {
                      this.alertService.errorStatus$.next(result.error);
                  }
            }
        });
    }

    exportBNA() {
        return this.clientService.getBusinessNetwork().toArchive().then((exportedData) => {
            let file = new File([exportedData],
                this.clientService.getBusinessNetworkName() + '.bna',
                {type: 'application/octet-stream'});
            saveAs(file);
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
                        this.clientService.businessNetworkChanged$.next(true);
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
            title: 'Deploying updated business network',
            text: 'deploying ' + this.clientService.getBusinessNetworkName()
        });
        return Promise.resolve()
            .then(() => {
                if (this.deploying) {
                    return;
                }
                this.deploying = true;
                return this.adminService.update(this.clientService.getBusinessNetwork());
            })
            .then(() => {
                this.dirty = false;
                this.deploying = false;
                return this.clientService.refresh(this.clientService.getBusinessNetworkName());
            })
            .then(() => {
                this.updatePackageInfo();
                this.updateFiles();
                this.alertService.busyStatus$.next(null);
                this.alertService.successStatus$.next({
                    title: 'Deploy Successful',
                    text: 'Business Network Deployed Successfully',
                    icon: '#icon-deploy_24'
                });
                if ((<any> window).usabilla_live) {
                    (<any> window).usabilla_live('trigger', 'manual trigger');
                }
            })
            .catch((error) => {
                this.deploying = false;
                // if failed on deploy should go back to what had before deployed
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
            } else if (this.currentFile.script) {
                if (this.currentFile.id !== inputFileName) {
                    // Replace Script
                    let contents = this.clientService.getScriptFile(this.currentFile.id).getContents();
                    this.clientService.replaceFile(this.currentFile.id, inputFileName, contents, 'script');
                    this.updateFiles();
                    let index = this.findFileIndex(true, inputFileName);
                    this.setCurrentFile(this.files[index]);
                    this.dirty = true;
                }
            } else if (this.currentFile.model) {
                if (this.currentFile.displayID !== inputFileName) {
                    // Update Model filename
                    let contents = this.clientService.getModelFile(this.currentFile.id).getDefinitions();
                    this.clientService.replaceFile(this.currentFile.id, inputFileName, contents, 'model');
                    this.updateFiles();
                    let index = this.findFileIndex(false, inputFileName);
                    this.setCurrentFile(this.files[index]);
                    this.dirty = true;
                }
            } else {
                this.fileNameError = 'Error: Unable to process rename on current file type';
            }
        } else {
            this.fileNameError = 'Error: Invalid filename, file must be alpha-numeric with no spaces';
        }
    }

    /*
     * When user edits the package version (in the input box), the package.json needs to be updated, and the BND needs to be updated
     */
    editPackageVersion() {
        if (this.deployedPackageVersion !== this.inputPackageVersion) {
            this.deployedPackageVersion = this.inputPackageVersion;

            this.clientService.setBusinessNetworkVersion(this.deployedPackageVersion);
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
                        text: 'deleting ' + this.clientService.getBusinessNetworkName()
                    });

                    if (deleteFile.script) {
                        let scriptManager: ScriptManager = this.clientService.getBusinessNetwork().getScriptManager();
                        scriptManager.deleteScript(deleteFile.id);
                    } else if (deleteFile.model) {
                        let modelManager: ModelManager = this.clientService.getBusinessNetwork().getModelManager();
                        modelManager.deleteModelFile(deleteFile.id);
                    } else if (deleteFile.query) {
                        let queryManager: QueryManager = this.clientService.getBusinessNetwork().getQueryManager();
                        queryManager.deleteQueryFile();
                    } else {
                        throw new Error('Unable to process delete on selected file type');
                    }

                    // remove file from list view
                    let index = this.findFileIndex(false, deleteFile.displayID);
                    this.files.splice(index, 1);

                    // Make sure we set a file to remove the deleted file from the view
                    this.setInitialFile();

                    // validate the remaining (acl/cto files and conditionally enable deploy
                    if (this.editorFilesValidate()) {
                        this.clientService.businessNetworkChanged$.next(true);
                    } else {
                        this.clientService.businessNetworkChanged$.next(false);
                    }

                    // Send alert
                    this.alertService.busyStatus$.next(null);
                    this.alertService.successStatus$.next({
                        title: 'Delete Successful',
                        text: this.fileType(deleteFile) + ' File ' + deleteFile.displayID + ' was deleted.',
                        icon: '#icon-trash_32'
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

    fileType(resource: any): string {
        if (resource.model) {
            return 'Model';
        } else if (resource.script) {
            return 'Script';
        } else if (resource.acl) {
            return 'ACL';
        } else if (resource.query) {
            return 'Query';
        } else {
            return 'Readme';
        }
    }

    preventNameEdit(resource: any): boolean {
        if (resource.acl || resource.query) {
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
            if (file.model) {
                let modelFile = this.clientService.getModelFile(file.id);
                if (this.clientService.validateFile(file.id, modelFile.getDefinitions(), 'model') !== null) {
                    allValid = false;
                    file.invalid = true;
                } else {
                    file.invalid = false;
                }
            } else if (file.acl) {
                let aclFile = this.clientService.getAclFile();
                if (this.clientService.validateFile(file.id, aclFile.getDefinitions(), 'acl') !== null) {
                    allValid = false;
                    file.invalid = true;
                } else {
                    file.invalid = false;
                }
            } else if (file.script) {
                let script = this.clientService.getScriptFile(file.id);
                if (this.clientService.validateFile(file.id, script.getContents(), 'script') !== null) {
                    allValid = false;
                    file.invalid = true;
                } else {
                    file.invalid = false;
                }
            } else if (file.query) {
                let query = this.clientService.getQueryFile();
                if (this.clientService.validateFile(file.id, query.getDefinitions(), 'query') !== null) {
                    allValid = false;
                    file.invalid = true;
                } else {
                    file.invalid = false;
                }
            }
        }
        return allValid;
    }
}
