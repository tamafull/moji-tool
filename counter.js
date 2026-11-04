/* X(旧Twitter)重み付き文字数カウンタ。DOM非依存(nodeでテスト可能)。
 * 仕様根拠: twitter-text config v3 (docs.x.com/fundamentals/counting-characters)。
 * 自作の近似実装: URL検出・絵文字判定は twitter-text と完全一致しない(README参照)。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MojiCounter = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CONFIG = {
    maxWeightedLength: 280,
    defaultWeight: 2,
    urlLength: 23,
    emojiWeight: 2,
    // 重み1の範囲 [start, end] (code point)
    weightOneRanges: [[0x0000, 0x10FF], [0x2000, 0x200D], [0x2010, 0x201F], [0x2032, 0x2037]],
    weightOne: 1
  };

  var TLDS = 'com|net|org|jp|co\\.jp|ne\\.jp|or\\.jp|io|info|biz|dev|app|me|us|uk|de|fr|cn|kr|tv|ly|gl|to|co|ai';
  // ASCII URL文字のみ(日本語が隣接してもURLに巻き込まない)
  var URL_CHARS = "[A-Za-z0-9\\-._~:/?#\\[\\]@!$&'()*+,;=%]";
  function urlRegex() {
    return new RegExp(
      '(?:https?://' + URL_CHARS + '+)|(?:(?<![A-Za-z0-9@._-])(?:[A-Za-z0-9-]+\\.)+(?:' + TLDS +
      ')(?![A-Za-z0-9-])(?:[/?#]' + URL_CHARS + '*)?)', 'g');
  }
  var TRAILING = /[.,;:!?)\]'"]+$/;

  // 絵文字1個 = ZWJ/肌色/VS16結合列・国旗(RI2つ)・キーキャップ。それ以外は1コードポイントずつ。
  var PICT = '\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?';
  var TOKEN_SRC = '(\\p{Regional_Indicator}{2}|[#*0-9]\\uFE0F?\\u20E3|' + PICT + '(?:\\u200D' + PICT + ')*)|[\\s\\S]';

  function cpWeight(cp, config) {
    var r = config.weightOneRanges;
    for (var i = 0; i < r.length; i++) if (cp >= r[i][0] && cp <= r[i][1]) return config.weightOne;
    return config.defaultWeight;
  }

  /** [start,end) をトークン化して state.weighted に加算し、初超過位置(UTF-16 index)を記録。 */
  function weighSegment(text, start, end, config, state) {
    var re = new RegExp(TOKEN_SRC, 'gu'), m, seg = text.slice(start, end);
    while ((m = re.exec(seg)) !== null) {
      state.weighted += m[1] ? config.emojiWeight : cpWeight(m[0].codePointAt(0), config);
      if (state.overflowIndex < 0 && state.weighted > config.maxWeightedLength) state.overflowIndex = start + m.index;
    }
  }

  function findUrls(text) {
    var out = [], re = urlRegex(), m;
    while ((m = re.exec(text)) !== null) {
      var s = m[0].replace(TRAILING, '');
      if (!s) continue;
      out.push({ start: m.index, end: m.index + s.length });
      re.lastIndex = m.index + s.length;
    }
    return out;
  }

  /** overflowIndex: 超過が始まる位置(NFC正規化後文字列のUTF-16 index)。超過なしは -1。 */
  function analyze(input, options) {
    var config = Object.assign({}, CONFIG, options || {});
    var text = String(input == null ? '' : input).normalize('NFC');
    var urls = findUrls(text);
    var state = { weighted: 0, overflowIndex: -1 };
    var limit = config.maxWeightedLength, pos = 0;

    urls.forEach(function (u) {
      weighSegment(text, pos, u.start, config, state);
      state.weighted += config.urlLength;
      if (state.overflowIndex < 0 && state.weighted > limit) state.overflowIndex = u.start;
      pos = u.end;
    });
    weighSegment(text, pos, text.length, config, state);

    return {
      weighted: state.weighted,
      codePoints: Array.from(text).length,
      limit: limit,
      remaining: limit - state.weighted,
      over: state.weighted > limit,
      overflowIndex: state.overflowIndex,
      urls: urls.length
    };
  }

  return { analyze: analyze, findUrls: findUrls, CONFIG: CONFIG };
});
