#
# Run all tests
#

ifndef only
test:
	bin/expresso -I lib test/*.test.js
else
test:
	rm -rf files_*
	bin/expresso -I lib test/${only}.test.js
endif

.PHONY: test
