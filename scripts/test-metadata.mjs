import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { crc32, deflateSync } from 'node:zlib';
import ts from 'typescript';

// 使用项目已有编译器运行引擎测试，不引入额外测试框架。
const output = path.resolve('.next/metadata-tests/engine.mjs');
await mkdir(path.dirname(output), { recursive: true });
const source = await readFile('src/app/lib/metadata/exifToolEngine.ts', 'utf8');
await writeFile(output, ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText);
const engine = await import(pathToFileURL(output));
// WASM 在 Node 中模拟浏览器加载，所有文件和资源均来自本地。
globalThis.window = {};
globalThis.document = {};
globalThis.fetch = async () => new Response(await readFile('public/zeroperl.wasm'), {
  headers: { 'Content-Type': 'application/wasm' },
});
const tag = (name, displayValue) => ({ name, key: `GPS:${name}`, group: 'EXIF', displayValue, value: displayValue, editable: true, changed: false });

test('GPS degrees, minutes and seconds preserve fractions and hemisphere', () => {
  const draft = engine.buildDraftFromTags([
    tag('GPSLatitude', '33 deg 51\' 30.00" S'),
    tag('GPSLongitude', '151 deg 12\' 54.00" E'),
    tag('GPSAltitude', '12 m Below Sea Level'),
  ]);
  assert.equal(draft.gpsLatitude, '-33.858333');
  assert.equal(draft.gpsLongitude, '151.215');
  assert.equal(draft.gpsAltitude, '-12');
});

test('separate GPS reference tags supply southern and western signs', () => {
  const draft = engine.buildDraftFromTags([
    tag('GPSLatitude', '22.5'), tag('GPSLatitudeRef', 'South'),
    tag('GPSLongitude', '43.25'), tag('GPSLongitudeRef', 'West'),
  ]);
  assert.equal(draft.gpsLatitude, '-22.5');
  assert.equal(draft.gpsLongitude, '-43.25');
});

test('GPS validation rejects truncated and out-of-range values but allows deletion', () => {
  const base = engine.EMPTY_METADATA_DRAFT;
  assert.equal(engine.hasInvalidGpsDraft({ ...base, gpsLatitude: '91' }), true);
  assert.equal(engine.hasInvalidGpsDraft({ ...base, gpsLongitude: '-181' }), true);
  assert.equal(engine.hasInvalidGpsDraft({ ...base, gpsLatitude: '22junk' }), true);
  assert.equal(engine.hasInvalidGpsDraft({ ...base, gpsLatitude: '-22.5', gpsLongitude: '180', gpsAltitude: '-12' }), false);
  assert.equal(engine.hasInvalidGpsDraft(base), false);
});

function png() {
  const chunk = (type, data) => {
    const name = Buffer.from(type);
    const size = Buffer.alloc(4);
    size.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
    return Buffer.concat([size, name, data, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(2, 0);
  header.writeUInt32BE(2, 4);
  header[8] = 8;
  header[9] = 6;
  return new File([Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.from([0,255,0,0,255,0,255,0,255,0,0,0,255,255,255,255,255,255]))),
    chunk('IEND', Buffer.alloc(0)),
  ])], 'same-name.png', { type: 'image/png' });
}

test('parallel reads and writes do not mix metadata or wedge the engine after a failure', async () => {
  const results = await Promise.all(['Alpha', 'Beta', 'Gamma'].map((title) =>
    engine.writeMetadataEntries(png(), { 'XMP-dc:Title': title })
  ));
  for (const result of results) assert.equal(result.success, true, result.error);
  const tags = await Promise.all(results.map((result) => engine.readMetadata(result.file)));
  assert.deepEqual(tags.map((items) => items.find((item) => item.name === 'Title')?.displayValue), ['Alpha', 'Beta', 'Gamma']);
  const failed = await engine.writeMetadataEntries(png(), { 'DefinitelyNotARealTag': 'x' });
  assert.equal(failed.success, false);
  assert.equal(failed.failedTags[0].key, 'DefinitelyNotARealTag');
  const cleared = await engine.clearMetadata(results[0].file);
  assert.equal(cleared.success, true, cleared.error);
  const cleanTags = await engine.readMetadata(cleared.file);
  assert.equal(cleanTags.some((item) => item.name === 'Title'), false);
  assert.ok(cleanTags.filter((item) => ['System', 'File', 'Composite'].includes(item.group)).every((item) => !item.editable));
  const gps = await engine.writeMetadataEntries(png(), {
    'XMP-exif:GPSLatitude': '33.5 S', 'XMP-exif:GPSLongitude': '151.25 E',
    'XMP-dc:Title': 'Retained title',
  });
  assert.equal(gps.success, true, gps.error);
  const gpsTags = await engine.readMetadata(gps.file);
  assert.ok(gpsTags.some((item) => item.name === 'GPSLatitude'));
  const withoutGps = await engine.clearGps(gps.file);
  assert.equal(withoutGps.success, true, withoutGps.error);
  const remainingTags = await engine.readMetadata(withoutGps.file);
  assert.equal(remainingTags.some((item) => item.name.startsWith('GPS')), false);
  assert.equal(remainingTags.find((item) => item.name === 'Title')?.displayValue, 'Retained title');
});

test('clearing canvas JPEG removes ICC without treating the expected warning as a failure', async () => {
  // 由浏览器 Canvas 生成的 2x2 纯红 JPEG，包含浏览器自动写入的 sRGB ICC。
  const data = Buffer.from(await readFile('scripts/fixtures/canvas-icc.jpg.base64', 'utf8'), 'base64');
  const file = new File([data], 'canvas.jpg', { type: 'image/jpeg' });
  const original = await engine.readMetadata(file);
  assert.ok(original.some((tag) => tag.group === 'ICC'));
  const result = await engine.clearMetadata(file);
  assert.equal(result.success, true, result.error);
  const tags = await engine.readMetadata(result.file);
  assert.equal(tags.some((tag) => tag.group === 'ICC'), false);
  assert.equal(tags.find((tag) => tag.name === 'ImageWidth')?.value, 2);
  const draft = { ...engine.EMPTY_METADATA_DRAFT, title: 'Round trip', author: 'Author', gpsLatitude: '-33.858333', gpsLongitude: '151.215', gpsAltitude: '-12' };
  const written = await engine.writeMetadataEntries(file, engine.buildCommonMetadataEntries(draft, engine.EMPTY_METADATA_DRAFT));
  assert.equal(written.success, true, written.error);
  assert.deepEqual(written.failedTags, []);
  const roundTrip = engine.buildDraftFromTags(await engine.readMetadata(written.file));
  assert.equal(roundTrip.title, draft.title);
  assert.equal(roundTrip.author, draft.author);
  assert.equal(roundTrip.gpsLatitude, draft.gpsLatitude);
  assert.equal(roundTrip.gpsAltitude, '-12');
});
