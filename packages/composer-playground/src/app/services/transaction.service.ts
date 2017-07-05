import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs/Rx';

@Injectable()
export class TransactionService {
    public event$: Subject<string> = new BehaviorSubject<string>(null);

    lastTransaction = null;
    events = [];

    constructor() {
        // Constructor
    }

    reset(transaction, events) {
        if (!transaction && !events) {
            this.lastTransaction = null;
            this.events = [];
        } else {
            this.lastTransaction = transaction;
            this.events = events;
        }
    }
}
