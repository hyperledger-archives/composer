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

'use strict';

module.exports = function (app, callback) {

    const dataSource = app.loopback.createDataSource('Composer', {
        'name': 'Composer',
        'connector': 'loopback-connector-composer',
        'connectionProfileName': app.cfg.connectionProfileName,
        'businessNetworkIdentifier': app.cfg.businessNetworkIdentifier,
        'participantId': app.cfg.participantId,
        'participantPwd': app.cfg.participantPwd
    });

    dataSource.discoverModelDefinitions({}, (error, modelDefinitions) => {
        console.log('Loopback Connector for Fabric Composer');
        if (error) {
            throw error;
        }
        modelDefinitions.forEach((modelDefinition) => {
            //console.log('Process model: '+JSON.stringify(modelDefinition));
            dataSource.discoverSchemas(modelDefinition.name, { visited: {}, associations: true }, (error, modelSchema) => {
                if (error) {
                    throw error;
                }
                // this is required because LoopBack doesn't like dots in model schema names
                modelSchema.name = modelSchema.plural.replace(/\./g, '_');
                modelSchema.idInjection = false;
                let model = app.loopback.createModel(modelSchema);
                app.model(model, {
                    dataSource: dataSource,
                    public: true
                });
            });
        });
        console.log('Models Loaded Now');
        callback();
    });
};

