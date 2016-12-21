var map;
var marker;
var center;
var fill = [];

function markHere(coordinates, infowindow, title){
  var marker = new google.maps.Marker({
    position: coordinates,
    map: map,
    title: title
  });

  marker.addListener('click', function(){
  	infowindow.open(map, marker);
  });
}

function centerHere(latitude, longitude){
	var center = new google.maps.LatLng(latitude, longitude);
	map.panTo(center);
}

function initMap(initlat, initlng) {
  map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 41.0821, lng: -74.1746},
      zoom: 8
  });
}

function refreshPage(){
  window.location.reload();
}

$(document).ready(function(){
  var latitude;
  var longitude;
  var infowindow;
  var info;
  var title;
  var id;

  var initlat = $(".coorlat").text();
  var initlng = $(".coorlng").text();

  initlat = parseFloat(initlat);
  initlng = parseFloat(initlng);
  centerHere(initlat, initlng);

	$(".row").each(function(){

		latitude = $(this).find("#lat").text();
		longitude = $(this).find("#lng").text();

		latitude = parseFloat(latitude);
		longitude = parseFloat(longitude);

		var coordinates = {lat: latitude, lng: longitude};

		info = $(this).find('td').text();
		title = $(this).find('#first').text() + $(this).find('#last').text();

	 	infowindow = new google.maps.InfoWindow({
			content: info
		});

		markHere(coordinates, infowindow, title);
	});

	$("body").on("click", ".row", function(){
			latitude = $(this).find('#lat').text();
			longitude = $(this).find('#lng').text();
			centerHere(latitude, longitude);
	});
  
	$("body").on("click", "button", function(){
    if($(this).attr("id") == "Delete"){
		  var data = {"_id": $(this).val()};
		  console.log(data);
		  $.ajax({
    		type: "post",
    		url: "delete",
    		data: data
		  });
    }
	});

  $("body").on("keyup", "#search", function(){
    var first = $("body").find("[name = 'firstsearch']").val();
    var last = $("body").find("[name = 'lastsearch']").val();
    var query = first + " " + last;
    query = $.trim(query).replace(/ +/g, ' ').toLowerCase();

    $(".row").show().filter(function() {
      var names = $(this).find("#first").text() + $(this).find("#last").text();
      var text = names.replace(/\s+/g, ' ').toLowerCase();
      return !~text.indexOf(query);
    }).hide();

  });

});
