import { TestBed, inject } from '@angular/core/testing';
import { EditorService } from './editor.service';
import * as chai from 'chai';
let assert = chai.assert;

describe('Editor Service', () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                EditorService
            ]
        });
    });
    it('should set and get the current file for the editor', inject([EditorService], (service: EditorService) => {
        let TEST = {name: 'foo', val: 'bar'};
        assert.isNull(service.getCurrentFile());
        service.setCurrentFile(TEST);
        assert.equal(service.getCurrentFile(), TEST);
    }));
});
