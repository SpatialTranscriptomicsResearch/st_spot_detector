SRC_DIR = src
DEVEL_DIR = devel
DISTR_DIR = dist
NODE_DIR = ./node_modules/.bin

DEVEL ?= 0
ifeq ($(DEVEL), 1)
	BIN_DIR = $(DEVEL_DIR)
else
	BIN_DIR = $(DISTR_DIR)
endif

.PHONY: all clean

all: \
	$(shell find $(SRC_DIR) -type f | grep -e \.html$ | sed -r 's/^$(SRC_DIR)/$(BIN_DIR)/') \
	$(shell find $(SRC_DIR) -type f | grep -e \.png$ | sed -r 's/^$(SRC_DIR)/$(BIN_DIR)/') \
	$(BIN_DIR)/stylesheet.css \
	$(BIN_DIR)/main.bundle.js

clean:
	rm -fr $(BIN_DIR)/*

$(DISTR_DIR)/%.html: $(SRC_DIR)/%.html
	mkdir -p `dirname $@`
	$(NODE_DIR)/html-minifier --config-file ./html-minifier.conf.json $< > $@

$(DEVEL_DIR)/%.html: $(SRC_DIR)/%.html
	mkdir -p `dirname $@`
	sed "/library js/,/^$$/d" $< > $@

$(BIN_DIR)/%.png: $(SRC_DIR)/%.png
	mkdir -p `dirname $@`
	cp $< $@

$(DISTR_DIR)/stylesheet.css: $(shell find $(SRC_DIR) -type f | grep -e \.css$ )
	find $(SRC_DIR) -type f | grep -e \.css$$ | xargs cat > $(DISTR_DIR)/stylesheet.css
	$(NODE_DIR)/cleancss $(DISTR_DIR)/stylesheet.css -o $(DISTR_DIR)/stylesheet.css

$(DEVEL_DIR)/stylesheet.css: $(shell find $(SRC_DIR) -type f | grep -e \.css$ )
	find $(SRC_DIR) -type f | grep -e \.css$$ | xargs cat > $(DEVEL_DIR)/stylesheet.css

$(DISTR_DIR)/main.bundle.js: $(shell find $(SRC_DIR) -type f | grep -e \.js$ )
	$(NODE_DIR)/webpack --config ./webpack.config.dist.js
	find $(DISTR_DIR) | grep \.js$$ | \
		xargs -I '%' $(NODE_DIR)/uglifyjs --mangle --compress --output % -- %

$(DEVEL_DIR)/main.bundle.js: $(shell find $(SRC_DIR) -type f | grep -e \.js$ )
	$(NODE_DIR)/webpack --config ./webpack.config.devel.js
