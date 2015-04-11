angular.module('test-ui-route', ['ui.router','ncy-angular-breadcrumb'])

.config(function ($stateProvider, $urlRouterProvider) {
	
	$stateProvider
            .state(
            	'a', 
            	{
            		url : '/a',
            		abstract:true ,
            		template: '<div ui-view="a"></div>', 
            	}
            )
            .state(
            	'a.a', 
            	{
            		url : '/b',
            		views :{
            			'a@a' :  {template: '<p> This is A </p> ',} 

            		},
            	}
            )
            .state(
            	'a.a.a', 
            	{
            		url : '/c',
            		views :{
            			'a@a' :  {template: '<p> This is B </p>  ',} 

            		},
            	}
            )

})



