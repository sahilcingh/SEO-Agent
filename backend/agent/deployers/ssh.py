"""SSH / VPS deployer — connects over SSH, patches files, runs deploy command."""
import io


class SSHDeployer:
    def __init__(self, host: str, user: str, password: str = "",
                 private_key: str = "", port: int = 22,
                 site_root: str = "/var/www/html",
                 deploy_command: str = ""):
        self.host = host
        self.user = user
        self.password = password
        self.private_key = private_key
        self.port = port
        self.site_root = site_root.rstrip("/")
        self.deploy_command = deploy_command  # e.g. "cd /var/www/app && npm run build"
        self._client = None
        self._sftp = None

    def connect(self):
        import paramiko
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        connect_kwargs = {"hostname": self.host, "username": self.user, "port": self.port}
        if self.private_key:
            pkey = paramiko.RSAKey.from_private_key(io.StringIO(self.private_key))
            connect_kwargs["pkey"] = pkey
        else:
            connect_kwargs["password"] = self.password
        client.connect(**connect_kwargs, timeout=15)
        self._client = client
        self._sftp = client.open_sftp()

    def disconnect(self):
        if self._sftp:
            self._sftp.close()
        if self._client:
            self._client.close()

    def read_file(self, path: str) -> str:
        with self._sftp.open(f"{self.site_root}/{path}", "r") as f:
            return f.read().decode("utf-8", errors="replace")

    def write_file(self, path: str, content: str):
        full = f"{self.site_root}/{path}"
        with self._sftp.open(full, "w") as f:
            f.write(content)

    def run(self, command: str) -> tuple[str, str]:
        """Run a shell command. Returns (stdout, stderr)."""
        _, stdout, stderr = self._client.exec_command(command)
        return stdout.read().decode(), stderr.read().decode()

    def deploy(self) -> str:
        if self.deploy_command:
            out, err = self.run(self.deploy_command)
            return f"Deploy output:\n{out}\n{err}"
        return "No deploy command configured — files updated in place."

    def detect_stack(self) -> str:
        try:
            self.run(f"test -f {self.site_root}/wp-config.php && echo wp")
            return "wordpress"
        except Exception:
            pass
        try:
            self.run(f"test -f {self.site_root}/package.json && echo js")
            return "js"
        except Exception:
            pass
        return "html"
