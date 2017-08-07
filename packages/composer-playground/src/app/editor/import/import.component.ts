import { Component, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AdminService } from '../../services/admin.service';
import { ClientService } from '../../services/client.service';
import { SampleBusinessNetworkService } from '../../services/samplebusinessnetwork.service';
import { AlertService } from '../../basic-modals/alert.service';
import { ReplaceComponent } from '../../basic-modals/replace-confirm';
import { ImportErrorComponent } from '../../basic-modals/import-error';

import { BusinessNetworkDefinition } from 'composer-common';
import { ErrorComponent } from '../../basic-modals/error';

const fabricComposerOwner = 'hyperledger';
const fabricComposerRepository = 'composer-sample-networks';

@Component({
    selector: 'import-modal',
    templateUrl: './import.component.html',
    styleUrls: ['./import.component.scss'.toString()]
})
export class ImportComponent implements OnInit {

    private importInProgress: boolean = false;
    private gitHubInProgress: boolean = false;
    private sampleNetworks = [];
    private primaryNetworkNames = ['basic-sample-network'];
    private chosenNetwork = null;
    private expandInput: boolean = false;
    private isBroken: boolean = false;

    private maxFileSize: number = 5242880;
    private supportedFileTypes: string[] = ['.bna'];

    private _currentBusinessNetwork = null;

    set currentBusinessNetwork(businessNetwork) {
        this._currentBusinessNetwork = businessNetwork;
        if (businessNetwork instanceof BusinessNetworkDefinition) {
            this.currentAssets = businessNetwork.getModelManager().getAssetDeclarations().filter((d) => !d.isAbstract() && !d.isSystemType());
            this.currentParticipants = businessNetwork.getModelManager().getParticipantDeclarations().filter((d) => !d.isAbstract() && !d.isSystemType());
            this.currentTransactions = businessNetwork.getModelManager().getTransactionDeclarations().filter((d) => !d.isAbstract() && !d.isSystemType());
        }
    }

    get currentBusinessNetwork() {
        return this._currentBusinessNetwork;
    }

    private currentAssets = [];
    private currentParticipants = [];
    private currentTransactions = [];

    private NAME = 'Empty Business Network';
    private DESC = 'Start from scratch with a blank business network';
    private EMPTY_BIZNET = {name: this.NAME, description: this.DESC};

    constructor(private clientService: ClientService,
                public activeModal: NgbActiveModal,
                public modalService: NgbModal,
                private sampleBusinessNetworkService: SampleBusinessNetworkService,
                private alertService: AlertService) {

    }

    ngOnInit(): Promise<any> {
        // TODO: try and do this when we close modal
        this.currentBusinessNetwork = null;

        return this.clientService.ensureConnected(false)
            .then(() => {
                this.onShow();
            });
    }

    onShow() {
        this.gitHubInProgress = true;
        this.sampleBusinessNetworkService.getSampleList()
            .then((sampleNetworkList) => {
                this.sampleNetworks = this.addEmptyNetworkOption(sampleNetworkList);
                this.gitHubInProgress = false;

            })
            .catch((error) => {
                this.gitHubInProgress = false;
                this.alertService.errorStatus$.next(error);
            });
    }

    addEmptyNetworkOption(networks: any[]): any[] {

        let newOrder = [];

        // Append new network option to the list.
        newOrder.push(this.EMPTY_BIZNET);

        for (let i = 0; i < networks.length; i++) {
            newOrder.push(networks[i]);
        }

        return newOrder;
    }

    removeFile() {
        this.expandInput = false;
        this.currentBusinessNetwork = null;
    }

    import() {
        const confirmModalRef = this.modalService.open(ReplaceComponent);
        confirmModalRef.componentInstance.mainMessage = 'Your Business Network Definition currently in the Playground will be removed & replaced.';
        confirmModalRef.componentInstance.supplementaryMessage = 'Please ensure that you have exported any current model files in the Playground.';
        confirmModalRef.componentInstance.resource = 'definition';
        confirmModalRef.result.then((result) => {
            if (result === true) {
                this.importInProgress = true;
                let deployPromise;
                if (this.currentBusinessNetwork) {
                    deployPromise = this.sampleBusinessNetworkService.deployBusinessNetwork(this.currentBusinessNetwork);
                } else {
                    deployPromise = this.deployFromNpm();
                }

                deployPromise.then(() => {
                    this.importInProgress = false;
                    this.activeModal.close();
                })
                .catch((error) => {
                        this.importInProgress = false;
                        this.alertService.busyStatus$.next(null);
                        this.alertService.errorStatus$.next(error);
                    });

                return deployPromise;
            }
        })
            .catch((error) => {
                this.importInProgress = false;
                if (error && error !== 1) {
                    this.alertService.errorStatus$.next(error);
                }
            });
    }

    deployFromNpm(): Promise<any> {

        if (this.chosenNetwork === this.NAME) {
            let readme = 'This is the readme file for the Business Network Definition created in Playground';
            let packageJson = {
                name: 'unnamed-network',
                author: 'author',
                description: 'Empty Business Network',
                version: '0.0.1',
                devDependencies: {
                    'browserfs': '^1.2.0',
                    'chai': '^3.5.0',
                    'composer-admin': 'latest',
                    'composer-cli': 'latest',
                    'composer-client': 'latest',
                    'composer-connector-embedded': 'latest',
                    'eslint': '^3.6.1',
                    'istanbul': '^0.4.5',
                    'jsdoc': '^3.4.1',
                    'mkdirp': '^0.5.1',
                    'mocha': '^3.2.0',
                    'moment': '^2.17.1'
                },
                keywords: [],
                license: 'Apache 2.0',
                repository: {
                    type: 'e.g. git',
                    url: 'URL'
                },
                scripts: {
                    deploy: './scripts/deploy.sh',
                    doc: 'jsdoc --pedantic --recurse -c jsdoc.conf',
                    lint: 'eslint .',
                    postlicchk: 'npm run doc',
                    postlint: 'npm run licchk',
                    prepublish: 'mkdirp ./dist && composer archive create  --sourceType dir --sourceName . -a ./dist/unnamed-network.bna',
                    pretest: 'npm run lint',
                    test: 'mocha --recursive'
                }
            };
            let emptyBizNetDef = new BusinessNetworkDefinition('', '', packageJson, readme);
            this.currentBusinessNetwork = emptyBizNetDef;
            return this.sampleBusinessNetworkService.deployBusinessNetwork(this.currentBusinessNetwork);

        } else {

            let chosenSampleNetwork = this.sampleNetworks.find((sampleNetwork) => {
                return sampleNetwork.name === this.chosenNetwork;
            });

            return this.sampleBusinessNetworkService.deployChosenSample(chosenSampleNetwork);

        }
    }

    private fileDetected() {
        this.expandInput = true;
    }

    private fileLeft() {
        this.expandInput = false;

    }

    private fileAccepted(file: File) {
        let fileReader = new FileReader();
        fileReader.onload = () => {
            let dataBuffer = Buffer.from(fileReader.result);
            this.clientService.getBusinessNetworkFromArchive(dataBuffer, true)
                .then((businessNetwork) => {
                    this.currentBusinessNetwork = businessNetwork;
                    // needed for if browse file
                    this.expandInput = true;

                    this.isBroken = false;
                })
                .catch((brokenArchiveError) => {
                    // If the file has an issue (broken archive), we ask the user if they
                    // want to import it anyway
                    const importModalRef = this.modalService.open(ImportErrorComponent);
                    importModalRef.componentInstance.errorMessage = brokenArchiveError.toString();

                    importModalRef.result.then((result) => {
                        if (result === true) {
                            this.clientService.getBusinessNetworkFromArchive(dataBuffer, false)
                                .then((businessNetwork) => {
                                    this.currentBusinessNetwork = businessNetwork;
                                    // needed for if browse file
                                    this.expandInput = true;

                                    this.isBroken = true;
                                });
                        }
                    })
                        .catch((error) => {
                            this.expandInput = false;
                            if (error && error !== 1) {
                                this.alertService.errorStatus$.next(error);
                            }
                        });
                });
        };

        fileReader.readAsArrayBuffer(file);
    }

    private fileRejected(reason: string) {
        this.alertService.errorStatus$.next(reason);
        this.expandInput = false;
    }
}
