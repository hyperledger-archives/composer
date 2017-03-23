import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';

@Injectable()
export class ConnectionProfileService {

  constructor(private localStorageService: LocalStorageService) {
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

}
