require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const session = require("express-session");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());

app.use(express.static("public"));

// Atualizando a conexão com o MongoDB, removendo as opções depreciação
mongoose.connect(process.env.DB_URL)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB', err));

// Configurando a sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,  // Evita o aviso do express-session
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// Configurando o ambiente Nunjucks
const env = nunjucks.configure(path.resolve(__dirname, "views"), {
  watch: true,
  express: app,
  autoescape: true,
});

// Adicionando o filtro 'currency'
env.addFilter('currency', function(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
});

app.set("view engine", "njk");
app.use(require("./routes"));

// Rota principal para verificar se a aplicação está funcionando
app.get("/", (req, res) => {
  res.send("Aplicação funcionando corretamente!");
});

// Iniciando o servidor
app.listen(process.env.PORT || 3001, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT || 3001}`);
});
