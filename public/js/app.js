'use strict';

/**
 * Created by goer on 4/7/15.
 */

angular.module('myapp',
    [
        'ui.bootstrap',
        'js-data',
        'ui.router',
        'ncy-angular-breadcrumb',
        "pageslide-directive",
        'ngMap'
    ]
)


    .config(function ($stateProvider, $urlRouterProvider) {

        //$urlRouterProvider.otherwise('/rooms');

        $stateProvider
        
            .state('rooms', {
                url: "/rooms/:ownerId",
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
            .state('selectFriends', {
                url: "/selectFriends/:ownerId/:roomId",
                views : {
                    'main' : {
                        templateUrl: 'tpl/select-friends.html',
                        controller: 'SelectFriendCtrl',
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
            .state('map', {
                url: "/map/:roomId",
                views : {
                    'main' : {
                        templateUrl: 'tpl/map.html',
                        controller: 'MapCtrl',
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
        return DS.defineResource('myuser');
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

    .run(function ($interval,UserSvc,MemberLocationSvc) {


        $interval(MemberLocationSvc.refreshMemberLocations,1000);


    })

    .factory('MemberLocationSvc', function (RoomDetailSvc) {

        var currentPosition =  {lat:-6.264429700000001,lon:106.8036494};

        var getUserLocation = function () {
            var generator = new LocationGenerator();
            var xy = generator.nextLocation(currentPosition.lat,currentPosition.lon,1000);
            return { lat: xy[1], lon: xy[0]};
        }

        var memberLocations = {};

        var refreshMemberLocations = function () {

            RoomDetailSvc.getMembers(function (members) {
                angular.forEach(members, function (member) {
                    var pos = getUserLocation();

                    memberLocations[member.userid]=pos;
                    updateMemberLocations(member.userid,pos);

                })
            })
        }

        var getMemberLocation = function (userid,f) {
                f(userid,memberLocations[userid]);
        }
        
        var updateMemberLocations = function(userid,pos){

        }

        var setFunctionMemberLocation = function (f){
            updateMemberLocations = f;
        }

        return {
            refreshMemberLocations: refreshMemberLocations,
            memberLocations: memberLocations,
            updateMemberLocations: updateMemberLocations,
            getMemberLocation: getMemberLocation,
            setFunctionMemberLocation: setFunctionMemberLocation,
            currentPosition: currentPosition,
        }

    })

    .factory('FriendSvc', function (UserRelation,User) {

        var ownerId ;

        var setOwnerId = function (oid) {
            ownerId = oid;
        }


        var selectedFriends = [];

        var setSelectedFriends = function (sf) {
            selectedFriends = sf;
        }



        var getFriends = function (f) {

            UserRelation.findAll({ownerid: ownerId},{bypassCache: true}).then(f);

        }

        var isUserExist = function (uid, fo, fe) {

            User.find(uid).then(fo).catch(fe);

        }

        var isFriend = function(uid,fo,fe){

            UserRelation.findAll({ownerid: ownerId, userid: uid}).then(function (usrs) {
                if(usrs.length>0)
                    fo(usrs)
                else
                    fe(usrs);

            }).catch(fe);

        }

        var addFriend = function (userid,f){

            UserRelation.create({
                ownerid : ownerId,
                userid : userid
            }).then(f);

        }

        return {
            setOwnerId : setOwnerId,
            getFriends : getFriends,
            addFriend : addFriend,
            isFriend : isFriend,
            isUserExist : isUserExist,
            setSelectedFriends : setSelectedFriends,
            selectedFriends : selectedFriends,
        }
    })


    .factory('RoomDetailSvc', function ($q,Room,Message,RoomUser) {

        var roomId;
        var room;

        var setRoomId = function (rid,f) {
            roomId = rid;
            Room.find(roomId).then(function (r) {
                room = r;
                f(r);
            })
        }

        var getRoom = function () {
            return room;
        }

        var addMessage = function (uid,content,type,f) {
            Message.create(
                {
                    roomid: roomId,
                    content: content,
                    userid: uid
                }
            ).then(f);

        }

        var getMessages = function (f) {
            Message.findAll({roomid : roomId},{bypassCache: true}).then(f);
        }

        var deleteMessage = function (mid,f) {
            Message.destroy(mid).then(f);
        }


        var selectedFriends = [];

        var setSelectedFriends = function (sf,f) {
            selectedFriends = sf;
            var defer = $q.defer();

            angular.forEach(selectedFriends, function (f) {
                addMember(f.userid).then(function () {
                    defer.resolve();
                });
            });

            return defer.promise;
        }

        var getMembers = function (f) {
            RoomUser.findAll({roomid : roomId},{bypassCache: true}).then(f);
        }

        var isMember = function (uid,fo,fe) {
            RoomUser.findAll({roomid : roomId, userid: uid},{bypassCache: true}).then(function (rus) {
                console.log("rus:"+rus.length);
                if(rus.length>0){
                    fo(rus);
                }else{
                    fe(rus);
                }
            }).catch(function (err) {
                fe(err);
            });
        }

        var addMember = function (uid) {
            return RoomUser.create({roomid : roomId, userid: uid});
        }

        var deleteMember = function (ruid,f) {
            RoomUser.destroy(ruid).then(f);
        }

        return {

            setRoomId : setRoomId,
            getRoom : getRoom,
            addMessage : addMessage,
            getMessages : getMessages,
            deleteMessage : deleteMessage,
            getMembers : getMembers,
            addMember : addMember,
            isMember : isMember,
            deleteMember : deleteMember,
            setSelectedFriends : setSelectedFriends,

        }

    })

    .factory('RoomSvc', function (RoomUser,Room,Message,FriendSvc,OwnerSvc) {

        var ownerId;


        var initOwner = function (){

            OwnerSvc.getOwner(function (o) {
                ownerId=o;
            })

        }

        var setOwnerId = function (oid) {
            if(oid) {
                ownerId = oid;
                FriendSvc.setOwnerId(oid);
                return;
            }
            initOwner();
            return;
        }

        var getRooms = function (f) {
            Room.findAll({userid: ownerId}, {bypassCache: true}).then(f);
        }

        var addRoom = function (roomName,f) {

            Room.create({
                name : roomName,
                userid : ownerId
            }).then(function (r) {
                getRooms(f);
            });

        }

        var deleteRoom = function (roomId,f) {
            Room.destroy(roomId).then(function (r) {
                RoomUser.destroyAll({roomid: r.id});
                Message.destroyAll({roomid: r.id});
            });
        }




        return {

            setOwnerId : setOwnerId,
            getRooms : getRooms,
            addRoom : addRoom,
            deleteRoom : deleteRoom,

        }


    })

    .factory('OwnerSvc', function(User){

        var owner = null;

        var login = function (userName, password) {

            return User.findAll({username : 'goer'}).then(function(usr){
                owner = usr;
            })

        }

        var getOwner = function(f){

            if(owner!=null) {
                f(owner);
                return;
            }

            login('','').then(function (o) {
                f(o);
            })

        }

        var isLogin = function () {
            if(owner!=null) return true;
            return false;
        }

        var logout = function () {


        }

        return {

            owner : owner,
            login : login,
            logout : logout,
            isLogin : isLogin,
            getOwner : getOwner,
        }

    })

    .factory('MapSvc', function () {

        function setMapCenter(position, f) {

            var pos = new google.maps.LatLng(
                position.coords.latitude,
                position.coords.longitude);


            $scope.positions.push({
                lat: pos.k,
                lng: pos.B
            });


            console.log(pos);
            $scope.map.setCenter(pos);
            setMarker(pos);
            var d = {
                user: $scope.currentUser || 'main',
                location: {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                }
            };

            socket.emit('user:location:update', d);
            console.log('user:location:update' + d);


        }


        return {

        }

    })

    .factory('UserLocationSvc', function () {

        var userId;

        var currentPosition =  {lat:-6.264429700000001,lon:106.8036494};

        var getUserLocation = function () {
            var generator = new LocationGenerator();
            var xy = generator.nextLocation(currentPosition.lat,currentPosition.lon,10000);
            return { lat: xy[0], lon: xy[1]};
        }

        var setUserLocation = function (loc) {

        }

        var getUserLocationHistory = function () {

        }

        return {
            userId: userId,
            getUserLocation: getUserLocation,
            setUserLocation: setUserLocation,
            getUserLocationHistory: getUserLocationHistory,
        }

    })

    .factory('UserSvc', function () {



        return {

        }

    })




    .controller('MainCtrl', function ($scope, $modal, $stateParams,RoomUser, Room, User, Message, RoomSvc ) {

        RoomSvc.setOwnerId($stateParams.ownerId);


        function listRoomUsers() {
            RoomSvc.getRooms(function (rooms) {
                $scope.rooms = rooms;
            })
        }

        listRoomUsers();


        var AddRoomCtrl = function ($scope, $modalInstance, ownerId) {


            $scope.done = function () {

                RoomSvc.addRoom($scope.roomName, function (room) {
                    listRoomUsers();
                    $modalInstance.dismiss();
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
                    },
                    ownerId: function () {
                        return $stateParams.ownerId;
                    }
                },
                controller: AddRoomCtrl
            });
        };

        $scope.deleteRoom = function (roomId) {

            RoomSvc.deleteRoom(roomId, function () {
                console.log("deleteRoom done " + roomId);
            })

        }


    })

    .controller('RoomDetailCtrl', function ($scope, $modal, $stateParams, Room, Message, RoomDetailSvc, FriendSvc) {

        console.log("param: " + $stateParams.roomId);
        RoomDetailSvc.setRoomId($stateParams.roomId, function (room) {
            $scope.room = room;
            console.log("Room id:" + $scope.room.id);
            listMessages();
        });

        function listMembers() {
            RoomDetailSvc.getMembers(function (ms) {
                $scope.members = ms;
            })
        }

        listMembers();

        function listMessages() {
            RoomDetailSvc.getMessages(function (messages) {
                $scope.messages = messages;
            })
        }


        $scope.addMessage = function () {

            RoomDetailSvc.addMessage(1, $scope.newMessage,0, function (message) {
                listMessages();
            })

        }

        $scope.deleteMessage = function (messageId) {

            RoomDetailSvc.deleteMessage(messageId, function (m) {
                listMessages();
            })


        }


        $scope.deleteMember = function (memberId) {
            RoomDetailSvc.deleteMember(memberId, function () {
                console.log("Delete Member:"+memberId);
                listMembers();
            })
        }


    })

    .controller('SelectFriendCtrl', function ($scope, $state, $stateParams, FriendSvc, RoomDetailSvc) {

        FriendSvc.setOwnerId($stateParams.ownerId);
        $scope.friends = [];
        FriendSvc.getFriends(function (fs) {
            angular.forEach(fs, function (f) {
                RoomDetailSvc.isMember(f.userid, function (x) {

                }, function (y) {
                    $scope.friends.push({ friend: f, checked : false });
                })
            })
        })


        $scope.done = function () {

            console.dir($scope.friends);
            var s=[];
            angular.forEach($scope.friends, function (f) {
                if(f.checked){
                    s.push(f.friend);
                }
            });

            RoomDetailSvc.setSelectedFriends(s).then(function(){
                $state.go("roomDetail",{roomId: $stateParams.roomId});
            });


        }

        $scope.cancel = function () {
            $state.go("roomDetail",{roomId: $stateParams.roomId});
        }


    })

    .controller('FriendsCtrl',function($scope, $modal, $stateParams, UserRelation, User){



        $scope.owner = {};

        function getUser(){

            User.find($stateParams.userId).then(function(owner){

                $scope.owner = owner;
                getListOfFriends(owner.id);

            })

        }

        getUser();

        $scope.userrelations = [];

        function getListOfFriends(ownerid){

            UserRelation.findAll({ ownerid : ownerid}, {bypassCache: true}).then(function(userrelations){

                $scope.userrelations = userrelations;

            })

        }


        function createUserRelation(ownerid,userid){

            UserRelation.create({
                ownerid : ownerid,
                userid : userid
            }).then(function (userrelation) {
                console.log("Create Relation OK");
                getListOfFriends(ownerid);

            })

        }

        var AddFriendCtrl = function ($scope, $modalInstance, ownerid) {

            $scope.done = function () {

                //find User
                User.findAll({ username : $scope.username}).then(function (user) {
                    console.log("User found !, just create user relation");
                    createUserRelation(ownerid,user[0].id);

                }).catch(function (error) {
                    //create new User
                    User.create({
                        username : $scope.username,
                        password : $scope.username + "pwd"
                    }).then(function (user) {
                        createUserRelation(ownerid,user.id);
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
                    ownerid : function () {
                        return $scope.owner.id;
                    }
                },
                controller: AddFriendCtrl
            });

        }

        $scope.deleteFriend = function (friendid) {

            UserRelation.destroy(friendid).then(function () {
                getListOfFriends($scope.owner.id);
            })

        }


    })

    .controller('MapCtrl', function ($scope, $stateParams, RoomDetailSvc, MemberLocationSvc) {

        $scope.checked = false; // This will be binded using the ps-open attribute
        $scope.toggle = function(){
            $scope.checked = !$scope.checked
        }

        RoomDetailSvc.setRoomId($stateParams.roomId, function (room) {
            $scope.room = room;
            console.log("Room id:" + $scope.room.id);
        });

        function listMembers() {
            RoomDetailSvc.getMembers(function (ms) {
                $scope.members = ms;
            })
        }

        listMembers();

        $scope.memberLocations = {};
        $scope.memberMarker = {}

        function isMember(items,k){
            return items.hasOwnProperty(k);
            //angular.forEach(items, function(value, key) {
            //    if(angular.equals(k,key))
            //        return true;
            //});
            //return false;
        }

        var updateMemberLocation = function(userid,pos){
            console.log("Userid: "+userid+" pos lat:"+pos.lat+" lon:"+pos.lon);
            $scope.memberLocations[userid]=pos;
            if (!isMember($scope.memberMarker,userid))
                $scope.memberMarker[userid] = createMarker(userid);
            $scope.memberMarker[userid].setPosition(new google.maps.LatLng(
                $scope.memberLocations[userid].lat,
                $scope.memberLocations[userid].lon
            ));

            refreshMap(userid);
        }

        MemberLocationSvc.setFunctionMemberLocation(updateMemberLocation);

        $scope.$on('mapInitialized', function(event, map) {
            $scope.map = map;
        });

        $scope.currentMember = 0;


        function refreshMap(userid){
            if(userid===$scope.currentMember) {
                drawMap($scope.currentMember, $scope.memberLocations[$scope.currentMember]);
            }
            zoomToSeeAll();
        }

        function createMarker(userid){
            var infoWindow = new google.maps.InfoWindow();
            var marker = new google.maps.Marker({
                map: $scope.map,
                title: "Userid:"+userid,
                content: '<div class="infoWindowContent">' + "UserID:"+userid + '</div>',
            });
            return marker;
        }

        function drawMap(userid,p){

            var pos = new google.maps.LatLng(
                p.lat,
                p.lon
            );
            $scope.map.setCenter(pos);
            //$scope.memberMarker[userid].setPosition(pos);

        }


        $scope.centerLocation = {}


        function zoomToSeeAll(){

            var bounds = new google.maps.LatLngBounds();
            angular.forEach($scope.memberLocations,function(v,k){
                bounds.extend(new google.maps.LatLng(v.lat, v.lon));
            })

        }

        $scope.centerCurrentLocation = function () {
            $scope.currentMember = 0;
            navigator.geolocation.getCurrentPosition(function(position) {
                MemberLocationSvc.currentPosition = {
                    lat: position.coords.latitude, lon: position.coords.longitude
                };
                $scope.centerLocation = MemberLocationSvc.currentPosition;

                drawMap("Center",MemberLocationSvc.currentPosition);
            });
        }

        $scope.centerCurrentLocation();


        $scope.setMapToMember = function (userid) {

                $scope.currentMember = userid;
                drawMap('Userid:'+$scope.currentMember,$scope.memberLocations[$scope.currentMember]);

        }

    })
;