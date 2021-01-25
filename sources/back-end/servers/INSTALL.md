# HOW TO INSTALL

See: [docker-tuntap-osx](https://github.com/AlmirKadric-Published/docker-tuntap-osx) repository.

## tuntap

```bash
brew install --cask tuntap
```

## docker-tuntap-osx

```bash
brew install mahoney/tap/docker-tuntap-osx
```

### Caveats

A full uninstall requires running the uninstall script ***`before`*** doing a
brew uninstall:

```bash
/usr/local/opt/docker-tuntap-osx/bin/docker_tap_uninstall.sh
```

You must manually make root own the scripts:

```bash
sudo chown root /usr/local/opt/docker-tuntap-osx/sbin/docker_tap_*
```

A full uninstall requires removing the docker container and image:

```bash
docker rm -f docker-lifecycle-notifier
```

```bash
docker image rm docker-lifecycle-notifier
```

To prevent docker-lifecycle-listener being a backdoor for untrusted code
it requires `/usr/local/etc/docker-lifecycle-listener.d` and everything
within it to be owned by `root` and only writable by `root`.

You must change the ownership manually:

```bash
sudo chown -R root:admin /usr/local/etc/docker-lifecycle-listener.d
```

To have launchd start mahoney/tap/docker-lifecycle-listener now and restart at startup:

```bash
sudo brew services start mahoney/tap/docker-lifecycle-listener
```
