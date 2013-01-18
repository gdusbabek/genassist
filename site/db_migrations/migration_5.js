
exports.run = function(db, callback) {
    db.run('alter table contexts add lastuser varchar(256) default null', callback);
}