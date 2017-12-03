import { Injectable } from '@angular/core';

@Injectable()
export class ConnectionProfileService {
    private currentCertificate: string;

    getCertificate(): string {
        return this.currentCertificate;
    }

    setCertificate(cert: string) {
        this.currentCertificate = cert;
    }
}
