$(document).ready(function(){
	var buzzer = $("#buzzer")[0];
	var session = parseInt($("#sessionTime").html());
	var breakT = parseInt($("#breakTime").html());

	'use strict';
	

	$('#reset').hide();

	$('#startButton').on('click', function(){

		var counter = setInterval(timer, 1000);

		session *= 60;

		function timer (){
			// Hide all the different titles and buttons
			$('#startButton, #minus5Clock, #add5Clock, #minus5Break, #add5Break, #breakTime, #sessionHeader, #breakHeader, #description').hide();
			$('#timeType').show();
			$('#timeType').html('Session Time: ');

			session -= 1;
			if(session === 0){
				buzzer.play();
				clearInterval(counter);
				var startBreak = setInterval (breakTimer, 1000);
				$('#sessionTime').hide();
			}
			if(session % 60 >= 10){
				$('#sessionTime').html(Math.floor(session / 60) + ':' + session % 60);
			} else {
				$('#sessionTime').html(Math.floor(session / 60) + ':' + '0' + session %  60);
			}
			function breakTimer(){
				$('#timeType').html('Break Time: ');
				$('#breakTime').show();
				breakT *= 60;
				$('#timeType').show();
				breakT -= 1;
				if(breakT === 0){
					clearInterval(startBreak);
					buzzer.play();
					$('#reset').show();
					$('#breakTime, #timeType').hide();
				}
				if(breakT % 60 >= 10){
					$('#breakTime').html(Math.floor(breakT / 60) + ':' + breakT % 60);
				} else {
					$('#breakTime').html(Math.floor(breakT / 60) + ':' + '0' + breakT % 60);
				}
			}
		}
	});

	$('#reset').on('click', function(){
		session = 25;
		breakT = 5;
		$('#sessionTime').html(session);
		$('#breakTime').html(breakT);
		$('#startButton, #minus5Clock, #add5Clock, #minus5Break, #add5Break, #sessionTime, #breakTime, #sessionHeader, #breakHeader, #description').show();
		$('#reset, #timeType').hide();
	});

	$('#minus5Clock').on('click',function(){
		if(session > 5){
			session -= 5;
			$('#sessionTime').html(session);
		}
	});
	$('#add5Clock').on('click',function(){
		session += 5;
		$('#sessionTime').html(session);
	});
	$('#minus5Break').on('click',function(){
		if(breakT > 5){
			breakT -= 5;
			$('#breakTime').html(breakT);
		}
	});
	$('#add5Break').on('click',function(){
		breakT += 5;
		$('#breakTime').html(breakT);
		});
});
