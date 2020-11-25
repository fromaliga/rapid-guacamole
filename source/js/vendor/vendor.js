import 'focus-visible';
import LazyLoad from 'vanilla-lazyload';

const isWebpSupported = (feature, callback) => {
  let kTestImages = {
    lossy: 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
    lossless: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
    alpha:
      'UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==',
    animation:
      'UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA',
  };
  let img = new Image();
  img.onload = function () {
    let result = img.width > 0 && img.height > 0;
    callback(feature, result);
  };
  img.onerror = function () {
    callback(feature, false);
  };
  img.src = 'data:image/webp;base64,' + kTestImages[feature];
};

document.addEventListener('DOMContentLoaded', () => {
  isWebpSupported('lossy', function (feature, isSupported) {
    if (isSupported) {
      document.body.classList.add('is-webp-supported-true');
    } else {
      document.body.classList.add('is-webp-supported-false');
    }
  });

  /* eslint-disable */
  new LazyLoad({
    elements_selector: '[data-src]',
    use_native: true,
  });

  new LazyLoad({
    elements_selector: '.lazy',
  });
  /* eslint-enable */
});
