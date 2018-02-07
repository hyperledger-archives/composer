import * as path from 'path';
import { Promise } from 'bluebird';
import { exec } from 'child_process';
const pExec = Promise.promisify(exec);

export class CliHelper {
    static importCard(filePath: string, cardName: string) {
        return pExec(`composer card import --file ${filePath} --name ${cardName}`);
    }

    static pingCard(cardName: string) {
        return pExec(`composer network ping --card ${cardName}`);
    }
}