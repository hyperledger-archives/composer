/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const Globalize = require('globalize');

// Before we can use Globalize, we need to feed it on the appropriate I18n content (Unicode CLDR). Read Requirements on Getting Started on the root's README.md for more information.
Globalize.load(
    require('cldr-data/main/en/ca-gregorian'),
    require('cldr-data/main/en/currencies'),
    require('cldr-data/main/en/dateFields'),
    require('cldr-data/main/en/numbers'),
    require('cldr-data/main/en/units'),
    require('cldr-data/supplemental/currencyData'),
    require('cldr-data/supplemental/likelySubtags'),
    require('cldr-data/supplemental/plurals'),
    require('cldr-data/supplemental/timeData'),
    require('cldr-data/supplemental/weekData')
);
Globalize.loadMessages(require('../messages/en'));
Globalize.loadMessages(require('../messages/pt'));

// Set "en" as our default locale.
Globalize.locale('en');

module.exports = Globalize;
