#!/usr/bin/env node
/**
 * Refuses to deploy from a working tree that does not match git.
 *
 * WHY THIS EXISTS
 * `ng deploy` builds from the FILES ON DISK, not from a git ref. For months
 * that meant production at abadaoc.com contained work that had never been
 * committed — the booking page, the musica page and its guard, and a pile of
 * modified templates were all live but untracked. Recovering what was actually
 * deployed required grepping the minified production bundle.
 *
 * This script makes that impossible to repeat: if the tree is dirty, the
 * deploy stops before it builds. npm runs it automatically via the `predeploy`
 * lifecycle hook whenever you run `npm run deploy`.
 *
 * Escape hatch (use deliberately, not habitually):
 *   ALLOW_DIRTY_DEPLOY=1 npm run deploy
 */

const { execSync } = require('child_process');

const RED = '\x1b[31m', YEL = '\x1b[33m', GRN = '\x1b[32m', DIM = '\x1b[2m', OFF = '\x1b[0m';

function git(args) {
  return execSync(`git ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function fail(title, detail, fix) {
  console.error(`\n${RED}✖ Deploy blocked: ${title}${OFF}\n`);
  if (detail) console.error(detail + '\n');
  if (fix) console.error(`${YEL}How to fix:${OFF}\n${fix}\n`);
  console.error(`${DIM}Override (only if you truly mean it): ALLOW_DIRTY_DEPLOY=1 npm run deploy${OFF}\n`);
  process.exit(1);
}

if (process.env.ALLOW_DIRTY_DEPLOY === '1') {
  console.warn(`\n${YEL}⚠ ALLOW_DIRTY_DEPLOY=1 — deploying whatever is on disk, unchecked.${OFF}`);
  console.warn(`${YEL}  Whatever ships will not be recorded in git.${OFF}\n`);
  process.exit(0);
}

// 1. The tree must be clean. Untracked files under src/ matter most — that is
//    exactly how the booking page shipped without ever being committed.
const status = git('status --porcelain');
if (status) {
  const lines = status.split('\n');
  const untrackedSrc = lines.filter(l => l.startsWith('??') && l.includes('src/'));
  fail(
    'uncommitted changes',
    `These would be built into the deploy but are not in git:\n\n${status}` +
      (untrackedSrc.length
        ? `\n\n${RED}Note: ${untrackedSrc.length} untracked file(s) under src/ — these WILL ship and would be invisible in git history.${OFF}`
        : ''),
    '  git add -A && git commit      commit it, then deploy\n' +
    '  git stash                     shelve it, then deploy\n' +
    '  git checkout -- .             discard it (destructive)'
  );
}

// 2. Deploy from main. Deploying a feature branch is almost always an accident.
const branch = git('rev-parse --abbrev-ref HEAD');
if (branch !== 'main') {
  fail(
    `you are on "${branch}", not main`,
    'Production is built from main. Deploying a feature branch would push\nunreleased work live.',
    '  git checkout main'
  );
}

// 3. Local main should match origin/main, so the deployed commit is one that
//    actually exists for everyone else.
try {
  execSync('git fetch origin --quiet', { stdio: 'ignore' });
  const local = git('rev-parse main');
  const remote = git('rev-parse origin/main');
  if (local !== remote) {
    const ahead = git('rev-list --count origin/main..main');
    const behind = git('rev-list --count main..origin/main');
    fail(
      'main is out of sync with origin/main',
      `ahead ${ahead}, behind ${behind}. Deploying now would put code live that\nis not on the remote, so nobody else could reproduce this build.`,
      ahead !== '0' ? '  git push origin main' : '  git pull origin main'
    );
  }
} catch (err) {
  console.warn(`\n${YEL}⚠ Could not compare against origin (offline?). Continuing.${OFF}\n`);
}

const sha = git('rev-parse --short HEAD');
console.log(`\n${GRN}✔ Tree clean, on main, in sync with origin. Deploying ${sha}.${OFF}\n`);
