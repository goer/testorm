'use strict';

/**
 * Created by goer on 4/7/15.
 */

angular.module('myapp',['ui.bootstrap','ngRoute','js-data'])



    .config(['$routeProvider',
        function($routeProvider) {
            $routeProvider.
                when('/rooms', {
                    templateUrl: 'tpl/rooms.html',
                    controller: 'MainCtrl'
                }).
                when('/roomDetail/:roomId', {
                    templateUrl: 'tpl/roomDetail.html',
                    controller: 'RoomDetailCtrl'
                }).
                otherwise({
                    redirectTo: '/rooms'
                });
        }])

    .config(function (DSProvider) {
        DSProvider.defaults.basePath = 'http://localhost:2403/'; // etc.
    })

    .factory('Room', function (DS) {
        return DS.defineResource('room');
    })
    .factory('User', function (DS) {
        return DS.defineResource('user');
    })
    .factory('Message', function (DS) {
        return DS.defineResource('message');
    })
    .factory('RoomUser', function (DS) {
        return DS.defineResource({

                name: 'roomuser',
                relations: {
                    belongsTo: {
                        room : {
                            localKey: 'roomid',
                            localField: 'room',
                        }
                    }
                }

            }

        );
    })

    .controller('MainCtrl',function($scope, RoomUser,Room,User){


        function listRoomUsers() {
            RoomUser.findAll({userid:1},{bypassCache : true}).then(function (roomusers) {
                    $scope.roomusers = roomusers;
                });
        }

        listRoomUsers();

        $scope.addRoom = function () {

            Room.create({ name: $scope.roomName , userid : 1 }).then(function(room){
                RoomUser.create( { roomid: room.id, userid: 1, statusid: 0 }).then(function(roomuser){
                    listRoomUsers();
                })
            })


        };

        $scope.deleteRoom = function (roomuserId){

            RoomUser.destroy(roomuserId);
            listRoomUsers();

            console.log("deleteRoom done "+roomuserId);

        }


    })

    .controller('RoomDetailCtrl',function($scope,$routeParams, Room, Message){

        console.log("param: "+$routeParams.roomId);
        Room.find($routeParams.roomId)
            .then(function(room){
                $scope.room = room;
                console.log("Room id:"+$scope.room.id);
                listMessages();
            })


        function listMessages(){
            Message.findAll({ roomid : $scope.room.id },{bypassCache : true}).then(function (messages) {
                    $scope.messages = messages;
                });
        }



        $scope.addMessage = function(){

            Message.create({ roomid : $scope.room.id , content : $scope.newMessage , userid: 1  })
                .then(function(message){
                    listMessages();
                })
        }

        $scope.deleteMessage = function(messageId){

            Message.destroy(messageId);
            listMessages();

        }

    })
;