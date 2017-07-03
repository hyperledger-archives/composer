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

    public deployChosenSample(chosenNetwork: object): Promise<void> {
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
                return this.deployBusinessNetwork(businessNetwork);
            })
            .catch((error) => {
                throw(error);
            });
    }

    public deployBusinessNetwork(businessNetworkDefinition: BusinessNetworkDefinition): Promise<any> {
        return this.adminService.update(businessNetworkDefinition)
            .then(() => {
                return this.clientService.refresh();
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
