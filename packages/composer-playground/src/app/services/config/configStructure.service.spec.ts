/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
              docURL: 'https://doc_url',
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
          service.docURL.should.deep.equal('https://doc_url');
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
                              docs: 'https://hyperledger.github.io/composer/latest/introduction/introduction.html',
                              tutorial: 'https://hyperledger.github.io/composer/latest/tutorials/playground-tutorial.html',
                              community: 'https://hyperledger.github.io/composer/latest/support/support-index.html',
                              github: 'https://github.com/hyperledger/composer',
                              install: 'https://hyperledger.github.io/composer/latest/installing/installing-index.html',
                              legal: 'https://www.apache.org/licenses/LICENSE-2.0'
                          };

          service.setValuesFromObject(object);

          service.links.should.deep.equal({
                                              docs: 'My Docs',
                                              tutorial: 'https://hyperledger.github.io/composer/latest/tutorials/playground-tutorial.html',
                                              community: 'https://hyperledger.github.io/composer/latest/support/support-index.html',
                                              github: 'https://github.com/hyperledger/composer',
                                              install: 'https://hyperledger.github.io/composer/latest/installing/installing-index.html',
                                              legal: 'https://www.apache.org/licenses/LICENSE-2.0'
                                          });
      });
  });

  describe('setToDefault', () => {
      it('should set all the variables to their default values', () => {
        service.webonly = true;
        service.title = 'My Title';
        service.banner = ['My', 'Banner'];
        service.docURL = 'https://doc_url';
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
        service.docURL.should.deep.equal('https://hyperledger.github.io/composer/latest');
        service.links.should.deep.equal({
                                            docs: 'https://hyperledger.github.io/composer/latest/introduction/introduction.html',
                                            tutorial: 'https://hyperledger.github.io/composer/latest/tutorials/playground-tutorial.html',
                                            community: 'https://hyperledger.github.io/composer/latest/support/support-index.html',
                                            github: 'https://github.com/hyperledger/composer',
                                            install: 'https://hyperledger.github.io/composer/latest/installing/installing-index.html',
                                            legal: 'https://www.apache.org/licenses/LICENSE-2.0'
                                        });

        should.not.exist(service.analyticsID);
      });
  });
});
