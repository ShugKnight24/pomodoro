$(document).ready(function(){
  var buzzer = $("#buzzer")[0];
  var session = parseInt($("#sessionTime").html());
  var count = parseInt($("#sessionTime").html());
  var breakT = parseInt($("#breakTime").html());

  $("#reset").hide();

  $("#startButton").on("click", function(){
    var counter = setInterval(timer, 1000);
    function timer (){
      // Hide all the different titles and buttons
      $("#startButton, #minus5Clock, #add5Clock, #minus5Break, #add5Break, #breakTime, #sessionHeader, #breakHeader").hide();
      $("#timeType").html("Session Time: ");
      count -=1;
      if(count===0){
        buzzer.play();
        clearInterval(counter);
        var startBreak = setInterval (breakTimer, 1000);
        $("#sessionTime").hide();
      }
      $("#sessionTime").html(count);
      function breakTimer(){
        $("#timeType").html("Break Time: ");
        $("#breakTime").show();
        breakT -=1;
        if(breakT===0){
          clearInterval(startBreak);
        }
          $("#breakTime").html(breakT);
      }
    }
  });
  $("#minus5Clock").on("click",function(){
    if(session>5){
      session -= 5;
      $("#sessionTime").html(session);
    }
  });
  $("#add5Clock").on("click",function(){
    session += 5;
    $("#sessionTime").html(session);
  });
  $("#minus5Break").on("click",function(){
    if(breakT>5){
      breakT -= 5;
      $("#breakTime").html(breakT);
    }
  });
  $("#add5Break").on("click",function(){
    breakT += 5;
    $("#breakTime").html(breakT);
  });
});
