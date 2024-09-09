const moment = require('moment');
const Payable = require('../models/Payable');
const Exit = require('../models/Exit'); // Modelo de Saídas

// Função para listar todas as contas a pagar
exports.listAllPayables = async (req, res) => {
  try {
    let payables = await Payable.find();

    // Formatar a data de vencimento com moment.js
    payables = payables.map(payable => {
      payable.data_vencimento = moment(payable.data_vencimento).format('DD/MM/YYYY');
      return payable;
    });

    res.render('payables/list', { payables });
  } catch (err) {
    res.status(500).send('Erro ao listar contas a pagar');
  }
};

// Função para criar uma nova conta a pagar
exports.createPayable = async (req, res) => {
  try {
    const { descricao, valor, data_vencimento } = req.body;
    
    // Criar uma nova conta a pagar
    const newPayable = new Payable({
      descricao,
      valor,
      data_vencimento,
    });
    
    await newPayable.save();
    res.redirect('/payables'); // Redireciona para a lista após a criação
  } catch (err) {
    res.status(500).send('Erro ao criar conta a pagar');
  }
};

// Função para dar baixa em uma conta (marcar como paga)
exports.payPayable = async (req, res) => {
  try {
    const payable = await Payable.findById(req.params.id);

    if (!payable) {
      return res.status(404).send('Conta não encontrada');
    }

    // Marcar a conta como paga
    payable.status = 'Paga';
    await payable.save();

    // Gerar uma saída automática usando o modelo Exit
    await Exit.create({
      descriptionExit: payable.descricao,
      value: payable.valor,
      date: new Date(), // Data da baixa
    });

    res.redirect('/payables'); // Redireciona após pagar
  } catch (err) {
    console.error("Erro ao pagar conta:", err);  // Log detalhado do erro
    res.status(500).send('Erro ao pagar conta');
  }
};

// Função para excluir uma conta a pagar
exports.deletePayable = async (req, res) => {
  try {
    const payable = await Payable.findById(req.params.id);

    if (!payable) {
      return res.status(404).send('Conta não encontrada');
    }

    // Se a conta está paga, remover a saída correspondente
    if (payable.status === 'Paga') {
      await Exit.findOneAndDelete({ descriptionExit: payable.descricao, value: payable.valor });
    }

    // Remover a conta a pagar
    await Payable.findByIdAndDelete(req.params.id);

    res.redirect('/payables'); // Redireciona após excluir
  } catch (err) {
    console.error("Erro ao excluir conta:", err);  // Log detalhado do erro
    res.status(500).send('Erro ao excluir conta');
  }
};
