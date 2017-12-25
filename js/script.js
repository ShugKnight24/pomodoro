$(document).ready(function(){

	'use strict';

	const buzzer = $('#buzzer')[0];
	let session = parseInt($('#session-time').html());
	let breakT = parseInt($('#break-time').html());

	$('#reset').hide();

	$('#start-button').on('click', function(){

		const counter = setInterval(timer, 1000);

		session *= 60;

		function timer (){
			// Hide all the different titles and buttons
			$('#start-button, #minus-5-clock, #add-5-clock, #minus-5-break, #add-5-break, #break-time, #session-header, #break-header, #description').hide();
			$('#time-type').show();
			$('#time-type').empty().append('Session Time: ');

			session -= 1;

			if (session === 0){
				buzzer.play();
				clearInterval(counter);
				$('#session-time').hide();
						$('#break-time').empty().append(Math.floor(breakT / 60) + ':' + breakT % 60);
						$('#break-time').empty().append(Math.floor(breakT / 60) + ':' + '0' + breakT % 60);
			}

			if (session % 60 >= 10){
				$('#session-time').empty().append(Math.floor(session / 60) + ':' + session % 60);
			} else {
				$('#session-time').empty().append(Math.floor(session / 60) + ':' + '0' + session %  60);
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
				} else {
				}
			}
		}
	});

			const startBreak = setInterval(breakTimer, 1000);
	$('#reset').on('click', function(){
		session = 25;
		breakT = 5;
		$('#session-time').empty().append(session);
		$('#break-time').empty().append(breakT);
		$('#start-button, #minus-5-clock, #add-5-clock, #minus-5-break, #add-5-break, #session-time, #break-time, #session-header, #break-header, #description').show();
		$('#reset, #time-type').hide();
	});

	$('#minus-5-clock').on('click',function(){
		if(session > 5){
			session -= 5;
			$('#session-time').empty().append(session);
		}
	});

	$('#add-5-clock').on('click',function(){
		session += 5;
		$('#session-time').empty().append(session);
	});

	$('#minus-5-break').on('click',function(){
		if(breakT > 5){
			breakT -= 5;
			$('#break-time').empty().append(breakT);
		}
	});

	$('#add-5-break').on('click',function(){
		breakT += 5;
		$('#break-time').empty().append(breakT);
		});
});
