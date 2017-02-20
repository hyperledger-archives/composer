import { Injectable } from '@angular/core';

@Injectable()
export class NotificationService {

  public modalPromise: Promise<any> = Promise.resolve();

  constructor() {
  }

}
