import { Component, OnInit, ViewChild } from '@angular/core';
import leftPad = require('left-pad');

import { SubmitTransactionComponent } from './submittransaction';
import { ClientService } from '../client.service';
import { InitializationService } from '../initialization.service';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-transactionregistry',
  templateUrl: './transactionregistry.component.html',
  styleUrls: ['./transactionregistry.component.css']
})
export class TransactionRegistryComponent implements OnInit {

  private registry: any;
  private resources: any;
  private registryID: string;

  @ViewChild(SubmitTransactionComponent) private submitTransactionComponent: SubmitTransactionComponent;

  constructor(
    private clientService: ClientService,
    private initializationService: InitializationService,
    private alertService: AlertService
  ) {

  }

  ngOnInit(): Promise<any> {
    return this.initializationService.initialize()
      .then(() => {
          return this.loadResources();
      });
  }

  loadResources(): Promise<any> {
    return Promise.resolve()
      .then(() => {
        return this.clientService.getBusinessNetworkConnection().getTransactionRegistry();
      })
      .then((registry) => {
        this.registry = registry;
        return this.registry.getAll();
      })
      .then((resources) => {
        this.resources = resources.sort((a, b) => {
          return b.timestamp - a.timestamp;
        });
      })
      .catch((error) => {
        this.alertService.errorStatus$.next(error);
      });
  }

  serialize(resource: any): string {
    let serializer = this.clientService.getBusinessNetwork().getSerializer();
    return JSON.stringify(serializer.toJSON(resource), null, 2);
  }

  submitTransaction() {
    this.submitTransactionComponent.displayAndWait()
      .then((result) => {
        if (result) {
          return this.loadResources();
        }
      });
  }

}
