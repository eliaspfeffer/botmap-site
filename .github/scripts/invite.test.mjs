import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guestLink, recentInvitations } from '../../invite/invite.mjs';

test('remembers a bounded same-browser list, deduplicates by grant, and expires old invitations', () => {
  const values = new Map();
  const storage = { getItem: values.get.bind(values), setItem: values.set.bind(values) };
  const link = id => guestLink('https://device.network.ts.net:10000/?guest=1#k=g_' + String(id).repeat(43));
  assert.deepEqual(recentInvitations(storage, link(0), 1), [link(0).href]);
  for (let i = 1; i <= 8; i++) recentInvitations(storage, link(i), i + 1);
  assert.deepEqual(recentInvitations(storage, link(6), 9), [6, 8, 7, 5, 4, 3].map(i => link(i).href));
  assert.deepEqual(recentInvitations(storage, null, 31 * 24 * 60 * 60 * 1000), []);
  assert.deepEqual(recentInvitations(undefined, null), []);
});

test('only accepts guest links with the key in the fragment', () => {
  assert.equal(guestLink('https://device.network.ts.net:10000/?guest=1#k=owner-key'), null);
  assert.equal(guestLink('https://example.net/?guest=1#k=g_' + 'X'.repeat(43)), null);
  assert.equal(guestLink('javascript:alert(1)'), null);
  assert.equal(guestLink('https://user@device.network.ts.net:10000/?guest=1#k=g_' + 'X'.repeat(43)), null);
  assert.equal(guestLink('https://device.network.ts.net:10000/?guest=1#k=g_' + 'X'.repeat(43)).search, '?guest=1');
});
