/**
 * 地図 SVG まわりの共通処理
 * ---------------------------------------------------------
 * ・パズルの「盤面（正しい位置＝スロット）」
 * ・パズルの「ピース（ドラッグする都道府県の形）」
 * ・クイズの「タップ用の地図」
 * を、どれも同じ元データ（App.JapanMapSVG）から作る。
 *
 * 地図データは全都道府県が <g class="xxx region prefecture" data-code="NN">
 * という単位でグループ化されているので、data-code を都道府県コードとして
 * 一貫して使う（App.Prefectures.byCode と対応）。
 */
(function (global) {
  'use strict';

  var templateDoc = null;
  function getTemplateSvg() {
    if (!templateDoc) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(global.App.JapanMapSVG, 'image/svg+xml');
      templateDoc = doc.documentElement;
    }
    return templateDoc.cloneNode(true);
  }

  function allPrefectureGroups(svg) {
    return Array.prototype.slice.call(svg.querySelectorAll('g.prefecture[data-code]'));
  }

  function isInRegion(g, regionKey) {
    if (!regionKey) return true;
    return g.classList.contains(regionKey);
  }

  // 指定した地方（regionKey）に属する都道府県グループだけを残した bbox を、
  // 実際にDOMへ一時レンダリングして測る（transform行列を手計算しなくてよいように）。
  function measureRegionBBox(regionKey) {
    var svg = getTemplateSvg();
    svg.setAttribute('width', '1000');
    svg.setAttribute('height', '1000');
    svg.style.position = 'fixed';
    svg.style.left = '-99999px';
    svg.style.top = '0';
    svg.style.width = '1000px';
    svg.style.height = '1000px';
    document.body.appendChild(svg);

    var groups = allPrefectureGroups(svg).filter(function (g) { return isInRegion(g, regionKey); });
    var svgRect = svg.getBoundingClientRect();
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    groups.forEach(function (g) {
      var r = g.getBoundingClientRect();
      minX = Math.min(minX, r.left - svgRect.left);
      minY = Math.min(minY, r.top - svgRect.top);
      maxX = Math.max(maxX, r.right - svgRect.left);
      maxY = Math.max(maxY, r.bottom - svgRect.top);
    });
    document.body.removeChild(svg);

    if (!isFinite(minX)) return { x: 0, y: 0, w: 1000, h: 1000 };
    var padX = (maxX - minX) * 0.06 + 6;
    var padY = (maxY - minY) * 0.06 + 6;
    return {
      x: minX - padX,
      y: minY - padY,
      w: (maxX - minX) + padX * 2,
      h: (maxY - minY) + padY * 2
    };
  }

  /**
   * 盤面（正解位置のスロット）を作る。
   * regionKey が null の場合は全国、指定した場合はその地方のみに絞り込んで拡大表示。
   * 戻り値: { svg, codes }  codes: この盤面に含まれる都道府県コードの配列
   */
  function buildBoard(regionKey) {
    var svg = getTemplateSvg();
    svg.classList.add('map-board-svg');
    svg.removeAttribute('width');
    svg.removeAttribute('height');

    var groups = allPrefectureGroups(svg);
    var codes = [];
    groups.forEach(function (g) {
      var inRegion = isInRegion(g, regionKey);
      if (!inRegion) {
        g.parentNode.removeChild(g);
        return;
      }
      g.classList.add('pref-slot');
      g.setAttribute('data-region', global.App.Prefectures.byCode[g.getAttribute('data-code')].region);
      codes.push(g.getAttribute('data-code'));
    });

    if (regionKey) {
      var box = measureRegionBBox(regionKey);
      svg.setAttribute('viewBox', box.x + ' ' + box.y + ' ' + box.w + ' ' + box.h);
    }

    return { svg: svg, codes: codes };
  }

  /**
   * クイズ用の地図（全都道府県をタップ可能な状態で表示）。
   */
  function buildQuizMap() {
    var svg = getTemplateSvg();
    svg.classList.add('map-quiz-svg');
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    allPrefectureGroups(svg).forEach(function (g) {
      g.classList.add('pref-tap');
      g.setAttribute('data-region', global.App.Prefectures.byCode[g.getAttribute('data-code')].region);
    });
    return svg;
  }

  /**
   * 1都道府県ぶんの単独ピースSVGを作る（パズルのドラッグ対象）。
   * 沖縄・長崎・鹿児島のように離島が広い範囲に散らばる県は、そのまま
   * 全体を1つのピースにすると主要な陸地が小さく埋もれてしまうため、
   * class="pref-main-shape" が付いた「主要な陸地」だけを使ってピース化する
   * （盤面側は全ての離島を含む正しい形状のまま表示される）。
   */
  function buildPiece(code) {
    var full = getTemplateSvg();
    var source = full.querySelector('g.prefecture[data-code="' + code + '"]');
    if (!source) return null;
    var mainPaths = Array.prototype.slice.call(source.querySelectorAll('.pref-main-shape'));
    if (mainPaths.length === 0) mainPaths = Array.prototype.slice.call(source.querySelectorAll('path'));

    // getBBox() を使うために一旦DOMに単独でレンダリングする
    var holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    holder.style.position = 'fixed';
    holder.style.left = '-99999px';
    holder.setAttribute('width', '400');
    holder.setAttribute('height', '400');
    var clones = mainPaths.map(function (p) { return p.cloneNode(true); });
    clones.forEach(function (c) { holder.appendChild(c); });
    document.body.appendChild(holder);
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    clones.forEach(function (c) {
      var b = c.getBBox();
      minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height);
    });
    document.body.removeChild(holder);
    var bbox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

    // ピースと盤面（スロット）を完全に同じスケールで表示するため、
    // ここでは余白（padding）を入れない。スロット側の getBoundingClientRect() も
    // 同じ「塗り部分のバウンディングボックス」を基準にしているため、
    // pad=0 にすることで見た目のサイズがぴたりと一致する。
    // （枠線のにじみは svg 側の overflow:visible で吸収する）
    var pieceSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    pieceSvg.setAttribute('viewBox', bbox.x + ' ' + bbox.y + ' ' + bbox.width + ' ' + bbox.height);
    pieceSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    pieceSvg.classList.add('map-piece-svg');
    var pieceGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pieceGroup.classList.add('pref-piece');
    pieceGroup.setAttribute('data-region', global.App.Prefectures.byCode[code].region);
    clones.forEach(function (c) {
      var el = c.cloneNode(true);
      el.removeAttribute('transform');
      pieceGroup.appendChild(el);
    });
    pieceSvg.appendChild(pieceGroup);

    return { svg: pieceSvg, code: code, aspect: bbox.width / bbox.height };
  }

  function getSlotElement(boardSvg, code) {
    return boardSvg.querySelector('[data-code="' + code + '"]');
  }

  // パズルの吸着・配置サイズの基準にする「主要な陸地」だけの矩形。
  // (盤面のスロット全体には離島も含まれるため、ピース側と揃えるためにこちらを使う)
  function getSlotMainShapeRect(boardSvg, code) {
    var g = getSlotElement(boardSvg, code);
    if (!g) return null;
    var mainPaths = g.querySelectorAll('.pref-main-shape');
    var targets = mainPaths.length ? mainPaths : g.querySelectorAll('path');
    var minL = Infinity, minT = Infinity, maxR = -Infinity, maxB = -Infinity;
    targets.forEach(function (p) {
      var r = p.getBoundingClientRect();
      minL = Math.min(minL, r.left); minT = Math.min(minT, r.top);
      maxR = Math.max(maxR, r.right); maxB = Math.max(maxB, r.bottom);
    });
    if (!isFinite(minL)) return null;
    return { left: minL, top: minT, right: maxR, bottom: maxB, width: maxR - minL, height: maxB - minT };
  }

  /**
   * 盤面のスロットに、都道府県名のラベル（<text>）を仕込んでおく。
   * 表示するかどうかは CSS 側（.map-board-svg.show-names の有無と
   * .pref-slot.slot-filled の組み合わせ）で制御するので、ここでは
   * 「主要な陸地の中心」に文字を置くところまでを担当する。
   * board.svg が実際にDOMへ追加された後に呼び出すこと（getBBoxのため）。
   *
   * フォントサイズは県ごとに変えず、その盤面に含まれる中で一番小さい県の
   * 陸地に合わせて1つに統一する（大きい県だけ文字が大きくなるのを防ぎ、
   * 小さい県でもできるだけ文字がはみ出さないようにするため）。
   */
  function addNameLabels(boardSvg) {
    var groups = allPrefectureGroups(boardSvg);
    var entries = [];

    groups.forEach(function (g) {
      var code = g.getAttribute('data-code');
      var pref = global.App.Prefectures.byCode[code];
      if (!pref) return;
      var mainShape = g.querySelector('.pref-main-shape') || g.querySelector('path');
      if (!mainShape) return;
      var b = mainShape.getBBox();
      entries.push({ g: g, pref: pref, b: b, dim: Math.min(b.width, b.height) });
    });
    if (entries.length === 0) return;

    // 一番小さい県に合わせると全体が読みにくくなりすぎるため、下位1〜2割の
    // 「特に小さい県」は多少はみ出す余地を許容し、それ以外がしっかり
    // 読める大きさになるよう、下から約12%あたりの値を基準にする。
    var dims = entries.map(function (e) { return e.dim; }).sort(function (a, b) { return a - b; });
    var idx = Math.max(0, Math.floor(dims.length * 0.12));
    var basisDim = dims[idx];

    var fontSize = Math.max(8, Math.min(20, basisDim * 0.5));
    var strokeWidth = Math.max(1.4, fontSize * 0.22);

    entries.forEach(function (entry) {
      var b = entry.b;
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', b.x + b.width / 2);
      text.setAttribute('y', b.y + b.height / 2);
      text.setAttribute('font-size', fontSize);
      text.setAttribute('stroke', '#ffffff');
      text.setAttribute('stroke-width', strokeWidth);
      text.setAttribute('stroke-linejoin', 'round');
      text.setAttribute('paint-order', 'stroke');
      text.classList.add('pref-label');
      text.textContent = entry.pref.name;
      entry.g.appendChild(text);
    });
  }

  global.App = global.App || {};
  global.App.SvgMap = {
    buildBoard: buildBoard,
    buildQuizMap: buildQuizMap,
    buildPiece: buildPiece,
    getSlotElement: getSlotElement,
    getSlotMainShapeRect: getSlotMainShapeRect,
    addNameLabels: addNameLabels,
    allPrefectureGroups: allPrefectureGroups
  };
})(window);
