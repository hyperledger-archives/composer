import { Component, Input, Output, EventEmitter } from '@angular/core';

import { IdCard } from 'composer-common';

@Component({
    selector: 'identity-card',
    templateUrl: './identity-card.component.html',
    styleUrls: [
        './identity-card.component.scss'.toString()
    ]
})

export class IdentityCardComponent {

    @Input()
    identity: IdCard;

    @Input()
    preview: boolean = false;

    @Input()
    showDismissIcon: boolean = false;

    @Input()
    indestructible: boolean = false;

    @Output()
    onConnect: EventEmitter<string> = new EventEmitter<string>();

    @Output()
    onDismiss: EventEmitter<string> = new EventEmitter<string>();

    @Output()
    onDelete: EventEmitter<string> = new EventEmitter<string>();

    @Output()
    onExport: EventEmitter<string> = new EventEmitter<string>();

    connect() {
        this.onConnect.emit(this.identity.getName());
    }

    dismiss() {
        this.onDismiss.emit(this.identity.getName());
    }

    delete() {
        this.onDelete.emit(this.identity.getName());
    }

    export() {
        this.onExport.emit(this.identity.getName());
    }

    getInitials(): string {
        let result;
        let userId = this.identity.getName();
        let regexp = /^(\S)\S*\s*(\S?)/i;
        let matches = regexp.exec(userId);

        if (matches) {
            result = matches.slice(1, 3).join('');
        }

        return result ? result : ':)';
    }

    getRoles(): string {
        let adminRoles: string[] = this.identity.getRoles().filter((word) => word === 'PeerAdmin' || word === 'ChannelAdmin');

        if (adminRoles.length > 0) {
            return adminRoles.join(', ');
        }
    }
}
