
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass


//Middleware:

//confirm order exists
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

// validate deliverTo property, mobile number, dish property, dish quantity and ID's for order
function validateOrder(req, res, next) {
  const { data = {} } = req.body;
  const { orderId } = req.params;

  if (!data.deliverTo) {
    next({ status: 400, message: "Order must include a deliverTo" });
  } else if (!data.mobileNumber) {
    next({ status: 400, message: "Order must include a mobileNumber" });
  } else if (
    !data.dishes ||
    !Array.isArray(data.dishes) ||
    !data.dishes.length
  ) {
    next({ status: 400, message: "Order must include a dish" });
  } else if (data.dishes) {
    if (Array.isArray(data.dishes) && data.dishes.length) {
      const dishes = data.dishes;
      dishes.forEach((dish, index) => {
        if (
          !dish.quantity ||
          dish.quantity <= 0 ||
          !Number.isInteger(dish.quantity)
        ) {
          next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0`,
          });
        }
      });
    }
  }
  if (data.id) {
    if (data.id !== orderId) {
      next({
        status: 400,
        message: `order id does not match route id. Order: ${data.id}, Route: ${orderId}`,
      });
    }
  }
  return next();
}
// validate order status
function validateStatus(req, res, next) {
  const { data = {} } = req.body;
  if (!data.status) {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  } else if (data.status === "delivered") {
    next({ status: 400, message: "A delivered order cannot be changed" });
  } else if (data.status === "invalid") {
    next({ status: 400, message: "status is invalid" });
  }
  next();
}

// check pending status for order
function statusPending(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

//Routes: 

// GET / LIST :
function list(req, res) {
  res.json({ data: orders });
}

// POST / CREATE:
function create(req, res) {
  const { data = {} } = req.body;
  const newOrder = {
    id: nextId(),
    ...data,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// GET / READ:
function read(req, res, next) {
  res.status(200).json({ data: res.locals.order });
}
// PUT / UPDATE:
function update(req, res, next) {
  const { data = {} } = req.body;
  data.id = res.locals.order.id;
  res.locals.order = data;

  res.json({ data: res.locals.order });
}

// DELETE / DESTROY: 
function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index > -1) {
    orders.splice(index, 1);
    return res.sendStatus(204);
  }
  next({
    status: 404,
    message: `${useId} does not exist`,
  });
}

module.exports = {
  list,
  create: [validateOrder, create],
  read: [orderExists, read],
  update: [orderExists, validateOrder, validateStatus, update],
  delete: [orderExists, statusPending, destroy],
};