// Initialize the carousel with custom settings
document.addEventListener('DOMContentLoaded', function() {
  // Get the carousel element
  const carousel = document.getElementById('storyBotCarousel');
  
  // Initialize the Bootstrap carousel
  const storyBotCarousel = new bootstrap.Carousel(carousel, {
    interval: 5000,  // Change slides every 5 seconds
    wrap: true,      // Continuous loop
    touch: true      // Enable touch swiping on mobile
  });
  
  // Add swipe support for touch devices
  let touchStartX = 0;
  let touchEndX = 0;
  
  carousel.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, false);
  
  carousel.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, false);
  
  function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
      // Swipe left - next slide
      storyBotCarousel.next();
    } else if (touchEndX > touchStartX + 50) {
      // Swipe right - previous slide
      storyBotCarousel.prev();
    }
  }
  
  // Add hover effect for controls
  const carouselControls = document.querySelectorAll('.custom-carousel-control');
  
  carouselControls.forEach(control => {
    control.addEventListener('mouseenter', function() {
      const arrow = this.querySelector('.custom-arrow');
      arrow.style.transform = 'scale(1.1)';
    });
    
    control.addEventListener('mouseleave', function() {
      const arrow = this.querySelector('.custom-arrow');
      arrow.style.transform = 'scale(1)';
    });
  });
});