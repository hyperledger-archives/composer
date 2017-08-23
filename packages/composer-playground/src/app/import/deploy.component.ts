import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ClientService } from '../services/client.service';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { AlertService } from '../basic-modals/alert.service';
import { ImportComponent } from './import.component';

@Component({
    selector: 'deploy-business-network',
    templateUrl: './deploy.component.html',
    styleUrls: ['./deploy.component.scss'.toString()],
})
export class DeployComponent extends ImportComponent {

    private networkNameValid: boolean = true;

    constructor(protected clientService: ClientService,
                protected modalService: NgbModal,
                protected sampleBusinessNetworkService: SampleBusinessNetworkService,
                protected alertService: AlertService) {
        super(clientService, modalService, sampleBusinessNetworkService, alertService);
    }

    deploy() {
        let replacePromise;

        let deployed: boolean = true;

        this.deployInProgress = true;
        return this.sampleBusinessNetworkService.deployBusinessNetwork(this.currentBusinessNetwork, this.networkName, this.networkDescription)
            .then(() => {
                this.deployInProgress = false;
                this.finishedSampleImport.emit({deployed: deployed});
            })
            .catch((error) => {
                this.deployInProgress = false;
                this.alertService.errorStatus$.next(error);
                this.finishedSampleImport.emit({deployed: false, error: error});
            });
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
}
