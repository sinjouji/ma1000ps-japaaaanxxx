/**
 * 音まわり（読み上げ・効果音）
 * ---------------------------------------------------------
 * 効果音は音声ファイルを持たず Web Audio API で簡単な音を合成しているため、
 * 追加の音声アセットなしで動作する。将来「効果音を差し替えたい」となった
 * 場合は playTone の呼び出し部分を音声ファイル再生に差し替えるだけでよい。
 */
(function (global) {
  'use strict';

  var audioCtx = null;
  function getCtx() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    return audioCtx;
  }

  var VOLUME_LEVELS = [0.15, 0.35, 0.6]; // 0:小 1:中 2:大

  function playTone(freqSequence, volumeLevel) {
    var ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    var vol = VOLUME_LEVELS[volumeLevel] !== undefined ? VOLUME_LEVELS[volumeLevel] : VOLUME_LEVELS[1];
    var t = ctx.currentTime;
    freqSequence.forEach(function (step, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = step.freq;
      var start = t + i * step.dur;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.02);
      gain.gain.linearRampToValueAtTime(0, start + step.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + step.dur + 0.02);
    });
  }

  function playCorrect() {
    var s = global.App.Storage.getSettings();
    if (!s.sound.correctEnabled) return;
    playTone([{ freq: 880, dur: 0.11 }, { freq: 1175, dur: 0.16 }], s.sound.volume);
  }

  function playIncorrect() {
    var s = global.App.Storage.getSettings();
    if (!s.sound.incorrectEnabled) return;
    playTone([{ freq: 220, dur: 0.18 }, { freq: 175, dur: 0.22 }], s.sound.volume);
  }

  function speak(text) {
    var s = global.App.Storage.getSettings();
    if (!s.tts.enabled) return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ja-JP';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  }

  global.App = global.App || {};
  global.App.Audio = {
    playCorrect: playCorrect,
    playIncorrect: playIncorrect,
    speak: speak
  };
})(window);
