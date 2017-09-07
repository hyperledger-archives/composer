import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs/Rx';

@Injectable()
export class AlertService {

    // TODO think about not exposing this directly
    public errorStatus$: Subject<string> = new BehaviorSubject<string>(null);
    public busyStatus$: Subject<any> = new BehaviorSubject<any>(null);
    public successStatus$: Subject<any> = new BehaviorSubject<any>(null);
    public transactionEvent$: Subject<object> = new BehaviorSubject<object>(null);
}
