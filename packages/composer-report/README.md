# composer-report

This module provides the core diagnostic report code for the Hyperledger Composer `composer report` CLI.

While the full Composer report command includes additional diagnostics, the `composer-cli` module has many more dependencies which may result in difficulties during installation.
In the event that there are problems installing `composer-cli`, this module can be installed and run as a command to produce a basic report to assist problem determination.

## Install

Install with `npm install -g composer-report`

## Usage

There are no arguments or options, so just run `composer-report` to produce a _composer-report-<TIMESTAMP>.tgz_ report archive.

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.