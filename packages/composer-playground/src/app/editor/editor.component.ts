import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ImportComponent } from '../import/import.component';
import { AddFileComponent } from '../add-file/add-file.component';
import { DeleteComponent } from '../delete-confirm/delete-confirm.component';

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { InitializationService } from '../services/initialization.service';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { AlertService } from '../services/alert.service';
import { EditorService } from '../services/editor.service';

import { ModelFile, ScriptManager, ModelManager } from 'composer-common';

import { saveAs } from 'file-saver';

@Component({
    selector: 'app-editor',
    templateUrl: './editor.component.html',
    styleUrls: [
        './editor.component.scss'.toString()
    ]
})

export class EditorComponent implements OnInit {

    private files: any = [];
    private currentFile: any = null;
    private deletableFile: boolean = false;

    private addModelNamespace: string = 'org.acme.model';
    private addScriptFileName: string = 'lib/script.js';

    private noError: boolean = true;
    private dirty: boolean = false;
    private deploying: boolean = false;

    private editActive: boolean = false; // Are the input boxes visible?
    private editingPackage: boolean = false; // Is the package.json being edited?

    private deployedPackageName; // This is the deployed BND's package name
    private deployedPackageVersion; // This is the deployed BND's package version
    private deployedPackageDescription; // This is the deployed BND's package description

    private inputPackageName; // This is the input 'Name' before the BND is updated
    private inputPackageVersion; // This is the input 'Version' before the BND is updated

    constructor(private adminService: AdminService,
                private clientService: ClientService,
                private initializationService: InitializationService,
                private modalService: NgbModal,
                private route: ActivatedRoute,
                private sampleBusinessNetworkService: SampleBusinessNetworkService,
                private alertService: AlertService,
                private editorService: EditorService) {

    }

    ngOnInit(): Promise<any> {
        this.route.queryParams.subscribe(() => {
            if (this.sampleBusinessNetworkService.OPEN_SAMPLE) {
                this.openImportModal();
                this.sampleBusinessNetworkService.OPEN_SAMPLE = false;
            }
        });

        return this.initializationService.initialize()
        .then(() => {
            this.clientService.businessNetworkChanged$.subscribe((noError) => {
                if (this.editorFilesValidate() && noError) {
                    this.noError = noError;
                    this.dirty = true;
                } else {
                    this.noError = false;
                }
            });

            this.clientService.fileNameChanged$.subscribe((newName) => {
                if (this.currentFile !== null) {
                    this.updateFiles();
                    let index = this.files.findIndex((file) => file.id === newName);
                    this.setCurrentFile(this.files[index]);
                }
            });

            this.updatePackageInfo();
            this.updateFiles();

            if (this.editorService.getCurrentFile() !== null) {
                this.currentFile = this.editorService.getCurrentFile();
            } else {
                this.setInitialFile();
            }
        });
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
        if (this.currentFile === null || this.currentFile.displayID !== file.displayID) {
            if (this.editingPackage) {
                this.updatePackageInfo();
                this.editingPackage = false;
            }
            if (file.script || file.model) {
                this.deletableFile = true;
            } else {
                this.deletableFile = false;
            }
            // Reset editActive
            this.editActive = false;
            // Set selected file
            this.editorService.setCurrentFile(file);
            this.currentFile = file;
            // re-validate, since we do not persist bad files- they revert when navigated away
            if (this.editorFilesValidate()) {
                this.noError = true;
            }
        }
    }

    updateFiles() {
        let newFiles = [];

        // deal with model files
        let modelFiles = this.clientService.getModelFiles();
        let newModelFiles = [];
        modelFiles.forEach((modelFile) => {
            newModelFiles.push({
                model: true,
                id: modelFile.getNamespace(),
                displayID: 'model/' + modelFile.getNamespace() + '.cto',
            });
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

        // deal with acl files
        let aclFile = this.clientService.getAclFile();
        if (aclFile) {
            newFiles.push({
                acl: true,
                id: aclFile.getIdentifier(),
                displayID: aclFile.getIdentifier()
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
            while ( this.files.findIndex((file) => file.id === newModelNamespace) !== -1) {
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
        let index = this.files.findIndex((file) => file.id === newFile.getNamespace());
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
            let scriptName = this.addScriptFileName;
            while ( existingScripts.findIndex((file) => file.getIdentifier() === scriptName) !== -1 ) {
                scriptName = this.addScriptFileName + increment;
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
        let index = this.files.findIndex((file) => file.id === script.getIdentifier());
        this.setCurrentFile(this.files[index]);
        this.dirty = true;
    }

    openImportModal() {
        this.modalService.open(ImportComponent).result.then((result) => {
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
                this.alertService.successStatus$.next({title : 'Deploy Successful', text : 'Business network imported deployed successfully', icon : '#icon-deploy_24'});
            }
        }, (reason) => {
            if (reason && reason !== 1) {
                this.alertService.errorStatus$.next(reason);
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
        let modalRef = this.modalService.open(AddFileComponent);
        modalRef.componentInstance.businessNetwork = this.clientService.getBusinessNetwork();
        modalRef.result
        .then((result) => {
            if (result !== 0) {
                if (result instanceof ModelFile) {
                    this.addModelFile(result);
                } else {
                    this.addScriptFile(result);
                }
                this.clientService.businessNetworkChanged$.next(true);
            }
        }, (reason) => {
            if (reason && reason !== 1) {
                this.alertService.errorStatus$.next(reason);
            }
        });
    }

    deploy(): Promise<any> {
        // Gets the definition for the currently deployed business network
        this.alertService.busyStatus$.next({title: 'Deploying updated business network', text : 'deploying ' + this.clientService.getBusinessNetworkName()});
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
            return this.clientService.refresh();
        })
        .then(() => {
            this.updatePackageInfo();
            this.updateFiles();
            this.alertService.busyStatus$.next(null);
            this.alertService.successStatus$.next({title : 'Deploy Successful', text : 'Business Network Deployed Successfully', icon : '#icon-deploy_24'});
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
     * Swaps the toggle state. Used when editing Name and Version, will show input boxes.
     */
    toggleEditActive() {
        this.editActive = !this.editActive;
    }

    /*
     * When user edits the package name (in the input box), the package.json needs to be updated, and the BND needs to be updated
     */
    editPackageName() {
        if (this.deployedPackageName !== this.inputPackageName) {
            this.deployedPackageName = this.inputPackageName;
            this.clientService.setBusinessNetworkName(this.deployedPackageName);
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
                this.alertService.busyStatus$.next({title: 'Deleting file within business network', text : 'deleting ' + this.clientService.getBusinessNetworkName()});

                if (deleteFile.script) {
                    let scriptManager: ScriptManager = this.clientService.getBusinessNetwork().getScriptManager();
                    scriptManager.deleteScript(deleteFile.id);
                } else if (deleteFile.model) {
                    let modelManager: ModelManager = this.clientService.getBusinessNetwork().getModelManager();
                    modelManager.deleteModelFile(deleteFile.id);
                } else {
                    throw new Error('Unable to process delete on selected file type');
                }

                // remove file from list view
                let index = this.files.findIndex((x) => { return x.displayID === deleteFile.displayID; });
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
                this.alertService.successStatus$.next({title : 'Delete Successful', text : this.fileType(deleteFile) + ' ' + deleteFile.displayID + ' was deleted.', icon : '#icon-trash_32'});
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
            return 'Model File';
        } else if (resource.script) {
            return 'Script File';
        } else {
            return 'File';
        }
    }

    editorFilesValidate(): boolean {
        let allValid: boolean = true;

        for (let file of this.files) {
            if (file.model && allValid) {
                let modelFile = this.clientService.getModelFile(file.id);
                if (this.clientService.validateFile(file.id, modelFile.getDefinitions(), 'model') !== null) {
                    allValid = false;
                    file.invalid = true;
                } else {
                    file.invalid = false;
                }
            } else if (file.acl && allValid) {
                let aclFile = this.clientService.getAclFile();
                if (this.clientService.validateFile(file.id, aclFile.getDefinitions(), 'acl') !== null) {
                    allValid = false;
                    file.invalid = true;
                } else {
                    file.invalid = false;
                }
            } else if (file.script && allValid) {
                let script = this.clientService.getScriptFile(file.id);
                if (this.clientService.validateFile(file.id, script.getContents(), 'script') !== null) {
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
