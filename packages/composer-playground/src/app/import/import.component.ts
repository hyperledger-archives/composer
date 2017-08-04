import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { AlertService } from '../basic-modals/alert.service';
import { ReplaceComponent } from '../basic-modals/replace-confirm';

import { BusinessNetworkDefinition } from 'composer-common';
import { ConnectionProfileService } from '../services/connectionprofile.service';

@Component({
    selector: 'import-business-network',
    templateUrl: './import.component.html',
    styleUrls: ['./import.component.scss'.toString()]
})
export class ImportComponent implements OnInit {

    // choose whether to deploy or update the business network
    @Input() deployNetwork: boolean;
    @Output() finishedSampleImport = new EventEmitter<any>();

    private deployInProgress: boolean = false;
    private npmInProgress: boolean = true;
    private sampleNetworks = [];
    private primaryNetworkNames = ['basic-sample-network', 'carauction-network'];
    private chosenNetwork = null;
    private expandInput: boolean = false;
    private sampleDropped: boolean = false;

    private maxFileSize: number = 5242880;
    private supportedFileTypes: string[] = ['.bna'];

    private currentBusinessNetwork = null;
    private currentConnectionProfile: string = null;
    private currentBusinessNetworkPromise: Promise<BusinessNetworkDefinition>;
    private networkName: string;
    private networkDescription: string;

    private NAME = 'Empty Business Network';
    private DESC = 'Start from scratch with a blank business network';
    private EMPTY_BIZNET = {name: this.NAME, description: this.DESC};

    constructor(private clientService: ClientService,
                public modalService: NgbModal,
                private sampleBusinessNetworkService: SampleBusinessNetworkService,
                private alertService: AlertService,
                private adminService: AdminService,
                private connectionProfileService: ConnectionProfileService) {

    }

    ngOnInit(): Promise<void> {
        this.currentBusinessNetwork = null;
        this.currentConnectionProfile = this.connectionProfileService.getCurrentConnectionProfile();

        return this.adminService.connectWithoutNetwork(false)
            .then(() => {
                this.onShow();
            });
    }

    onShow(): Promise<void> {
        this.npmInProgress = true;
        return this.sampleBusinessNetworkService.getSampleList()
            .then((sampleNetworkList) => {
                this.sampleNetworks = this.addEmptyNetworkOption(sampleNetworkList);
                this.selectNetwork(this.sampleNetworks[1]);
                this.npmInProgress = false;

            })
            .catch((error) => {
                this.npmInProgress = false;
                this.alertService.errorStatus$.next(error);
            });
    }

    selectNetwork(network): void {
        this.chosenNetwork = network;
        if (this.chosenNetwork.name !== this.NAME) {
            this.currentBusinessNetworkPromise = this.sampleBusinessNetworkService.getChosenSample(this.chosenNetwork).then((result) => {
                this.currentBusinessNetwork = result;
                return result;
            });
        } else {
            this.deployEmptyNetwork();
        }

    }

    removeFile() {
        this.expandInput = false;
        this.currentBusinessNetwork = null;
    }

    deploy() {
        let replacePromise;

        let deployed: boolean = true;

        if (this.deployNetwork) {
            replacePromise = Promise.resolve(true);
        } else {
            const confirmModalRef = this.modalService.open(ReplaceComponent);
            confirmModalRef.componentInstance.mainMessage = 'Your Business Network Definition currently in the Playground will be removed & replaced.';
            confirmModalRef.componentInstance.supplementaryMessage = 'Please ensure that you have exported any current model files in the Playground.';
            confirmModalRef.componentInstance.resource = 'definition';
            replacePromise = confirmModalRef.result;
        }

        replacePromise.then((result) => {
            if (result === true) {
                this.deployInProgress = true;
                let deployPromise;
                if (this.deployNetwork) {
                    return this.sampleBusinessNetworkService.deployBusinessNetwork(this.currentBusinessNetwork, this.networkName, this.networkDescription);
                } else {
                    return this.sampleBusinessNetworkService.updateBusinessNetwork(this.currentBusinessNetwork);
                }
            } else {
                deployed = false;
            }
        })
            .then(() => {
                this.deployInProgress = false;
                this.finishedSampleImport.emit({deployed: deployed});
            })
            .catch((error) => {
                this.deployInProgress = false;
                this.alertService.errorStatus$.next(error);
                this.finishedSampleImport.emit({deployed: false, error: error});
            });

        return replacePromise;
    }

    deployEmptyNetwork(): void {
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

        this.currentBusinessNetworkPromise = Promise.resolve().then(() => {
            this.currentBusinessNetwork = this.sampleBusinessNetworkService.createNewBusinessDefinition('', '', packageJson, readme);
            return this.currentBusinessNetwork;
        });
    }

    closeSample() {
        this.sampleDropped = false;
        this.selectNetwork(this.sampleNetworks[1]);
    }

    cancel() {
        this.finishedSampleImport.emit({deployed: false});
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

    private fileDetected() {
        this.expandInput = true;
    }

    private fileLeft() {
        this.expandInput = false;

    }

    private fileAccepted(file: File): void {
        let fileReader = new FileReader();
        fileReader.onload = () => {
            let dataBuffer = Buffer.from(fileReader.result);
            this.currentBusinessNetworkPromise = this.clientService.getBusinessNetworkFromArchive(dataBuffer)
                .then((businessNetwork) => {
                    this.chosenNetwork = businessNetwork.getMetadata().getPackageJson();
                    this.currentBusinessNetwork = businessNetwork;
                    // needed for if browse file
                    this.sampleDropped = true;
                    this.expandInput = false;
                    return businessNetwork;
                })
                .catch((error) => {
                    let failMessage = 'Cannot import an invalid Business Network Definition. Found ' + error.toString();
                    this.alertService.errorStatus$.next(failMessage);
                    this.expandInput = false;
                    return null;
                });
        };

        fileReader.readAsArrayBuffer(file);
    }

    private fileRejected(reason: string): void {
        this.alertService.errorStatus$.next(reason);
        this.expandInput = false;
    }
}
