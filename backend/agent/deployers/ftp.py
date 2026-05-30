"""FTP / cPanel deployer — uploads changed files directly to hosting server."""
import ftplib
import io
import os


class FTPDeployer:
    def __init__(self, host: str, user: str, password: str,
                 remote_root: str = "/public_html"):
        self.host = host
        self.user = user
        self.password = password
        self.remote_root = remote_root.rstrip("/")
        self._ftp: ftplib.FTP | None = None

    def connect(self):
        self._ftp = ftplib.FTP(self.host, timeout=30)
        self._ftp.login(self.user, self.password)
        self._ftp.set_pasv(True)

    def disconnect(self):
        if self._ftp:
            try:
                self._ftp.quit()
            except Exception:
                pass

    def read_file(self, remote_path: str) -> str:
        buf = io.BytesIO()
        self._ftp.retrbinary(f"RETR {self.remote_root}/{remote_path}", buf.write)
        return buf.getvalue().decode("utf-8", errors="replace")

    def write_file(self, remote_path: str, content: str):
        buf = io.BytesIO(content.encode("utf-8"))
        full_path = f"{self.remote_root}/{remote_path}"
        # Ensure directory exists
        dirs = full_path.rsplit("/", 1)[0]
        self._ensure_dir(dirs)
        self._ftp.storbinary(f"STOR {full_path}", buf)

    def _ensure_dir(self, path: str):
        parts = path.split("/")
        current = ""
        for part in parts:
            if not part:
                continue
            current = f"{current}/{part}" if current else f"/{part}"
            try:
                self._ftp.mkd(current)
            except ftplib.error_perm:
                pass  # already exists

    def file_exists(self, remote_path: str) -> bool:
        try:
            self._ftp.size(f"{self.remote_root}/{remote_path}")
            return True
        except Exception:
            return False

    def detect_stack(self) -> str:
        """Detect stack from files present on server."""
        if self.file_exists("wp-config.php"):
            return "wordpress"
        if self.file_exists("package.json"):
            return "js"
        if self.file_exists("index.html") or self.file_exists("index.htm"):
            return "html"
        return "html"
