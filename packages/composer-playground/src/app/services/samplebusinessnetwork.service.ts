import { Injectable } from '@angular/core';
import { Http, RequestOptions, URLSearchParams }    from '@angular/http';

import { AdminService } from './admin.service';
import { ClientService } from './client.service';
import { AlertService } from '../basic-modals/alert.service';

import { BusinessNetworkDefinition } from 'composer-common';

@Injectable()
export class SampleBusinessNetworkService {
    constructor(private adminService: AdminService,
                private clientService: ClientService,
                private alertService: AlertService,
                private http: Http) {
    }

    createNewBusinessDefinition(name, description, packageJson, readme) {
        return new BusinessNetworkDefinition(name, description, packageJson, readme);
    }

    public getSampleList() {
        return this.http.get(PLAYGROUND_API + '/api/getSampleList')
            .toPromise()
            .then((response) => {
                return response.json();
            })
            .catch((error) => {
                throw(error);
            });
    }

    public deployChosenSample(chosenNetwork: object, deployNetwork: boolean): Promise<void> {
        let params: URLSearchParams = new URLSearchParams();

        let paramNames = Object.keys(chosenNetwork);

        paramNames.forEach((paramName) => {
            params.set(paramName, chosenNetwork[paramName]);
        });

        let requestOptions = new RequestOptions();
        requestOptions.search = params;

        return this.http.get(PLAYGROUND_API + '/api/downloadSample', requestOptions)
            .toPromise()
            .then((response) => {
                return BusinessNetworkDefinition.fromArchive((<any> response)._body);
            })
            .then((businessNetwork) => {
                return this.deployBusinessNetwork(businessNetwork, deployNetwork);
            })
            .catch((error) => {
                throw(error);
            });
    }

    public deployBusinessNetwork(businessNetworkDefinition: BusinessNetworkDefinition, deployNetwork: boolean): Promise<any> {
        let deployPromise;

        if (deployNetwork) {
            deployPromise = this.adminService.deploy(businessNetworkDefinition);
        } else {
            let currentBusinessNetworkName = this.clientService.getBusinessNetworkName();

            let packageJson = businessNetworkDefinition.getMetadata().getPackageJson();
            packageJson.name = currentBusinessNetworkName;

            let newNetwork = this.createNewBusinessDefinition(currentBusinessNetworkName, businessNetworkDefinition.getDescription(), packageJson, businessNetworkDefinition.getMetadata().getREADME());

            let modelFiles = this.clientService.filterModelFiles(businessNetworkDefinition.getModelManager().getModelFiles());

            newNetwork.getModelManager().addModelFiles(modelFiles);
            businessNetworkDefinition.getScriptManager().getScripts().forEach((script) => {
                newNetwork.getScriptManager().addScript(script);
            });

            if (businessNetworkDefinition.getAclManager().getAclFile()) {
                newNetwork.getAclManager().setAclFile(businessNetworkDefinition.getAclManager().getAclFile());
            }

            deployPromise = this.adminService.update(newNetwork);
        }

        return deployPromise
            .then(() => {
                return this.clientService.refresh(businessNetworkDefinition.getName());
            })
            .then(() => {
                return this.clientService.reset();
            })
            .then(() => {
                this.alertService.busyStatus$.next(null);
            })
            .catch((error) => {
                this.alertService.busyStatus$.next(null);
                throw error;
            });
    }
}
