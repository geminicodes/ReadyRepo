import { spawn } from "node:child_process";

function run(label, args) {
  const child = spawn("npm", args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: false
  });

  const prefix = `[${label}] `;
  child.stdout.on("data", (d) => process.stdout.write(prefix + String(d)));
  child.stderr.on("data", (d) => process.stderr.write(prefix + String(d)));

  child.on("exit", (code, signal) => {
    // If one exits, propagate the exit code.
    if (signal) process.exitCode = 1;
    else process.exitCode = code ?? 1;
  });

  return child;
}

const server = run("server", ["run", "dev", "-w", "server"]);
const client = run("client", ["run", "dev", "-w", "client"]);

function shutdown() {
  server.kill("SIGINT");
  client.kill("SIGINT");
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(130);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(143);
});

