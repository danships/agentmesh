#!/usr/bin/env node
import { program } from 'commander';
import path from 'node:path';
import { runAgent } from './runner.js';
import { loadConfig, resolveDataDir } from './config.js';
import { loadOrCreateAgentKey, createOwnerKey } from './keys.js';

program.name('agentmesh-agent').description('Run an AgentMesh agent').version('0.1.0');

program
  .command('start')
  .description('Start the agent (load config, keys, and run)')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (opts: { config?: string }) => {
    try {
      const agent = await runAgent(opts.config);
      console.error('Agent started. Peer ID:', agent.peerId);
      console.error('Press Ctrl+C to stop.');
      const shutdown = async () => {
        await agent.stop();
        process.exit(0);
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
      // Keep process alive
      await new Promise<void>(() => {});
    } catch (error) {
      console.error('Failed to start agent:', error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Scaffold config and generate keys in the data directory')
  .option('-c, --config <path>', 'Path to write config file (default: ./agentmesh.config.json)')
  .option('-d, --data-dir <path>', 'Data directory for keys (default: ./.agentmesh)')
  .action(async (opts: { config?: string; dataDir?: string }) => {
    const dataDir = opts.dataDir ?? './.agentmesh';
    const configPath = opts.config ?? './agentmesh.config.json';
    const { mkdirSync, writeFileSync } = await import('node:fs');
    mkdirSync(path.resolve(dataDir), { recursive: true });
    loadOrCreateAgentKey(path.resolve(dataDir));
    createOwnerKey(path.resolve(dataDir));
    const config = {
      name: 'my-agent',
      dataDir: path.resolve(dataDir),
      transport: { network: 'public', listenPort: 0, bootstrapAddrs: [] },
      tools: [],
    };
    writeFileSync(path.resolve(configPath), JSON.stringify(config, null, 2));
    console.error('Created', configPath, 'and keys in', dataDir);
  });

program
  .command('keys show')
  .description('Show agent ID (public key hex) and multiaddrs if agent is running')
  .option('-d, --data-dir <path>', 'Data directory (default: from config or ~/.agentmesh)')
  .action(async (opts: { dataDir?: string }) => {
    const config = loadConfig();
    const dataDir = opts.dataDir ?? resolveDataDir(config);
    const identity = loadOrCreateAgentKey(dataDir);
    const hex = Buffer.from(identity.publicKey).toString('hex');
    console.log('Agent public key (hex):', hex);
    console.log('Agent URI: agent://' + hex.slice(0, 16) + '...');
  });

program.parse();
