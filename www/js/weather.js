var data = [];//window.mockWeather;
var tomorrow = false;

function loadDataAndRender() {
	navigator.geolocation.getCurrentPosition(function (pos) {
		var api_key = '69a81ffc5608e547610d70c8b746a4eb';
		var tstamp = Math.floor(new Date().getTime() / 1000 / 86400) * 86400 + (tomorrow ? 86400 : 0);
		var url = 'https://api.forecast.io/forecast/' + api_key + '/' + pos.coords.latitude + ',' + pos.coords.longitude + ',' + tstamp + '?units=si&lang=sv&callback=weather_callback';
		$jsonp.send(url, {
			callbackName: 'weather_callback',
			onSuccess: function (forecast) {
				data = forecast.hourly.data;
				window.weather = data;
				renderDay();
			},
			onTimeout: function () {
				data = [];
				renderDay();
			},
			timeout: 5
		});
	});
}

function init() {
	if(data.length == 0) {
		loadDataAndRender();
	} else {
		renderDay();
	}
}

var switchDay = function() {
	tomorrow = !tomorrow;
	loadDataAndRender();
};
window.switchDay = switchDay;

if(window.cordova) {
	document.addEventListener("deviceready", function() {
		init();
		document.addEventListener("pause", function() {
			data = [];
			renderDay();
		}, false);
		document.addEventListener("resume", function() {
			loadDataAndRender();
		}, false);
	}, false);
} else {
	init();
}

var backgroundColumns = function(n, first, width, height) {
	var bg = new Path.Rectangle(0, 0, width + 1, height);
	bg.fillColor = n % 2 == 0 ? '#080808' : '#0D0D0D';
	if(n < first) bg.fillColor = n % 2 == 0 ? '#040404' : '#060606';
	return new Group({
		children: [bg],
		position: new Point(n * width, 0)
	}); 
};

var timeLabels = function(n, width, height) {
	var label = new PointText({
		point: [width / 2, height - 5],
		content: n,
		fillColor: 'white',
		fontFamily: 'Helvetica',
		justification: 'center',
		fontSize: (width / 2)
	});
	return new Group({
		children: [label],
		position: new Point(n * width, height / 2 - width / 3)
	}); 
};

var temperaturePath = function(width, height) {
	var group = new Group();
	var path = new Path();
	path.strokeColor = 'rgba(255,160,0,1)';
	path.strokeWidth = (width / 8);
	path.strokeCap = 'round';
	path.strokeJoin = 'round';
	var min_t = 1000, max_t = -1000;
	for(var i = 0; i < data.length; i++) {
		var item = data[i];
		var h = (new Date(item.time * 1000)).getHours();
		if(i > 0 && h == 0) break;
		var t = item.apparentTemperature;
		min_t = Math.min(t, min_t);
		max_t = Math.max(t, max_t);
	}
	var tempSteps = 5;
	min_t = Math.floor(min_t / tempSteps) * tempSteps;
	max_t = Math.floor((max_t + tempSteps - 0.1) / tempSteps) * tempSteps;
	var span_t = max_t - min_t;
	for(var i = 0; i < data.length; i++) {
		var item = data[i];
		var h = (new Date(item.time * 1000)).getHours();
		if(i > 0 && h == 0) break;
		var t = item.apparentTemperature;
		var ty = Math.floor((t - min_t) / span_t * height);
		path.add(new Point(h * width, height / 2 - ty));
	}
	path.smooth();
	group.addChild(path);
	
	var offset = Math.max(1, Math.floor(span_t / 5));
	for(t = min_t + offset; t <= max_t - offset; t += offset) {
		var ty = height / 2 - Math.floor((t - min_t) / span_t * height);
		var line = new Path.Line(new Point(-width, ty), new Point(view.size.width, ty));
		line.strokeColor = 'rgba(255,160,0,0.25)';
		group.addChild(line);
		
		var label = new PointText({
			point: [-width / 3, ty + width / 2],
			content: t + ' °C',
			fillColor: 'rgba(255,160,0,0.75)',
			fontFamily: 'Helvetica',
			justification: 'left',
			fontSize: (width / 2)
		});
		group.addChild(label);
	}
	
	return group;
};

var windSpeedPath = function(width, height) {
	var group = new Group();
	var path = new Path();
	path.strokeColor = 'rgba(128,128,128,1)';
	path.strokeWidth = (width / 16);
	path.strokeCap = 'round';
	path.strokeJoin = 'round';
	var min_t = 1000, max_t = -1000;
	for(var i = 0; i < data.length; i++) {
		var item = data[i];
		var h = (new Date(item.time * 1000)).getHours();
		if(i > 0 && h == 0) break;
		var t = item.windSpeed;
		min_t = Math.min(t, min_t);
		max_t = Math.max(t, max_t);
	}
	min_t = 0;
	max_t = Math.floor((max_t + 10 - 0.1) / 10) * 10;
	var span_t = max_t - min_t;
	for(var i = 0; i < data.length; i++) {
		var item = data[i];
		var h = (new Date(item.time * 1000)).getHours();
		if(i > 0 && h == 0) break;
		var t = item.windSpeed;
		var ty = Math.floor((t - min_t) / span_t * height);
		path.add(new Point(h * width, height / 2 - ty));
	}
	path.smooth();
	group.addChild(path);
	var label = new PointText({
		point: [-width / 3, -height / 2 + width / 1.5],
		content: max_t + ' m/s',
		fillColor: 'rgba(128,128,128,0.75)',
		fontFamily: 'Helvetica',
		justification: 'left',
		fontSize: (width / 2)
	});
	group.addChild(label);
	return group;
};

var precColumns = function(width, height) {
	var cols = new Group();
	for(var i = 0; i < data.length; i++) {
		var item = data[i];
		var h = (new Date(item.time * 1000)).getHours();
		if(i > 0 && h == 0) break;
		var prop = item.precipProbability;
		var prec = item.precipIntensity;
		var p = prec / 4;
		var h2 = height - width * 1.5;
		var col = new Path.Rectangle(-width * 1.5 / 5 + h * width, h2 / 2, width * 3 / 5, -h2 * p);
		col.fillColor = 'rgba(0,0,96,' + prop + ')';
		cols.addChild(col);
	}
	return cols;
};

var cloudArea = function(width, height) {
	var path = new Path();
	path.strokeWidth = 0;
	path.fillColor = 'rgba(160,160,160,0.1)';
	var first_x, first_y, last_x, last_y;
	for(var i = 0; i < data.length; i++) {
		var item = data[i];
		var h = (new Date(item.time * 1000)).getHours();
		if(i > 0 && h == 0) break;
		var c = item.cloudCover;
		var dx = 0;
		if(i == 0) dx = -width / 2;
		last_x = h * width + dx;
		var h2 = height - width * 1.5;
		last_y = h2 / 2 - c * h2;
		if(i == 0) {
			first_x = last_x;
			first_y = last_y;
		}
		path.add(new Point(last_x, last_y));
	}
	path.removeSegment(path.segments.length - 1);
	path.add(new Point(last_x + width / 2, last_y));
	path.smooth();
	path.add(new Point(last_x + width / 2, height / 2));
	path.add(new Point(first_x, height / 2));
	path.add(new Point(first_x, first_y));
	return path;
};

var renderDay = function() {
	document.getElementById('day').innerHTML = tomorrow ? 'Tomorrow' : 'Today';
	var day = new Group();
	var numHours = 24;
	var width = view.size.width / numHours;
	var height = view.size.height;
	var first = data.length == 0 ? -1 : (new Date(data[0].time * 1000)).getHours();
	for(var i = 0; i < numHours; i++) {
		var slot = backgroundColumns(i, first, width, height);
		day.addChild(slot);
	}
	if(data.length > 0) {
		var prec = precColumns(width, height);
		day.addChild(prec);
		var cloud = cloudArea(width, height);
		day.addChild(cloud);
		var wind = windSpeedPath(width, height);
		day.addChild(wind);
		var temp = temperaturePath(width, height);
		day.addChild(temp);
		for(var i = 0; i < numHours; i++) {
			var labels = timeLabels(i, width, height);
			day.addChild(labels);
		}
	}
	day.position = view.center;
}

function onFrame(event) {
}

function onResize(event) {
	renderDay();
}