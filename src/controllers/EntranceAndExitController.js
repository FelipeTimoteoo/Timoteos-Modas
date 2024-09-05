const moment = require("moment");
const Entrance = require("../models/Entrance");
const Exit = require("../models/Exit");
const formatCurrency = require("../lib/formatCurrency");

class EntranceAndExitController {
  async index(req, res) {
    // Remove a verificação de permissão de administrador
     const userLogged = req.session.userId;
    
     if(userLogged.type !== "ADMIN") {
       return res.render("notPermission/index");
     }
    
    let items = {
      entrances: [],
      exits: [],
      totalEntrance: 0,
      totalExit: 0,
      balance: 0,
    };

    const filtersEntrance = {};
    const filtersExit = {};

    const { startDate, finalDate } = req.body;

    let dateFilter = false;

    if (startDate || finalDate) {
      dateFilter = true;

      filtersEntrance.createdAt = {};
      filtersExit.date = {};

      const startDateFormatted = moment(req.body.startDate).format(
        "YYYY-MM-DDT00:mm:ss.SSSZ"
      );

      const finalDateFormatted = moment(req.body.finalDate).format(
        "YYYY-MM-DDT23:59:ss.SSSZ"
      );

      filtersEntrance.createdAt.$gte = startDateFormatted;
      filtersEntrance.createdAt.$lte = finalDateFormatted;

      filtersExit.date.$gte = startDateFormatted;
      filtersExit.date.$lte = finalDateFormatted;
    }

    let entrances = await Entrance.paginate(filtersEntrance, {
      page: req.query.page || 1,
      limit: parseInt(req.query.limit_page) || 2000,
      sort: "-createdAt",
    });

    let exits = await Exit.paginate(filtersExit, {
      page: req.query.page || 1,
      limit: parseInt(req.query.limit_page) || 2000,
      sort: "-date",
    });

    if (!startDate || !finalDate) {
      entrances = entrances.docs.map((entrance) => {
        if (moment(entrance.createdAt).month() === moment(Date.now()).month()) {
          return entrance;
        }
      });

      exits = exits.docs.map((exit) => {
        if (moment(exit.date).month() === moment(Date.now()).month()) {
          return exit;
        }
      });
    }

    if (!startDate || !finalDate) {
      entrances.map((entrance) => {
        if (entrance) {
          items.entrances.push(entrance);
          items.totalEntrance += entrance.value;
        }
      });

      exits.map((exit) => {
        if (exit) {
          items.exits.push(exit);
          items.totalExit += exit.value;
        }
      });
    } else {
      entrances.docs.map((entrance) => {
        if (entrance) {
          items.entrances.push(entrance);
          items.totalEntrance += entrance.value;
        }
      });

      exits.docs.map((exit) => {
        if (exit) {
          items.exits.push(exit);
          items.totalExit += exit.value;
        }
      });
    }

    items.balance = items.totalEntrance - items.totalExit;

    return res.render("entranceandexitdatails/list", {
      totalEntrance: formatCurrency.brl(items.totalEntrance),
      totalExit: formatCurrency.brl(items.totalExit),
      balance: formatCurrency.brl(items.balance),
      dateFilter: dateFilter,
      startDate,
      finalDate,
    });
  }
}

module.exports = new EntranceAndExitController();
