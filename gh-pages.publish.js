var ghpages = require('gh-pages');

ghpages.publish('demo', function(err) {
  if (err) {
    console.log('Failed to publish');
  }
});
