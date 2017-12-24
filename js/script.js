$(document).ready(function(){

	'use strict';

	var buzzer = $('#buzzer')[0];
	var session = parseInt($('#session-time').html());
	var breakT = parseInt($('#break-time').html());

	$('#reset').hide();

	$('#start-button').on('click', function(){

		var counter = setInterval(timer, 1000);

		session *= 60;

		function timer (){
			// Hide all the different titles and buttons
			$('#start-button, #minus-5-clock, #add-5-clock, #minus-5-break, #add-5-break, #break-time, #session-header, #break-header, #description').hide();
			$('#time-type').show();
			$('#time-type').html('Session Time: ');

			session -= 1;

			if (session === 0){
				buzzer.play();
				clearInterval(counter);
				var startBreak = setInterval(breakTimer, 1000);
				$('#session-time').hide();
			}

			if (session % 60 >= 10){
				$('#session-time').html(Math.floor(session / 60) + ':' + session % 60);
			} else {
				$('#session-time').html(Math.floor(session / 60) + ':' + '0' + session %  60);
			}

			function breakTimer(){

				$('#time-type').html('Break Time: ');
				$('#break-time').show();
				breakT *= 60;
				$('#time-type').show();
				breakT -= 1;

				if (breakT === 0){
					clearInterval(startBreak);
					buzzer.play();
					$('#reset').show();
					$('#break-time, #time-type').hide();
				}

				if (breakT % 60 >= 10){
					$('#break-time').html(Math.floor(breakT / 60) + ':' + breakT % 60);
				} else {
					$('#break-time').html(Math.floor(breakT / 60) + ':' + '0' + breakT % 60);
				}
			}
		}
	});

	$('#reset').on('click', function(){
		session = 25;
		breakT = 5;
		$('#session-time').html(session);
		$('#break-time').html(breakT);
		$('#start-button, #minus-5-clock, #add-5-clock, #minus-5-break, #add-5-break, #session-time, #break-time, #session-header, #break-header, #description').show();
		$('#reset, #time-type').hide();
	});

	$('#minus-5-clock').on('click',function(){
		if(session > 5){
			session -= 5;
			$('#session-time').html(session);
		}
	});

	$('#add-5-clock').on('click',function(){
		session += 5;
		$('#session-time').html(session);
	});

	$('#minus-5-break').on('click',function(){
		if(breakT > 5){
			breakT -= 5;
			$('#break-time').html(breakT);
		}
	});

	$('#add-5-break').on('click',function(){
		breakT += 5;
		$('#break-time').html(breakT);
		});
});
