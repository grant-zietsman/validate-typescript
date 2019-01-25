#!/bin/bash

cd "$(dirname "$0")"

set -e;

cd ..
npm link

cd test
npm link validate-typescript