/**
 * Created by goer on 4/7/15.
 */
var express = require('express')
    , app = express()
    , server = require('http').createServer(app)
    , io = require("socket.io").listen(server);


app.configure(function() {

    app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 8080);
    app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
    app.use(express.static(__dirname + '/public'));

    console.log("dirname:"+__dirname);

    app.set('view engine', "jade");
    app.engine('jade', require('jade').__express);
    app.set('views', __dirname + '/tpl');

    app.use(express.bodyParser());
    app.use(express.methodOverride());


});

app.get("/", function(req, res){
    res.render("page");
});

var Backbone = require('backbone');
var BackboneMongo = require('backbone-mongo');
var RestController = require('backbone-rest');

var mongoURL = 'mongodb://' + (process.env.OPENSHIFT_MONGODB_DB_HOST || 'localhost') + ':' + ( parseInt(process.env.OPENSHIFT_MONGODB_DB_PORT) || '' ) ;
console.log("monggoURL: "+mongoURL);

var Room = Backbone.Model.extend({
    urlRoot: mongoURL + '/room',
});
Room.prototype.sync = BackboneMongo.sync(Room);
new RestController(app, {model_type: Room, route: '/api/room'});

var Message = Backbone.Model.extend({
    urlRoot: mongoURL + '/message',
});
Message.prototype.sync = BackboneMongo.sync(Message);
new RestController(app, {model_type: Message, route: '/api/message'});


var User = Backbone.Model.extend({
    urlRoot: mongoURL + '/user',
});
User.prototype.sync = BackboneMongo.sync(Message);
new RestController(app, {model_type: User, route: '/api/user'});


server.listen(app.get('port'), app.get('ipaddr'), function(){
    console.log('Express server listening on  IP: ' + app.get('ipaddr') + ' and port ' + app.get('port'));
});