# To Test
cd ~/Projects/npm-script && npmre
cd ~/Projects/npm-script-preset-videojs && npmre && npm link ~/Projects/npm-script
cd ./test/fixtures/videojs-test-plugin
npm i && npm link ~/Projects/npm-script && npm link ~/Projects/npm-script-preset-videojs

