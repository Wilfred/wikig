import path from "path";
import request from "supertest";
import { spawn } from "child_process";

test("the compiled server starts and serves HTTP requests", async () => {
  const server = spawn(process.execPath, ["dist/bin/www"], {
    cwd: path.resolve(__dirname, ".."),
    env: {
      ...process.env,
      NODE_ENV: "production",
      IN_MEMORY_DB: "true",
      PORT: "0",
      DEBUG: "wikig:server",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const closed = new Promise<void>((resolve) => {
    server.once("close", () => resolve());
  });
  let output = "";
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const port = await new Promise<number>((resolve, reject) => {
      const onData = (chunk: Buffer): void => {
        output += chunk.toString();
        const match = output.match(/Listening on port (\d+)/);
        if (match) {
          resolve(Number(match[1]));
        }
      };
      server.stdout.on("data", onData);
      server.stderr.on("data", onData);
      server.once("error", reject);
      server.once("close", (code, signal) => {
        reject(new Error(`Server exited (${code ?? signal}):\n${output}`));
      });
      timeout = setTimeout(() => {
        reject(new Error(`Server did not start:\n${output}`));
      }, 10000);
    });

    await request(`http://127.0.0.1:${port}`)
      .get("/")
      .timeout(2000)
      .expect(302)
      .expect("Location", "/HomePage");
  } finally {
    clearTimeout(timeout);
    server.kill();
    await closed;
  }
}, 15000);
