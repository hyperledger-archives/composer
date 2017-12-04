import * as packageObject from '../../../package.json';

export class AboutService {
    versions = null;

    getVersions(): Promise<any> {
        if (!this.versions) {
            this.versions =  {
                playground: {
                    name: 'playground',
                    version: packageObject.version
                }
            };
        }

        return Promise.resolve(this.versions);
    }
}
