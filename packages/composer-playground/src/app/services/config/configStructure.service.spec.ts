import { Config } from './configStructure.service';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import * as sinon from 'sinon';

let should = chai.should();

describe('Config', () => {
  let service: Config;

  beforeEach(() => {
      service = new Config();
  });

  describe('setValuesFromObject', () => {
      it('should assign values from keys in properties thats names match variable names in the Config class', () => {
          let object = {
              webonly: true,
              title: 'My Title',
              banner: ['My', 'Banner'],
              links: {
                docs: 'My Docs',
                tutorial: 'My Tutorial',
                community: 'My Community',
                github: 'My Github',
                install: 'My Install',
                legal: 'My License'
              },
              analyticsID: 'My ID'
          };

          service.setValuesFromObject(object);

          service.webonly.should.deep.equal(true);
          service.title.should.deep.equal('My Title');
          service.banner.should.deep.equal(['My', 'Banner']);
          service.links.should.deep.equal({
                                            docs: 'My Docs',
                                            tutorial: 'My Tutorial',
                                            community: 'My Community',
                                            github: 'My Github',
                                            install: 'My Install',
                                            legal: 'My License'
                                          });
          service.analyticsID.should.deep.equal('My ID');
      });

      it('should only assign values from keys in properties thats names match variable names in the Config class', () => {
          let object = {
              nonMatchingName: true
          };

          service.setValuesFromObject(object);

          service.should.deep.equal(new Config());
      });

      it('should only update values in variables that are object types of Config for keys shared in passed object', () => {
          let object = {
              links: {
                docs: 'My Docs'
              }
          };

          service.links = {
                              docs: 'https://hyperledger.github.io/composer/introduction/introduction.html',
                              tutorial: 'https://hyperledger.github.io/composer/tutorials/playground-tutorial.html',
                              community: 'https://hyperledger.github.io/composer/support/support-index.html',
                              github: 'https://github.com/hyperledger/composer',
                              install: 'https://hyperledger.github.io/composer/installing/installing-index.html',
                              legal: 'https://www.apache.org/licenses/LICENSE-2.0'
                          };

          service.setValuesFromObject(object);

          service.links.should.deep.equal({
                                              docs: 'My Docs',
                                              tutorial: 'https://hyperledger.github.io/composer/tutorials/playground-tutorial.html',
                                              community: 'https://hyperledger.github.io/composer/support/support-index.html',
                                              github: 'https://github.com/hyperledger/composer',
                                              install: 'https://hyperledger.github.io/composer/installing/installing-index.html',
                                              legal: 'https://www.apache.org/licenses/LICENSE-2.0'
                                          });
      });
  });

  describe('setToDefault', () => {
      it('should set all the variables to their default values', () => {
        service.webonly = true;
        service.title = 'My Title';
        service.banner = ['My', 'Banner'];
        service.links = {
          docs: 'My Docs',
          tutorial: 'My Tutorial',
          community: 'My Community',
          github: 'My Github',
          install: 'My Install',
          legal: 'My License'
        };
        service.analyticsID = 'My ID';

        service.setToDefault();

        service.webonly.should.deep.equal(false);
        service.title.should.deep.equal('Hyperledger Composer');
        service.banner.should.deep.equal(['Hyperledger', 'Composer Playground']);
        service.links.should.deep.equal({
                                            docs: 'https://hyperledger.github.io/composer/introduction/introduction.html',
                                            tutorial: 'https://hyperledger.github.io/composer/tutorials/playground-tutorial.html',
                                            community: 'https://hyperledger.github.io/composer/support/support-index.html',
                                            github: 'https://github.com/hyperledger/composer',
                                            install: 'https://hyperledger.github.io/composer/installing/installing-index.html',
                                            legal: 'https://www.apache.org/licenses/LICENSE-2.0'
                                        });

        should.not.exist(service.analyticsID);
      });
  });
});
