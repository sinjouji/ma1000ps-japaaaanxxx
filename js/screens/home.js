(function (global) {
  'use strict';

  var HomeScreen = {
    render: function (container) {
      container.innerHTML =
        global.App.Layout.renderHeader({ title: '日本地図パズル＆クイズ', hideSettings: false }) +
        '<main class="home-main">' +
          '<p class="home-lead">あそびながら、都道府県をおぼえよう。</p>' +
          '<div class="home-primary">' +
            '<button class="big-button big-button--puzzle" data-nav="puzzle">' +
              '<span class="big-button__icon">🧩</span>' +
              '<span class="big-button__label">パズル</span>' +
            '</button>' +
            '<button class="big-button big-button--quiz" data-nav="quiz">' +
              '<span class="big-button__icon">❓</span>' +
              '<span class="big-button__label">クイズ</span>' +
            '</button>' +
          '</div>' +
          '<div class="home-secondary">' +
            '<button class="small-button" data-nav="questions">📚 問題管理</button>' +
            '<button class="small-button" data-nav="data-export">📤 データ書き出し</button>' +
            '<button class="small-button" data-nav="data-import">📥 データ取り込み</button>' +
          '</div>' +
        '</main>';
      global.App.Layout.bindNavButtons(container);
    }
  };

  global.App.Router.register('home', HomeScreen);
})(window);
