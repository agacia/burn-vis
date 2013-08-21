
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('burn', { title: 'BURN THE WORLD' });
};