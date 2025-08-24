module.exports = {
  apps: [
    {
      name: 'chorechart-mobile',
      script: 'npx expo start --clear',
      cwd: '/home/user/webapp/mobile',
      env: {
        NODE_ENV: 'development',
        EXPO_PUBLIC_API_URL: 'https://3000-in94v68ruf2qj2t3orxw2-6532622b.e2b.dev',
      },
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_file: '/home/user/webapp/mobile/logs/combined.log',
      out_file: '/home/user/webapp/mobile/logs/out.log',
      error_file: '/home/user/webapp/mobile/logs/error.log',
      time: true
    }
  ]
};