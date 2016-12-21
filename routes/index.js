var express = require('express');
var NodeGeocoder = require('node-geocoder');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = 'mongodb://localhost:27017/test';
var router = express.Router();
var $ = require('jquery');
var collection;
var lat = {};
var lng = {};
//Default value to center
var latlng = {"lat": 41.0821, "lng": -74.1746};
var options = {
	provider: "google",
	httpAdapter: 'https',
	apiKey: 'AIzaSyBctxFcG6gnLS7TcsT_lt_-Jzbp2niZsJQ',
	formatter: null
};
var geocoder = NodeGeocoder(options);
MongoClient.connect(url, function(err, db){
	if(err){
		console.log("Connection to Mongo failed");
		console.log(err);
	}
	else{
		console.log("Connection to Mongo successful");
		collection = db.collection('test3');
		collection.find().toArray(function(err, result){
			if(err){
				console.log(err);
			}
			else if(result.length){
				console.log(result.length + " values found");
			}
			else{
				console.log("No document(s) found!");
			}

		});
	}
});

var ensureLoggedin = function(req, res, next){
	if(req.user){
		next();
	}
	else{
		res.redirect("/login");
	}
}

var dist = function distance(lat1, lon1, lat2, lon2, unit) {
	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var theta = lon1-lon2
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	return dist
};

router.get('/', function(req, res, next){
	res.redirect('start');
});

router.get('/start', function(req, res, next){
	res.render('start', {})
});

router.post('/mailer', function(req, res, next){
	var data = req.body;

	var contact = data.contact;
	if(data.contact == 'Any' || data.contact == 'Email'){
		data.contact = "Yes";
	}
	else{
		data.contact = "No";
	}
	res.render('mailer', data);

	var address = data.street + " " + data.city + " " 
	+ data.state + " " + data.zip;

	geocoder.geocode(address, function(err, res){
		data.lat = res[0].latitude;
		data.lng = res[0].longitude;

		collection.insert(data);
	});

	data.contact = contact;

});

router.get('/login_success', ensureLoggedin, function(req, res){
	res.render('login_success', {});
});

router.get('/update', ensureLoggedin, function(req, res, next){
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	if(query._id == undefined){
		return;
	}
	query._id = ObjectId(query._id);
	collection.find(query).toArray(function(err, result){
		res.render('update', {collection: result});
	});
});

router.get('/contacts', ensureLoggedin, function(req, res, next){
	collection.find().toArray(function(err, result){
		res.render('contacts', {coordinates: latlng ,collection : result});
	});
});

router.post('/delete', ensureLoggedin, function(req, res, next){
	var data = req.body;

	data._id = ObjectId(data._id);
	collection.remove(data);
	collection.update(data, data);

	collection.find().toArray(function(err, result){
		res.render('contacts', {coordinates: latlng, collection : result});
	});

});

router.post('/update', ensureLoggedin, function(req, res, next){
	var data = req.body;
	
	var contact = data.contact;
	data._id = ObjectId(data._id);
	var id = {"_id" : data._id};

	if(data.contact == 'Any' || data.contact == 'Email'){
		data.contact = "Yes";
	}
	else{
		data.contact = "No";
	}

	var address = data.street + " " + data.city + " " 
	+ data.state + " " + data.zip;

    geocoder.geocode(address, function(err, res){
        data.lat = res[0].latitude;
        data.lng = res[0].longitude;
        collection.update(id,data);

    });

    res.render('submission_success');

    data.contact = contact;

});

router.post('/search', function(req, res, next){
	var searchquery = req.body.address;
	var latlng = {};
	var radius = req.body.radius;
	var points = [];

	//If user just clicks search, just return
	if(searchquery == 0){
		return;
	}
	//If nothing is within radius, were gonna send nothing back.
	var empty_points = [{
		_id: null,
		title: null,
		first: null,
		last: null,
		street: null,
		city: null,
		state: null,
		zip: null, 
		phone: null,
		email: null,
		contact: null,
		lat: null,
		lng: null
	}];

	geocoder.geocode(searchquery, function(err, response){
		lat = response[0].latitude;
		lng = response[0].longitude;
		latlng = {"lat": lat, "lng": lng};
		collection.find().toArray(function(err, result){
			for(var i = 0; i < result.length; i++){
				var distance = dist(lat, lng, result[i].lat, result[i].lng);
				if(distance <= radius){
					points.push(result[i]);
				}
			}
			//If we dont find points within the radius
			//Render nothing!
			if(points.length == 0){
				res.render('contacts', {coordinates: latlng, collection: empty_points});
				return;
			}
			res.render('contacts', {coordinates: latlng ,collection: points});
		});
	});


});

router.post('/searchname', function(req, res, next){
	var name = req.body;
	console.log(name);
});

module.exports = router;
