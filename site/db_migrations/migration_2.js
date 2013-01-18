
exports.run = function(db, callback) {
    db.run('drop table test_migration', callback);
}