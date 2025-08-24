module.exports = {
  apps: [
    {
      name: 'chorechart-web',
      script: 'npm run dev',
      cwd: '/home/user/webapp/web',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_file: '/home/user/webapp/web/logs/combined.log',
      out_file: '/home/user/webapp/web/logs/out.log',
      error_file: '/home/user/webapp/web/logs/error.log',
      time: true
    }
  ]
};