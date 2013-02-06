#!/bin/bash

DIST=dist
STAMP=`date '+%Y%m%d_%H%M'`
DIR=`npm prefix`
APP_VERSION=`./what_version.js`

cd ..
mkdir -p ${DIST}
npm pack
mv genassist-${APP_VERSION}.tgz ${DIST}/genassist-${APP_VERSION}-${STAMP}.tgz
cd cms

# next generate the build info to be used by chef.  This basically involves pulling a few things out of package.json
# and placing it in cms/data_bags/build/info.json
# todo: is there a pretty way to do this?
echo "{\"id\": \"build\", \"version\": \"${APP_VERSION}\", \"stamp\": \"${STAMP}\"}" > ./data_bags/build/info.json


