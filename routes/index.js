var express = require('express');
var hbs = require('hbs');
var router = express.Router();
var db = require('monk')('mongodb://localhost/dmshop');
var categories = require('../controllers/categories').sort(function(a,b) {
	return a.category.trim() > b.category.trim();
});
var pageLimit = 12;

hbs.registerHelper('inc', function(i) {
    return i + 1
});

/* GET home page. */
router.get('/', function(req, res, next) {
    //parse request data
    var category = parseInt(req.query.category) || 0;
    if (category < 0) category = 0;
    if (category > categories.length) category = categories.length;
    var search = req.query.search;

    //query products
    var products = db.get('products');
    var query = {};
    if (category > 0) {
        query['class_id'] = {
            '$in': categories[category - 1].classes
        }
    }
    if (search) {
    	query['name'] = {
    		'$regex': search,
    		'$options': 'i',
    	}
    }
    products.count(query, function(err, count) {
        if (count === 0) {
            return res.render('products', {
                categories: categories,
                category: category,
                products: [],
                currentPage: 0,
                totalPage: 0,
                itemCount: 0,
            });
        }
        var totalPage = Math.ceil(count / pageLimit);
        var pageNo = parseInt(req.query.page) || 1;
        if (pageNo < 1) pageNo = 1;
        if (pageNo > totalPage) pageNo = totalPage;

        products.find(query, {
            sort: {
                name: 1
            },
            limit: pageLimit,
            skip: (pageNo - 1) * pageLimit
        }, function(err, docs) {
            if (docs) {
                res.render('products', {
                	searchTerm: search,
                    categories: categories,
                    category: category,
                    products: docs,
                    currentPage: pageNo,
                    totalPage: totalPage,
                    itemCount: count,
                });

            }
        })
    });


});

module.exports = router;
