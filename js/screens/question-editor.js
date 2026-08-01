(function (global) {
  'use strict';

  var Prefectures = global.App.Prefectures;
  var Utils = global.App.Utils;

  function blankQuestion() {
    return {
      id: Utils.generateId('q'),
      type: 'tap_prefecture',
      question: '',
      answers: [],
      tag: [],
      hints: {
        easy: { type: 'text', value: '' },
        normal: { type: 'text', value: '' },
        hard: { type: 'text', value: '' }
      },
      explanation: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // container に問題編集フォームを描画する。existing が null なら新規作成。
  function renderForm(container, existing) {
    var isNew = !existing;
    var data = existing ? JSON.parse(JSON.stringify(existing)) : blankQuestion();
    if (!Array.isArray(data.tag)) data.tag = data.tag ? [data.tag] : [];

    container.innerHTML =
      global.App.Layout.renderHeader({ title: isNew ? '新しい問題' : '問題を編集', backTo: 'questions' }) +
      '<main class="qedit-main">' +
        '<label class="field-label" for="f-question">問題文</label>' +
        '<textarea id="f-question" class="text-area" rows="2" placeholder="例: 北海道をタップしてください"></textarea>' +

        '<label class="field-label">答え（都道府県・複数選択可）</label>' +
        '<input type="search" id="f-answer-filter" class="text-input" placeholder="都道府県名で絞り込み">' +
        '<div class="answer-chips" id="answer-chips"></div>' +
        '<div class="pref-picker" id="pref-picker"></div>' +

        '<label class="field-label" for="f-tag">タグ（読点・カンマ区切りで複数可）</label>' +
        '<input type="text" id="f-tag" class="text-input" placeholder="例: 東北, 有名">' +

        '<label class="field-label" for="f-hint-easy">ヒント（かんたん）</label>' +
        '<textarea id="f-hint-easy" class="text-area" rows="2"></textarea>' +

        '<label class="field-label" for="f-hint-normal">ヒント（ふつう）</label>' +
        '<textarea id="f-hint-normal" class="text-area" rows="2"></textarea>' +

        '<label class="field-label" for="f-hint-hard">ヒント（むずかしい）</label>' +
        '<textarea id="f-hint-hard" class="text-area" rows="2"></textarea>' +

        '<label class="field-label" for="f-explanation">解説</label>' +
        '<textarea id="f-explanation" class="text-area" rows="3"></textarea>' +

        '<div class="duplicate-panel" id="duplicate-panel" hidden></div>' +

        '<div class="qedit-actions">' +
          '<button class="cta-button" id="save-question">保存する</button>' +
          '<button class="text-button" data-nav="questions">キャンセル</button>' +
        '</div>' +
      '</main>';
    global.App.Layout.bindNavButtons(container);

    document.getElementById('f-question').value = data.question;
    document.getElementById('f-tag').value = data.tag.join(', ');
    document.getElementById('f-hint-easy').value = (data.hints.easy && data.hints.easy.value) || '';
    document.getElementById('f-hint-normal').value = (data.hints.normal && data.hints.normal.value) || '';
    document.getElementById('f-hint-hard').value = (data.hints.hard && data.hints.hard.value) || '';
    document.getElementById('f-explanation').value = data.explanation || '';

    var selectedCodes = data.answers.slice();
    renderChips();
    renderPicker('');

    document.getElementById('f-answer-filter').addEventListener('input', Utils.debounce(function (ev) {
      renderPicker(ev.target.value.trim());
    }, 100));

    function renderChips() {
      var box = document.getElementById('answer-chips');
      if (selectedCodes.length === 0) {
        box.innerHTML = '<span class="answer-chips__empty">まだ選ばれていません</span>';
        return;
      }
      box.innerHTML = selectedCodes.map(function (code) {
        var p = Prefectures.byCode[code];
        return '<span class="chip">' + p.name + '<button class="chip__remove" data-remove="' + code + '">×</button></span>';
      }).join('');
      box.querySelectorAll('[data-remove]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var code = btn.getAttribute('data-remove');
          selectedCodes = selectedCodes.filter(function (c) { return c !== code; });
          renderChips();
          renderPicker(document.getElementById('f-answer-filter').value.trim());
        });
      });
    }

    function renderPicker(filterText) {
      var picker = document.getElementById('pref-picker');
      picker.innerHTML = Prefectures.regions.map(function (r) {
        var prefs = Prefectures.byRegion[r.key].filter(function (p) {
          return !filterText || p.name.indexOf(filterText) !== -1 || p.kana.indexOf(filterText) !== -1;
        });
        if (prefs.length === 0) return '';
        return (
          '<div class="pref-picker__group">' +
            '<p class="pref-picker__region">' + r.name + '</p>' +
            '<div class="pref-picker__list">' +
              prefs.map(function (p) {
                var checked = selectedCodes.indexOf(p.code) !== -1 ? ' checked' : '';
                return (
                  '<label class="pref-check">' +
                    '<input type="checkbox" value="' + p.code + '"' + checked + '>' +
                    '<span>' + p.name + '</span>' +
                  '</label>'
                );
              }).join('') +
            '</div>' +
          '</div>'
        );
      }).join('');

      picker.querySelectorAll('input[type=checkbox]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var code = cb.value;
          if (cb.checked) {
            if (selectedCodes.indexOf(code) === -1) selectedCodes.push(code);
          } else {
            selectedCodes = selectedCodes.filter(function (c) { return c !== code; });
          }
          renderChips();
        });
      });
    }

    var duplicatesShown = false;

    document.getElementById('save-question').addEventListener('click', function () {
      var draft = collectDraft();
      if (!draft.question.trim()) {
        alert('問題文を入力してください。');
        return;
      }
      if (draft.answers.length === 0) {
        alert('答えを1つ以上選んでください。');
        return;
      }

      if (!duplicatesShown) {
        var dups = findSimilar(draft);
        if (dups.length > 0) {
          showDuplicates(dups);
          duplicatesShown = true;
          document.getElementById('save-question').textContent = 'このまま保存する';
          return;
        }
      }
      persist(draft);
    });

    function collectDraft() {
      var tagRaw = document.getElementById('f-tag').value;
      var tags = tagRaw.split(/[,、]/).map(function (t) { return t.trim(); }).filter(Boolean);
      return Object.assign({}, data, {
        question: document.getElementById('f-question').value,
        answers: selectedCodes.slice(),
        tag: tags,
        hints: {
          easy: { type: 'text', value: document.getElementById('f-hint-easy').value },
          normal: { type: 'text', value: document.getElementById('f-hint-normal').value },
          hard: { type: 'text', value: document.getElementById('f-hint-hard').value }
        },
        explanation: document.getElementById('f-explanation').value,
        updatedAt: new Date().toISOString()
      });
    }

    function findSimilar(draft) {
      var all = global.App.Storage.getQuestions().filter(function (q) { return q.id !== draft.id; });
      return all.filter(function (q) {
        var sim = Utils.textSimilarity(q.question, draft.question);
        var overlap = Utils.overlapAnswers(q.answers, draft.answers);
        // 「同じ答えを含み、文もそこそこ似ている」か「文がほぼ同一」の場合に候補表示する。
        // テンプレート的な文（〜をタップしてください等）は語尾が共通しやすく、
        // 答えが違う問題同士でも見かけの類似度が上がるため、答えの一致も考慮する。
        return (overlap && sim > 0.3) || sim > 0.8;
      }).slice(0, 5);
    }

    function showDuplicates(dups) {
      var panel = document.getElementById('duplicate-panel');
      panel.hidden = false;
      panel.innerHTML =
        '<p class="duplicate-panel__title">似ている問題があります（保存は可能です）</p>' +
        '<ul class="duplicate-panel__list">' +
          dups.map(function (q) {
            var names = q.answers.map(function (c) { return Prefectures.byCode[c] ? Prefectures.byCode[c].name : c; }).join('・');
            return '<li><strong>' + Utils.escapeHtml(q.question) + '</strong>（答え: ' + Utils.escapeHtml(names) + '）</li>';
          }).join('') +
        '</ul>';
    }

    function persist(draft) {
      var all = global.App.Storage.getQuestions();
      var idx = all.findIndex(function (q) { return q.id === draft.id; });
      if (idx === -1) {
        all.push(draft);
      } else {
        all[idx] = draft;
      }
      global.App.Storage.saveQuestions(all);
      global.App.Router.navigate('questions');
    }
  }

  global.App = global.App || {};
  global.App.QuestionEditor = { renderForm: renderForm };
})(window);
