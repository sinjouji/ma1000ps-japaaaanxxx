(function (global) {
  'use strict';

  var ExportScreen = {
    render: function (container) {
      var questions = global.App.Storage.getQuestions();
      container.innerHTML =
        global.App.Layout.renderHeader({ title: 'データ書き出し', backTo: 'home' }) +
        '<main class="dataio-main">' +
          '<p class="section-lead">現在の問題データ（' + questions.length + '件）をJSONファイルとして書き出します。</p>' +
          '<button class="cta-button" id="do-export">📤 書き出す</button>' +
          '<p class="dataio-note" id="export-note"></p>' +
        '</main>';
      global.App.Layout.bindNavButtons(container);

      document.getElementById('do-export').addEventListener('click', function () {
        try {
          var payload = global.App.Storage.exportData();
          var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          var stamp = new Date().toISOString().slice(0, 10);
          a.href = url;
          a.download = 'pref-puzzle-quiz-questions-' + stamp + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          document.getElementById('export-note').textContent = '書き出しました。';
        } catch (e) {
          document.getElementById('export-note').textContent = '書き出しに失敗しました: ' + e.message;
        }
      });
    }
  };

  var ImportScreen = {
    render: function (container) {
      container.innerHTML =
        global.App.Layout.renderHeader({ title: 'データ取り込み', backTo: 'home' }) +
        '<main class="dataio-main">' +
          '<p class="section-lead">書き出したJSONファイルを選ぶと、内容を確認してから今のデータに追加（マージ）できます。既存データは削除されません。</p>' +
          '<input type="file" accept="application/json" id="import-file" class="file-input">' +
          '<div class="dataio-preview" id="import-preview" hidden></div>' +
          '<p class="dataio-note" id="import-note"></p>' +
        '</main>';
      global.App.Layout.bindNavButtons(container);

      var pendingPayload = null;

      document.getElementById('import-file').addEventListener('change', function (ev) {
        var file = ev.target.files[0];
        var note = document.getElementById('import-note');
        var preview = document.getElementById('import-preview');
        pendingPayload = null;
        preview.hidden = true;
        note.textContent = '';
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function () {
          try {
            var payload = JSON.parse(reader.result);
            if (!payload || !Array.isArray(payload.questions)) {
              throw new Error('questions 配列が見つかりません');
            }
            pendingPayload = payload;
            var currentTotal = global.App.Storage.getQuestions().length;
            preview.hidden = false;
            preview.innerHTML =
              '<p class="dataio-preview__summary">このファイルには <strong>' + payload.questions.length + ' 件</strong> の問題が含まれています。</p>' +
              '<p class="dataio-preview__summary">現在のデータ（' + currentTotal + ' 件）に追加され、合計 ' + (currentTotal + payload.questions.length) + ' 件になります。</p>' +
              '<button class="cta-button" id="confirm-import">この内容を取り込む</button>';
            document.getElementById('confirm-import').addEventListener('click', function () {
              try {
                var result = global.App.Storage.importData(pendingPayload);
                note.textContent = result.added + ' 件の問題を追加しました（合計 ' + result.total + ' 件）。';
                preview.hidden = true;
                pendingPayload = null;
                document.getElementById('import-file').value = '';
              } catch (e) {
                note.textContent = '取り込みに失敗しました: ' + e.message;
              }
            });
          } catch (e) {
            note.textContent = 'ファイルを読み込めませんでした: ' + e.message;
          }
        };
        reader.readAsText(file);
      });
    }
  };

  global.App.Router.register('data-export', ExportScreen);
  global.App.Router.register('data-import', ImportScreen);
})(window);
