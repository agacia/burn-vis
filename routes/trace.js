
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('trace', { title: 'BURN YOUR TRACE' });
};