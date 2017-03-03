import { Component, ViewChild, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import leftPad = require('left-pad');

import { ClientService } from '../../client.service';
import { NotificationService } from '../../notification.service';
import { InitializationService } from '../../initialization.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'submit-transaction',
  templateUrl: './submittransaction.component.html',
  styleUrls: ['./submittransaction.component.css']
})
export class SubmitTransactionComponent implements OnInit {

  private classes: string[] = [];
  private clazz: string = null;
  private data: string = null;
  private error: string = null;
  private submitInProgress: boolean = false;

  @ViewChild('modal') private modal;

  @Output('onSubmited') private submited$ = new EventEmitter();
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
    return this.initializationService.initialize()
      .then(() => {
          let businessNetworkDefinition = this.clientService.getBusinessNetwork();
          let modelManager = businessNetworkDefinition.getModelManager();
          this.classes = modelManager.getTransactionDeclarations().filter((classDeclaration) => {
            return !classDeclaration.isAbstract();
          }).map((classDeclaration) => {
            return classDeclaration.getFullyQualifiedName();
          });
          if (this.classes.length) {
            this.clazz = this.classes[0];
            this.onClassChanged();
          }
      });
  }

  private onShow() {
    this.onClassChanged();
  }

  private onHidden() {
    this.hidden$.emit();
  }

  private onClassChanged() {
    let businessNetworkDefinition = this.clientService.getBusinessNetwork();
    let introspector = businessNetworkDefinition.getIntrospector();
    let classDeclaration = introspector.getClassDeclaration(this.clazz);
    let factory = businessNetworkDefinition.getFactory();
    let idx = Math.round(Math.random() * 9999).toString();
    idx = leftPad(idx, 4, '0');
    let id = `${classDeclaration.getIdentifierFieldName()}:${idx}`;
    let resource = factory.newResource(classDeclaration.getModelFile().getNamespace(), classDeclaration.getName(), id, { generate: true });
    let serializer = this.clientService.getBusinessNetwork().getSerializer();
    try {
      let json = serializer.toJSON(resource);
      // Delete the transaction ID and timestamp which are irrelevant.
      delete json[classDeclaration.getIdentifierFieldName()];
      delete json.timestamp;
      this.data = JSON.stringify(json, null, 2);
    } catch (e) {
      // We can't generate a sample instance for some reason.
      console.error(e);
      this.data = '';
    }
  }

  private onDataChanged() {
    try {
      let json = JSON.parse(this.data);
      let serializer = this.clientService.getBusinessNetwork().getSerializer();
      let resource = serializer.fromJSON(json);
      resource.setIdentifier('00000000-0000-0000-0000-000000000000');
      resource.timestamp = new Date();
      resource.validate();
      this.error = null;
    } catch (e) {
      this.error = e.toString();
    }
  }

  private submit() {
    this.submitInProgress = true;
    this.alertService.busyStatus$.next('Submitting transaction ...');
    return Promise.resolve()
      .then(() => {
        let json = JSON.parse(this.data);
        let serializer = this.clientService.getBusinessNetwork().getSerializer();
        let resource = serializer.fromJSON(json);
        return this.clientService.getBusinessNetworkConnection().submitTransaction(resource);
      })
      .then(() => {
        this.alertService.busyStatus$.next(null);
        this.submited$.emit();
        this.submitInProgress = false;
      })
      .catch((error) => {
        this.alertService.busyStatus$.next(null);
        this.alertService.errorStatus$.next(error);
        this.error$.emit(error);
        this.submitInProgress = false;
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
          if (!this.submitInProgress) {
            resolve(false);
            subs.forEach((sub) => { sub.unsubscribe(); });
          }
        }),
        this.submited$.subscribe(() => {
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
