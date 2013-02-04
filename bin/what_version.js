#!/usr/bin/node
var fs = require('fs');

var packageJson = fs.readFileSync('package.json', 'utf8');
var package = JSON.parse(packageJson);
console.log(package.version);
process.exit(0);