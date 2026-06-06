"""Thin wrappers over `tmux -L uvs`.

We use a dedicated tmux socket (`-L uvs`) so Watchtower-spawned sessions never
clash with the user's own tmux server. Functions are synchronous subprocess
calls — invoke them from async code via `asyncio.to_thread`.
"""
import shutil
import subprocess

SOCKET = "uvs"


def _tmux(*args: str) -> tuple[bool, str]:
    """Run `tmux -L uvs <args>`; return (ok, combined output)."""
    if not has_tmux():
        return False, "tmux not found on PATH"
    proc = subprocess.run(
        ["tmux", "-L", SOCKET, *args],
        capture_output=True,
        text=True,
    )
    out = (proc.stdout or "") + (proc.stderr or "")
    return proc.returncode == 0, out.strip()


def has_tmux() -> bool:
    return shutil.which("tmux") is not None


def spawn(session_id: str, command: str, cwd: str) -> str:
    """Start a detached session named `uvs_<id>`; return its target."""
    target = f"uvs_{session_id}"
    ok, out = _tmux("new-session", "-d", "-s", target, "-c", cwd, command)
    if not ok:
        raise RuntimeError(f"tmux new-session failed: {out}")
    return target


def send_keys(target: str, keys: str, enter: bool = True) -> tuple[bool, str]:
    args = ["send-keys", "-t", target, keys]
    if enter:
        args.append("Enter")
    return _tmux(*args)


def capture_pane(target: str) -> str:
    ok, out = _tmux("capture-pane", "-t", target, "-p")
    if not ok:
        raise RuntimeError(f"tmux capture-pane failed: {out}")
    return out


def kill_session(target: str) -> tuple[bool, str]:
    return _tmux("kill-session", "-t", target)
