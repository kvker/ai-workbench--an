const { spawn } = require('node:child_process');
const readline = require('node:readline');

class JsonRpcClient {
  constructor(command, args, options = {}) {
    this.command = command;
    this.args = args;
    this.cwd = options.cwd;
    this.env = options.env;
    this.requestTimeoutMs = options.requestTimeoutMs || 30000;
    this.pending = new Map();
    this.notificationHandlers = new Set();
    this.nextId = 1;
    this.closed = false;
    this.stderr = '';
  }

  start() {
    this.child = spawn(this.command, this.args, {
      cwd: this.cwd,
      env: this.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.child.on('error', (error) => this.rejectAll(error));
    this.child.on('exit', (code, signal) => {
      this.closed = true;
      this.rejectAll(new Error(`codex app-server exited with code=${code} signal=${signal}`));
    });

    this.child.stderr.on('data', (chunk) => {
      this.stderr += chunk.toString();
    });

    const lines = readline.createInterface({ input: this.child.stdout });
    lines.on('line', (line) => this.handleLine(line));

    return this;
  }

  async request(method, params) {
    const id = this.nextId++;
    const payload = { jsonrpc: '2.0', id, method, params };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`codex app-server request timed out: ${method}`));
      }, this.requestTimeoutMs);

      this.pending.set(id, { resolve, reject, timeout });
      this.write(payload);
    });
  }

  notify(method, params) {
    this.write({ jsonrpc: '2.0', method, params });
  }

  onNotification(handler) {
    this.notificationHandlers.add(handler);

    return () => this.notificationHandlers.delete(handler);
  }

  close() {
    if (!this.child || this.closed) {
      return;
    }

    this.child.kill();
  }

  write(payload) {
    if (!this.child || !this.child.stdin.writable) {
      throw new Error('codex app-server stdin is not writable.');
    }

    this.child.stdin.write(`${JSON.stringify(payload)}\n`);
  }

  handleLine(line) {
    if (!line.trim()) {
      return;
    }

    let message;

    try {
      message = JSON.parse(line);
    } catch (error) {
      return;
    }

    if (message.id !== undefined && this.pending.has(message.id)) {
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(pending.timeout);

      if (message.error) {
        pending.reject(new Error(message.error.message || JSON.stringify(message.error)));
        return;
      }

      pending.resolve(message.result);
      return;
    }

    if (message.method) {
      for (const handler of this.notificationHandlers) {
        handler(message);
      }
    }
  }

  rejectAll(error) {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timeout);
      pending.reject(error);
      this.pending.delete(id);
    }
  }
}

module.exports = {
  JsonRpcClient,
};
