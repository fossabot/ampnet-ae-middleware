let enums = require('../../enums/enums.js')

exports.up = function(knex, Promise) {
    return knex.schema.createTable('transaction', function (table) {
        table.increments();
        table.string('hash').notNullable().unique();
        table.string('from_wallet');
        table.string('to_wallet');
        table.string('input', 400);
        table.enu('state', enums.txStateValues).notNullable();
        table.enu('supervisor_status', enums.supervisorStatusValues);
        table.enu('type', enums.txTypeValues);
        table.bigInteger('amount');
        table.string('wallet');
        table.enu('wallet_type', enums.walletTypeValues);
        table.timestamp('created_at', { useTz: true }).notNullable();
        table.timestamp('processed_at', { useTz: true });
        table.string('error_message')
      });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('transaction');
};
