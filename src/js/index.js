$(document).ready(function() {

  $('.slider').slick({
    autoplay: true,
    arrows: false,
    autoplaySpeed: 1500,
    adaptiveHeight: true
  })

  $('.icon-video').magnificPopup({
    type: 'iframe'
  })
})