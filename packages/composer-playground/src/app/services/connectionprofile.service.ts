import {Injectable} from '@angular/core';
import {LocalStorageService} from 'angular-2-local-storage';

import {AdminConnection} from 'composer-admin';

import {WalletService} from '../wallet.service';


@Injectable()
export class ConnectionProfileService {

  private adminConnection: AdminConnection;

  constructor(private localStorageService: LocalStorageService,
              private walletService: WalletService) {
  }

  private getAdminConnection() {
    if (!this.adminConnection) {
      this.adminConnection = new AdminConnection();
    }

    return this.adminConnection;
  }

  getCurrentConnectionProfile(): string {
    let result = this.localStorageService.get<string>('currentConnectionProfile');
    if (result === null) {
      result = '$default';
    }
    return result;
  }

  setCurrentConnectionProfile(connectionProfile: string) {
    this.localStorageService.set('currentConnectionProfile', connectionProfile);
  }

  createProfile(name, connectionProfile): Promise<any> {
    return this.getAdminConnection().createProfile(name, connectionProfile);
  }

  getProfile(name): Promise<any> {
    return this.getAdminConnection().getProfile(name);
  }

  createDefaultProfile(): Promise<any> {
    // Check to see if the default connection profile exists.
    console.log('Checking for $default connection profile');
    return this.getAdminConnection().getProfile('$default')
      .catch((error) => {
        // It doesn't exist, so create it.
        console.log('$default connection profile does not exist, creating');
        return this.getAdminConnection().createProfile('$default', {type: 'web'})
          .then(() => {
            return this.walletService.getWallet('$default').add('admin', 'adminpw');
          });
      });
  };

  getAllProfiles(): Promise<any> {
    return this.getAdminConnection().getAllProfiles();
  }

}
