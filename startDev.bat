REM not running grunt for now to autobuild JS b/c it kills CPU
REM start grunt
pushd C:\Program Files\MongoDB\Server\3.2\bin
start mongod --port 27017 --dbpath C:\git\gunswap\data
start mongo
popd
start node server.js