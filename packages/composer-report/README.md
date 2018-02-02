# composer-report

This module provides the core diagnostic report code for the Hyperledger Composer `composer report` CLI.

While the full Composer report command includes additional diagnostics, the `composer-cli` module has many more dependencies which may result in difficulties during installation.
In the event that there are problems installing `composer-cli`, this module can be installed and run as a command to produce a basic report to assist problem determination.

## Install

Install with `npm install -g composer-report`

## Usage

There are no arguments or options, so just run `composer-report` to produce a _composer-report-<TIMESTAMP>.tgz_ report archive.
