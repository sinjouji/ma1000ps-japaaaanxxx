# 日本地図パズル＆クイズアプリ（Ver1）

HTML / CSS / JavaScript のみで作った、都道府県を覚えるためのパズル＆クイズアプリです。
ビルドツール不要。`index.html` をブラウザで開くだけで動作します（GitHub Pages / Netlify 等の静的ホスティングにもそのまま置けます）。

## 使い方

- `index.html` を開くとホーム画面が表示されます。
- 🧩 パズル：地方別 or 全国から選び、都道府県をドラッグ＆ドロップで正しい位置に配置します（マウス／iPadのタッチどちらも対応）。
- ❓ クイズ：地図上の「○○県をタップしてください」に答えます。
- 📚 問題管理：問題の一覧・検索・追加・編集・削除ができます。似た問題がある場合は保存前に候補を表示しますが、保存自体は常に可能です。
- 📤📥 データ書き出し／取り込み：問題データをJSONファイルとして書き出し・取り込み（既存データへ追加マージ）できます。

## ファイル構成

```
index.html
css/style.css              画面共通スタイル
js/data/
  prefectures-data.js       都道府県マスターデータ（コード・読み仮名・地方分類）
  japan-map-svg.js          日本地図SVG（文字列として埋め込み。fetch不要でfile://でも動作）
  questions-default.js      初期問題データ（tapタイプ47件を自動生成）
js/utils.js                 共通ユーティリティ（ID生成・類似度判定・ふりがな付与など）
js/storage.js               localStorage 読み書き・書き出し/取り込みのマージ処理
js/audio.js                 読み上げ（Web Speech API）・効果音（Web Audio API）
js/svg-map.js                地図SVGから「盤面」「ピース」「クイズ用地図」を生成する処理
js/map-interaction.js         地図の拡大縮小・ドラッグ移動・タップ判定を共通化したコントローラー
                              （クイズ・パズルの両方で共用。将来のシルエットクイズや
                              ヒント演出・学習モードでもそのまま呼び出せる）
js/layout.js                 画面共通のヘッダー部品
js/router.js                 ハッシュベースの簡易ルーター（#home, #puzzle/region/kanto など）
js/screens/                  各画面（home / puzzle / quiz / question-list / question-editor / settings / data-io）
```

## 拡張するときのヒント（Ver2以降）

- **クイズの出題タイプを増やす**：`js/screens/quiz.js` の `QuizTypes` に
  `{ instruction(q), checkAnswer(q, code) }` を持つオブジェクトを追加するだけで、
  シルエット／名産品／県庁所在地／有名人／名所クイズなどを追加できます。
  問題データの `type` フィールドに新しいタイプ名を入れれば拾われます。
- **ヒントの「地図演出」対応**：問題データの `hints.easy/normal/hard` は
  `{ type: "text", value: "..." }` という構造になっているので、
  `type: "map"` を追加してヒント表示側で分岐すれば、テキスト以外の演出にも対応できます。
- **設定項目を増やす**：`js/storage.js` の `DEFAULT_SETTINGS` にキーを足すだけで、
  既存ユーザーのデータにも自動でデフォルト値がマージされます（`Utils.deepMergeDefaults`）。
- **学習履歴・苦手問題だけ出題・タイムアタックなど**：`js/storage.js` に
  履歴保存用のキーを追加し、`quiz.js` の出題対象を絞り込むフィルタを足す形で拡張できます。
- **パズルの難易度設定（かんたん/ふつう/むずかしい）**：`js/screens/puzzle.js` の
  `DIFFICULTY_PRESETS`（吸着の許容範囲）は、`js/storage.js` の
  `settings.puzzle.difficulty`（現在は常に `'normal'`）から読み込む形にすでに
  なっているので、設定画面に選択UIを足して値を保存するだけで対応できます。
  「かんたん」はヒント表示、「むずかしい」は補助なし、という仕様を足す場合も
  同じ場所を起点に拡張してください。
- **県名表示（`settings.prefNames.enabled`）**：デフォルトON。パズルのピースと、
  完成して塗りつぶされた県に県名ラベルを表示します。OFFの時はピースを長押し
  した間だけ一時的に県名が見えます（`js/screens/puzzle.js` の `attachDrag` 内、
  および `js/svg-map.js` の `addNameLabels`）。

## 地図データについて（ライセンス表記・重要）

地図SVGデータは、国土交通省国土地理院「地球地図日本」のデータを
[dataofjapan/land](https://github.com/dataofjapan/land)（MITライセンス）がTopoJSON化したものを、
本アプリ用に座標投影・簡略化してSVG化したものです（教材としての形状精度を優先し、
Douglas-Peucker法による軽度の簡略化と、東京都の父島・鳥島等ごく遠方の離島のみ表示から除外しています）。

**利用にあたっての注意（重要）**：地球地図日本のデータは、非営利目的では「出典の明記」、
営利目的では「出典の明記」に加えて「国土地理院への利用報告」が求められます。
本アプリをBOOTH等で販売・配布する場合は、出典表記を残すとともに、
国土地理院への利用報告（https://www.gsi.go.jp/kankyochiri/gm_jpn.html）をご検討ください。
出典表記は `js/data/japan-map-svg.js` の先頭コメントに記載しています。
