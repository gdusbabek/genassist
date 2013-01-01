#!/bin/bash

STAMP=`date '+%Y%m%d_%H%M%S'`
BUNDLE=site_${STAMP}.tar
BUNDLE_PATH=dist/${BUNDLE}
SSHHOST=gdusbabek@genassist.tagfriendly.com

# is run from site.

mkdir -p dist
git archive --format tar --output ${BUNDLE_PATH} master
 

scp ${BUNDLE_PATH} ${SSHHOST}:/home/node/site_bundles/${BUNDLE}
ssh ${SSHHOST} \'\'mkdir -p /home/node/site_bundles/site_${STAMP}\'\'
ssh ${SSHHOST} \'\'tar -C /home/node/site_bundles/site_${STAMP} -xf /home/node/site_bundles/${BUNDLE}\'\'

# now it is time for the local update script to take over.
ssh ${SSHHOST} \'\'sudo /home/node/site_bundles/site_${STAMP}/dev-bin/update.sh\'\'
