(function (global) {
  'use strict';

  var Prefectures = global.App.Prefectures;

  /**
   * 出題タイプごとの処理を登録するレジストリ。
   * Ver1 は 'tap_prefecture' のみだが、将来
   *   capital       (県庁所在地クイズ)
   *   specialty     (名産品クイズ)
   *   famous_person (有名人クイズ)
   *   landmark      (名所クイズ)
   *   silhouette    (シルエットクイズ)
   * などを追加する際は、ここに同じ形の
   * { instruction(question), checkAnswer(question, picked) } を足すだけでよい。
   * 問題データ側の type にこれらの文字列を入れれば、このレジストリが拾う。
   */
  var QuizTypes = {
    tap_prefecture: {
      instruction: function (q) {
        return global.App.Utils.withFurigana(q.question, Prefectures.list);
      },
      checkAnswer: function (q, code) {
        return q.answers.indexOf(code) !== -1;
      }
    }
  };
  global.App.QuizTypes = QuizTypes;

  var QuizScreen = {
    render: function (container) {
      renderStart(container);
    },
    destroy: function () {
      document.body.classList.remove('quiz-playing', 'no-scroll');
    }
  };

  function renderStart(container) {
    document.body.classList.remove('quiz-playing', 'no-scroll');
    var all = global.App.Storage.getQuestions().filter(function (q) { return QuizTypes[q.type]; });
    container.innerHTML =
      global.App.Layout.renderHeader({ title: 'クイズ', backTo: 'home' }) +
      '<main class="quiz-start-main">' +
        '<p class="section-lead">地図を見ながら、都道府県をタップして答えよう。</p>' +
        '<p class="quiz-count">問題数：' + all.length + '問</p>' +
        (all.length === 0
          ? '<p class="empty-note">問題がありません。「問題管理」から問題を追加してください。</p>'
          : '<button class="cta-button" id="quiz-start">クイズをはじめる</button>') +
      '</main>';
    global.App.Layout.bindNavButtons(container);
    var startBtn = document.getElementById('quiz-start');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        startSession(container, global.App.Utils.shuffle(all));
      });
    }
  }

  function startSession(container, questions) {
    var index = 0;
    var correctCount = 0;

    function setupZoomPan(onTap) {
      var viewport = document.getElementById('quiz-map-viewport');
      var canvas = document.getElementById('quiz-map-canvas');
      var levelLabel = document.getElementById('zoom-level');
      var resetBtn = document.getElementById('zoom-reset');

      var controller = global.App.MapInteraction.attach(viewport, canvas, {
        minScale: 1, maxScale: 2.5, step: 0.5,
        tapSelector: '.pref-tap',
        onTap: onTap,
        onScaleChange: function (scale) {
          levelLabel.textContent = Math.round(scale * 100) + '%';
          resetBtn.hidden = (scale === 1);
        }
      });

      document.getElementById('zoom-in').addEventListener('click', controller.zoomIn);
      document.getElementById('zoom-out').addEventListener('click', controller.zoomOut);
      resetBtn.addEventListener('click', controller.reset);
    }

    function renderQuestion() {
      document.body.classList.add('quiz-playing');
      var q = questions[index];
      var typeHandler = QuizTypes[q.type];

      container.innerHTML =
        global.App.Layout.renderHeader({ title: 'クイズ', backTo: 'home' }) +
        '<main class="quiz-play-main">' +
          '<div class="quiz-toolbar">' +
            '<span class="quiz-progress">' + (index + 1) + ' / ' + questions.length + '</span>' +
            '<div class="quiz-toolbar__right">' +
              '<button class="text-button" id="quiz-speak">🔊 読み上げ</button>' +
            '</div>' +
          '</div>' +
          '<p class="quiz-question" id="quiz-question">' + typeHandler.instruction(q) + '</p>' +
          '<div class="quiz-hints" id="quiz-hints"></div>' +
          '<div class="quiz-map-shell">' +
            '<div class="map-zoom-controls">' +
              '<button class="zoom-btn" id="zoom-out" aria-label="縮小">−</button>' +
              '<span class="zoom-level" id="zoom-level">100%</span>' +
              '<button class="zoom-btn" id="zoom-in" aria-label="拡大">＋</button>' +
              '<button class="zoom-reset-btn" id="zoom-reset" hidden>元に戻す</button>' +
            '</div>' +
            '<div class="quiz-map-viewport" id="quiz-map-viewport">' +
              '<div class="quiz-map-canvas" id="quiz-map-canvas"></div>' +
            '</div>' +
          '</div>' +
          '<p class="quiz-feedback" id="quiz-feedback"></p>' +
          '<div class="quiz-explanation" id="quiz-explanation" hidden></div>' +
          '<button class="cta-button" id="quiz-next" hidden>次へ</button>' +
        '</main>';
      global.App.Layout.bindNavButtons(container);

      renderHintButtons(q);

      var mapCanvas = document.getElementById('quiz-map-canvas');
      var mapSvg = global.App.SvgMap.buildQuizMap();
      mapCanvas.appendChild(mapSvg);

      var answered = false;

      document.getElementById('quiz-speak').addEventListener('click', function () {
        global.App.Audio.speak(q.question);
      });
      // 設定で読み上げがONなら自動再生
      global.App.Audio.speak(q.question);

      setupZoomPan(function (g) {
        if (answered) return;
        answered = true;
        var code = g.getAttribute('data-code');
        var isCorrect = typeHandler.checkAnswer(q, code);
        var feedback = document.getElementById('quiz-feedback');

        if (isCorrect) {
          g.classList.add('pref-correct');
          feedback.textContent = '⭕ せいかい！';
          feedback.className = 'quiz-feedback quiz-feedback--correct';
          global.App.Audio.playCorrect();
          correctCount++;
        } else {
          g.classList.add('pref-incorrect');
          feedback.textContent = '❌ ざんねん';
          feedback.className = 'quiz-feedback quiz-feedback--incorrect';
          global.App.Audio.playIncorrect();
          q.answers.forEach(function (ansCode) {
            var ansEl = global.App.SvgMap.getSlotElement(mapSvg, ansCode);
            if (ansEl) ansEl.classList.add('pref-correct');
          });
        }

        if (q.explanation) {
          var expl = document.getElementById('quiz-explanation');
          expl.hidden = false;
          expl.textContent = q.explanation;
        }
        document.getElementById('quiz-next').hidden = false;
      });

      document.getElementById('quiz-next').addEventListener('click', function () {
        index++;
        if (index >= questions.length) {
          renderResult();
        } else {
          renderQuestion();
        }
      });
    }

    function renderHintButtons(q) {
      var levels = [['easy', 'かんたん'], ['normal', 'ふつう'], ['hard', 'むずかしい']];
      var box = document.getElementById('quiz-hints');
      box.innerHTML = '';
      levels.forEach(function (pair) {
        var key = pair[0], label = pair[1];
        var hint = q.hints && q.hints[key];
        var hasValue = hint && hint.value;
        var btn = document.createElement('button');
        btn.className = 'hint-button';
        btn.textContent = '💡 ' + label;
        btn.disabled = !hasValue;
        btn.addEventListener('click', function () {
          var p = document.createElement('p');
          p.className = 'hint-text';
          p.textContent = hint.value;
          btn.replaceWith(p);
        });
        box.appendChild(btn);
      });
    }

    function renderResult() {
      document.body.classList.remove('quiz-playing', 'no-scroll');
      container.innerHTML =
        global.App.Layout.renderHeader({ title: 'クイズけっか', backTo: 'home' }) +
        '<main class="quiz-result-main">' +
          '<p class="quiz-result__score">' + correctCount + ' / ' + questions.length + ' 問正解</p>' +
          '<div class="quiz-result__actions">' +
            '<button class="cta-button" id="quiz-retry">もういちど</button>' +
            '<button class="text-button" data-nav="home">ホームに戻る</button>' +
          '</div>' +
        '</main>';
      global.App.Layout.bindNavButtons(container);
      document.getElementById('quiz-retry').addEventListener('click', function () {
        renderStart(container);
      });
    }

    renderQuestion();
  }

  global.App.Router.register('quiz', QuizScreen);
})(window);
