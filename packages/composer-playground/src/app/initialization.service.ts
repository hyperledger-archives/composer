import {Injectable} from '@angular/core';

import {AdminService} from './admin.service';
import {ClientService} from './client.service';
import {AlertService} from './services/alert.service';
import {SampleBusinessNetworkService} from './services/samplebusinessnetwork.service';

const fabricComposerOwner = 'fabric-composer';
const fabricComposerRepository = 'sample-networks';

@Injectable()
export class InitializationService {

  private initializingPromise: Promise<any> = null;
  private initialized = false;

  constructor(private adminService: AdminService,
              private clientService: ClientService,
              private sampleBusinessNetworkService: SampleBusinessNetworkService,
              private alertService: AlertService) {

  }

  initialize(): Promise<any> {
    if (this.initialized) {
      return Promise.resolve();
    } else if (this.initializingPromise) {
      return this.initializingPromise;
    }
    this.initializingPromise = this.adminService.ensureConnected()
      .then(() => {
        return this.clientService.ensureConnected();
      })
      .then(() => {
        if (this.adminService.isInitialDeploy()) {
          // We can't use the Github sample integration for the initial deploy until we figure out the rate limiting!
          return this.sampleBusinessNetworkService.deployInitialSample();
          // return this.sampleBusinessNetworkService.getSampleNetworkInfo(fabricComposerOwner, fabricComposerRepository, 'packages/CarAuction-Network/')
          //   .then((info) => {
          //     return this.sampleBusinessNetworkService.deploySample(fabricComposerOwner, fabricComposerRepository, info);
          //   });
        }
      })
      .then(() => {
        this.alertService.busyStatus$.next(null);
        this.initialized = true;
        this.initializingPromise = null;
      })
      .catch((error) => {
        //TODO: Is this needed?
        this.alertService.busyStatus$.next(null);
        this.alertService.errorStatus$.next(error);
        this.initialized = false;
        this.initializingPromise = null;
      });
    return this.initializingPromise;
  }

}
