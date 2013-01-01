#!/bin/bash

DIR="$( cd -P "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DIR=`dirname ${DIR}`

echo using upgrade dir $DIR
ln -f -s ${DIR} /home/gdusbabek/site
sudo ln -f -s ${DIR}/conf/nginx-site /etc/nginx/sites-enabled/genassist

# npm install
cd $DIR
npm install

# node and nginx
sudo stop genassist
sudo touch /var/log/genassist.log
sudo chmod +x ${DIR}/conf/upstart-genassist
sudo ln -f -s ${DIR}/conf/upstart-genassist /etc/init/genassist.conf
sudo start genassist
sudo /etc/init.d/nginx restart

echo Successfully updated.