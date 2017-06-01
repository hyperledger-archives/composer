import { browser, element, by } from 'protractor';
import * as chai from 'chai';
let should = chai.should();

describe('Protractor Demo App', (() => {

  // Navigate to Editor base page
  beforeEach(() =>  {
    browser.get(browser.baseUrl + '/editor');
  });

  it('should have a title', (() => {
    let myElement = element(by.css('.navlogo')).getText()
    .then((myText) => {
        console.log('navLogo text: ', myText);
        myText.should.equal('Hyperledger Composer Playground');
    });
  }));

}));
