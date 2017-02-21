import { Component, ViewChild, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import leftPad = require('left-pad');

import { ClientService } from '../../client.service';
import { ConnectionProfileService } from '../../connectionprofile.service';
import { WalletService } from '../../wallet.service';
import { NotificationService } from '../../notification.service';
import { InitializationService } from '../../initialization.service';

@Component({
  selector: 'update-participant',
  templateUrl: './updateparticipant.component.html',
  styleUrls: ['./updateparticipant.component.css']
})
export class UpdateParticipantComponent implements OnInit, OnDestroy {

  private subs: any[];
  private registryID: string = null;
  private data: string = null;
  private error: string = null;
  private updateInProgress: boolean = false;
  private connectionProfileOverride: string = null;

  @ViewChild('modal') private modal;

  @Output('onUpdated') private updated$ = new EventEmitter();
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

  private onDataChanged() {
    try {
      let json = JSON.parse(this.data);
      let serializer = this.clientService.getBusinessNetwork().getSerializer();
      let resource = serializer.fromJSON(json);
      resource.validate();
      this.error = null;
    } catch (e) {
      this.error = e.toString();
    }
  }

  private update() {
    this.updateInProgress = true;
    this.clientService.busyStatus$.next('Updating participant ...');
    return this.clientService.getBusinessNetworkConnection().getParticipantRegistry(this.registryID)
      .then((registry) => {
        let json = JSON.parse(this.data);
        let serializer = this.clientService.getBusinessNetwork().getSerializer();
        let resource = serializer.fromJSON(json);
        return registry.update(resource);
      })
      .then(() => {
        this.clientService.busyStatus$.next(null);
        this.updated$.emit();
        this.updateInProgress = false;
      })
      .catch((error) => {
        this.clientService.busyStatus$.next(null);
        this.clientService.errorStatus$.next(error);
        this.error$.emit(error);
        this.updateInProgress = false;
      })
  }

  displayAndWait(resource): Promise<boolean> {
    let serializer = this.clientService.getBusinessNetwork().getSerializer();
    this.data = JSON.stringify(serializer.toJSON(resource), null, 2);
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
          if (!this.updateInProgress) {
            resolve(false);
            subs.forEach((sub) => { sub.unsubscribe(); });
          }
        }),
        this.updated$.subscribe(() => {
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
