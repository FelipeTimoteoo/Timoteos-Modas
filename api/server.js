require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const nunjucks = require('nunjucks');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Serve static files from "public"
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Configuring sessions
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
  uri: process.env.DB_URL,
  collection: 'sessions',
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Configuring Nunjucks
const env = nunjucks.configure(path.resolve(__dirname, 'views'), {
  watch: true,
  express: app,
  autoescape: true,
});

// Adding currency filter
env.addFilter('currency', function(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
});

app.set('view engine', 'njk');
app.use(require('./routes'));

// Listen on the port from environment variable or default to 3001
app.listen(process.env.PORT || 3001, () => {
  console.log(`Server is running on port ${process.env.PORT || 3001}`);
});
