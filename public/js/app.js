'use strict';

/**
 * Created by goer on 4/7/15.
 */

angular.module('myapp', ['ui.bootstrap', 'js-data', 'ui.router','ncy-angular-breadcrumb'])

    .run(['PrintToConsole', function (PrintToConsole) {
        PrintToConsole.active = true;
    }])

    .config(function ($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/rooms/roomDetail/4539e3c8ba2d289c');

        $stateProvider
            .state('rooms', {
                url: "/rooms",
                views:{
                    'A' : {templateUrl: "tpl/rooms.html",}
                },
                controller: 'MainCtrl'
            })
            .state('rooms.roomDetail', {
                url: "/roomDetail/:roomId",
                views: {
                    'B': { template: '<h1>roomDetail</h1>',}
                },
                controller: 'RoomDetailCtrl'
            })

        ;


    })

    .factory("PrintToConsole", ["$rootScope", function ($rootScope) {
        var handler = {active: true};
        handler.toggle = function () {
            handler.active = !handler.active;
        };
        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            if (handler.active) {
                console.log("$stateChangeStart --- event, toState, toParams, fromState, fromParams");
                console.log(arguments);
            }
            ;
        });
        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            if (handler.active) {
                console.log("$stateChangeError --- event, toState, toParams, fromState, fromParams, error");
                console.log(arguments);
            }
            ;
        });
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            if (handler.active) {
                console.log("$stateChangeSuccess --- event, toState, toParams, fromState, fromParams");
                console.log(arguments);
            }
            ;
        });
        $rootScope.$on('$viewContentLoading', function (event, viewConfig) {
            if (handler.active) {
                console.log("$viewContentLoading --- event, viewConfig");
                console.log(arguments);
            }
            ;
        });
        $rootScope.$on('$viewContentLoaded', function (event) {
            if (handler.active) {
                console.log("$viewContentLoaded --- event");
                console.log(arguments);
            }
            ;
        });
        $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
            if (handler.active) {
                console.log("$stateNotFound --- event, unfoundState, fromState, fromParams");
                console.log(arguments);
            }
            ;
        });
        return handler;
    }])

    //.config(['$routeProvider',
    //    function($routeProvider) {
    //        $routeProvider.
    //            when('/rooms', {
    //                templateUrl: 'tpl/rooms.html',
    //                controller: 'MainCtrl'
    //            }).
    //            when('/roomDetail/:roomId', {
    //                templateUrl: 'tpl/roomDetail.html',
    //                controller: 'RoomDetailCtrl'
    //            }).
    //            otherwise({
    //                redirectTo: '/rooms'
    //            });
    //    }])

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
    .controller('MainCtrl', function ($scope, $modal, RoomUser, Room, User, Message, RoomUserList, PrintToConsole) {

        $scope.debugger = PrintToConsole;

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

    .controller('RoomDetailCtrl', function ($scope, $modal, $routeParams, Room, Message, PrintToConsole) {

        $scope.debugger = PrintToConsole;

        console.log("param: " + $routeParams.roomId);
        Room.find($routeParams.roomId)
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
;