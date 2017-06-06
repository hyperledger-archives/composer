import { browser, element, by } from 'protractor';
import * as chai from 'chai';
let should = chai.should();

describe('Welcome Splash', (() => {

  // Navigate to Editor base page
  beforeEach(() =>  {
    browser.get(browser.baseUrl);
  });

  it('should welcome the user to Composer Playground', (() => {
    let myElement = element(by.css('.welcome')).getText()
    .then((myText) => {
        myText.should.contain('Welcome to Hyperledger Composer Playground!');
    });
  }));

}));
