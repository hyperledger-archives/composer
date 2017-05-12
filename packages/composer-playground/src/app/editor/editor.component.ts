import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ImportComponent } from '../import/import.component';
import { AddFileComponent } from '../add-file/add-file.component';
import { DeleteComponent } from '../delete/delete.component';

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
            this.clientService.businessNetworkChanged$.subscribe((error) => {
                this.noError = error;
                this.dirty = true;
            });

            this.updatePackageInfo();
            this.updateFiles();

            if (this.editorService.getCurrentFile() !== null) {
                this.currentFile = this.editorService.getCurrentFile();
            } else {
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
        });
    }

    updatePackageInfo() {
        this.deployedPackageName = this.clientService.getMetaData().getName(); // Set Name
        this.deployedPackageVersion = this.clientService.getMetaData().getVersion(); // Set Version
        this.deployedPackageDescription = this.clientService.getMetaData().getDescription(); // Set Description
        this.inputPackageName = this.clientService.getMetaData().getName();
        this.inputPackageVersion = this.clientService.getMetaData().getVersion();
    }

    setCurrentFile(file) {
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
            code =
                `/**
  * New model file
  */

  namespace ${this.addModelNamespace}`;
        } else {
            code = contents;
        }

        modelManager.addModelFile(code);
        this.updateFiles();
        this.files.forEach((file) => {
            if (file.id === this.addModelNamespace) {
                this.setCurrentFile(file);
            }
        });
        this.dirty = true;
    }

    addScriptFile(scriptFile = null) {
        let businessNetworkDefinition = this.clientService.getBusinessNetwork();
        let scriptManager = businessNetworkDefinition.getScriptManager();
        let code;
        let script;
        if (!scriptFile) {
            code =
                `/**
  * New script file
  */`;
            script = scriptManager.createScript(this.addScriptFileName, 'JS', code);
        } else {
            script = scriptFile;
        }

        scriptManager.addScript(script);
        this.updateFiles();
        this.files.forEach((file) => {
            if (file.id === this.addScriptFileName) {
                this.setCurrentFile(file);
            }
        });
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
        confirmModalRef.componentInstance.headerMessage = 'Delete File';
        confirmModalRef.componentInstance.fileType = this.fileType(this.currentFile);
        confirmModalRef.componentInstance.displayID = this.currentFile.displayID;
        confirmModalRef.componentInstance.deleteMessage = 'This file will be removed from your business network definition, which may stop your business netork from working and may limit access to data that is already stored in the business network.';
        confirmModalRef.result.then((result) => {
            if (result) {
                this.alertService.busyStatus$.next({title: 'Deleting file within business network', text : 'deleting ' + this.clientService.getBusinessNetworkName()});
                return Promise.resolve()
                .then(() => {
                    if (this.currentFile.script) {
                        let scriptManager: ScriptManager = this.clientService.getBusinessNetwork().getScriptManager();
                        scriptManager.deleteScript(this.currentFile.id);
                    } else if (this.currentFile.model) {
                        let modelManager: ModelManager = this.clientService.getBusinessNetwork().getModelManager();
                        modelManager.deleteModelFile(this.currentFile.id);
                    } else {
                        throw new Error('Delete attempted on unsupported file type');
                    }
                    return this.adminService.update(this.clientService.getBusinessNetwork());
                })
                .then(() => {
                    this.dirty = true;
                    return this.clientService.refresh();
                })
                .then(() => {
                    this.updatePackageInfo();
                    this.updateFiles();
                    this.alertService.busyStatus$.next(null);
                    this.alertService.successStatus$.next({title : 'Delete Successful', text : 'Business Network Updated Successfully', icon : '#icon-trash_32'});
                    if ((<any> window).usabilla_live) {
                        (<any> window).usabilla_live('trigger', 'manual trigger');
                    }
                })
                .catch((error) => {
                    this.dirty = false;
                    // if failed on delete should go back to what had before deletion
                    this.updatePackageInfo();
                    this.updateFiles();
                    this.alertService.busyStatus$.next(null);
                    this.alertService.errorStatus$.next(error);
                });
            } else {
                // TODO: we should always get called with a code for this usage of the
                // modal but will that always be true
            }
        });
    }

    fileType(resource: any): string {
        if (resource.model) {
            return 'Model File';
        } else if (resource.script) {
            return 'Script File';
        }
    }
}
