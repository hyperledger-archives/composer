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
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ClientService } from '../services/client.service';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { AlertService } from '../basic-modals/alert.service';
import { ConfigService } from '../services/config.service';
import { IdentityCardService } from '../services/identity-card.service';

import { BusinessNetworkDefinition } from 'composer-common';

@Component({
    selector: 'deploy-business-network',
    templateUrl: './deploy.component.html',
    styleUrls: ['./deploy.component.scss'.toString()],
})
export class DeployComponent implements OnInit {

    @Input() showCredentials: boolean;

    @Output() finishedSampleImport = new EventEmitter<any>();

    private currentBusinessNetwork = null;
    private deployInProgress: boolean = false;
    private npmInProgress: boolean = false;
    private sampleNetworks = [];
    private chosenNetwork = null;
    private expandInput: boolean = false;
    private sampleDropped: boolean = false;
    private uploadedNetwork = null;

    private networkDescription: string;
    private networkName: string;
    private networkNameValid: boolean = true;
    private cardNameValid: boolean = true;

    private userId: string = '';
    private userSecret: string = null;
    private credentials = null;
    private cardName: string = null;

    private currentBusinessNetworkPromise: Promise<BusinessNetworkDefinition>;

    private maxFileSize: number = 5242880;
    private supportedFileTypes: string[] = ['.bna'];

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

    deploy() {
        let deployed: boolean = true;

        this.deployInProgress = true;

        return this.sampleBusinessNetworkService.deployBusinessNetwork(this.currentBusinessNetwork, this.cardName, this.networkName, this.networkDescription, this.userId, this.userSecret, this.credentials)
            .then(() => {
                this.cardNameValid = true;
                this.deployInProgress = false;
                this.finishedSampleImport.emit({deployed: deployed});
            })
            .catch((error) => {
                this.deployInProgress = false;
                if (error.message.startsWith('Card already exists: ')) {
                    this.cardNameValid = false;
                } else {
                    this.alertService.errorStatus$.next(error);
                    this.finishedSampleImport.emit({deployed: false, error: error});
                }
            });
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
                'moment': '^2.19.3'
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
            `/*
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

rule NetworkAdminUser {
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

        let emptyModelFile = `/*
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

namespace org.example.empty
`;

        this.currentBusinessNetworkPromise = Promise.resolve().then(() => {
            this.currentBusinessNetwork = this.sampleBusinessNetworkService.createNewBusinessDefinition('', '', packageJson, readme);
            const aclManager = this.currentBusinessNetwork.getAclManager();
            const aclFile = aclManager.createAclFile('permissions.acl', permissions);
            aclManager.setAclFile(aclFile);
            this.currentBusinessNetwork.getModelManager().addModelFile(emptyModelFile, 'model.cto');
            this.currentBusinessNetwork.participants = this.currentBusinessNetwork.getModelManager().getParticipantDeclarations(false);
            this.currentBusinessNetwork.assets = this.currentBusinessNetwork.getModelManager().getAssetDeclarations(false);
            this.currentBusinessNetwork.transactions = this.currentBusinessNetwork.getModelManager().getTransactionDeclarations(false);
            return this.currentBusinessNetwork;
        });
    }

    updateCredentials($event) {
        // credentials not valid yet
        if (!$event || !$event.userId) {
            this.userId = null;
            this.userSecret = null;
            this.credentials = null;
            return;
        }

        if ($event.secret) {
            this.userSecret = $event.secret;
            this.credentials = null;

        } else {
            this.userSecret = null;
            this.credentials = {
                certificate: $event.cert,
                privateKey: $event.key
            };
        }

        this.userId = $event.userId;
    }

    isInvalidDeploy() {
        if (!this.networkName || !this.networkNameValid || this.deployInProgress || !this.cardNameValid || (this.showCredentials && !this.userId)) {
            return true;
        }

        return false;
    }

    closeSample() {
        this.sampleDropped = false;
        this.selectNetwork(this.sampleNetworks[0]);
    }

    removeFile() {
        this.expandInput = false;
        this.currentBusinessNetwork = null;
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

    private setNetworkName(name) {
        this.networkName = name;
        if (!name) {
            this.networkNameValid = true;
        } else {
            let pattern = /^[a-z0-9-]+$/;
            this.networkNameValid = pattern.test(this.networkName);
        }
    }

    private setCardName(name) {
        if (this.cardName !== name) {
            this.cardName = name;
            this.cardNameValid = true;
        }
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
