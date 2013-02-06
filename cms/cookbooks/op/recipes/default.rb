
# some ppas
execute "apt-update" do
  command "apt-get update" 
  action :nothing
end

execute "add-node-js-ppa" do
  action :run
  command "add-apt-repository ppa:chris-lea/node.js"
  notifies :run, resources(:execute => "apt-update")
  only_if "test ! -f /etc/apt/sources.list.d/chris-lea-node_js-quantal.list"
end

execute "add-nginx-ppa" do
  action :run
  command "add-apt-repository ppa:nginx/stable"
  notifies :run, resources(:execute => "apt-update")
  only_if "test ! -f /etc/apt/sources.list.d/nginx-stable-quantal.list"
end

execute "add-node-user" do
  action :run
  command "sudo adduser --system --shell /bin/bash --gecos 'for running node.js apps' --group --disabled-password --home /home/node node"
  only_if "test ! -f /home/node"
end

# install the packages we want.
package 'python-software-properties'
package 'software-properties-common'
package 'sqlite3'
package 'libsqlite3-dev'
package 'nodejs'
package 'npm'
package 'nginx'

build_info = data_bag_item('build', 'build')
genassist_version = build_info["version"]
genassist_stamp = build_info["stamp"]

execute "copy-extracted-files" do
  action :run
  command "cp -Rf /opt/genassist/uploads/genassist-#{genassist_version}-#{genassist_stamp} /home/node/bundles/"
end

execute "npm-install" do
  action :run
  command "cd /home/node/bundles/genassist-#{genassist_version}-#{genassist_stamp} && npm install"
end

execute "npm-echonest" do
  action :run
  command "cd /home/node/bundles/genassist-#{genassist_version}-#{genassist_stamp}/node_modules/echonest && npm install && rake clean build dist"
  only_if "test -e /home/node/bundles/genassist-#{genassist_version}-#{genassist_stamp}/node_modules/echonest"
end

execute "chown-bundle" do
  action :run
  command "chown -R node:node /home/node/bundles/genassist-#{genassist_version}-#{genassist_stamp}"
end

service "genassist" do
   provider Chef::Provider::Service::Upstart
   supports :restart => true, :start => true, :stop => true
   action [:stop]
end

execute "unlink-old-bundle" do
  action :run
  command "sudo rm /home/node/genassist"
  only_if "test -e /home/node/genassist"
end

execute "link-bundle" do
  action :run
  command "sudo -u node ln -f -s /home/node/bundles/genassist-#{genassist_version}-#{genassist_stamp} /home/node/genassist"
  only_if "test ! -f /home/node/genassist"
end

# todo: hardlink (snapshot) existing database and cache directories.

execute "make-db-dir" do
  action :run
  command "sudo -u node mkdir /home/node/dbs"
  only_if "test ! -e /home/node/dbs"
end

execute "make-cache-dir" do
  action :run
  command "sudo -u node mkdir /home/node/cache"
  only_if "test ! -e /home/node/cache"
end

cookbook_file "/etc/nginx/sites-available/genassist" do
  source "nginx-genassist"
end

execute "link-nginx-config" do
  action :run
  command "sudo ln -s /etc/nginx/sites-available/genassist /etc/nginx/sites-enabled/genassist"
  only_if "test ! -e /etc/nginx/sites-enabled/genassist"
end

cookbook_file "/etc/init/genassist.conf" do
  source "upstart-genassist"
end

cookbook_file "/home/node/genassist_production_config.js" do
  action :create_if_missing
  mode 0755
  source "config.js"
end

service "genassist" do
   provider Chef::Provider::Service::Upstart
   supports :restart => true, :start => true, :stop => true
   action [:start]
end

cookbook_file "/etc/nginx/nginx.conf" do
  source "nginx.conf"
end

# restart nginx
service 'nginx' do
  action :restart
end

cron "new_album_poller" do
  minute "*/60"
  user "node"
  command "NODE_ENV=production /home/node/genassist/bin/new_album_loader.js -f /home/node/cache -d /home/node/dbs/albums.db >> /home/node/album_pull.log"
end

cron "backup_context_db" do
  hour "*/24"
  user "node"
  command "/home/node/genassist/bin/backup_db.sh /home/node/dbs/context.db /home/node/db_backups/context 30"
end

cron "backup_albums_db" do
  hour "*/24"
  user "node"
  command "/home/node/genassist/bin/backup_db.sh /home/node/dbs/albums.db /home/node/db_backups/album 30"
end
