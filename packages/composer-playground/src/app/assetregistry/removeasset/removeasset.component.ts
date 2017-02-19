import { Component, ViewChild, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import leftPad = require('left-pad');

import { ClientService } from '../../client.service';
import { ConnectionProfileService } from '../../connectionprofile.service';
import { WalletService } from '../../wallet.service';
import { NotificationService } from '../../notification.service';
import { InitializationService } from '../../initialization.service';

@Component({
  selector: 'remove-asset',
  templateUrl: './removeasset.component.html',
  styleUrls: ['./removeasset.component.css']
})
export class RemoveAssetComponent implements OnInit, OnDestroy {

  private subs: any[];
  private registryID: string = null;
  private resourceID: string = null;
  private removeInProgress: boolean = false;

  @ViewChild('modal') private modal;

  @Output('onRemoved') private removed$ = new EventEmitter();
  @Output('onHidden') private hidden$ = new EventEmitter();
  @Output('onError') private error$ = new EventEmitter();

  constructor(
    private route: ActivatedRoute,
    private clientService: ClientService,
    private notificationService: NotificationService,
    private initializationService: InitializationService
  ) {

  }

  ngOnInit(): Promise<any> {
    return this.initializationService.initialize()
      .then(() => {
        this.subs = [
          this.route.params.subscribe(params => {
            this.registryID = params['id'];
          })
        ];
      });
  }

  ngOnDestroy() {
    this.subs.forEach((sub) => { sub.unsubscribe(); });
  }

  private onShow() {

  }

  private onHidden() {
    this.hidden$.emit();
  }

  private remove() {
    this.removeInProgress = true;
    this.clientService.busyStatus$.next('Removing asset ...');
    return this.clientService.getBusinessNetworkConnection().getAssetRegistry(this.registryID)
      .then((registry) => {
        return registry.remove(this.resourceID);
      })
      .then(() => {
        this.clientService.busyStatus$.next(null);
        this.removed$.emit();
        this.removeInProgress = false;
      })
      .catch((error) => {
        this.clientService.busyStatus$.next(null);
        this.clientService.errorStatus$.next(error);
        this.error$.emit(error);
        this.removeInProgress = false;
      })
  }

  displayAndWait(resource): Promise<boolean> {
    this.resourceID = resource.getIdentifier();
    this.notificationService.modalPromise = this.notificationService.modalPromise.then(() => {
      return new Promise((resolve, reject) => {
        let subs = [
          this.hidden$.subscribe(() => {
            resolve();
            subs.forEach((sub) => { sub.unsubscribe(); });
          })
        ];
        this.modal.show();
      });
    });
    return new Promise((resolve, reject) => {
      let subs = [
        this.hidden$.subscribe(() => {
          if (!this.removeInProgress) {
            resolve(false);
            subs.forEach((sub) => { sub.unsubscribe(); });
          }
        }),
        this.removed$.subscribe(() => {
          resolve(true);
          subs.forEach((sub) => { sub.unsubscribe(); });
        }),
        this.error$.subscribe((error) => {
          resolve(false);
          subs.forEach((sub) => { sub.unsubscribe(); });
        })
      ];
    });
  }

}
