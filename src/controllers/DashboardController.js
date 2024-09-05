const Sale = require('../models/Sale');
const ProductSold = require('../models/ProductSold');
const Seller = require('../models/Seller');

class DashboardController {
  async index(req, res) {
    // Agregando dados
    const totalSales = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$sale.total' },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    const topProducts = await ProductSold.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productId',
          totalSold: { $sum: '$products.amount' },
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    const topSellers = await Seller.aggregate([
      {
        $lookup: {
          from: 'sales',
          localField: '_id',
          foreignField: 'seller',
          as: 'sales'
        }
      },
      {
        $project: {
          name: 1,
          totalSales: { $size: '$sales' },
          totalRevenue: { $sum: '$sales.sale.total' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    // Garantir que os valores numéricos sejam mantidos para os gráficos
    const totalAmount = totalSales[0]?.totalAmount || 0;
    const totalCount = totalSales[0]?.totalCount || 0;

    // Preparar os dados para o template (gráficos e exibição)
    const formattedTotalSales = {
      totalAmount: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount),
      totalCount
    };

    // Não aplicar formatação para os valores usados nos gráficos
    const rawTopSellers = topSellers.map(seller => ({
      name: seller.name,
      totalRevenue: seller.totalRevenue || 0
    }));

    return res.render('dashboard/index', {
      totalSales: formattedTotalSales, // Exibição formatada
      topProducts,                      // Produtos para gráficos
      rawTopSellers,                    // Vendedores para gráficos
      formattedTopSellers: topSellers.map(seller => ({
        ...seller,
        totalRevenue: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(seller.totalRevenue || 0)
      })) // Exibição formatada dos vendedores
    });
  }
}

module.exports = new DashboardController();
