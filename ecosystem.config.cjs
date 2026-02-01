module.exports = {
  apps: [
    {
      name: "nexus-iptv",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "/var/www/nexus-iptv",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3005
      },
      error_file: "/var/logs/nexus-iptv/pm2-error.log",
      out_file: "/var/logs/nexus-iptv/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true
    }
  ]
}