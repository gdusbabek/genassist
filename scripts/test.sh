echo running tests

if [ ! $TEST_FILES ]; then
    TEST_FILES=$(find tests -type f -name "test-*.js" -print0 | tr "\0" " " | sed '$s/.$//')
fi

# hack to get the absolute path of the config dir.
RETCWD=`pwd`
cd tests
CONFIG_DIR=`pwd`
cd ${RETCWD}

echo GENASSIST_CONFIG_DIR=${CONFIG_DIR}

NODE_PATH=lib NODE_ENV=testing GENASSIST_CONFIG_DIR=${CONFIG_DIR} node_modules/whiskey/bin/whiskey \
    --tests "${TEST_FILES}" \
    --real-time \
    --report-timing \
    --failfast \
    --timeout 40000 \
    --sequential