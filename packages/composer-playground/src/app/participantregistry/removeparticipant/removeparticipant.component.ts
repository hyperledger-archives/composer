import { Component, ViewChild, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import leftPad = require('left-pad');

import { ClientService } from '../../client.service';
import { NotificationService } from '../../notification.service';
import { InitializationService } from '../../initialization.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'remove-participant',
  templateUrl: './removeparticipant.component.html',
  styleUrls: ['./removeparticipant.component.css']
})
export class RemoveParticipantComponent implements OnInit, OnDestroy {

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
    private initializationService: InitializationService,
    private alertService: AlertService
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
    this.alertService.busyStatus$.next('Removing participant ...');
    return this.clientService.getBusinessNetworkConnection().getParticipantRegistry(this.registryID)
      .then((registry) => {
        return registry.remove(this.resourceID);
      })
      .then(() => {
        this.alertService.busyStatus$.next(null);
        this.removed$.emit();
        this.removeInProgress = false;
      })
      .catch((error) => {
        this.alertService.busyStatus$.next(null);
        this.alertService.errorStatus$.next(error);
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
