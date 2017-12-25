$(document).ready(function(){

	'use strict';

	const buzzer = $('#buzzer')[0];
	let session = parseInt($('#session-time').html());
	let breakT = parseInt($('#break-time').html());

	$('#start-button').on('click', function(){

		const counter = setInterval(timer, 1000);

		session *= 60;

		function timer(){
			// Hide all the different titles and buttons
			$('#start-button, #minus-5-clock, #add-5-clock, #minus-5-break, #add-5-break, #break-time, #session-header, #break-header, #description').addClass('hidden');

			$('#time-type').empty().append('Session Time: ');

			session -= 1;

			if (session === 0){
				buzzer.play();
				clearInterval(counter);
				const startBreak = setInterval(breakTimer, 1000);
				breakT *= 60;
				$('#session-time').addClass('hidden');

				function breakTimer(){

					$('#time-type').empty().append('Break Time: ');
					$('#break-time, #time-type').removeClass('hidden');
					breakT -= 1;

					if (breakT === 0){
						clearInterval(startBreak);
						buzzer.play();
						$('#reset').removeClass('hidden');
						$('#break-time, #time-type').addClass('hidden');
					}

					if (breakT % 60 >= 10){
						$('#break-time').empty().append(Math.floor(breakT / 60) + ':' + breakT % 60);
					} else {
						$('#break-time').empty().append(Math.floor(breakT / 60) + ':' + '0' + breakT % 60);
					}
				}
				
			}

			if (session % 60 >= 10){
				$('#session-time').empty().append(Math.floor(session / 60) + ':' + session % 60);
			} else {
				$('#session-time').empty().append(Math.floor(session / 60) + ':' + '0' + session %  60);
			}

		}

	});

	$('#reset').on('click', function(){
		session = 25;
		breakT = 5;
		$('#session-time').empty().append(session);
		$('#break-time').empty().append(breakT);
		$('#start-button, #minus-5-clock, #add-5-clock, #minus-5-break, #add-5-break, #session-time, #break-time, #session-header, #break-header, #description').removeClass('hidden');
		$('#reset, #time-type').addClass('hidden');
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
