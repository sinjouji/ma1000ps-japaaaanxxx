/**
 * かんたんなハッシュルーター
 * ---------------------------------------------------------
 * 画面（screen）は { render(container, params), destroy?(container) } を実装し
 * App.Router.register('home', HomeScreen) のように登録する。
 * URL は #home, #puzzle, #puzzle/kanto, #questions/edit/xxxx のような形。
 */
(function (global) {
  'use strict';

  var screens = {};
  var currentScreen = null;
  var currentContainer = null;

  function register(name, screen) {
    screens[name] = screen;
  }

  function parseHash() {
    var hash = location.hash.replace(/^#\/?/, '');
    if (!hash) hash = 'home';
    var parts = hash.split('/');
    return { name: parts[0], params: parts.slice(1) };
  }

  function navigate(path) {
    location.hash = path;
  }

  function renderCurrent() {
    var container = document.getElementById('app');
    var route = parseHash();
    var screen = screens[route.name] || screens.home;

    if (currentScreen && typeof currentScreen.destroy === 'function') {
      try { currentScreen.destroy(currentContainer); } catch (e) { console.warn(e); }
    }
    container.innerHTML = '';
    window.scrollTo(0, 0);
    currentScreen = screen;
    currentContainer = container;
    screen.render(container, route.params);

    // 現在地に応じてナビゲーションのハイライトなどを更新
    document.body.setAttribute('data-route', route.name);
  }

  window.addEventListener('hashchange', renderCurrent);
  window.addEventListener('DOMContentLoaded', renderCurrent);

  global.App = global.App || {};
  global.App.Router = {
    register: register,
    navigate: navigate,
    renderCurrent: renderCurrent,
    parseHash: parseHash
  };
})(window);
