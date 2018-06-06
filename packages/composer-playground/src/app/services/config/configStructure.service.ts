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
export class Config {
  public webonly: boolean = false;
  public title: string = '';
  public banner: Array<string> = ['', ''];
  public docURL: string = '';
  public links: object = {
    docs: <string> '',
    tutorial: <string> '',
    community: <string> '',
    github: <string> '',
    install: <string> '',
    legal: <string> ''
  };
  public analyticsID: string = null;

  setValuesFromObject(values: object): void {
    this.overwriteConfigWithUserConfig(this, values);
  }

  setToDefault(): void {
    this.webonly = false;
    this.title = 'Hyperledger Composer';
    this.banner = ['Hyperledger', 'Composer Playground'];
    this.docURL = 'https://hyperledger.github.io/composer/latest';
    this.links = {
      docs: <string> 'https://hyperledger.github.io/composer/latest/introduction/introduction.html',
      tutorial: <string> 'https://hyperledger.github.io/composer/latest/tutorials/playground-tutorial.html',
      community: <string> 'https://hyperledger.github.io/composer/latest/support/support-index.html',
      github: <string> 'https://github.com/hyperledger/composer',
      install: <string> 'https://hyperledger.github.io/composer/latest/installing/installing-index.html',
      legal: <string> 'https://www.apache.org/licenses/LICENSE-2.0'
    };
    this.analyticsID = null;
  }

  private overwriteConfigWithUserConfig(baseConfig: object, userConfig: object) {
    for (let key in baseConfig) {
      if (baseConfig.hasOwnProperty(key) && userConfig.hasOwnProperty(key)) {
        if (baseConfig[key] instanceof Object && userConfig[key] instanceof Object) {
          baseConfig[key] = this.overwriteConfigWithUserConfig(baseConfig[key], userConfig[key]);
        } else {
          baseConfig[key] = userConfig[key];
        }
      }
    }
    return baseConfig;
  }
}
