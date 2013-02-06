#!/bin/bash

# Usage: ./deploy [host]

APP_VERSION=`./what_version.js ./data_bags/build info.json version`
STAMP=`./what_version.js ./data_bags/build info.json stamp`

host="${1:-gdusbabek@genassist}"
ssh-keygen -R "${host#*@}" 2> /dev/null

# copy most recent bundle to server.
scp ../dist/genassist-${APP_VERSION}-${STAMP}.tgz ${host}:/opt/genassist/uploads/

ssh_cmd='cd /opt/genassist/uploads'
ssh_cmd="${ssh_cmd} && sudo tar -xvzf genassist-${APP_VERSION}-${STAMP}.tgz"
ssh_cmd="${ssh_cmd} && sudo rm -rf genassist-${APP_VERSION}-${STAMP}"
ssh_cmd="${ssh_cmd} && sudo mv package genassist-${APP_VERSION}-${STAMP}"
ssh_cmd="${ssh_cmd} && sudo chown -R root:root genassist-${APP_VERSION}-${STAMP}"
ssh_cmd="${ssh_cmd} && sudo rm -rf ~/chef"
ssh_cmd="${ssh_cmd} && mkdir ~/chef"
ssh_cmd="${ssh_cmd} && cd ~/chef"
ssh_cmd="${ssh_cmd} && tar xj"
ssh_cmd="${ssh_cmd} && sudo bash install.sh ${APP_VERSION} ${STAMP}"

tar cj . | ssh -o 'StrictHostKeyChecking no' $host "${ssh_cmd}"


