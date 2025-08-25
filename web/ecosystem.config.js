module.exports = {
  apps: [{
    name: 'choreside-web',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/user/webapp/web',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}