'use strict';

/**
 * Created by goer on 4/7/15.
 */

angular.module('myapp',['restmod','ui.bootstrap','ngRoute','js-data'])



    .config(['$routeProvider',
        function($routeProvider) {
            $routeProvider.
                when('/rooms', {
                    templateUrl: 'tpl/rooms.html',
                    controller: 'MainCtrl'
                }).
                when('/roomDetail/:roomID', {
                    templateUrl: 'tpl/roomDetail.html',
                    controller: 'RoomDetailCtrl'
                }).
                otherwise({
                    redirectTo: '/rooms'
                });
        }])




    .config(['restmodProvider',function(restmodProvider){
        return restmodProvider.rebase({
            $config: {
                style: 'JimmyBakerStyle!'
            }
        })
    }])


    .factory('Room', function(restmod) {
        return restmod.model('http://127.0.0.1:2403/room');
    })

    .factory('Message', function(restmod) {
        return restmod.model('http://127.0.0.1:2403/message').mix({
            user: { belongsTo: 'User', key: 'userid' }, // default key would be 'owner_id'
            room: { belongsTo: 'Room', key: 'roomid' } // default key would be 'owner_id'
        });
    })

    .factory('User', function(restmod) {
        return restmod.model('http://127.0.0.1:2403/users');
    })

    .factory('RoomUser', function(restmod) {
        return restmod.model('http://127.0.0.1:2403/roomuser').mix({
            user: { belongsTo: 'User', key: 'userid' },
            room: { belongsTo: 'Room', key: 'roomid' }
        });
    })

    .factory('Owner', function() {
        return {
            id : 1,
            username : 'goer',
            password : 'goer1thea'
        }
    })

    .controller('MainCtrl',function($scope,Room,Owner,RoomUser){


        $scope.roomusers = RoomUser.$collection({ userid: Owner.id });
        $scope.roomusers.$refresh();

        $scope.addRoom = function () {

            var room = Room.$create({ name: $scope.roomName, userid : Owner.id });

            var roomuser = RoomUser.$create(
                    {   'roomid' : ""+room.id ,
                        "userid" : ""+Owner.id ,
                        'statusid' : '0'
                    });

            $scope.roomusers.$refresh();

        };


    })

    .controller('RoomDetailCtrl',function($scope,$routeParams,Room,Message,Owner,RoomUser){

        $scope.room = Room.$find($routeParams.roomID);
        $scope.room.$fetch();
        console.log("RoomDetail: "+$scope.room.id);

        $scope.messages = Message.$collection({ roomid :$routeParams.roomID });
        $scope.messages.$refresh();

        $scope.users = Message.$collection({ roomid :$routeParams.roomID });
        $scope.messages.$refresh();


        $scope.addMessage = function(){
            Message.$build(
                {   roomid : $routeParams.roomID ,
                    content : $scope.newMessage,
                    userid : Owner.id,
                }
            ).$save().$then(function(){

                    $scope.messages = Message.$collection({ roomid : $routeParams.roomID });
                    $scope.messages.$refresh();

                });

        }

    })
;