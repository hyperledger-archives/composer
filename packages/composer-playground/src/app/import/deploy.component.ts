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
import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ClientService } from '../services/client.service';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { AlertService } from '../basic-modals/alert.service';
import { ImportComponent } from './import.component';
import { ConfigService } from '../services/config.service';
import { IdentityCardService } from '../services/identity-card.service';

@Component({
    selector: 'deploy-business-network',
    templateUrl: './deploy.component.html',
    styleUrls: ['./deploy.component.scss'.toString()],
})
export class DeployComponent extends ImportComponent {

    @Input() showCredentials: boolean;

    private networkNameValid: boolean = true;
    private cardNameValid: boolean = true;

    private userId: string = '';
    private userSecret: string = null;
    private credentials = null;
    private cardName: string = null;

    constructor(protected clientService: ClientService,
                protected modalService: NgbModal,
                protected sampleBusinessNetworkService: SampleBusinessNetworkService,
                protected alertService: AlertService) {
        super(clientService, modalService, sampleBusinessNetworkService, alertService);
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
}
