'use strict';

const Tree = require('./tree.js');
let treeify = require('treeify');

let _root = new Tree();
_root.setRootInclusion();

_root.addNode('alpha',true);
_root.addNode('beta',true);
_root.addNode('gamma',true);
_root.addNode('delta',false);
_root.addNode('delta/epsilon',true);
_root.addNode('zeta/eta',true);

console.log( treeify.asTree(_root,true));
console.log( _root.getInclusion('alpha'));
console.log( _root.getInclusion('beta'));
console.log( _root.getInclusion('gamma'));
console.log( _root.getInclusion('delta'));
console.log( _root.getInclusion('delta/epsilon'));
console.log( _root.getInclusion('zeta/eta'));
console.log( _root.getInclusion('omega'));
