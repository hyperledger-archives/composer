#!/usr/bin/env node
require('yargs').command('get <username|email> [password]', 'fetch a user by username or email.')
    .help()

  .wrap(72)
  .argv;
