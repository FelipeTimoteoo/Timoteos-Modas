const moment = require('moment');
const Cart = require('../lib/cart');
const Product = require('../models/Product'); // Verifique este caminho
const formatCurrency = require('../lib/formatCurrency');
const Seller = require('../models/Seller');

class CartController {
  async index(req, res) {
    const filters = {};
    const { change } = req.body;

    // Buscar os vendedores
    const sellers = await Seller.find();

    if (req.body.nome) {
      filters.nome = new RegExp(req.body.nome, 'i');
      let products = await Product.find({ name: filters.nome });
      if (!products.length) {
        console.log('No products found with name:', req.body.nome);
      }
      products = await Promise.all(products.map(async (product) => {
        product.formattedExpirationDate = moment(product.expirationDate).format('DD-MM-YYYY');
        return product;
      }));

      let { cart } = req.session;
      cart = Cart.init(cart);

      // Remove referência a produtos variados
      cart.totalproductsVariedFormated = '';

      return res.render('cart/list', {
        cart,
        products,
        sellers,
      });
    }

    if (req.body.searchBarcode) {
      let products = await Product.find({ barcode: req.body.searchBarcode });
      if (!products.length) {
        console.log('No products found with barcode:', req.body.searchBarcode);
      }
      products = await Promise.all(products.map(async (product) => {
        product.formattedExpirationDate = moment(product.expirationDate).format('DD-MM-YYYY');
        product.formattedSalePrice = formatCurrency.brl(product.salePrice);
        return product;
      }));

      let { cart } = req.session;
      cart = Cart.init(cart);

      // Remove referência a produtos variados
      cart.totalproductsVariedFormated = '';

      return res.render('cart/list', {
        cart,
        products,
        sellers,
      });
    }

    let { cart } = req.session;
    cart = Cart.init(cart);

    cart.items.map((item) => {
      item.formattedPrice = formatCurrency.brl(item.price);
    });

    cart.total.formattedPrice = formatCurrency.brl(cart.total.price);

    // Remove referência a produtos variados
    cart.productsVariedValues = [];
    cart.totalproductsVariedFormated = '';

    const changeFormate = change ? formatCurrency.brl(change - cart.total.price) : formatCurrency.brl(0);

    return res.render('cart/list', {
      cart,
      changeFormate,
      change,
      sellers,
    });
  }

  async addOne(req, res) {
    let { searchBarcode, addValue } = req.body;
    const { id } = req.params;

    if (!addValue) addValue = 0;

    let product;
    if (searchBarcode) {
      product = await Product.findOne({ barcode: searchBarcode });
    } else if (id) {
      product = await Product.findById(id);
    }

    if (!product) {
      console.log('Product not found with barcode:', searchBarcode, 'or id:', id);
      return res.redirect('/cart');
    }

    const quantity = req.body.quantity || 1;

    let { cart } = req.session;
    cart = Cart.init(cart).addOne({
      product: [product],
      quantity,
      addValue,
    });

    req.session.cart = cart;

    return res.redirect('/cart');
  }

  async removeOne(req, res) {
    const { id } = req.params;
    let { cart } = req.session;

    if (!cart) return res.redirect('/cart');

    cart = Cart.init(cart).removeOne(id);
    req.session.cart = cart;

    return res.redirect('/cart');
  }

  async delete(req, res) {
    const { id } = req.params;
    let { cart } = req.session;

    if (!cart) return res.redirect('/cart');

    cart = Cart.init(cart).delete({
      id,
    });

    req.session.cart = cart;

    return res.redirect('/cart');
  }
}

module.exports = new CartController();
