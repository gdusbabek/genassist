#!/usr/bin/node
var fs = require('fs');
var path = require('path');

// how you use this:
// what_version.js ${directory containing package file} ${name of package file} ${which attribute to dump}
// output is a single line containing the attribute you ask for.
// defaults are "../" "package.json" "version"

var packageDir = '../'
var packageFile = 'package.json';
var field = 'version';

if (process.argv[2]) {
  packageDir = process.argv[2];
}
if (process.argv[3]) {
  packageFile = process.argv[3];
}
if (process.argv[4]) {
  field = process.argv[4];
}

packageFile = path.join(packageDir, packageFile);

var packageJson = fs.readFileSync(packageFile, 'utf8');
var package = JSON.parse(packageJson);
console.log(package[field]);
process.exit(0);