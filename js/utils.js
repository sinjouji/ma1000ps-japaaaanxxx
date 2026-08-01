/**
 * 共通ユーティリティ
 */
(function (global) {
  'use strict';

  function generateId(prefix) {
    var rand = Math.random().toString(36).slice(2, 9);
    var time = Date.now().toString(36);
    return (prefix || 'q') + '-' + time + '-' + rand;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait || 200);
    };
  }

  // 既存オブジェクトに欠けているキーだけをデフォルト値で埋める再帰マージ。
  // 設定(settings)のように将来キーが増えても壊れないようにするために使う。
  function deepMergeDefaults(target, defaults) {
    var out = Array.isArray(defaults) ? (target || []).slice() : Object.assign({}, defaults);
    if (Array.isArray(defaults)) return target !== undefined ? target : out;
    Object.keys(defaults).forEach(function (key) {
      var defVal = defaults[key];
      var curVal = target ? target[key] : undefined;
      if (curVal === undefined) {
        out[key] = defVal;
      } else if (typeof defVal === 'object' && defVal !== null && !Array.isArray(defVal)) {
        out[key] = deepMergeDefaults(curVal, defVal);
      } else {
        out[key] = curVal;
      }
    });
    return out;
  }

  // 2つの文字列の類似度を 0〜1 で返す簡易実装（bigram の重なり具合＝Dice係数）。
  // 厳密な形態素解析はしないが、「似た問題文」の候補表示には十分な精度。
  function textSimilarity(a, b) {
    a = (a || '').replace(/\s+/g, '');
    b = (b || '').replace(/\s+/g, '');
    if (!a.length || !b.length) return 0;
    if (a === b) return 1;
    var bigrams = function (s) {
      var out = [];
      for (var i = 0; i < s.length - 1; i++) out.push(s.substr(i, 2));
      if (out.length === 0) out.push(s);
      return out;
    };
    var A = bigrams(a);
    var B = bigrams(b).slice();
    var matches = 0;
    A.forEach(function (g) {
      var idx = B.indexOf(g);
      if (idx !== -1) { matches++; B.splice(idx, 1); }
    });
    return (2 * matches) / (A.length + bigrams(b).length);
  }

  function sameAnswers(a, b) {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    var sa = a.slice().sort();
    var sb = b.slice().sort();
    return sa.every(function (v, i) { return v === sb[i]; });
  }

  function overlapAnswers(a, b) {
    if (!a || !b) return false;
    return a.some(function (code) { return b.indexOf(code) !== -1; });
  }

  // 問題文の中に含まれる都道府県の正式名称に、読み仮名（ふりがな）を
  // <ruby> タグで付与する。設定「読み仮名 ON/OFF」から利用する。
  function withFurigana(text, prefList) {
    if (!text) return '';
    var sorted = prefList.slice().sort(function (a, b) { return b.fullName.length - a.fullName.length; });
    var html = escapeHtml(text);
    sorted.forEach(function (p) {
      var needle = escapeHtml(p.fullName);
      if (html.indexOf(needle) === -1) return;
      var ruby = '<ruby>' + needle + '<rt>' + p.kana + '</rt></ruby>';
      html = html.split(needle).join(ruby);
    });
    return html;
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
    } catch (e) { return ''; }
  }

  global.App = global.App || {};
  global.App.Utils = {
    generateId: generateId,
    shuffle: shuffle,
    escapeHtml: escapeHtml,
    debounce: debounce,
    deepMergeDefaults: deepMergeDefaults,
    textSimilarity: textSimilarity,
    sameAnswers: sameAnswers,
    overlapAnswers: overlapAnswers,
    withFurigana: withFurigana,
    formatDate: formatDate
  };
})(window);
