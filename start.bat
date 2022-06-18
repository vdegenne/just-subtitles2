@REM SET ENV=prod
@REM pm2 start pm2.config.cjs

echo 'Starting the server, please wait'

wsl.exe ENV=prod pm2 start pm2.config.cjs