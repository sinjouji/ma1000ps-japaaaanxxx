(function (global) {
  'use strict';

  var SettingsScreen = {
    render: function (container) {
      var s = global.App.Storage.getSettings();

      container.innerHTML =
        global.App.Layout.renderHeader({ title: '設定', backTo: 'home', hideSettings: true }) +
        '<main class="settings-main">' +
          renderToggleRow('tts-enabled', '🔊 問題読み上げ', s.tts.enabled) +
          renderToggleRow('furigana-enabled', 'あ 読み仮名を表示', s.furigana.enabled) +
          renderToggleRow('prefnames-enabled', '🏷️ 県名表示（パズル）', s.prefNames.enabled) +
          renderToggleRow('sound-correct', '⭕ 正解音', s.sound.correctEnabled) +
          renderToggleRow('sound-incorrect', '❌ 不正解音', s.sound.incorrectEnabled) +

          '<div class="settings-row">' +
            '<span class="settings-row__label">🔈 効果音の音量</span>' +
            '<div class="volume-select" id="volume-select">' +
              [0, 1, 2].map(function (v) {
                var label = ['小', '中', '大'][v];
                var active = s.sound.volume === v ? ' is-active' : '';
                return '<button class="volume-select__btn' + active + '" data-volume="' + v + '">' + label + '</button>';
              }).join('') +
            '</div>' +
          '</div>' +

          '<button class="text-button" id="reset-questions">🗑️ 問題データを初期状態に戻す</button>' +

          '<div class="about-section">' +
            '<p class="about-section__title">このアプリについて</p>' +
            '<p class="about-section__attribution">地図データ出典：地球地図日本（国土地理院関連データを利用・加工）</p>' +
            '<p class="about-section__note">詳しい出典・ライセンス表記は同梱の README をご覧ください。</p>' +
          '</div>' +
        '</main>';
      global.App.Layout.bindNavButtons(container);

      function renderToggleRow(id, label, checked) {
        return (
          '<label class="settings-row" for="' + id + '">' +
            '<span class="settings-row__label">' + label + '</span>' +
            '<span class="toggle">' +
              '<input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + '>' +
              '<span class="toggle__track"><span class="toggle__thumb"></span></span>' +
            '</span>' +
          '</label>'
        );
      }

      function save(mutator) {
        var cur = global.App.Storage.getSettings();
        mutator(cur);
        global.App.Storage.saveSettings(cur);
      }

      document.getElementById('tts-enabled').addEventListener('change', function (ev) {
        save(function (cur) { cur.tts.enabled = ev.target.checked; });
      });
      document.getElementById('furigana-enabled').addEventListener('change', function (ev) {
        save(function (cur) { cur.furigana.enabled = ev.target.checked; });
      });
      document.getElementById('prefnames-enabled').addEventListener('change', function (ev) {
        save(function (cur) { cur.prefNames.enabled = ev.target.checked; });
      });
      document.getElementById('sound-correct').addEventListener('change', function (ev) {
        save(function (cur) { cur.sound.correctEnabled = ev.target.checked; });
      });
      document.getElementById('sound-incorrect').addEventListener('change', function (ev) {
        save(function (cur) { cur.sound.incorrectEnabled = ev.target.checked; });
      });
      document.querySelectorAll('[data-volume]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var v = parseInt(btn.getAttribute('data-volume'), 10);
          save(function (cur) { cur.sound.volume = v; });
          document.querySelectorAll('[data-volume]').forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
          global.App.Audio.playCorrect();
        });
      });
      document.getElementById('reset-questions').addEventListener('click', function () {
        if (!confirm('問題データを初期状態に戻します。追加・編集した問題は失われます。よろしいですか？')) return;
        global.App.Storage.resetQuestionsToDefault();
        alert('問題データを初期状態に戻しました。');
      });
    }
  };

  global.App.Router.register('settings', SettingsScreen);
})(window);
