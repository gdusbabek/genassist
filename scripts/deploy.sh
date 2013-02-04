#!/bin/bash

#SSHCMD=user@host
DIST=dist
STAMP=`date '+%Y%m%d_%H%M'`
DIR=`npm prefix`
APP_VERSION=`bin/what_version.js`
PACK_FILE=genassist-${APP_VERSION}-${STAMP}.tgz
PACK_PATH=${DIST}/${PACK_FILE}

mkdir -p ${DIST}

npm pack
mv genassist-${APP_VERSION}.tgz ${PACK_PATH}
scp ${PACK_PATH} ${SSHCMD}:/opt/genassist/uploads/
ssh ${SSHCMD} \'\'npm install /opt/genassist/uploads/${PACK_FILE}\'\'
ssh ${SSHCMD} \'\'mv node_modules/genassist /opt/genassist/${APP_VERSION}-${STAMP} && rm -rf node_modules\'\'

# at this point, we have delivered a bundle, extracted it, and placed it where it will live.
# let the scripts on the bundle handle things from here on out.  Keep in mind they run as the user specified in SSHCMD




