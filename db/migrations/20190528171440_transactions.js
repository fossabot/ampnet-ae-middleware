exports.up = function(knex, Promise) {
    return knex.schema.createTable('transaction', function (table) {
        table.increments();
        table.string('hash').notNullable().unique();
        table.string('from_wallet').notNullable();
        table.string('to_wallet').notNullable();
        table.string('input').notNullable();
        table.string('state').notNullable();
        table.string('type').notNullable();
        table.integer('amount');
        table.string('wallet');
        table.timestamp('created_at', { useTz: true }).notNullable();
        table.timestamp('processed_at', { useTz: true})
      });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('transaction');
};
