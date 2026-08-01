/**
 * データ永続化レイヤー（localStorage）
 * ---------------------------------------------------------
 * 画面側は直接 localStorage を触らず、必ずこのモジュール経由でデータを
 * 読み書きする。将来 IndexedDB やクラウド同期に差し替える場合も
 * このファイルの中身を変えるだけで済むようにするための層。
 */
(function (global) {
  'use strict';

  var KEYS = {
    QUESTIONS: 'pmq.questions.v1',
    SETTINGS: 'pmq.settings.v1'
  };

  var DEFAULT_SETTINGS = {
    schemaVersion: 1,
    tts: {
      enabled: false // 問題読み上げ ON/OFF
    },
    furigana: {
      enabled: true // 読み仮名 ON/OFF
    },
    sound: {
      correctEnabled: true, // 正解音 ON/OFF
      incorrectEnabled: true, // 不正解音 ON/OFF
      volume: 1 // 0:小 1:中 2:大 の3段階
    },
    prefNames: {
      enabled: true // 県名表示 ON/OFF（パズルのピース・完成した地図に県名を出すか）
    },
    puzzle: {
      // 将来のパズル難易度設定の置き場。'normal' が現在の吸着判定(基準)。
      // 'easy' は吸着範囲を広め、'hard' は狭めにする想定（js/screens/puzzle.js の
      // DIFFICULTY_PRESETS と対応させる）。今はまだ設定画面から変更できないが、
      // 値を持たせておくことで後から設定UIを足すだけで対応できる。
      difficulty: 'normal'
    },
    // 今後の拡張用の置き場（例: 出題数、テーマカラーなど）
    misc: {}
  };

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('storage read error', key, e);
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('storage write error', key, e);
      return false;
    }
  }

  function getQuestions() {
    var stored = readJson(KEYS.QUESTIONS, null);
    if (stored === null) {
      // 初回起動時は初期問題データを流し込む
      var defaults = global.App.getDefaultQuestions();
      writeJson(KEYS.QUESTIONS, defaults);
      return defaults;
    }
    return stored;
  }

  function saveQuestions(list) {
    return writeJson(KEYS.QUESTIONS, list);
  }

  function getSettings() {
    var stored = readJson(KEYS.SETTINGS, null);
    return global.App.Utils.deepMergeDefaults(stored, DEFAULT_SETTINGS);
  }

  function saveSettings(settings) {
    return writeJson(KEYS.SETTINGS, settings);
  }

  function resetQuestionsToDefault() {
    var defaults = global.App.getDefaultQuestions();
    writeJson(KEYS.QUESTIONS, defaults);
    return defaults;
  }

  // ---- 書き出し / 取り込み -------------------------------------------------

  function exportData() {
    return {
      appId: 'pref-puzzle-quiz',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      questions: getQuestions()
    };
  }

  // 取り込み: 既存データへマージする。
  // id が既存と衝突した場合はデータを失わないよう新しい id を振り直して追加する
  // （「重複があっても保存は可能」という問題管理の方針と揃えている）。
  function importData(payload) {
    if (!payload || !Array.isArray(payload.questions)) {
      throw new Error('不正なデータ形式です（questions 配列が見つかりません）');
    }
    var current = getQuestions();
    var existingIds = {};
    current.forEach(function (q) { existingIds[q.id] = true; });

    var added = 0;
    payload.questions.forEach(function (incoming) {
      var q = Object.assign({}, incoming);
      if (!q.id || existingIds[q.id]) {
        q.id = global.App.Utils.generateId('imported');
      }
      existingIds[q.id] = true;
      if (!q.type) q.type = 'tap_prefecture';
      if (!q.hints) q.hints = { easy: { type: 'text', value: '' }, normal: { type: 'text', value: '' }, hard: { type: 'text', value: '' } };
      current.push(q);
      added++;
    });

    saveQuestions(current);
    return { added: added, total: current.length };
  }

  global.App = global.App || {};
  global.App.Storage = {
    KEYS: KEYS,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    getQuestions: getQuestions,
    saveQuestions: saveQuestions,
    getSettings: getSettings,
    saveSettings: saveSettings,
    resetQuestionsToDefault: resetQuestionsToDefault,
    exportData: exportData,
    importData: importData
  };
})(window);
