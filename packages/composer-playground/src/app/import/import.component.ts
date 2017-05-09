import { Component, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { AlertService } from '../services/alert.service';

import { BusinessNetworkDefinition } from 'composer-common';
import { ErrorComponent } from '../error';

const fabricComposerOwner = 'hyperledger';
const fabricComposerRepository = 'composer-sample-networks';

@Component({
    selector: 'import-modal',
    templateUrl: './import.component.html',
    styleUrls: ['./import.component.scss'.toString()]
})
export class ImportComponent implements OnInit {

    private deployInProgress: boolean = false;
    private gitHubInProgress: boolean = false;
    private sampleNetworks = [];
    private primaryNetworkNames = ['basic-sample-network', 'carauction-network'];
    private owner: string = '';
    private repository: string = '';
    private gitHubAuthenticated: boolean = false;
    private oAuthEnabled: boolean = false;
    private clientId: string = null;
    private chosenNetwork = null;
    private expandInput: boolean = false;

    private maxFileSize: number = 5242880;
    private supportedFileTypes: string[] = ['.bna'];

    private currentBusinessNetwork = null;

    private NAME = 'Empty Business Network';
    private DESC = 'Start from scratch with a blank business network';
    private EMPTY_BIZNET = {name: this.NAME, description: this.DESC};

    constructor(private adminService: AdminService,
                private clientService: ClientService,
                public activeModal: NgbActiveModal,
                public modalService: NgbModal,
                private sampleBusinessNetworkService: SampleBusinessNetworkService,
                private alertService: AlertService) {

    }

    ngOnInit(): Promise<any> {
        // TODO: try and do this when we close modal
        this.currentBusinessNetwork = null;

        return this.adminService.ensureConnected()
        .then(() => {
            return this.clientService.ensureConnected();
        })
        .then(() => {
            return this.sampleBusinessNetworkService.isOAuthEnabled();
        })
        .then((result) => {
            this.oAuthEnabled = result;
            if (result) {
                return this.sampleBusinessNetworkService.getGithubClientId()
                .then((clientId) => {
                    if (!clientId) {
                        // shouldn't get here as oauthEnabled should return false
                        // if client id not set but just incase
                        return this.activeModal.dismiss(
                            new Error(this.sampleBusinessNetworkService.NO_CLIENT_ID)
                        );
                    }

                    this.clientId = clientId;
                    this.onShow();
                });
            } else {
                this.onShow();
            }
        });
    }

    onShow() {
        this.gitHubInProgress = true;
        this.gitHubAuthenticated = this.sampleBusinessNetworkService.isAuthenticatedWithGitHub();
        if (this.gitHubAuthenticated) {
            return this.sampleBusinessNetworkService.getModelsInfo(fabricComposerOwner,
                fabricComposerRepository)
            .then((modelsInfo) => {
                this.sampleNetworks = this.orderGitHubProjects(modelsInfo);
                this.gitHubInProgress = false;
            })
            .catch((error) => {

                if (error.message.includes('API rate limit exceeded')) {
                    error = new Error(this.sampleBusinessNetworkService.RATE_LIMIT_MESSAGE);
                }

                this.gitHubInProgress = false;

                let modalRef = this.modalService.open(ErrorComponent);
                modalRef.componentInstance.error = error;
            });
        }
    }

    orderGitHubProjects(networks: any[]): any[] {

        let newOrder = [];
        newOrder.push(this.EMPTY_BIZNET);

        for (let i = 0; i < this.primaryNetworkNames.length; i++) {
            let primaryName = this.primaryNetworkNames[i];
            for (let j = 0; j < networks.length; j++) {
                let network = networks[j];
                if (primaryName === network.name) {
                    newOrder.push(network);
                }
            }
        }
        for (let i = 0; i < networks.length; i++) {
            let network = networks[i];
            if (this.primaryNetworkNames.indexOf(network.name) === -1) {
                newOrder.push(network);
            }
        }
        return newOrder;
    }

    removeFile() {
        this.expandInput = false;
        this.currentBusinessNetwork = null;
    }

    deploy() {
        this.deployInProgress = true;
        let deployPromise;

        if (this.currentBusinessNetwork) {
            deployPromise = this.sampleBusinessNetworkService.deployBusinessNetwork(this.currentBusinessNetwork);
        } else {
            deployPromise = this.deployFromGitHub();
        }

        deployPromise.then(() => {
            this.deployInProgress = false;
            this.activeModal.close();
        })
        .catch((error) => {
            if (error.message.includes('API rate limit exceeded')) {
                error = new Error(this.sampleBusinessNetworkService.RATE_LIMIT_MESSAGE);
            }

            this.deployInProgress = false;

            let modalRef = this.modalService.open(ErrorComponent);
            modalRef.componentInstance.error = error;
        });

        return deployPromise;
    }

    deployFromGitHub(): Promise<any> {

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

            let chosenOwner = this.owner !== '' ? this.owner : fabricComposerOwner;
            let chosenRepository = this.repository !== '' ? this.repository : fabricComposerRepository;
            return this.sampleBusinessNetworkService.deploySample(chosenOwner, chosenRepository, chosenSampleNetwork);

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
            this.sampleBusinessNetworkService.getBusinessNetworkFromArchive(dataBuffer)
            .then((businessNetwork) => {
                this.currentBusinessNetwork = businessNetwork;
                // needed for if browse file
                this.expandInput = true;
            })
            .catch((error) => {
                let failMessage = 'Cannot import an invalid Business Network Definition. Found ' + error.toString();
                this.alertService.errorStatus$.next(failMessage);
                this.expandInput = false;
            });
        };

        fileReader.readAsArrayBuffer(file);
    }

    private fileRejected(reason: string) {
        this.alertService.errorStatus$.next(reason);
        this.expandInput = false;
    }
}
