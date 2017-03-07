import { Injectable } from '@angular/core';

import { AdminService } from './admin.service';
import { ConnectionProfileService } from '../connectionprofile.service';
import { IdentityService } from '../identity.service';
import { AlertService } from './alert.service'

import { BusinessNetworkConnection } from 'composer-client';
import { BusinessNetworkDefinition, Util } from 'composer-common';

@Injectable()
export class ClientService {

  private businessNetworkConnection: BusinessNetworkConnection = null;
  private isConnected: boolean = false;
  private connectingPromise: Promise<any> = null;

  constructor(
    private adminService: AdminService,
    private connectionProfileService: ConnectionProfileService,
    private identityService: IdentityService,
    private alertService: AlertService
  ) {
    this.businessNetworkConnection = new BusinessNetworkConnection();
  }

  getBusinessNetworkConnection(): BusinessNetworkConnection {
    return this.businessNetworkConnection;
  }

  getBusinessNetwork(): BusinessNetworkDefinition {
    return this.businessNetworkConnection.getBusinessNetwork();
  }

  ensureConnected(): Promise<any> {
    if (this.isConnected) {
      return Promise.resolve();
    } else if (this.connectingPromise) {
      return this.connectingPromise;
    }
    let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
    this.alertService.busyStatus$.next('Establishing client connection ...');
    console.log('Connecting to connection profile', connectionProfile);
    let userID;
    this.connectingPromise = this.adminService.ensureConnected()
      .then(() => {
        return this.identityService.getUserID();
      })
      .then((userID_) => {
        userID = userID_;
        return this.identityService.getUserSecret();
      })
      .then((userSecret) => {
        return this.businessNetworkConnection.connect(connectionProfile, 'org.acme.biznet', userID, userSecret)
      })
      .then(() => {
        // this.busyStatus$.next(null);
        console.log('Connected');
        this.isConnected = true;
        this.connectingPromise = null;
      })
      .catch((error) => {
        this.alertService.busyStatus$.next(`Failed to connect: ${error}`);
        this.isConnected = false;
        this.connectingPromise = null;
        throw error;
      });
      return this.connectingPromise;
  }

  reset(): Promise<any> {
    return this.ensureConnected()
      .then(() => {
        // TODO: hack hack hack, this should be in the admin API.
        return Util.invokeChainCode((<any>(this.businessNetworkConnection)).securityContext, 'resetBusinessNetwork', []);
      });
  }

  refresh(): Promise<any> {
    let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
    let userID;
    return this.businessNetworkConnection.disconnect()
      .then(() => {
        return this.identityService.getUserID();
      })
      .then((userID_) => {
        userID = userID_;
        return this.identityService.getUserSecret();
      })
      .then((userSecret) => {
        return this.businessNetworkConnection.connect(connectionProfile, 'org.acme.biznet', userID, userSecret)
      });
  }

}
