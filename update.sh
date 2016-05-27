#!/bin/bash

git checkout master -- index.js
rm -rf docs/
documentation build index.js -f html -o docs
git checkout master -- README.md
marked -o README.html README.md --gfm
mustache -p README.html view.json index.mustache > index.html