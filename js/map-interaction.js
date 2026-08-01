/**
 * 地図の「拡大縮小・ドラッグ移動・タップ判定」を共通化したコントローラー。
 * ---------------------------------------------------------
 * クイズ画面で最初に使っているが、将来のシルエットクイズ・ヒント演出・
 * 学習モードなど「同じ地図操作が必要な画面」から共通で呼び出せるように、
 * 画面固有のUI（ボタンの見た目や配置）とは切り離してある。
 *
 * 使い方:
 *   var controller = App.MapInteraction.attach(viewportEl, canvasEl, {
 *     onTap: function (prefGroupEl) { ... },   // 一定以上動かさずに指を離した時に呼ばれる
 *     onScaleChange: function (scale) { ... }, // 表示中の倍率が変わった時に呼ばれる
 *     tapSelector: '.pref-tap'                 // タップ対象を探すためのセレクタ
 *   });
 *   controller.zoomIn(); controller.zoomOut(); controller.reset();
 *
 * viewportEl: overflow:hidden の外枠。canvasEl: 実際に transform を当てる内側の要素。
 */
(function (global) {
  'use strict';

  function attach(viewport, canvas, options) {
    options = options || {};
    var MIN_SCALE = options.minScale || 1;
    var MAX_SCALE = options.maxScale || 2.5;
    var STEP = options.step || 0.5;
    var tapSelector = options.tapSelector || '.pref-tap';
    var onTap = options.onTap || function () {};
    var onScaleChange = options.onScaleChange || function () {};

    var scale = MIN_SCALE, panX = 0, panY = 0;

    function apply() {
      canvas.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + scale + ')';
      onScaleChange(scale);
    }

    function setScale(next) {
      scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(next * 10) / 10));
    }

    function zoomIn() { setScale(scale + STEP); apply(); }
    function zoomOut() {
      setScale(scale - STEP);
      if (scale === MIN_SCALE) { panX = 0; panY = 0; }
      apply();
    }
    function reset() { scale = MIN_SCALE; panX = 0; panY = 0; apply(); }

    // --- ドラッグでの移動 & ピンチでの拡大縮小、タップの判定 (Pointer Events) ---
    // ネイティブの click に頼ると setPointerCapture の影響で対象がずれる可能性が
    // あるため、指を離した座標から elementFromPoint で直接タップ対象を判定する。
    var pointers = {}; // pointerId -> {x, y}
    var pinchStartDist = 0;
    var pinchStartScale = MIN_SCALE;
    var moveAccum = 0;
    var singlePointerId = null;

    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function pointerIds() { return Object.keys(pointers); }

    function onPointerDown(ev) {
      viewport.setPointerCapture(ev.pointerId);
      pointers[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      moveAccum = 0;
      if (pointerIds().length === 1) singlePointerId = ev.pointerId;
      if (pointerIds().length === 2) {
        var ids = pointerIds();
        pinchStartDist = dist(pointers[ids[0]], pointers[ids[1]]);
        pinchStartScale = scale;
      }
    }

    function onPointerMove(ev) {
      if (!pointers[ev.pointerId]) return;
      var prev = pointers[ev.pointerId];
      var dx = ev.clientX - prev.x, dy = ev.clientY - prev.y;
      pointers[ev.pointerId] = { x: ev.clientX, y: ev.clientY };

      var ids = pointerIds();
      if (ids.length === 2) {
        var newDist = dist(pointers[ids[0]], pointers[ids[1]]);
        if (pinchStartDist > 0) {
          setScale(pinchStartScale * (newDist / pinchStartDist));
          apply();
        }
      } else if (ids.length === 1) {
        moveAccum += Math.abs(dx) + Math.abs(dy);
        panX += dx; panY += dy;
        apply();
      }
    }

    function endPointer(ev) {
      var wasSingleTap = pointerIds().length === 1 && ev.pointerId === singlePointerId && moveAccum <= 8;
      delete pointers[ev.pointerId];
      if (pointerIds().length < 2) pinchStartDist = 0;
      if (wasSingleTap) {
        var target = document.elementFromPoint(ev.clientX, ev.clientY);
        var hit = target ? target.closest(tapSelector) : null;
        if (hit) onTap(hit);
      }
    }

    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', endPointer);
    viewport.addEventListener('pointercancel', function (ev) { delete pointers[ev.pointerId]; });

    apply();

    return {
      zoomIn: zoomIn,
      zoomOut: zoomOut,
      reset: reset,
      getScale: function () { return scale; }
    };
  }

  global.App = global.App || {};
  global.App.MapInteraction = { attach: attach };
})(window);
