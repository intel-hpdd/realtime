%define base_name realtime

Name:     iml-%{base_name}
Version:  7.0.2
# Release Start
Release:  1%{?dist}
# Release End
Summary:  Provides Realtime data to IML
License:  MIT
Group:    System Environment/Libraries
URL:      https://github.com/whamcloud/%{base_name}
Source0:  %{name}-%{version}.tgz

%{?systemd_requires}
BuildRequires: systemd

Requires: nodejs
BuildRequires: nodejs-packaging
BuildRequires: npm

ExclusiveArch: %{nodejs_arches}

%description
This modules provides realtime data to the GUI.

%prep
%setup -q -n package
npm i --production
%nodejs_fixdep -r highland
%nodejs_fixdep -r intel-fp
%nodejs_fixdep -r intel-logger
%nodejs_fixdep -r intel-obj
%nodejs_fixdep -r intel-req
%nodejs_fixdep -r @iml/router
%nodejs_fixdep -r intel-through
%nodejs_fixdep -r json-mask
%nodejs_fixdep -r jsonschema
%nodejs_fixdep -r socket.io
%nodejs_fixdep -r uws
%nodejs_fixdep -r pg


%build
#nothing to do

%install
mkdir -p %{buildroot}%{_unitdir}
mkdir -p %{buildroot}%{nodejs_sitelib}/@iml/%{base_name}
mv iml-realtime.service %{buildroot}%{_unitdir}
cp -al . %{buildroot}%{nodejs_sitelib}/@iml/%{base_name}

%post
systemctl preset iml-realtime.service

%preun
%systemd_preun iml-realtime.service

%postun
%systemd_postun_with_restart iml-realtime.service

%clean
rm -rf %{buildroot}

%files
%{nodejs_sitelib}
%attr(0644,root,root)%{_unitdir}/iml-realtime.service

%changelog
* Thu Jun 27 2019 Joe Grund <jgrund@whamcloud.com> - 7.0.1-3
  - Bump to re-enable abi restriction

* Thu Jun 27 2019 Joe Grund <jgrund@whamcloud.com> - 7.0.1-2
  - Use Nodesource node for building

* Thu Jan 10 2019 Joe Grund <jgrund@whamcloud.com> - 7.0.1-1
  - Refactor to be compatible with Django 1.6

* Fri Jan 4 2019 Joe Grund <jgrund@whamcloud.com> - 7.0.0-2
  - Build using Docker copr image

* Tue Jun 19 2018 Will Johnson <wjohnson@whamcloud.com> - 7.0.0-1
  - Build using FAKE
  - Initial standalone RPM package
