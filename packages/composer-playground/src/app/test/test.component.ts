import {Component, OnInit} from '@angular/core';

import {ClientService} from '../client.service';
import {InitializationService} from '../initialization.service';
import {AlertService} from '../services/alert.service';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: [
    './test.component.scss'.toString()
  ]
})
export class TestComponent implements OnInit {

  private assetRegistries = [];
  private participantRegistries = [];
  private transactionRegistry = null;
  private chosenRegistry = null;

  constructor(private clientService: ClientService,
              private initializationService: InitializationService,
              private alertService: AlertService) {
  }

  ngOnInit(): Promise<any> {
    return this.initializationService.initialize()
      .then(() => {
        return this.clientService.getBusinessNetworkConnection().getAllAssetRegistries()
          .then((assetRegistries) => {
            assetRegistries.forEach((assetRegistry) => {
              let index = assetRegistry.id.lastIndexOf('.');
              let displayName = assetRegistry.id.substring(index + 1);
              assetRegistry.displayName = displayName;
            });

            this.assetRegistries = assetRegistries.sort((a, b) => {
              return a.id.localeCompare(b.id);
            });

            return this.clientService.getBusinessNetworkConnection().getAllParticipantRegistries()
          })
          .then((participantRegistries) => {
            participantRegistries.forEach((participantRegistry) => {
              let index = participantRegistry.id.lastIndexOf('.');
              let displayName = participantRegistry.id.substring(index + 1);
              participantRegistry.displayName = displayName;
            });

            this.participantRegistries = participantRegistries.sort((a, b) => {
              return a.id.localeCompare(b.id);
            });

            return this.clientService.getBusinessNetworkConnection().getTransactionRegistry()
          })
          .then((transactionRegistry) =>{
            this.transactionRegistry = transactionRegistry;
          });
      })
      .catch((error) => {
        this.alertService.errorStatus$.next(error);
      });
  }
}
