var navigationEl = document.querySelector('.navigation');
var demosEl = document.querySelector('.demos');
var articleEls = document.querySelectorAll('article');
var jsOutputEl = document.querySelector('.js-output');
var htmlOutputEl = document.querySelector('.html-output');
var demos = [];

function getScrollTop() {
  return document.body.scrollTop || document.documentElement.scrollTop;
}

function scrollTo(selector, offset, cb) {
  var offset = offset || 0;
  var el = document.querySelector(selector);
  var scrollAnim = anime({
    targets: {scroll: demosEl.scrollTop},
    scroll: el.offsetTop - offset,
    duration: 500,
    easing: 'easeInOutQuart',
    update: function(a) { demosEl.scrollTop = a.animations[0].currentValue; },
    complete: function() { if (cb) cb(); }
  });
}

function parseHTML(el, parentId) {
  var parentEl = document.createElement('div');
  var clone = el.cloneNode(true);
  var shadowEls = clone.querySelectorAll('.shadow');
  var els = clone.querySelectorAll('.el');
  for (var i = 0; i < shadowEls.length; i++ ) shadowEls[i].remove();
  for (var i = 0; i < els.length; i++ ) els[i].removeAttribute('style');
  parentEl.id = parentId;
  parentEl.innerHTML = clone.innerHTML;
  return html_beautify(parentEl.outerHTML, {
    preserve_newlines: false,
    indent_size: 2
  });
}

function outputCode(JScode, HTMLcode) {
  var js = document.createTextNode(JScode);
  var html = document.createTextNode(HTMLcode);
  jsOutputEl.innerHTML = '';
  htmlOutputEl.innerHTML = '';
  jsOutputEl.appendChild(js);
  htmlOutputEl.appendChild(html);
  hljs.highlightBlock(jsOutputEl);
  hljs.highlightBlock(htmlOutputEl);
}

function toggleSectionLink(ulEl) {
  var ulHeight = 20;
  var ulEls = document.querySelectorAll('.navigation ul');
  for (var i = 0; i < ulEls.length; i++) ulEls[i].classList.remove('active');
  anime({
    targets: '.navigation ul',
    height: ulHeight + 10,
    duration: 400,
    easing: 'easeOutQuart'
  });
  anime.remove(ulEl);
  anime({
    targets: ulEl,
    height: function(el) {
      return el.childNodes.length * ulHeight + 20;
    },
    duration: 600,
    delay: 400,
    easing: 'easeInOutQuart'
  });
  ulEl.classList.add('active');
}

function resetDemos() {
  demos.forEach(function(demo) {
    demo.anim.pause();
    demo.anim.seek(0);
  });
}

function createDemo(el) {
  var demo = {};
  var scriptEl = el.querySelector('script');
  var demoContentEl = el.querySelector('.demo-content');
  var title = el.querySelector('h3').innerHTML;
  var id = el.id;
  var demoAnim = window[id];
  var JScode = scriptEl ? scriptEl.innerHTML : '';
  var HTMLcode = demoContentEl ? parseHTML(demoContentEl, id) : '';
  function highlightDemo(e) {
    if (e) e.preventDefault();
    if (!el.classList.contains('active')) {
      resetDemos();
      var linkEls = document.querySelectorAll('.demo-link');
      for (var i = 0; i < demos.length; i++) {
        var d = demos[i];
        d.el.classList.remove('active');
        linkEls[i].classList.remove('active');
        d.anim.pause();
      }
      history.pushState(null, null, '#'+id);
      outputCode(JScode, HTMLcode);
      var linkEl = document.querySelector('a[href="#'+id+'"]');
      var ulEl = linkEl.parentNode.parentNode;
      linkEl.classList.add('active');
      el.classList.add('active');
      toggleSectionLink(ulEl);
      scrollTo('#'+id, 60, function() {
        if (!el.classList.contains('controls')) demoAnim.restart();
      });
    } else {
      if (!el.classList.contains('controls')) demoAnim.restart();
    }
  }
  function enterDemo() {
    if (!el.classList.contains('active')) {
      demoAnim.restart();
    }
  }
  function leaveDemo() {
    if (!el.classList.contains('active')) {
      demoAnim.pause();
      demoAnim.seek(0);
    }
  }
  el.addEventListener('click', highlightDemo);
  // el.addEventListener('mouseenter', enterDemo);
  // el.addEventListener('mouseleave', leaveDemo);
  resetDemos();
  return {
    el: el,
    title: title,
    id: id,
    anim: demoAnim,
    highlight: highlightDemo
  }
}

function getDemoById(id) {
  return demos.filter(function(a) { return a.id === id})[0];
}

function createLinksSection(articleEl) {
  var articleId = articleEl.id;
  var articleTitle = articleEl.querySelector('h2').innerHTML;
  var colorClass = articleEl.classList[0];
  var ulEl = document.createElement('ul');
  var liEl = document.createElement('li');
  var sectionLinkEl = document.createElement('a');
  sectionLinkEl.setAttribute('href', '#'+articleId);
  sectionLinkEl.innerHTML = articleTitle;
  sectionLinkEl.addEventListener('click', function(e) {
    e.preventDefault();
    var firstDemoId = articleEl.querySelector('.demo').id;
    var firstDemo = getDemoById(firstDemoId);
    firstDemo.highlight();
  });
  liEl.appendChild(sectionLinkEl);
  ulEl.appendChild(liEl);
  ulEl.classList.add(colorClass);
  return ulEl;
}

function createDemoLink(demo) {
  var liEl = document.createElement('li');
  var demoLinkEl = document.createElement('a');
  demoLinkEl.setAttribute('href', '#'+demo.id);
  demoLinkEl.innerHTML = demo.title;
  demoLinkEl.classList.add('demo-link');
  demoLinkEl.addEventListener('click', demo.highlight);
  liEl.appendChild(demoLinkEl);
  return liEl;
}

var fragment = document.createDocumentFragment();
for (var i = 0; i < articleEls.length; i++) {
  var articleEl = articleEls[i];
  var linksSectionEl = createLinksSection(articleEl);
  var demoEls = articleEl.querySelectorAll('.demo');
  for (var d = 0; d < demoEls.length; d++) {
    var demo = createDemo(demoEls[d]);
    var demoLinkEl = createDemoLink(demo);
    linksSectionEl.appendChild(demoLinkEl);
    demos.push(demo);
  }
  fragment.appendChild(linksSectionEl);
}
navigationEl.appendChild(fragment);

(function updateDemos() {
  var hash = window.location.hash;
  if (hash) {
    var id = hash.replace('#','');
    var demo = getDemoById(id);
    if (demo) demo.highlight();
  } else {
    demos[0].highlight();
  }
})();