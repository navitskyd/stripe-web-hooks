document
.querySelectorAll('.photosvet-slider input[type="range"]')
.forEach((inputSlider) => {
  inputSlider.addEventListener("input", function (e) {
    let slider = e.target;
    let container = slider.closest(".photosvet-slider");
    let arrows= container.querySelector('.slider-button');
    let divisor = container.querySelector(".photosvet-divisor");
    divisor.style.width = slider.value + "%";

    total = container.getBoundingClientRect().width;
    offset = slider.value/100*total-25;
    arrows.style.left=offset+"px";
  });
});
