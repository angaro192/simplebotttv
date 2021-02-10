M.AutoInit();

$(document).ready(function(){
  $('.carousel').carousel({
    indicators: true
  });
  //Passar para a proxima imagem
  setInterval(function(){
    $('.carousel').carousel('next')
  }, 5000)
});

$(document).ready(function(){
  $('.tooltipped').tooltip({
    position: 'top'
  });
});