/**
 * 都道府県マスターデータ
 * ---------------------------------------------------------
 * romaji は assets の地図データ（SVG）内の class 名と対応しています。
 * region は八地方区分のキー。地図SVGの class 名（tohoku / kanto / chubu /
 * kinki / chugoku / shikoku / kyushu-okinawa / hokkaido は単独）と揃えてあります。
 *
 * 将来、市区町村データや県章・県花などを追加したくなった場合は
 * 各オブジェクトにキーを追加するだけで良いように、配列 + オブジェクトの
 * シンプルな構造にしています。
 */
(function (global) {
  'use strict';

  var REGIONS = [
    { key: 'hokkaido', name: '北海道' },
    { key: 'tohoku', name: '東北' },
    { key: 'kanto', name: '関東' },
    { key: 'chubu', name: '中部' },
    { key: 'kinki', name: '近畿' },
    { key: 'chugoku', name: '中国' },
    { key: 'shikoku', name: '四国' },
    { key: 'kyushu-okinawa', name: '九州・沖縄' }
  ];

  // suffix: 都 / 道 / 府 / 県
  var LIST = [
    { code: '1', romaji: 'hokkaido', name: '北海道', kana: 'ほっかいどう', fullName: '北海道', region: 'hokkaido' },
    { code: '2', romaji: 'aomori', name: '青森', kana: 'あおもり', fullName: '青森県', region: 'tohoku' },
    { code: '3', romaji: 'iwate', name: '岩手', kana: 'いわて', fullName: '岩手県', region: 'tohoku' },
    { code: '4', romaji: 'miyagi', name: '宮城', kana: 'みやぎ', fullName: '宮城県', region: 'tohoku' },
    { code: '5', romaji: 'akita', name: '秋田', kana: 'あきた', fullName: '秋田県', region: 'tohoku' },
    { code: '6', romaji: 'yamagata', name: '山形', kana: 'やまがた', fullName: '山形県', region: 'tohoku' },
    { code: '7', romaji: 'fukushima', name: '福島', kana: 'ふくしま', fullName: '福島県', region: 'tohoku' },
    { code: '8', romaji: 'ibaraki', name: '茨城', kana: 'いばらき', fullName: '茨城県', region: 'kanto' },
    { code: '9', romaji: 'tochigi', name: '栃木', kana: 'とちぎ', fullName: '栃木県', region: 'kanto' },
    { code: '10', romaji: 'gunma', name: '群馬', kana: 'ぐんま', fullName: '群馬県', region: 'kanto' },
    { code: '11', romaji: 'saitama', name: '埼玉', kana: 'さいたま', fullName: '埼玉県', region: 'kanto' },
    { code: '12', romaji: 'chiba', name: '千葉', kana: 'ちば', fullName: '千葉県', region: 'kanto' },
    { code: '13', romaji: 'tokyo', name: '東京', kana: 'とうきょう', fullName: '東京都', region: 'kanto' },
    { code: '14', romaji: 'kanagawa', name: '神奈川', kana: 'かながわ', fullName: '神奈川県', region: 'kanto' },
    { code: '15', romaji: 'niigata', name: '新潟', kana: 'にいがた', fullName: '新潟県', region: 'chubu' },
    { code: '16', romaji: 'toyama', name: '富山', kana: 'とやま', fullName: '富山県', region: 'chubu' },
    { code: '17', romaji: 'ishikawa', name: '石川', kana: 'いしかわ', fullName: '石川県', region: 'chubu' },
    { code: '18', romaji: 'fukui', name: '福井', kana: 'ふくい', fullName: '福井県', region: 'chubu' },
    { code: '19', romaji: 'yamanashi', name: '山梨', kana: 'やまなし', fullName: '山梨県', region: 'chubu' },
    { code: '20', romaji: 'nagano', name: '長野', kana: 'ながの', fullName: '長野県', region: 'chubu' },
    { code: '21', romaji: 'gifu', name: '岐阜', kana: 'ぎふ', fullName: '岐阜県', region: 'chubu' },
    { code: '22', romaji: 'shizuoka', name: '静岡', kana: 'しずおか', fullName: '静岡県', region: 'chubu' },
    { code: '23', romaji: 'aichi', name: '愛知', kana: 'あいち', fullName: '愛知県', region: 'chubu' },
    { code: '24', romaji: 'mie', name: '三重', kana: 'みえ', fullName: '三重県', region: 'kinki' },
    { code: '25', romaji: 'shiga', name: '滋賀', kana: 'しが', fullName: '滋賀県', region: 'kinki' },
    { code: '26', romaji: 'kyoto', name: '京都', kana: 'きょうと', fullName: '京都府', region: 'kinki' },
    { code: '27', romaji: 'osaka', name: '大阪', kana: 'おおさか', fullName: '大阪府', region: 'kinki' },
    { code: '28', romaji: 'hyogo', name: '兵庫', kana: 'ひょうご', fullName: '兵庫県', region: 'kinki' },
    { code: '29', romaji: 'nara', name: '奈良', kana: 'なら', fullName: '奈良県', region: 'kinki' },
    { code: '30', romaji: 'wakayama', name: '和歌山', kana: 'わかやま', fullName: '和歌山県', region: 'kinki' },
    { code: '31', romaji: 'tottori', name: '鳥取', kana: 'とっとり', fullName: '鳥取県', region: 'chugoku' },
    { code: '32', romaji: 'shimane', name: '島根', kana: 'しまね', fullName: '島根県', region: 'chugoku' },
    { code: '33', romaji: 'okayama', name: '岡山', kana: 'おかやま', fullName: '岡山県', region: 'chugoku' },
    { code: '34', romaji: 'hiroshima', name: '広島', kana: 'ひろしま', fullName: '広島県', region: 'chugoku' },
    { code: '35', romaji: 'yamaguchi', name: '山口', kana: 'やまぐち', fullName: '山口県', region: 'chugoku' },
    { code: '36', romaji: 'tokushima', name: '徳島', kana: 'とくしま', fullName: '徳島県', region: 'shikoku' },
    { code: '37', romaji: 'kagawa', name: '香川', kana: 'かがわ', fullName: '香川県', region: 'shikoku' },
    { code: '38', romaji: 'ehime', name: '愛媛', kana: 'えひめ', fullName: '愛媛県', region: 'shikoku' },
    { code: '39', romaji: 'kochi', name: '高知', kana: 'こうち', fullName: '高知県', region: 'shikoku' },
    { code: '40', romaji: 'fukuoka', name: '福岡', kana: 'ふくおか', fullName: '福岡県', region: 'kyushu-okinawa' },
    { code: '41', romaji: 'saga', name: '佐賀', kana: 'さが', fullName: '佐賀県', region: 'kyushu-okinawa' },
    { code: '42', romaji: 'nagasaki', name: '長崎', kana: 'ながさき', fullName: '長崎県', region: 'kyushu-okinawa' },
    { code: '43', romaji: 'kumamoto', name: '熊本', kana: 'くまもと', fullName: '熊本県', region: 'kyushu-okinawa' },
    { code: '44', romaji: 'oita', name: '大分', kana: 'おおいた', fullName: '大分県', region: 'kyushu-okinawa' },
    { code: '45', romaji: 'miyazaki', name: '宮崎', kana: 'みやざき', fullName: '宮崎県', region: 'kyushu-okinawa' },
    { code: '46', romaji: 'kagoshima', name: '鹿児島', kana: 'かごしま', fullName: '鹿児島県', region: 'kyushu-okinawa' },
    { code: '47', romaji: 'okinawa', name: '沖縄', kana: 'おきなわ', fullName: '沖縄県', region: 'kyushu-okinawa' }
  ];

  var byCode = {};
  var byRomaji = {};
  LIST.forEach(function (p) {
    byCode[p.code] = p;
    byRomaji[p.romaji] = p;
  });

  var byRegion = {};
  REGIONS.forEach(function (r) {
    byRegion[r.key] = LIST.filter(function (p) { return p.region === r.key; });
  });

  global.App = global.App || {};
  global.App.Prefectures = {
    list: LIST,
    regions: REGIONS,
    byCode: byCode,
    byRomaji: byRomaji,
    byRegion: byRegion,
    regionName: function (key) {
      var r = REGIONS.filter(function (x) { return x.key === key; })[0];
      return r ? r.name : key;
    }
  };
})(window);
