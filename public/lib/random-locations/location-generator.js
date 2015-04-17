//http://gis.stackexchange.com/questions/25877/how-to-generate-random-locations-nearby-my-location

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.LocationGenerator = factory();
  }
}(this, function () {

    function Random () {
    }

    Random.prototype.nextvar = function () {
    	return Math.random();
    }

    function LocationGenerator () {
        this.random = new Random();
    }

    LocationGenerator.prototype.nextLocation = function (x0, y0, radius) {

        // Convert radius from meters to degrees
        var radiusInDegrees = radius / 111000;

        var u = this.random.nextvar();
        var v = this.random.nextvar();
        var w = radiusInDegrees * Math.sqrt(u);
        var t = 2 * Math.PI * v;
        var x = w * Math.cos(t);
        var y = w * Math.sin(t);

        // Adjust the x-coordinate for the shrinking of the east-west distances
        var new_x = x / Math.cos(y0);

        var foundLongitude = new_x + x0;
        var foundLatitude = y + y0;
        return [foundLatitude, foundLongitude];
    }

    return LocationGenerator;
}));