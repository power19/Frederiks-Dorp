import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface PingResult {
  alive: boolean;
  latency: number | null;
  checkedAt: string;
}

export async function pingHost(ip: string): Promise<PingResult> {
  const isWindows = process.platform === "win32";
  const command = isWindows
    ? `ping -n 1 -w 2000 ${ip}`
    : `ping -c 1 -W 2 ${ip}`;

  const checkedAt = new Date().toISOString();

  try {
    const { stdout } = await execAsync(command, { timeout: 5000 });

    // Parse latency from ping output
    let latency: number | null = null;

    if (isWindows) {
      const match = stdout.match(/Average = (\d+)ms/);
      if (match) latency = parseInt(match[1], 10);
    } else {
      const match = stdout.match(/time[=<](\d+(?:\.\d+)?)\s*ms/);
      if (match) latency = parseFloat(match[1]);
    }

    return { alive: true, latency, checkedAt };
  } catch {
    return { alive: false, latency: null, checkedAt };
  }
}
