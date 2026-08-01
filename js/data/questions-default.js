/**
 * 初期問題データ（Ver1で唯一実装している「都道府県タップ」タイプの問題を
 * 47都道府県ぶん自動生成）。
 *
 * 将来 type を増やす場合（capital=県庁所在地 / specialty=名産品 /
 * famous_person=有名人 / landmark=名所 / silhouette=シルエット）は、
 * このファイルとは別に questions-<type>.js のようなファイルを追加し、
 * App.getDefaultQuestions() の中でまとめて返すようにすると
 * 既存データを壊さずに拡張できます。
 */
(function (global) {
  'use strict';

  function buildDefaultQuestions() {
    var prefs = global.App.Prefectures.list;
    return prefs.map(function (p, i) {
      return {
        id: 'default-tap-' + p.code,
        type: 'tap_prefecture', // 将来: 'capital' | 'specialty' | 'famous_person' | 'landmark' | 'silhouette' など
        question: p.fullName + 'をタップしてください',
        answers: [p.code], // 配列。複数の都道府県を正解にできる
        tag: [p.region],
        hints: {
          easy: { type: 'text', value: '' },
          normal: { type: 'text', value: '' },
          hard: { type: 'text', value: '' }
        },
        explanation: '',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      };
    });
  }

  global.App = global.App || {};
  global.App.getDefaultQuestions = buildDefaultQuestions;
})(window);
