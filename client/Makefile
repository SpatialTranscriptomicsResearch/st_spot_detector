SRC_DIR = src
NODE_DIR = ./node_modules/.bin

.PHONY: all clean

all: dist devel docs

devel: $(shell find $(SRC_DIR)) config-builder.js webpack.config.devel.js
	@echo "Compiling development build..."
	@$(NODE_DIR)/webpack --config ./webpack.config.devel.js && touch -cm ./devel

dist: $(shell find $(SRC_DIR)) config-builder.js webpack.config.dist.js
	@echo "Compiling release build..."
	@$(NODE_DIR)/webpack --config ./webpack.config.dist.js && touch -cm ./dist

docs: $(shell find $(SRC_DIR) | grep \.js$)
	@echo "Compiling docs..."
	@$(NODE_DIR)/jsdoc $(SRC_DIR)/* -d docs && touch -cm ./docs

clean:
	@if [ -d devel ]; then echo "Removing ./devel"; rm -r devel; fi
	@if [ -d dist  ]; then echo "Removing ./dist" ; rm -r dist ; fi
	@if [ -d docs  ]; then echo "Removing ./docs" ; rm -r docs ; fi
