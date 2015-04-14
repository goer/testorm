'use strict';

/**
 * Created by goer on 4/7/15.
 */

angular.module('myapp', ['ui.bootstrap', 'js-data', 'ui.router','ncy-angular-breadcrumb'])


    .config(function ($stateProvider, $urlRouterProvider) {

        //$urlRouterProvider.otherwise('/rooms');

        $stateProvider
        
            .state('rooms', {
                url: "/rooms",
                views : {
                    'main' : {
                        templateUrl: "tpl/rooms.html",
                        controller: 'MainCtrl',
                    }
                },

            })
            .state('roomDetail', {
                url: "/roomDetail/:roomId",
                views : {
                    'main' : {
                        templateUrl: 'tpl/roomDetail.html',
                        controller: 'RoomDetailCtrl',
                    }
                },

            })
            .state('friends', {
                url: "/friends/:userId",
                views : {
                    'main' : {
                        templateUrl: 'tpl/friends.html',
                        controller: 'FriendsCtrl',
                    }
                },

            })


    })


    .config(function (DSProvider) {
        DSProvider.defaults.basePath = 'http://localhost:2403/'; // etc.
    })

    .factory('Room', function (DS) {
        return DS.defineResource('room');
    })
    .factory('User', function (DS) {
        return DS.defineResource('users');
    })
    .factory('UserRelation', function (DS) {
        return DS.defineResource('userrelation');
    })
    .factory('Message', function (DS) {
        return DS.defineResource('message');
    })
    .factory('RoomUser', function (DS) {
        return DS.defineResource({

                name: 'roomuser',
                relations: {
                    belongsTo: {
                        room: {
                            localKey: 'roomid',
                            localField: 'room'
                        }
                    }
                }

            }
        );
    })

    .factory('RoomUserList', function (RoomUser, Room) {
        return {

            list: function ($scope) {
                RoomUser.findAll({userid: 1}, {bypassCache: true}).then(function (roomusers) {

                    $scope.roomusers = roomusers;

                    $scope.rooms = [];
                    for (var i = 0; i < $scope.roomusers.length; i++) {
                        Room.find($scope.roomusers[i].roomid).then(function (room) {
                            $scope.rooms.push(room);
                        })
                    }


                });
            }

        }
    })
    .controller('MainCtrl', function ($scope, $modal, RoomUser, Room, User, Message, RoomUserList) {

       

        function listRoomUsers() {
            RoomUser.findAll({userid: 1}, {bypassCache: true}).then(function (roomusers) {

                $scope.roomusers = roomusers;

                $scope.rooms = [];
                for (var i = 0; i < $scope.roomusers.length; i++) {
                    Room.find($scope.roomusers[i].roomid).then(function (room) {
                        $scope.rooms.push(room);
                    })
                }


            });
        }

        listRoomUsers();


        var AddRoomCtrl = function ($scope, $modalInstance) {


            $scope.done = function () {
                Room.create({name: $scope.roomName, userid: 1}).then(function (room) {
                    RoomUser.create({roomid: room.id, userid: 1, statusid: 0}).then(function (roomuser) {
                        listRoomUsers();
                        $modalInstance.dismiss();
                    })
                })


            }

            $scope.cancel = function () {
                $modalInstance.dismiss();

            }


        };

        $scope.addRoom = function () {

            var modalInstance = $modal.open({
                templateUrl: 'addRoom.html',
                resolve: {
                    roomName: function () {
                        return $scope.roomName;
                    }
                },
                controller: AddRoomCtrl
            });
        };

        $scope.deleteRoom = function (roomId) {

            Room.destroy(roomId);
            RoomUser.findAll({roomid: roomId}).then(function (roomuser) {
                RoomUser.destroy(roomuser.id);
                Message.findAll({roomid: roomId}).then(function (message) {
                    Message.destroy(message.id);
                })
                listRoomUsers();
            })


            console.log("deleteRoom done " + roomId);

        }


    })

    .controller('RoomDetailCtrl', function ($scope, $modal, $stateParams, Room, Message) {


        console.log("param: " + $stateParams.roomId);
        Room.find($stateParams.roomId)
            .then(function (room) {
                $scope.room = room;
                console.log("Room id:" + $scope.room.id);
                listMessages();
            })


        function listMessages() {
            Message.findAll({roomid: $scope.room.id}, {bypassCache: true}).then(function (messages) {
                $scope.messages = messages;
            });
        }


        $scope.addMessage = function () {

            Message.create({roomid: $scope.room.id, content: $scope.newMessage, userid: 1})
                .then(function (message) {
                    listMessages();
                })
        }

        $scope.deleteMessage = function (messageId) {

            Message.destroy(messageId);
            listMessages();

        }


        $scope.addUser = function () {
            var modalInstance = $modal.open({
                templateUrl: 'addUser.html',
                controller: function ($scope, $modalInstance) {

                    $scope.done = function () {
                        $modalInstance.dismiss();

                    }

                    $scope.cancel = function () {
                        $modalInstance.dismiss();

                    }

                }
            });
        }


    })

    .controller('FriendsCtrl',function($scope, $modal, $stateParams, UserRelation, User){



        $scope.owner = {};

        function getUser(){

            User.find($stateParams.userId).then(function(owner){

                $scope.owner = owner;
                getListOfFriends(owner);

            })

        }

        getUser();

        $scope.userrelations = [];

        function getListOfFriends(user){

            UserRelation.findAll({ ownerid : user.id}).then(function(userrelations){

                $scope.userrelations = userrelations;

            })

        }

        function saveNewFriend(){

            //create friend 1st
            User.create({

                username : $scope.username,

            }).then(function (user) {
                //create userrelation
                UserRelation.create(
                    {
                        ownerid : $scope.ownerid,
                        userid : user.id
                    }
                ).then(function (userrelation) {

                        getListOfFriends(owner);

                    })
            })


        }

        function createUserRelation(ownerid,userid){

            UserRelation.create({
                ownerid : ownerid,
                userid : userid
            }).then(function (userrelation) {
                alert("Create Relation OK")

            })

        }

        var AddFriendCtrl = function ($scope, $modalInstance) {

            $scope.done = function () {

                //find User
                User.findAll({ username : $scope.username}).then(function (user) {
                    alert("User found !, just create user relation");
                    createUserRelation($scope.owner.id,user.id);

                }).catch(function (error) {
                    //create new User
                    User.create({
                        username : $scope.username,
                        password : $scope.username + "pwd"
                    }).catch(function (user) {
                        createUserRelation($scope.owner.id,user.id);
                    })
                })


                $modalInstance.dismiss();

            }

            $scope.cancel = function () {
                $modalInstance.dismiss();

            }

        }

        $scope.addNewFriend = function (){

            var modalInstance = $modal.open({
                templateUrl: 'AddNewFriend.html',
                resolve: {
                    roomName: function () {
                        return $scope.roomName;
                    }
                },
                controller: AddFriendCtrl
            });


        }

        function addNewFriendExec(){

            owner = User.get($scope.ownerid);

            //find no fuplicate user
            User.findAll({ username : $scope.username }).then(function (users) {

                $scope.error = 'Name is not available';

            }).catch(function (error) {

                //free username
                saveNewFriend();



            })


        }

    })
;