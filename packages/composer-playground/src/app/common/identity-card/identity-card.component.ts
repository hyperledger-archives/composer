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
    link: String;

    @Input()
    identity: IdCard;

    @Input()
    cardRef: string;

    @Input()
    preview: boolean = false;

    @Input()
    showDismissIcon: boolean = false;

    @Input()
    indestructible: boolean = false;

    @Input()
    showSpecial: boolean = false;

    @Output()
    onConnect: EventEmitter<string> = new EventEmitter<string>();

    @Output()
    onDeploySample: EventEmitter<void> = new EventEmitter<void>();

    @Output()
    onDismiss: EventEmitter<string> = new EventEmitter<string>();

    @Output()
    onDelete: EventEmitter<string> = new EventEmitter<string>();

    @Output()
    onExport: EventEmitter<string> = new EventEmitter<string>();

    connect() {
        this.onConnect.emit(this.identity.getUserName());
    }

    deploySample() {
        this.onDeploySample.emit();
    }

    dismiss() {
        this.onDismiss.emit(this.identity.getUserName());
    }

    delete() {
        this.onDelete.emit(this.identity.getUserName());
    }

    export() {
        this.onExport.emit(this.identity.getUserName());
    }

    getInitials(): string {
        let result;
        let userId = this.identity.getUserName();
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
