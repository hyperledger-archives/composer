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

import { AngularTestPage } from './app.po';
import { ExpectedConditions, browser, element, by } from 'protractor';
import {} from 'jasmine';


describe('Starting tests for <%=appName%>', function() {
  let page: AngularTestPage;

  beforeEach(() => {
    page = new AngularTestPage();
  });

  it('website title should be <%=appName%>', () => {
    page.navigateTo('/');
    return browser.getTitle().then((result)=>{
      expect(result).toBe('<%=appName%>');
    })
  });

  it('network-name should be <%=businessNetworkIdentifier%>',() => {
    element(by.css('.network-name')).getWebElement()
    .then((webElement) => {
      return webElement.getText();
    })
    .then((txt) => {
      expect(txt).toBe('<%=businessNetworkIdentifier%>.bna');
    });
  });

  it('navbar-brand should be <%=appName%>',() => {
    element(by.css('.navbar-brand')).getWebElement()
    .then((webElement) => {
      return webElement.getText();
    })
    .then((txt) => {
      expect(txt).toBe('<%=appName%>');
    });
  });

  <% for(var x=0;x<assetList.length;x++){ %>
    it('<%=assetList[x].name%> component should be loadable',() => {
      page.navigateTo('/<%=assetList[x].name%>');
      browser.findElement(by.id('assetName'))
      .then((assetName) => {
        return assetName.getText();
      })
      .then((txt) => {
        expect(txt).toBe('<%=assetList[x].name%>');
      });
    });

    it('<%=assetList[x].name%> table should have <%=assetList[x].properties.length + 1%> columns',() => {
      page.navigateTo('/<%=assetList[x].name%>');
      element.all(by.css('.thead-cols th')).then(function(arr) {
        expect(arr.length).toEqual(<%=assetList[x].properties.length + 1%>); // Addition of 1 for 'Action' column
      });
    });
  <%}%>

  <% for(var x=0;x<participantList.length;x++){ %>
    it('<%=participantList[x].name%> component should be loadable',() => {
      page.navigateTo('/<%=participantList[x].name%>');
      browser.findElement(by.id('participantName'))
      .then((participantName) => {
        return participantName.getText();
      })
      .then((txt) => {
        expect(txt).toBe('<%=participantList[x].name%>');
      });
    });

    it('<%=participantList[x].name%> table should have <%=participantList[x].properties.length + 1%> columns',() => {
      page.navigateTo('/<%=participantList[x].name%>');
      element.all(by.css('.thead-cols th')).then(function(arr) {
        expect(arr.length).toEqual(<%=participantList[x].properties.length + 1%>); // Addition of 1 for 'Action' column
      });
    });
  <%}%>

  <% for(var x=0;x<transactionList.length;x++){ %>
    it('<%=transactionList[x].name%> component should be loadable',() => {
      page.navigateTo('/<%=transactionList[x].name%>');
      browser.findElement(by.id('transactionName'))
      .then((transactionName) => {
        return transactionName.getText();
      })
      .then((txt) => {
        expect(txt).toBe('<%=transactionList[x].name%>');
      });
    });
  <%}%>

});