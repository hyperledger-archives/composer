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
import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { Constants } from '../constants';
import { OperationsHelper } from '../utils/operations-helper';
import { Login } from '../component/login';
import { Deploy } from '../component/deploy';
import { SuccessAlert } from '../component/alert';
import { CreateBusinessNetworkCard } from '../component/create-business-network-card';

describe('login', () => {
    const profile = browser.params.profile;
    const isFabricTest = (profile !== 'Web Browser');
    const profileName = profile !== 'Web Browser' ? Constants.fabricCPName : Constants.webCPName;
    beforeAll(() => {
        // Important angular configuration and intial step passage to reach editor
        browser.waitForAngularEnabled(false);
        OperationsHelper.navigatePastWelcome();
    });

    afterAll(() => {
        browser.waitForAngularEnabled(true);
        browser.executeScript('window.sessionStorage.clear();');
        browser.executeScript('window.localStorage.clear();');
    });

    describe('handle routing in UI', () => {
        it('should add the TestPeerAdmin card', () => {
            if (isFabricTest) {
                return Login.importBusinessNetworkCard(Constants.tempDir + '/' + Constants.peerAdminCardName)
                    .then(() => {
                        return SuccessAlert.waitToDisappear();
                    });
            }
        });

        it('should allow a user to go to the deploy page and update the URL', () => {
            return Login.deployNewToProfile(profile)
                .then(() => {
                    return Deploy.waitToAppear();
                })
                .then(() => {
                    let encodedCPName = encodeURIComponent(profileName);
                    let regex = new RegExp(`ref=${encodedCPName}#deploy$`);
                    expect(browser.getCurrentUrl()).toMatch(regex);
                });
        });

        it('should allow the user to go back from the deploy page by using the UI button', () => {
            return Deploy.goBackToLogin()
                .then(() => {
                    let regex = new RegExp(`/login$`);
                    expect(browser.getCurrentUrl()).toMatch(regex);
                    return Login.waitToAppear();
                });
        });

        it('should let the user go to the create ID page and update the URL', () => {
            return Login.createNewBusinessNetworkCard()
                .then(() => {
                    return CreateBusinessNetworkCard.waitToAppear();
                })
                .then(() => {
                    let regex = new RegExp(`#create-card$`);
                    expect(browser.getCurrentUrl()).toMatch(regex);
                });
        });

        it('should allow the user to go back from the create ID page by using the UI button', () => {
            return CreateBusinessNetworkCard.goBackToLogin()
                .then(() => {
                    let regex = new RegExp(`/login$`);
                    expect(browser.getCurrentUrl()).toMatch(regex);
                    return Login.waitToAppear();
                });
        });
    });

    describe('handle routing using back button', () => {
        it('should add the TestPeerAdmin card', () => {
            if (isFabricTest) {
                return Login.importBusinessNetworkCard(Constants.tempDir + '/' + Constants.peerAdminCardName)
                    .then(() => {
                        return SuccessAlert.waitToDisappear();
                    });
            }
        });

        it('should allow a user to go to the deploy page and update the URL', () => {
            return Login.deployNewToProfile(profile)
                .then(() => {
                    return Deploy.waitToAppear();
                })
                .then(() => {
                    let encodedCPName = encodeURIComponent(profileName);
                    let regex = new RegExp(`ref=${encodedCPName}#deploy$`);
                    expect(browser.getCurrentUrl()).toMatch(regex);
                });
        });

        it('should allow the user to go back from the deploy page by using the browser back button', () => {
            browser.navigate().back();
            let regex = new RegExp(`/login$`);
            expect(browser.getCurrentUrl()).toMatch(regex);
            return Login.waitToAppear();
        });

        it('should let the user go to the create ID page and update the URL', () => {
            return Login.createNewBusinessNetworkCard()
                .then(() => {
                    return CreateBusinessNetworkCard.waitToAppear();
                })
                .then(() => {
                    let regex = new RegExp(`#create-card$`);
                    expect(browser.getCurrentUrl()).toMatch(regex);
                });
        });

        it('should allow the user to go back from the create ID page by using the back button', () => {
            browser.navigate().back();
            let regex = new RegExp(`/login$`);
            expect(browser.getCurrentUrl()).toMatch(regex);
            return Login.waitToAppear();
        });
    });
});
