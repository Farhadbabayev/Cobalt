// "Completed Projects" slider on the home page (replaces the old weblocks.io + Swiper scripts).
(function () {
  var viewport = document.querySelector('.slider-wrapper-div');
  var list = viewport && viewport.querySelector('.slider-list');
  if (!list) return;
  var items = list.querySelectorAll('.slider-item');
  if (!items.length) return;

  var index = 0;
  list.style.transition = 'transform 0.5s ease';

  function step() {
    var item = items[0];
    return item.offsetWidth + (parseFloat(getComputedStyle(item).marginRight) || 0);
  }
  function maxOffset() {
    return Math.max(0, list.scrollWidth - viewport.clientWidth);
  }
  function lastIndex() {
    return Math.ceil(maxOffset() / step());
  }
  function render() {
    var offset = Math.min(index * step(), maxOffset());
    list.style.transform = 'translate3d(' + -offset + 'px, 0, 0)';
  }
  function go(delta) {
    var last = lastIndex();
    index += delta;
    if (index > last) index = 0;
    if (index < 0) index = last;
    render();
  }

  var prev = document.querySelector('.slider-navigation.prev-slide');
  var next = document.querySelector('.slider-navigation.next-slide');
  if (prev) prev.addEventListener('click', function () { go(-1); });
  if (next) next.addEventListener('click', function () { go(1); });

  // Swipe support for touch screens, where the arrows are hidden.
  var startX = null;
  viewport.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  });

  window.addEventListener('resize', function () {
    index = Math.min(index, lastIndex());
    render();
  });
})();
