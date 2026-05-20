import argparse
import os
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
IS_WINDOWS = os.name == "nt"


def npm_command():
    return "npm.cmd" if IS_WINDOWS else "npm"


def venv_python(directory):
    if IS_WINDOWS:
        candidate = directory / ".venv" / "Scripts" / "python.exe"
    else:
        candidate = directory / ".venv" / "bin" / "python"

    return candidate if candidate.exists() else None


def module_python(primary_dir, fallback_dirs=None):
    fallback_dirs = fallback_dirs or []

    for directory in [primary_dir, *fallback_dirs]:
        candidate = venv_python(directory)
        if candidate:
            return str(candidate)

    return sys.executable


def build_services(args):
    services = []

    if not args.skip_backend:
        services.append(
            {
                "name": "backend",
                "cwd": ROOT_DIR / "backend",
                "cmd": [npm_command(), "run", "dev"],
            }
        )

    if not args.skip_frontend:
        services.append(
            {
                "name": "frontend",
                "cwd": ROOT_DIR / "frontend",
                "cmd": [npm_command(), "run", "dev"],
            }
        )

    if not args.skip_ai:
        ai_python = module_python(ROOT_DIR / "ai")
        services.append(
            {
                "name": "ai",
                "cwd": ROOT_DIR / "ai",
                "cmd": [
                    ai_python,
                    "-m",
                    "uvicorn",
                    "app:app",
                    "--host",
                    args.ai_host,
                    "--port",
                    str(args.ai_port),
                    "--reload",
                ],
            }
        )

    if not args.skip_database:
        db_python = module_python(ROOT_DIR / "database", [ROOT_DIR / "ai"])
        pipeline_cmd = [
            db_python,
            "run_hourly_pipeline.py",
            "--interval-hours",
            str(args.pipeline_interval_hours),
            "--crawler-max-results",
            str(args.crawler_max_results),
            "--crawler-sleep-seconds",
            str(args.crawler_sleep_seconds),
            "--summary-batch-size",
            str(args.summary_batch_size),
        ]

        if not args.pipeline_run_immediately:
            pipeline_cmd.append("--no-run-immediately")

        if args.skip_summary:
            pipeline_cmd.append("--skip-summary")

        services.append(
            {
                "name": "database",
                "cwd": ROOT_DIR / "database",
                "cmd": pipeline_cmd,
            }
        )

    return services


def stream_output(name, process):
    for line in process.stdout:
        print(f"[{name}] {line.rstrip()}", flush=True)


def start_service(service):
    print(
        f"[start] {service['name']}: {' '.join(map(str, service['cmd']))}",
        flush=True,
    )

    creationflags = 0
    if IS_WINDOWS:
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP

    process = subprocess.Popen(
        service["cmd"],
        cwd=service["cwd"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        text=True,
        encoding="utf-8",
        errors="replace",
        creationflags=creationflags,
    )

    thread = threading.Thread(
        target=stream_output,
        args=(service["name"], process),
        daemon=True,
    )
    thread.start()

    return process


def stop_process(name, process):
    if process.poll() is not None:
        return

    print(f"[stop] {name}", flush=True)

    try:
        if IS_WINDOWS:
            process.send_signal(signal.CTRL_BREAK_EVENT)
            time.sleep(1)

        if process.poll() is None:
            process.terminate()

        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
    except Exception as error:
        print(f"[warn] Could not stop {name}: {error}", flush=True)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Start backend, frontend, AI service, and database pipeline."
    )
    parser.add_argument("--skip-backend", action="store_true")
    parser.add_argument("--skip-frontend", action="store_true")
    parser.add_argument("--skip-ai", action="store_true")
    parser.add_argument("--skip-database", action="store_true")
    parser.add_argument("--ai-host", default="0.0.0.0")
    parser.add_argument("--ai-port", type=int, default=8001)
    parser.add_argument("--pipeline-interval-hours", type=float, default=1)
    parser.add_argument("--pipeline-run-immediately", action="store_true")
    parser.add_argument("--crawler-max-results", type=int, default=15)
    parser.add_argument("--crawler-sleep-seconds", type=int, default=3)
    parser.add_argument("--summary-batch-size", type=int, default=20)
    parser.add_argument("--skip-summary", action="store_true")
    return parser.parse_args()


def main():
    args = parse_args()
    services = build_services(args)

    if not services:
        print("[error] No services selected.", flush=True)
        return 1

    processes = []

    try:
        for service in services:
            process = start_service(service)
            processes.append((service["name"], process))
            time.sleep(0.5)

        print("", flush=True)
        print("[ready] Started selected services.", flush=True)
        print("[ready] Backend:  http://localhost:8000/api/v1/health", flush=True)
        print("[ready] Frontend: http://localhost:5173", flush=True)
        print("[ready] AI:       http://localhost:8001/docs", flush=True)
        print("[ready] Press Ctrl+C to stop all services.", flush=True)

        while True:
            for name, process in processes:
                return_code = process.poll()
                if return_code not in (None, 0):
                    print(
                        f"[error] {name} exited with code {return_code}.",
                        flush=True,
                    )
                    raise KeyboardInterrupt
            time.sleep(1)
    except KeyboardInterrupt:
        print("", flush=True)
        print("[shutdown] Stopping services...", flush=True)
    finally:
        for name, process in reversed(processes):
            stop_process(name, process)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
