
exports.up = function(knex, Promise) {
    return knex.schema.createTable('transaction', function (table) {
        table.increments();
        table.string('hash').notNullable().unique();
      });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('transaction');
};
