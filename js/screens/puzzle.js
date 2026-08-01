(function (global) {
  'use strict';

  var Prefectures = global.App.Prefectures;

  var resizeHandler = null;
  var repositionAllRef = null;

  var PuzzleScreen = {
    render: function (container, params) {
      if (!params || params.length === 0) {
        renderSelect(container);
      } else if (params[0] === 'all') {
        renderPlay(container, null);
      } else if (params[0] === 'region' && params[1]) {
        renderPlay(container, params[1]);
      } else {
        renderSelect(container);
      }
    },
    destroy: function () {
      document.body.classList.remove('puzzle-playing');
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
      }
    }
  };

  function renderSelect(container) {
    document.body.classList.remove('puzzle-playing');
    var regionButtons = Prefectures.regions.map(function (r) {
      return (
        '<button class="stamp-button stamp-button--' + r.key + '" data-nav="puzzle/region/' + r.key + '">' +
          '<span class="stamp-button__label">' + r.name + '</span>' +
        '</button>'
      );
    }).join('');

    container.innerHTML =
      global.App.Layout.renderHeader({ title: 'パズルをえらぶ', backTo: 'home' }) +
      '<main class="puzzle-select-main">' +
        '<button class="big-button big-button--all" data-nav="puzzle/all">' +
          '<span class="big-button__icon">🗾</span>' +
          '<span class="big-button__label">全国パズル</span>' +
        '</button>' +
        '<p class="section-label">地方別パズル</p>' +
        '<div class="stamp-grid">' + regionButtons + '</div>' +
      '</main>';
    global.App.Layout.bindNavButtons(container);
  }

  function renderPlay(container, regionKey) {
    document.body.classList.add('puzzle-playing');
    var title = regionKey ? Prefectures.regionName(regionKey) + 'パズル' : '全国パズル';
    container.innerHTML =
      global.App.Layout.renderHeader({ title: title, backTo: 'puzzle' }) +
      '<main class="puzzle-play-main">' +
        '<div class="puzzle-toolbar">' +
          '<div class="puzzle-progress-block">' +
            '<span class="puzzle-progress" id="puzzle-progress">0 / 0（0%）</span>' +
            '<div class="puzzle-progress-bar"><div class="puzzle-progress-bar__fill" id="puzzle-progress-fill"></div></div>' +
          '</div>' +
          '<button class="text-button" id="puzzle-retry">🔄 やりなおす</button>' +
        '</div>' +
        '<div class="puzzle-stage" id="puzzle-stage">' +
          '<div class="puzzle-board-shell">' +
          '<div class="map-zoom-controls">' +
            '<button class="zoom-btn" id="board-zoom-out" aria-label="縮小">−</button>' +
            '<span class="zoom-level" id="board-zoom-level">100%</span>' +
            '<button class="zoom-btn" id="board-zoom-in" aria-label="拡大">＋</button>' +
            '<button class="zoom-reset-btn" id="board-zoom-reset" hidden>元に戻す</button>' +
          '</div>' +
          '<div class="puzzle-board-viewport" id="puzzle-board-viewport">' +
            '<div class="puzzle-board-canvas" id="puzzle-board-canvas"></div>' +
          '</div>' +
        '</div>' +
          '<div class="puzzle-workspace" id="puzzle-workspace">' +
            '<p class="puzzle-workspace__label">🧩 ピースエリア（ここから地図へドラッグしよう）</p>' +
          '</div>' +
          '<div class="puzzle-piece-layer" id="puzzle-piece-layer"></div>' +
        '</div>' +
        '<div class="puzzle-complete" id="puzzle-complete" hidden>' +
          '<p class="puzzle-complete__title">🎉 かんせい！</p>' +
          '<div class="puzzle-complete__actions">' +
            '<button class="cta-button" id="puzzle-again">もういちど</button>' +
            '<button class="text-button" data-nav="puzzle">他のパズルへ</button>' +
          '</div>' +
        '</div>' +
      '</main>';
    global.App.Layout.bindNavButtons(container);

    setupPuzzle(container, regionKey);

    document.getElementById('puzzle-retry').addEventListener('click', function () {
      setupPuzzle(container, regionKey);
    });
  }

  var PIECE_CELL = 86; // 作業スペースに置くときの1個あたりの目安サイズ(px)
  var PIECE_MIN_DIM = 50; // どんなに細長い形でも、これより小さくはしない(つかみやすさ優先)

  function setupPuzzle(container, regionKey) {
    var stage = document.getElementById('puzzle-stage');
    var boardCanvas = document.getElementById('puzzle-board-canvas');
    var boardViewport = document.getElementById('puzzle-board-viewport');
    var workspace = document.getElementById('puzzle-workspace');
    var pieceLayer = document.getElementById('puzzle-piece-layer');
    var completeBox = document.getElementById('puzzle-complete');
    completeBox.hidden = true;
    boardCanvas.innerHTML = '';
    pieceLayer.innerHTML = '';
    workspace.innerHTML = '<p class="puzzle-workspace__label">🧩 ピースエリア（ここから地図へドラッグしよう）</p>';

    var board = global.App.SvgMap.buildBoard(regionKey);
    boardCanvas.appendChild(board.svg);
    var showNames = global.App.Storage.getSettings().prefNames.enabled;
    global.App.SvgMap.addNameLabels(board.svg);
    board.svg.classList.toggle('show-names', showNames);

    var boardZoomLevel = document.getElementById('board-zoom-level');
    var boardZoomReset = document.getElementById('board-zoom-reset');
    var boardZoom = global.App.MapInteraction.attach(boardViewport, boardCanvas, {
      minScale: 1, maxScale: 3, step: 0.5,
      tapSelector: '.pref-slot-unused',
      onScaleChange: function (scale) {
        boardZoomLevel.textContent = Math.round(scale * 100) + '%';
        boardZoomReset.hidden = (scale === 1);
      }
    });
    document.getElementById('board-zoom-in').addEventListener('click', boardZoom.zoomIn);
    document.getElementById('board-zoom-out').addEventListener('click', boardZoom.zoomOut);
    boardZoomReset.addEventListener('click', boardZoom.reset);

    var codes = global.App.Utils.shuffle(board.codes);
    var placed = {};
    var total = codes.length;
    // pos[code] = { xFrac, yFrac } … ステージ全体に対する割合位置（未完成のピースのみ持つ）
    var pos = {};
    var pieces = {}; // code -> { el }

    updateProgress();

    // 作業スペースの高さを、ピース数がちゃんと収まるように確保する
    // ピースエリア(workspace)は常に画面に収まる高さのまま固定し、
    // 中のピース（絶対配置）だけがそれより下にはみ出す形にする。
    // ここで workspace 自体の高さを内容に合わせて伸ばしてしまうと、
    // 外側の puzzle-stage 側の overflow:hidden で切り取られてしまい、
    // workspace 自身の縦スクロールが効かなくなるため、高さは変更しない。
    function sizeWorkspace() {
      var wsWidth = workspace.getBoundingClientRect().width || stage.getBoundingClientRect().width || 320;
      var cols = Math.max(1, Math.floor(wsWidth / PIECE_CELL));
      var rows = Math.ceil(total / cols);
      return { cols: cols, rows: rows };
    }

    function stageRect() { return stage.getBoundingClientRect(); }

    function rectRelTo(rect, baseRect) {
      return {
        left: rect.left - baseRect.left,
        top: rect.top - baseRect.top,
        width: rect.width,
        height: rect.height
      };
    }

    function scatterInitialPositions(grid) {
      var wsRect = workspace.getBoundingClientRect();
      codes.forEach(function (code, i) {
        var col = i % grid.cols;
        var row = Math.floor(i / grid.cols);
        var cx = col * PIECE_CELL + PIECE_CELL / 2 + (Math.random() - 0.5) * PIECE_CELL * 0.3;
        var cy = row * PIECE_CELL + PIECE_CELL / 2 + (Math.random() - 0.5) * PIECE_CELL * 0.3;
        pos[code] = { xFrac: cx / wsRect.width, yFrac: cy / Math.max(wsRect.height, 1) };
      });
    }

    // ピースの表示サイズを、形の縦横比に応じて決める。
    // どんなに小さい・細長い都道府県でも PIECE_MIN_DIM を下回らないようにし、
    // 「見つけやすく・つかみやすい」ことを実際の縮尺の正確さより優先する。
    function pieceBoxSize(aspect) {
      var base = Math.round(PIECE_CELL * 0.78);
      var a = aspect && isFinite(aspect) && aspect > 0 ? aspect : 1;
      var w, h;
      if (a >= 1) {
        w = base; h = base / a;
        if (h < PIECE_MIN_DIM) { h = PIECE_MIN_DIM; w = Math.round(h * a); }
      } else {
        h = base; w = base * a;
        if (w < PIECE_MIN_DIM) { w = PIECE_MIN_DIM; h = Math.round(w / a); }
      }
      return { width: Math.round(w), height: Math.round(h) };
    }

    function applyFreePosition(pieceEl, code) {
      var sRect = stageRect();
      var size = pieceBoxSize(pieces[code] && pieces[code].aspect);
      var cx = pos[code].xFrac * sRect.width;
      var cy = pos[code].yFrac * sRect.height;
      pieceEl.style.width = size.width + 'px';
      pieceEl.style.height = size.height + 'px';
      pieceEl.style.left = (cx - size.width / 2) + 'px';
      pieceEl.style.top = (cy - size.height / 2) + 'px';
    }

    // ピースエリア(workspace)にまだ置かれたままの、一度も持ち上げていない
    // ピース用の位置決め。workspace 自身のスクロール領域を基準にするので、
    // ピース数が多くて画面からはみ出しても workspace を縦スクロールすれば
    // 必ずすべてのピースにたどり着ける。
    function applyTrayPosition(pieceEl, code) {
      var wsRect = workspace.getBoundingClientRect();
      var size = pieceBoxSize(pieces[code] && pieces[code].aspect);
      var cx = pos[code].xFrac * wsRect.width;
      var cy = pos[code].yFrac * wsRect.height;
      pieceEl.style.width = size.width + 'px';
      pieceEl.style.height = size.height + 'px';
      pieceEl.style.left = (cx - size.width / 2) + 'px';
      pieceEl.style.top = (cy - size.height / 2) + 'px';
    }

    // ピースを「ピースエリアに収まっている状態」から「地図をまたいで自由に
    // 動かせる状態」へ切り替える。最初に持ち上げた瞬間に一度だけ呼ばれる。
    // 見た目の位置は変えず、座標の基準だけを workspace → stage に付け替える。
    function detachFromTray(pieceEl, code) {
      if (pieces[code].isFree) return;
      var rect = pieceEl.getBoundingClientRect();
      var sRect = stageRect();
      pieceEl.style.left = (rect.left - sRect.left) + 'px';
      pieceEl.style.top = (rect.top - sRect.top) + 'px';
      pieceEl.style.width = rect.width + 'px';
      pieceEl.style.height = rect.height + 'px';
      pieceLayer.appendChild(pieceEl);
      pieces[code].isFree = true;
    }

    function repositionAll() {
      Object.keys(pieces).forEach(function (code) {
        var p = pieces[code];
        if (p.isFree) {
          applyFreePosition(p.el, code);
        } else {
          applyTrayPosition(p.el, code);
        }
      });
    }
    repositionAllRef = repositionAll;

    function updateProgress() {
      var n = Object.keys(placed).length;
      var pct = total > 0 ? Math.round((n / total) * 100) : 0;
      document.getElementById('puzzle-progress').textContent = n + ' / ' + total + '（' + pct + '%）';
      document.getElementById('puzzle-progress-fill').style.width = pct + '%';
      if (n === total && total > 0) {
        setTimeout(function () { completeBox.hidden = false; }, 300);
      }
    }

    // 吸着の許容範囲。「ふつう」を現在の基準とする。将来、設定画面に
    // 難易度(かんたん/ふつう/むずかしい)を追加する際は、ここではなく
    // js/storage.js の settings.puzzle.difficulty を切り替えるだけでよい。
    //   かんたん: 許容範囲を広め + ヒント表示あり
    //   ふつう  : 標準の許容範囲（現在の基準の判定）
    //   むずかしい: 許容範囲を狭め + 補助なし
    var DIFFICULTY_PRESETS = {
      easy:   { toleranceRatio: 1.0,  toleranceExtra: 36 },
      normal: { toleranceRatio: 0.5,  toleranceExtra: 18 },
      hard:   { toleranceRatio: 0.3,  toleranceExtra: 6 }
    };
    var currentDifficulty = (global.App.Storage.getSettings().puzzle || {}).difficulty || 'normal';

    // 正しいスロットとの「近さ」を判定する。ドラッグ中には使わず、
    // 指(マウス)を離した時点でのみ判定する。
    function proximityToCorrectSlot(pieceEl, code) {
      var slotEl = global.App.SvgMap.getSlotElement(board.svg, code);
      var mainRect = global.App.SvgMap.getSlotMainShapeRect(board.svg, code);
      if (!slotEl || !mainRect) return { within: false };
      var pieceRect = pieceEl.getBoundingClientRect();
      var slotCenter = { x: mainRect.left + mainRect.width / 2, y: mainRect.top + mainRect.height / 2 };
      var pieceCenter = { x: pieceRect.left + pieceRect.width / 2, y: pieceRect.top + pieceRect.height / 2 };
      var dist = Math.hypot(slotCenter.x - pieceCenter.x, slotCenter.y - pieceCenter.y);
      var preset = DIFFICULTY_PRESETS[currentDifficulty] || DIFFICULTY_PRESETS.normal;
      var threshold = Math.max(mainRect.width, mainRect.height) * preset.toleranceRatio + preset.toleranceExtra;
      return { within: dist <= threshold, slotEl: slotEl };
    }

    function clampToStage(left, top, w, h) {
      var sRect = stageRect();
      var maxLeft = Math.max(0, sRect.width - w);
      var maxTop = Math.max(0, sRect.height - h);
      return {
        left: Math.min(Math.max(0, left), maxLeft),
        top: Math.min(Math.max(0, top), maxTop)
      };
    }

    function attachDrag(el, code) {
      var dragState = null;
      var longPressTimer = null;
      var LONG_PRESS_MS = 380;
      var MOVE_CANCEL_DIST = 6;

      function cancelLongPress() {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        el.classList.remove('name-revealed');
      }

      el.addEventListener('pointerdown', function (ev) {
        if (placed[code]) return;
        ev.preventDefault();
        detachFromTray(el, code);
        el.setPointerCapture(ev.pointerId);
        el.classList.add('dragging');
        el.style.zIndex = 50;
        var rect = el.getBoundingClientRect();
        dragState = {
          pointerId: ev.pointerId,
          offsetX: ev.clientX - rect.left,
          offsetY: ev.clientY - rect.top,
          startX: ev.clientX,
          startY: ev.clientY,
          size: rect.width
        };
        if (!showNames) {
          longPressTimer = setTimeout(function () {
            el.classList.add('name-revealed');
          }, LONG_PRESS_MS);
        }
      });

      el.addEventListener('pointermove', function (ev) {
        if (!dragState || ev.pointerId !== dragState.pointerId) return;
        var moved = Math.hypot(ev.clientX - dragState.startX, ev.clientY - dragState.startY);
        if (moved > MOVE_CANCEL_DIST) cancelLongPress();
        var sRect = stageRect();
        var left = ev.clientX - sRect.left - dragState.offsetX;
        var top = ev.clientY - sRect.top - dragState.offsetY;
        el.style.left = left + 'px';
        el.style.top = top + 'px';
        // ドラッグ中は色を変えない。判定は指を離した時(endDrag)にのみ行う。
      });

      function endDrag(ev) {
        if (!dragState || ev.pointerId !== dragState.pointerId) return;
        cancelLongPress();
        el.classList.remove('dragging');
        el.style.zIndex = '';
        dragState = null;

        var prox = proximityToCorrectSlot(el, code);
        if (prox.within) {
          placed[code] = true;
          delete pos[code];
          el.classList.add('piece-placed');
          prox.slotEl.classList.add('slot-filled');
          global.App.Audio.playCorrect();
          updateProgress();

          // ピースは地図の上に残さない: 正解位置へ吸い込まれるように小さくなって消える。
          // 消えた後の地図側は、県境が見えたまま完成色で塗りつぶされて「配置済み」を表す。
          var mainRect = global.App.SvgMap.getSlotMainShapeRect(board.svg, code);
          if (mainRect) {
            var r = rectRelTo(mainRect, stageRect());
            var cx = r.left + r.width / 2;
            var cy = r.top + r.height / 2;
            el.style.left = cx + 'px';
            el.style.top = cy + 'px';
            el.style.width = '0px';
            el.style.height = '0px';
          } else {
            el.style.opacity = '0';
          }
          setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
          }, 260);
          delete pieces[code];
        } else {
          // 正解でなければ、今いる場所にそのまま自由に置ける（ステージ内にクランプするのみ）
          var sRect = stageRect();
          var box = pieceBoxSize(pieces[code] && pieces[code].aspect);
          var w = parseFloat(el.style.width) || box.width;
          var h = parseFloat(el.style.height) || box.height;
          var clamped = clampToStage(parseFloat(el.style.left) || 0, parseFloat(el.style.top) || 0, w, h);
          el.style.left = clamped.left + 'px';
          el.style.top = clamped.top + 'px';
          pos[code] = {
            xFrac: (clamped.left + w / 2) / sRect.width,
            yFrac: (clamped.top + h / 2) / sRect.height
          };
        }
      }

      el.addEventListener('pointerup', endDrag);
      el.addEventListener('pointercancel', endDrag);
    }

    function buildAllPieces() {
      var grid = sizeWorkspace();
      scatterInitialPositions(grid);
      codes.forEach(function (code) {
        var built = global.App.SvgMap.buildPiece(code);
        if (!built) return;
        var el = document.createElement('div');
        el.className = 'puzzle-piece';
        el.setAttribute('data-code', code);
        el.appendChild(built.svg);
        var nameLabel = document.createElement('span');
        nameLabel.className = 'piece-name-label';
        nameLabel.textContent = (Prefectures.byCode[code] || {}).name || '';
        el.appendChild(nameLabel);
        el.classList.toggle('show-name', showNames);
        workspace.appendChild(el);
        pieces[code] = { el: el, aspect: built.aspect, isFree: false };
        applyTrayPosition(el, code);
        attachDrag(el, code);
      });
    }

    buildAllPieces();

    document.getElementById('puzzle-again').addEventListener('click', function () {
      setupPuzzle(container, regionKey);
    });

    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    resizeHandler = global.App.Utils.debounce(function () {
      sizeWorkspace();
      if (repositionAllRef) repositionAllRef();
    }, 150);
    window.addEventListener('resize', resizeHandler);
  }

  global.App.Router.register('puzzle', PuzzleScreen);
})(window);
