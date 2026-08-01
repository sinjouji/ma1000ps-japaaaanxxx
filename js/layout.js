/**
 * 画面共通のヘッダー部品
 */
(function (global) {
  'use strict';

  function renderHeader(opts) {
    opts = opts || {};
    var backHtml = opts.backTo
      ? '<button class="header-back" data-nav="' + opts.backTo + '" aria-label="戻る">←</button>'
      : '<span class="header-back header-back--placeholder"></span>';
    var settingsHtml = opts.hideSettings
      ? ''
      : '<button class="header-settings" data-nav="settings" aria-label="設定">⚙</button>';

    return (
      '<header class="app-header">' +
        backHtml +
        '<h1 class="app-header__title">' + global.App.Utils.escapeHtml(opts.title || '') + '</h1>' +
        settingsHtml +
      '</header>'
    );
  }

  function bindNavButtons(container) {
    container.querySelectorAll('[data-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        global.App.Router.navigate(btn.getAttribute('data-nav'));
      });
    });
  }

  global.App = global.App || {};
  global.App.Layout = {
    renderHeader: renderHeader,
    bindNavButtons: bindNavButtons
  };
})(window);
