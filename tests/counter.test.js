const test = require('node:test');
const assert = require('node:assert/strict');
const { analyze, findUrls } = require('../counter.js');
const w = (s, o) => analyze(s, o).weighted;

test('空文字', () => { const r = analyze(''); assert.equal(r.weighted, 0); assert.equal(r.remaining, 280); assert.equal(r.over, false); assert.equal(r.overflowIndex, -1); });
test('null/undefined', () => { assert.equal(w(null), 0); assert.equal(w(undefined), 0); });
test('半角英数=1', () => assert.equal(w('abc123'), 6));
test('ひらがな/カタカナ/漢字=2', () => { assert.equal(w('あ'), 2); assert.equal(w('ア'), 2); assert.equal(w('漢字'), 4); });
test('全角英数・全角記号=2', () => { assert.equal(w('ＡＢ１'), 6); assert.equal(w('！'), 2); });
test('半角カナ=2(範囲外)', () => assert.equal(w('ｱ'), 2));
test('改行=1', () => assert.equal(w('a\nb'), 3));
test('境界 U+10FF=1 / U+1100=2', () => { assert.equal(w('\u10FF'), 1); assert.equal(w('\u1100'), 2); });
test('境界 U+2000-200D / 2010-201F / 2032-2037', () => {
  assert.equal(w('\u200D'), 1); assert.equal(w('\u200E'), 2);
  assert.equal(w('\u2010'), 1); assert.equal(w('\u2020'), 2); assert.equal(w('\u201F'), 1);
  assert.equal(w('\u2032'), 1); assert.equal(w('\u2037'), 1); assert.equal(w('\u2038'), 2);
});
test('日本語のみ140字ちょうどで上限内、141で超過', () => {
  assert.equal(analyze('あ'.repeat(140)).over, false);
  assert.equal(analyze('あ'.repeat(140)).remaining, 0);
  const r = analyze('あ'.repeat(141));
  assert.equal(r.over, true); assert.equal(r.remaining, -2); assert.equal(r.overflowIndex, 140);
});
test('英数280で上限内、281で超過', () => { assert.equal(analyze('a'.repeat(280)).over, false); assert.equal(analyze('a'.repeat(281)).over, true); });
test('URLは長さに関係なく23', () => {
  assert.equal(w('https://example.com/' + 'a'.repeat(200)), 23);
  assert.equal(w('http://a.jp'), 23);
});
test('URL前後は通常加算', () => assert.equal(w('見て https://example.com/x です'), 4 + 1 + 23 + 1 + 4));
test('日本語が隣接してもURLに巻き込まない', () => assert.equal(w('見てhttps://example.com/xです'), 4 + 23 + 4));
test('URL末尾の句読点は除外', () => assert.equal(w('https://example.com/a.'), 24));
test('スキーム無しドメインもURL扱い', () => assert.equal(w('example.com'), 23));
test('メンションはURLと誤検出しない', () => assert.equal(findUrls('@user_name hi').length, 0));
test('メンション/ハッシュタグは通常計算', () => { assert.equal(w('@abc'), 4); assert.equal(w('#日本語'), 1 + 6); });
test('絵文字=2', () => assert.equal(w('😀'), 2));
test('ZWJ家族絵文字・肌色絵文字も1つで2', () => { assert.equal(w('👨‍👩‍👧‍👦'), 2); assert.equal(w('👍🏽'), 2); });
test('国旗=2', () => assert.equal(w('🇯🇵'), 2));
test('キーキャップ=2、素の数字/#は1', () => { assert.equal(w('1️⃣'), 2); assert.equal(w('1'), 1); assert.equal(w('#'), 1); });
test('NFC正規化: か+濁点結合は「が」1文字=2', () => assert.equal(w('か\u3099'), 2));
test('通常文字数(コードポイント)併記', () => { const r = analyze('a😀あ'); assert.equal(r.codePoints, 3); assert.equal(r.weighted, 5); });
test('サロゲートペア漢字はコードポイント1・重み2', () => { const r = analyze('𠮷'); assert.equal(r.codePoints, 1); assert.equal(r.weighted, 2); });
test('上限は設定で変更可能', () => { const r = analyze('abcdef', { maxWeightedLength: 5 }); assert.equal(r.over, true); assert.equal(r.overflowIndex, 5); });
test('超過位置: URL途中で超えるとURL先頭', () => assert.equal(analyze('a'.repeat(270) + 'https://example.com').overflowIndex, 270));
test('1万字でも高速(<100ms)', () => { const t = Date.now(); analyze('あa😀'.repeat(3400)); assert.ok(Date.now() - t < 100); });
