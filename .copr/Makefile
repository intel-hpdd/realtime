NPM := $(shell if which npm 2>/dev/null; then true; else echo npm; fi)

$(NPM):
	dnf install -y npm
	dnf install -y nodejs-packaging

srpm: $(NPM)
	npm pack
	mkdir -p /tmp/_topdir/SOURCES
	cp -r ./* /tmp/_topdir/SOURCES
	rpmbuild -bs --define "_topdir /tmp/_topdir" /tmp/_topdir/SOURCES/iml-realtime.spec
	cp -r /tmp/_topdir/SRPMS/* $(outdir)
