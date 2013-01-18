
exports.run = function(db, callback) {
    db.run('alter table contexts add lastsk varchar(128) default null', callback);
}