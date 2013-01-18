
exports.run = function(db, callback) {
    db.run('create table test_migration (test int)', callback);
}