const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// In the src/dishes/dishes.controller.js file, add handlers and
// middleware functions to create, read, update, and list dishes.
// Note that dishes cannot be deleted.

// CREATE (post)
// Checking dish data for name, description and image
// Dish has price && > 0

function checkingDishData(propertyInfo) {
  return (req, res, next) => {
    const { data = {} } = req.body;
    const value = data[propertyInfo];

    if (value) {
      return next();
    }

    next({ status: 400, message: `Dish must include a(n) ${propertyInfo}` });
  };
}

const hasDishName = checkingDishData("name");
const hasDishDescription = checkingDishData("description");
const hasDishImage = checkingDishData("image_url");

function priceIsGreaterThanZero(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (Number.isInteger(price) && price > 0) {
    return next();
  }
  // price must be an integer
  next({
    status: 400,
    message: "Dish must have a price that is an integer greater than 0",
  });
}

function routeIdMatchesBodyId(req, res, next) {
  const dishId = req.params.dishId;
  const { id } = req.body.data;
  if (!id || id === dishId) {
    return next();
  }

  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

function create(req, res) {
  const dish = req.body.data;
  dish.id = nextId();
  dishes.push(dish);
  res.status(201).json({ data: dish });
}

// DELETE
function destroy(req, res) {
  const index = dishes.findIndex((dish) => dish.id === res.locals.dish);
  dishes.splice(index, 1);
  res.sendStatus(204);
}

function dishIdExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDishId = dishes.find((dish) => dish.id === dishId);
  if (foundDishId) {
    res.locals.dish = foundDishId;
    return next();
  }
  next({
    status: 404,
    message: `Dish not found by dishId: ${req.params.dishId}}`,
  });
}

// LIST (get) all dishes
function list(req, res) {
  res.json({ data: dishes });
}

// READ
function read(req, res) {
  res.json({ data: res.locals.dish });
}

// UPDATE
function update(req, res) {
  const { id } = res.locals.dish;
  Object.assign(res.locals.dish, req.body.data, { id });
  res.json({ data: res.locals.dish });
}

module.exports = {
  create: [
    hasDishName,
    hasDishDescription,
    priceIsGreaterThanZero,
    hasDishImage,
    create,
  ],
  delete: [dishIdExists, destroy],
  list,
  read: [dishIdExists, read],
  update: [
    dishIdExists,
    routeIdMatchesBodyId,
    hasDishName,
    hasDishDescription,
    priceIsGreaterThanZero,
    hasDishImage,
    update,
  ],
};
