import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ClientService } from '../services/client.service';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { AlertService } from '../basic-modals/alert.service';

import { BusinessNetworkDefinition } from 'composer-common';

@Component({
    selector: 'import-business-network',
    template: ``
})
export abstract class ImportComponent implements OnInit {

    @Output() finishedSampleImport = new EventEmitter<any>();

    protected networkName: string;
    protected deployInProgress: boolean = false;
    protected currentBusinessNetwork = null;
    protected networkDescription: string;

    private npmInProgress: boolean = false;
    private sampleNetworks = [];
    private chosenNetwork = null;
    private expandInput: boolean = false;
    private sampleDropped: boolean = false;
    private uploadedNetwork = null;

    private maxFileSize: number = 5242880;
    private supportedFileTypes: string[] = ['.bna'];

    private currentBusinessNetworkPromise: Promise<BusinessNetworkDefinition>;

    private lastName = 'empty-business-network';
    private lastDesc = '';

    private NAME = 'empty-business-network';
    private DESC = 'Start from scratch with a blank business network';
    private EMPTY_BIZNET = {name: this.NAME, description: this.DESC};

    constructor(protected clientService: ClientService,
                protected modalService: NgbModal,
                protected sampleBusinessNetworkService: SampleBusinessNetworkService,
                protected alertService: AlertService) {

    }

    ngOnInit(): Promise<void> {
        this.currentBusinessNetwork = null;
        return this.onShow();
    }

    onShow(): Promise<void> {
        this.npmInProgress = true;
        return this.sampleBusinessNetworkService.getSampleList()
            .then((sampleNetworkList) => {
                this.initNetworkList(sampleNetworkList);
            })
            .catch((error) => {
                this.initNetworkList([]);
            });
    }

    selectNetwork(network): void {
        this.chosenNetwork = network;
        this.updateBusinessNetworkNameAndDesc(network);
        if (this.chosenNetwork.name !== this.NAME) {
            this.currentBusinessNetworkPromise = this.sampleBusinessNetworkService.getChosenSample(this.chosenNetwork).then((result) => {
                this.currentBusinessNetwork = result;

                this.currentBusinessNetwork.participants = result.getModelManager().getParticipantDeclarations(false);
                this.currentBusinessNetwork.assets = result.getModelManager().getAssetDeclarations(false);
                this.currentBusinessNetwork.transactions = result.getModelManager().getTransactionDeclarations(false);

                return this.currentBusinessNetwork;
            });
        } else {
            this.deployEmptyNetwork();
        }

    }

    removeFile() {
        this.expandInput = false;
        this.currentBusinessNetwork = null;
    }

    abstract deploy()

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
        let permissions =
            `rule NetworkAdminUser {
    description: "Grant business network administrators full access to user resources"
    participant: "org.hyperledger.composer.system.NetworkAdmin"
    operation: ALL
    resource: "**"
    action: ALLOW
}

rule NetworkAdminSystem {
    description: "Grant business network administrators full access to system resources"
    participant: "org.hyperledger.composer.system.NetworkAdmin"
    operation: ALL
    resource: "org.hyperledger.composer.system.**"
    action: ALLOW
}`;

        this.currentBusinessNetworkPromise = Promise.resolve().then(() => {
            this.currentBusinessNetwork = this.sampleBusinessNetworkService.createNewBusinessDefinition('', '', packageJson, readme);
            const aclManager = this.currentBusinessNetwork.getAclManager();
            const aclFile = aclManager.createAclFile('permissions.acl', permissions);
            aclManager.setAclFile(aclFile);
            this.currentBusinessNetwork.participants = this.currentBusinessNetwork.getModelManager().getParticipantDeclarations(false);
            this.currentBusinessNetwork.assets = this.currentBusinessNetwork.getModelManager().getAssetDeclarations(false);
            this.currentBusinessNetwork.transactions = this.currentBusinessNetwork.getModelManager().getTransactionDeclarations(false);
            return this.currentBusinessNetwork;
        });
    }

    closeSample() {
        this.sampleDropped = false;
        this.selectNetwork(this.sampleNetworks[0]);
    }

    addEmptyNetworkOption(networks: any[]): any[] {
        let newOrder = [];
        newOrder.push(this.EMPTY_BIZNET);
        for (let i = 0; i < networks.length; i++) {
            newOrder.push(networks[i]);
        }
        return newOrder;
    }

    updateBusinessNetworkNameAndDesc(network) {
        let nameEl = this.networkName;
        let descEl = this.networkDescription;
        let name = network.name;
        let desc = (typeof network.description === 'undefined') ? '' : network.description;
        if ((nameEl === '' || nameEl === this.lastName || typeof nameEl === 'undefined')) {
            this.networkName = name;
            this.lastName = name;
        }
        if ((descEl === '' || descEl === this.lastDesc || typeof descEl === 'undefined')) {
            this.networkDescription = desc;
            this.lastDesc = desc;
        }
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
                    this.updateBusinessNetworkNameAndDesc(this.chosenNetwork);
                    this.currentBusinessNetwork = businessNetwork;
                    this.currentBusinessNetwork.participants = businessNetwork.getModelManager().getParticipantDeclarations(false);
                    this.currentBusinessNetwork.assets = businessNetwork.getModelManager().getAssetDeclarations(false);
                    this.currentBusinessNetwork.transactions = businessNetwork.getModelManager().getTransactionDeclarations(false);
                    this.sampleDropped = true;
                    // needed for if browse file
                    this.expandInput = false;
                    this.uploadedNetwork = this.chosenNetwork;
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

    private initNetworkList(sampleNetworkList): void {
        this.sampleNetworks = this.addEmptyNetworkOption(sampleNetworkList);
        if (this.sampleNetworks.length === 1) {
            this.selectNetwork(this.sampleNetworks[0]);
        } else {
            this.selectNetwork(this.sampleNetworks[1]);
        }
        this.npmInProgress = false;
    }
}
