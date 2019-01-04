srpm:
	npm pack
	mkdir -p /tmp/_topdir/SOURCES
	cp -r ./* /tmp/_topdir/SOURCES
	rpmbuild -bs --define "_topdir /tmp/_topdir" iml-realtime.spec
	cp -r /tmp/_topdir/SRPMS/* $(outdir)
