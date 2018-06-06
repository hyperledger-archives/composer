# API-CHANGELOG

## Syntax of the Changelog.txt

### Example file
```
#
# This is the changelog for Hyperledger Composer. It lists all significant changes to
# functionality and public API.
#
#
Version 0.15.2 {fcb7a3866eb7f9d0b3c46924ae932824} 2017-11-22
- Extend ParseException with file name
- Make private number of constructors and removed exceptions from formally documented API
- Add the introspection APIs, Memory and Filesystem Card store.

Version 0.15.1 {015d225161956eb66be1636cef324c8a} 2017-11-14
- Add in has to the Card Store
- Make IdCard constructor public

Version 0.15.0 {bc4416a38d5d8d9d53dd4f5cbe3992aa} 2017-11-08
- Add IdCard and BusinessNetworkCardStore to public API

```

### Specification

- The file is text, utf-8 encoding
- Comments are indetified by # in the first column
- Entries are in chronological order with the most recent first 
- Each entry is composed of an indentifier line, starting in column 1, with details after that with comments on the changes.
- *Identifier Line*
    - Should match this syntax  `Version <number> {public api digest} <date>`
    - The version number must match that specified in package.json
    - The public api digest is computed and validated using *api-changelog*
- Latest public API  is available in api.txt.

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.