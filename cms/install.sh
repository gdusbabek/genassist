#!/bin/bash

# this runs as root in /home/$user/chef (wherever deploy.sh copies it to)

chef_binary=/usr/local/bin/chef-solo
app_version=$1
stamp=$2


echo `whoami`
echo `pwd`
echo ${app_version}
echo ${stamp}

if ! test -f "$chef_binary"; then
  sudo apt-get -y update && \
  sudo apt-get -y upgrade && \
  sudo apt-get -y install ruby-full gem rake git-core make build-essential && \
  sudo /usr/bin/gem install chef ohai --no-rdoc --no-ri
fi

"$chef_binary" -c solo.rb -j solo.json