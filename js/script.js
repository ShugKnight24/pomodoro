$(document).ready(function(){
  var buzzer = $("#buzzer")[0];
  var session = parseInt($("#sessionTime").html());
  var breakT = parseInt($("#breakTime").html());
  buzzer.play();
  $("#reset").hide();

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
