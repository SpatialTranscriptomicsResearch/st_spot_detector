SRC_DIR = src
NODE_DIR = ./node_modules/.bin

WATCH ?= 0

.PHONY: all clean

all: dist devel docs

devel dist: %: $(shell find $(SRC_DIR)) config-builder.js webpack.config.%.js
	@echo "Compiling $@ build..."
	@cmd="${NODE_DIR}/webpack --config webpack.config.$@.js" ;\
	if [ ${WATCH} -eq 1 ]; then cmd="$$cmd --watch"; fi      ;\
	$${cmd} && touch -cm $@

docs: $(shell find $(SRC_DIR) | grep \.js$)
	@echo "Compiling docs..."
	@$(NODE_DIR)/jsdoc $(SRC_DIR)/* -d docs && touch -cm ./docs

clean:
	@if [ -d devel ]; then echo "Removing ./devel"; rm -r devel; fi
	@if [ -d dist  ]; then echo "Removing ./dist" ; rm -r dist ; fi
	@if [ -d docs  ]; then echo "Removing ./docs" ; rm -r docs ; fi
