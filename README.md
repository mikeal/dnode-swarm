# dnode swarm

This library implements a swarm of remote rpc peers.

It uses:

* upnode (reliabilty layer on top of dnode)
* bittorrent-dht (decentralized peer info)

## Usage

```javascript
var opts = {}
opts.rpc = {echo: (text, cb) => cb(null, text)}
opts.infoHash = new Buffer(20).fill('testing-').toString('hex')

var s1 = createSwarm(opts)
var s2 = createSwarm(opts)

// This will print twice, one is the connection to itself
// the other is the connection to s2
s1.remotes().forEach(remote => {
  remote.echo('test', (null, text) => console.log(text))
})
```