(function (global) {
  'use strict';

  var Prefectures = global.App.Prefectures;

  // 問題タイプごとの日本語表示名。将来 capital / specialty / famous_person /
  // landmark / silhouette 等を追加したら、ここにも表示名を足すこと。
  var TYPE_LABELS = {
    tap_prefecture: 'タップ（都道府県）'
  };
  function typeLabel(type) {
    return TYPE_LABELS[type] || type;
  }

  var QuestionListScreen = {
    render: function (container, params) {
      if (params && params[0] === 'new') {
        global.App.QuestionEditor.renderForm(container, null);
        return;
      }
      if (params && params[0] === 'edit' && params[1]) {
        var existing = global.App.Storage.getQuestions().filter(function (q) { return q.id === params[1]; })[0];
        global.App.QuestionEditor.renderForm(container, existing || null);
        return;
      }
      renderList(container);
    }
  };

  function renderList(container) {
    // 検索のたびに localStorage を読み直さず、画面を開いた時点の内容を
    // メモリ上に保持しておく（問題数が増えても検索がもたつかないように）。
    // 追加・削除・取り込みなど、データが変わる操作をしたら明示的に読み直す。
    var questions = global.App.Storage.getQuestions();

    var typeOptions = Object.keys(TYPE_LABELS).map(function (t) {
      return '<option value="' + t + '">' + global.App.Utils.escapeHtml(typeLabel(t)) + '</option>';
    }).join('');

    container.innerHTML =
      global.App.Layout.renderHeader({ title: '問題管理', backTo: 'home' }) +
      '<main class="qlist-main">' +
        '<div class="qlist-search">' +
          '<input type="search" id="search-question" class="text-input" placeholder="問題文で検索">' +
          '<input type="search" id="search-answer" class="text-input" placeholder="答えの県名で検索">' +
          '<select id="search-type" class="text-input">' +
            '<option value="">すべてのタイプ</option>' +
            typeOptions +
          '</select>' +
        '</div>' +
        '<button class="cta-button" id="new-question">＋ 新しい問題を追加</button>' +
        '<p class="qlist-count" id="qlist-count"></p>' +
        '<ul class="qlist" id="qlist"></ul>' +
      '</main>';
    global.App.Layout.bindNavButtons(container);

    document.getElementById('new-question').addEventListener('click', function () {
      global.App.Router.navigate('questions/new');
    });

    var searchQ = document.getElementById('search-question');
    var searchA = document.getElementById('search-answer');
    var searchType = document.getElementById('search-type');
    var rerender = global.App.Utils.debounce(function () { renderRows(); }, 150);
    searchQ.addEventListener('input', rerender);
    searchA.addEventListener('input', rerender);
    searchType.addEventListener('change', rerender);

    function renderRows() {
      var qFilter = searchQ.value.trim();
      var aFilter = searchA.value.trim();
      var typeFilter = searchType.value;

      var filtered = questions.filter(function (q) {
        var matchQ = !qFilter || (q.question || '').indexOf(qFilter) !== -1;
        var matchA = !aFilter || q.answers.some(function (code) {
          var p = Prefectures.byCode[code];
          return p && (p.fullName.indexOf(aFilter) !== -1 || p.name.indexOf(aFilter) !== -1 || p.kana.indexOf(aFilter) !== -1);
        });
        var matchType = !typeFilter || q.type === typeFilter;
        return matchQ && matchA && matchType;
      });

      document.getElementById('qlist-count').textContent = filtered.length + ' 件 / 全 ' + questions.length + ' 件';

      var listEl = document.getElementById('qlist');
      if (questions.length === 0) {
        listEl.innerHTML = '<li class="qlist-empty">まだ問題がありません。「＋ 新しい問題を追加」から作成してください。</li>';
        return;
      }
      if (filtered.length === 0) {
        listEl.innerHTML = '<li class="qlist-empty">条件に一致する問題が見つかりませんでした。</li>';
        return;
      }
      listEl.innerHTML = filtered.map(function (q) {
        var answerNames = q.answers.map(function (code) {
          var p = Prefectures.byCode[code];
          return p ? p.name : code;
        }).join('・');
        var tags = (Array.isArray(q.tag) ? q.tag : [q.tag]).filter(Boolean).map(function (t) {
          return Prefectures.byRegion[t] ? Prefectures.regionName(t) : t;
        }).join(' / ');
        return (
          '<li class="qlist-item">' +
            '<div class="qlist-item__body" data-edit="' + q.id + '">' +
              '<p class="qlist-item__question">' + global.App.Utils.escapeHtml(q.question) + '</p>' +
              '<p class="qlist-item__meta">' +
                '答え: ' + global.App.Utils.escapeHtml(answerNames) +
                (tags ? ' ／ タグ: ' + global.App.Utils.escapeHtml(tags) : '') +
                ' ／ ' + global.App.Utils.escapeHtml(typeLabel(q.type)) +
              '</p>' +
            '</div>' +
            '<div class="qlist-item__actions">' +
              '<button class="icon-button" data-edit="' + q.id + '" aria-label="編集">✏️</button>' +
              '<button class="icon-button" data-delete="' + q.id + '" aria-label="削除">🗑️</button>' +
            '</div>' +
          '</li>'
        );
      }).join('');

      listEl.querySelectorAll('[data-edit]').forEach(function (el) {
        el.addEventListener('click', function () {
          global.App.Router.navigate('questions/edit/' + el.getAttribute('data-edit'));
        });
      });
      listEl.querySelectorAll('[data-delete]').forEach(function (el) {
        el.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var id = el.getAttribute('data-delete');
          if (!confirm('この問題を削除しますか？')) return;
          questions = global.App.Storage.getQuestions().filter(function (q) { return q.id !== id; });
          global.App.Storage.saveQuestions(questions);
          renderRows();
        });
      });
    }

    renderRows();
  }

  global.App.Router.register('questions', QuestionListScreen);
})(window);
