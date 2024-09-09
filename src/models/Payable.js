const mongoose = require('mongoose'); // ou Sequelize, caso esteja usando outro ORM

const PayableSchema = new mongoose.Schema({
  descricao: {
    type: String,
    required: true,
  },
  valor: {
    type: Number,
    required: true,
  },
  data_vencimento: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pendente', 'Paga'],
    default: 'Pendente',
  },
});

module.exports = mongoose.model('Payable', PayableSchema);
