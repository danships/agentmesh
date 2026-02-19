import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
  loadOrCreateAgentKey,
  loadOwnerKey,
  createOwnerKey,
  loadOrCreateDelegationCert,
} from '../src/keys.js';

describe('keys', () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), 'agentmesh-keys-'));
  });

  afterEach(() => {
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('loadOrCreateAgentKey creates key file and returns identity', () => {
    const id = loadOrCreateAgentKey(dataDir);
    expect(id.publicKey).toHaveLength(32);
    expect(id.secretKey).toHaveLength(32);
    const id2 = loadOrCreateAgentKey(dataDir);
    expect(id2.publicKey).toEqual(id.publicKey);
  });

  it('loadOwnerKey returns undefined when no key', () => {
    expect(loadOwnerKey(dataDir)).toBeUndefined();
  });

  it('createOwnerKey creates key file', () => {
    const owner = createOwnerKey(dataDir);
    expect(owner.publicKey).toHaveLength(32);
    expect(loadOwnerKey(dataDir)).toBeDefined();
  });

  it('loadOrCreateDelegationCert creates cert when owner exists', () => {
    const agentId = loadOrCreateAgentKey(dataDir);
    const ownerId = createOwnerKey(dataDir);
    const cert = loadOrCreateDelegationCert(dataDir, agentId.publicKey, ownerId);
    expect(cert.owner).toBeDefined();
    expect(cert.agent).toBeDefined();
    expect(cert.signature).toBeDefined();
    expect(cert.expiresAt).toBeGreaterThan(Date.now());
  });
});
