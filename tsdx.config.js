module.exports = {
  rollup(config, options) {
    config.output.name = 'parseIngredient';
    config.output.exports = 'default';
    config.output.globals = { 'numeric-quantity': 'numericQuantity' };
    return config;
  },
};
