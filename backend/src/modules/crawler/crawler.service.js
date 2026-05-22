const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const AppError = require("../../utils/appError");

const ROOT_DIR = path.resolve(__dirname, "../../../../");
const DATABASE_DIR = path.join(ROOT_DIR, "database");
const PIPELINE_SCRIPT = path.join(DATABASE_DIR, "run_hourly_pipeline.py");
const DEFAULT_TIMEOUT_MS = Number(process.env.MANUAL_CRAWLER_TIMEOUT_MS || 300000);
const DEFAULT_COOLDOWN_MS = Number(process.env.MANUAL_CRAWLER_COOLDOWN_MS || 20000);

let runningCrawlerPromise = null;
let currentCrawlerStatus = null;
let lastCrawlerStatus = {
  is_running: false,
};

function resolvePythonCommand() {
  if (process.env.DATABASE_PIPELINE_PYTHON) {
    return process.env.DATABASE_PIPELINE_PYTHON;
  }

  const venvPython = process.platform === "win32"
    ? path.join(DATABASE_DIR, ".venv", "Scripts", "python.exe")
    : path.join(DATABASE_DIR, ".venv", "bin", "python");

  if (fs.existsSync(venvPython)) {
    return venvPython;
  }

  return process.platform === "win32" ? "py" : "python3";
}

function tailOutput(output, maxLines = 60) {
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-maxLines)
    .join("\n");
}

function logCrawlerChunk(chunk) {
  chunk
    .toString()
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((line) => {
      console.log(`[manual-crawler] ${line}`);
    });
}

function runPipelineProcess(args) {
  return new Promise((resolve, reject) => {
    const pythonCommand = resolvePythonCommand();
    const commandArgs = [];

    if (pythonCommand === "py") {
      commandArgs.push("-3.11");
    }

    commandArgs.push(PIPELINE_SCRIPT, ...args);
    console.log(
      `[manual-crawler] Start: ${pythonCommand} ${commandArgs.join(" ")}`
    );

    const child = spawn(pythonCommand, commandArgs, {
      cwd: DATABASE_DIR,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
      },
      windowsHide: true,
    });

    let output = "";

    const timeout = setTimeout(() => {
      child.kill();
      reject(new AppError("Crawler timeout", 504));
    }, DEFAULT_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      logCrawlerChunk(chunk);
    });

    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
      logCrawlerChunk(chunk);
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(new AppError(`Cannot start crawler: ${error.message}`, 500));
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      console.log(`[manual-crawler] Finished with code ${code}`);

      if (code !== 0) {
        reject(new AppError(`Crawler exited with code ${code}`, 500));
        return;
      }

      resolve({
        output: tailOutput(output),
      });
    });
  });
}

function finishCrawler(status, result) {
  lastCrawlerStatus = {
    ...status,
    ...result,
    is_running: false,
    finished_at: new Date().toISOString(),
  };
  currentCrawlerStatus = null;
  runningCrawlerPromise = null;
}

function getCooldownStatus() {
  if (!lastCrawlerStatus.finished_at || DEFAULT_COOLDOWN_MS <= 0) {
    return {
      cooldown_remaining_ms: 0,
      cooldown_until: null,
    };
  }

  const finishedAtMs = Date.parse(lastCrawlerStatus.finished_at);

  if (Number.isNaN(finishedAtMs)) {
    return {
      cooldown_remaining_ms: 0,
      cooldown_until: null,
    };
  }

  const cooldownUntilMs = finishedAtMs + DEFAULT_COOLDOWN_MS;
  const remainingMs = Math.max(0, cooldownUntilMs - Date.now());

  return {
    cooldown_remaining_ms: remainingMs,
    cooldown_until: remainingMs > 0
      ? new Date(cooldownUntilMs).toISOString()
      : null,
  };
}

function runManualCrawler(options, triggerUserId = null) {
  if (runningCrawlerPromise) {
    throw new AppError("Crawler is already running", 409);
  }

  const cooldownStatus = getCooldownStatus();
  if (cooldownStatus.cooldown_remaining_ms > 0) {
    const remainingSeconds = Math.ceil(
      cooldownStatus.cooldown_remaining_ms / 1000
    );
    throw new AppError(
      `Crawler cooldown, please try again in ${remainingSeconds} seconds`,
      429
    );
  }

  const maxResults = options.max_results || 5;
  const startedAt = new Date().toISOString();
  const status = {
    is_running: true,
    started_at: startedAt,
    scope: options.topic_id ? "topic" : "latest",
    topic_id: options.topic_id || null,
    max_results: maxResults,
  };
  const args = [
    "--run-once",
    "--crawler-max-results",
    String(maxResults),
    "--crawler-sleep-seconds",
    "10",
    "--skip-summary",
    "--skip-ai-trends",
  ];

  if (options.topic_id) {
    args.push("--topic-id", String(options.topic_id));
  }

  if (triggerUserId) {
    args.push("--trigger-user-id", String(triggerUserId));
  }

  currentCrawlerStatus = status;
  lastCrawlerStatus = status;
  runningCrawlerPromise = runPipelineProcess(args)
    .then((result) => {
      finishCrawler(status, {
        success: true,
        output: result.output,
      });
    })
    .catch((error) => {
      console.error("[manual-crawler] Failed:", error);
      finishCrawler(status, {
        success: false,
        error: error.message || "Crawler failed",
      });
    });

  return {
    ...status,
    accepted: true,
  };
}

function getCrawlerStatus() {
  if (currentCrawlerStatus) {
    return currentCrawlerStatus;
  }

  return {
    ...lastCrawlerStatus,
    ...getCooldownStatus(),
  };
}

module.exports = {
  runManualCrawler,
  getCrawlerStatus,
};
