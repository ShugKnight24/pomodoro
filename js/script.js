$(document).ready(function(){

	'use strict';

	const buzzer = $('#buzzer')[0];
	let session = parseInt($('#session-time').html());
	let breakT = parseInt($('#break-time').html());

	$('#start').on('click', function(){

		const counter = setInterval(timer, 1000);

		session *= 60;

		function timer(){
			// Hide all the different titles and buttons
			$('#start, #minus-5-clock, #add-5-clock, .break-div, #minus-5-break, #add-5-break').addClass('hidden');
			$('#stop').removeClass('hidden');

			$('#time-type').empty().append('Session Time: ');

			session -= 1;

			if (session === 0){
				buzzer.play();
				clearInterval(counter);
				const startBreak = setInterval(breakTimer, 1000);
				breakT *= 60;
				$('.time-div').addClass('hidden');

				function breakTimer(){

					$('#time-type').empty().append('Break Time: ');
					$('.break-div, #time-type').removeClass('hidden');
					breakT -= 1;

					if (breakT === 0){
						clearInterval(startBreak);
						buzzer.play();
						$('#reset').removeClass('hidden');
						$('#break-time, #time-type, #stop').addClass('hidden');
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

	$('#reset, #stop').on('click', function(){
		session = 25;
		breakT = 5;
		$('#session-time').empty().append(session);
		$('#break-time').empty().append(breakT);
		$('.time-div, #start, #minus-5-clock, #add-5-clock, #minus-5-break, #add-5-break, #session-time, #break-time, #session-header, #break-header').removeClass('hidden');
		$('#reset, #time-type, #stop').addClass('hidden');
	});

	$('#minus-5-clock').on('click',function(){
		if (session > 5){
			session -= 5;
			$('#session-time').empty().append(session);
		}
	});

	$('#add-5-clock').on('click',function(){
		session += 5;
		$('#session-time').empty().append(session);
	});

	$('#minus-5-break').on('click',function(){
		if (breakT > 5){
			breakT -= 5;
			$('#break-time').empty().append(breakT);
		}
	});

	$('#add-5-break').on('click',function(){
		breakT += 5;
		$('#break-time').empty().append(breakT);
		});
});

// Toggle accordion
$('.accordion-heading').on('click', function(event){
	event.stopPropagation();
	var $this = $(this);
	$this.parent('.accordion').toggleClass('accordion-active');
	$this.parent('.accordion').siblings('.accordion-body').slideToggle('fast').toggleClass('accordion-active');
});

// Handle Settings Menu
function openSettings() {
	$('.side-settings').addClass('open');
}

const $openSettingsButton = $('.open-settings');
$openSettingsButton.on('click', openSettings);

function closeSettings() {
	$('.side-settings').removeClass('open');
}

const $closeSettingsButton = $('.close-settings');
$closeSettingsButton.on('click', closeSettings);

const $buzzer = $('#buzzer')[0];
// Adjust Volume Input
function updateVolume(){
	$buzzer.volume = (this.value / 100);
}

const $updateVolumeInput = $('#update-volume');

$updateVolumeInput.on('change', updateVolume)
	.on('mousemove', updateVolume);

// Decrease Volume
const $volumeMinusIcon = $('.volume-container .fa-minus');

$volumeMinusIcon.on('click', function(){
	$updateVolumeInput[0].stepDown(10);
	$buzzer.volume = ($updateVolumeInput[0].value / 100);
});

// Increase Volume
const $volumePlusIcon = $('.volume-container .fa-plus');

$volumePlusIcon.on('click', function(){
	$updateVolumeInput[0].stepUp(10);
	$buzzer.volume = ($updateVolumeInput[0].value / 100);
});

