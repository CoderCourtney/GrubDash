const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// In the src/orders/orders.controller.js file, add handlers and
// middleware functions to create, read, update, delete, and list orders.

// Anytime you need to assign a new id to an order or dish,
// use the nextId function exported from src/utils/nextId.js

// CREATE 
function checkingOrderData(propertyOrderInfo) {
  return (req, res, next) => {
    const orderValue = req.body.data[propertyOrderInfo];

    if (orderValue) {
      return next();
    }

    next({ status: 400, message: `Order must include a ${propertyOrderInfo}` });
  };
}

const hasDeliverTo = checkingOrderData("deliverTo");
const hasMobileNumber = checkingOrderData("mobileNumber");
const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];

function hasValidStatus(req, res, next) {
  const { data = {} } = req.body;
  const status = data.status;
  if (validStatuses.includes(status)) {
    return next();
  }

  next({
    status: 400,
    message: `Order must have a status of ${validStatuses}`,
  });
}

function hasDish(req, res, next) {
  const { data = {} } = req.body;
  const dishes = data.dishes;
  if (dishes && Array.isArray(dishes) && dishes.length) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include at least one dish",
  });
}

function dishQuantity(req, res, next) {
  const { data = {} } = req.body;
  const message = data.dishes
    .map((dish, index) =>
      dish.quantity && Number.isInteger(dish.quantity)
        ? null
        : `Dish ${index} must have a quantity that is an integer greater than 0`
    )
    .filter((errorMessage) => errorMessage !== null)
    .join(",");
  if (message) {
    return next({ status: 400, message });
  }
  next();
}

function routeIdMatchesBodyId(req, res, next) {
  const dishId = req.params.orderId;
  const { id } = req.body.data;
  if (!id || id === dishId) {
    return next();
  }

  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${dishId}`,
  });
}

function create(req, res) {
  const order = req.body.data;
  order.id = nextId();
  order.status = "pending";
  orders.push(order);
  res.status(201).json({ data: order });
}

// DELETE
function destroy(req, res) {
  const index = orders.findIndex((order) => order.id === res.locals.order);
  orders.splice(index, 1);
  res.sendStatus(204);
}

// LIST
function list(req, res) {
  res.json({ data: orders });
}

// READ
function read(req, res) {
  res.json({ data: res.locals.order });
}

// UPDATE
function isNotDelivered(req, res, next) {
  if (res.locals.order.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

function isPending(req, res, next) {
  if (res.locals.order.status === "pending") {
    return next();
  }
  return next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}

function orderIdExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrderId = orders.find((order) => order.id === orderId);
  if (foundOrderId) {
    res.locals.order = foundOrderId;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${req.params.orderId}}`,
  });
}

function update(req, res) {
  const { id } = res.locals.order;
  Object.assign(res.locals.order, req.body.data, { id });
  res.json({ data: res.locals.order });
}

module.exports = {
  create: [hasDeliverTo, hasMobileNumber, hasDish, dishQuantity, create],
  delete: [orderIdExists, isPending, destroy],
  list,
  read: [orderIdExists, read],
  update: [
    orderIdExists,
    routeIdMatchesBodyId,
    hasValidStatus,
    isNotDelivered,
    hasDeliverTo,
    hasMobileNumber,
    hasDish,
    dishQuantity,
    update,
  ],
};
