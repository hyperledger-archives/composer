import { Component, ViewChild, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import leftPad = require('left-pad');

import { ClientService } from '../client.service';
import { NotificationService } from '../notification.service';
import { InitializationService } from '../initialization.service';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.css']
})
export class ResetComponent implements OnInit {

  private resetInProgress: boolean = false;

  @ViewChild('modal') private modal;

  @Output('onReset') private reset$ = new EventEmitter();
  @Output('onHidden') private hidden$ = new EventEmitter();
  @Output('onError') private error$ = new EventEmitter();

  constructor(
    private clientService: ClientService,
    private notificationService: NotificationService,
    private initializationService: InitializationService,
    private alertService: AlertService
  ) {

  }

  ngOnInit(): Promise<any> {
    return this.initializationService.initialize();
  }

  private onShow() {

  }

  private onHidden() {
    this.hidden$.emit();
  }

  private reset() {
    this.resetInProgress = true;
    this.alertService.busyStatus$.next('Resetting business network ...');
    return this.clientService.reset()
      .then(() => {
        this.alertService.busyStatus$.next(null);
        this.reset$.emit();
        this.resetInProgress = false;
      })
      .catch((error) => {
        this.alertService.busyStatus$.next(null);
        this.alertService.errorStatus$.next(error);
        this.error$.emit(error);
        this.resetInProgress = false;
      })
  }

  displayAndWait(): Promise<boolean> {
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
          if (!this.resetInProgress) {
            resolve(false);
            subs.forEach((sub) => { sub.unsubscribe(); });
          }
        }),
        this.reset$.subscribe(() => {
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
