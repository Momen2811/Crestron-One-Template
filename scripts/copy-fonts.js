#!/usr/bin/env node
/**
 * Copies the specific Sora + JetBrains Mono WOFF2 files we use from the
 * @fontsource packages into app/template/assets/fonts/ so the panel runs
 * without depending on fonts.googleapis.com at runtime.
 *
 * Wired as a postinstall hook in package.json — runs automatically after
 * `npm install`. Also exposed as `npm run copy:fonts` for manual re-runs.
 *
 * Idempotent: re-running overwrites the destination files cleanly.
 * Safe on a fresh clone: if @fontsource packages aren't installed yet
 * (e.g. running before npm install completes), exits 0 with a warning.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '..', 'app', 'template', 'assets', 'fonts');

const COPIES = [
    { src: '@fontsource/sora',           name: 'sora',           weights: [300, 400, 500, 600, 700] },
    { src: '@fontsource/jetbrains-mono', name: 'jetbrainsmono',  weights: [400, 500, 600] }
];

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyOne(family) {
    let pkgFilesDir;
    try {
        const pkgJson = require.resolve(family.src + '/package.json');
        pkgFilesDir = path.join(path.dirname(pkgJson), 'files');
    } catch (e) {
        console.warn(`[copy-fonts] ${family.src} not installed yet; skipping (run after npm install).`);
        return;
    }
    if (!fs.existsSync(pkgFilesDir)) {
        console.warn(`[copy-fonts] ${pkgFilesDir} does not exist; @fontsource layout changed?`);
        return;
    }

    ensureDir(DEST_DIR);

    family.weights.forEach((w) => {
        // @fontsource v5 file pattern: <family-key>-latin-<weight>-normal.woff2
        // where <family-key> is the npm package name minus the @fontsource/ prefix.
        const familyKey = family.src.replace('@fontsource/', '');
        const srcFile   = path.join(pkgFilesDir, `${familyKey}-latin-${w}-normal.woff2`);
        const destFile  = path.join(DEST_DIR,    `${family.name}-${w}.woff2`);

        if (!fs.existsSync(srcFile)) {
            console.warn(`[copy-fonts] missing source: ${srcFile}`);
            return;
        }
        fs.copyFileSync(srcFile, destFile);
        console.log(`[copy-fonts] ${family.name}-${w}.woff2   (${fs.statSync(destFile).size} bytes)`);
    });
}

console.log('[copy-fonts] copying WOFF2 files into', DEST_DIR);
COPIES.forEach(copyOne);
console.log('[copy-fonts] done.');
