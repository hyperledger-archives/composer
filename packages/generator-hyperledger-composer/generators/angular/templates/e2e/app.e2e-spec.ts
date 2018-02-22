import { AngularTestPage } from './app.po';
import { browser, element, by } from 'protractor';

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
    var networkName = element(by.css('.network-name')).getWebElement();
    expect(networkName.getText()).toBe('<%=businessNetworkIdentifier%>');
  });

  it('navbar-brand should be <%=appName%>',() => {
    var navbarBrand = element(by.css('.navbar-brand')).getWebElement();
    expect(navbarBrand.getText()).toBe('<%=appName%>');
  });

  <% for(var x=0;x<assetList.length;x++){ %>
    it('<%=assetList[x].name%> component should be loadable',() => {
      page.navigateTo('/<%=assetList[x].name%>');
      var assetName = browser.findElement(by.id('assetName'));
      expect(assetName.getText()).toBe('<%=assetList[x].name%>');
    });

    it('<%=assetList[x].name%> table should have <%=assetList[x].properties.length + 1%> columns',() => {
      page.navigateTo('/<%=assetList[x].name%>');
      element.all(by.css('.thead-cols th')).then(function(arr) {
        expect(arr.length).toEqual(<%=assetList[x].properties.length + 1%>); // Addition of 1 for 'Action' column
      });
    });

  <%}%>

});
