const upnode = require('upnode')
const DHT = require('bittorrent-dht')
const crypto = require('crypto')
const values = o => Object.keys(o).map(k => o[k])
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
// const onePunch = require('./one-punch')

function createSwarm (opts, cb) {
  var rpc = opts.rpc
  var infoHash = opts.infoHash
  var dhtPort = opts.dhtPort || rand(20000, 50000)
  var dnodePort = opts.dnodePort || rand(20000, 50000)

  if (!rpc) throw new Error('rpc argument is required')
  if (!infoHash) throw new Error('infoHash is required')

  var clients = {}
  var dht = new DHT()

  var server = upnode(function (client, conn) {
    for (var key in rpc) this[key] = rpc[key]
    this.serviceId = cb => cb(null, server._serviceId)
  })
  .listen(dnodePort, (e) => {
    if (e) return cb(e)

    // function finish () {
      dht.listen(dhtPort, cb)
      setTimeout(() => {
        console.log('announced for', dnodePort)
        dht.announce(infoHash, dnodePort, () => {
          dht.lookup(infoHash)
        })
      }, 100)
    // }

    // if (opts.nat) {
    //   onePunch((err, punch) => {
    //     if (err) return cb(err)
    //     punch(dnodePort, (err, info) => {
    //       if (err) return cb(err)
    //       finish()
    //     })
    //   })
    // } else {
    //   finish()
    // }
  })

  server._serviceId = crypto.randomBytes(10).toString()

  dht.on('peer', function (peer, infoHash, from) {
    peer.host = 'localhost'
    var hostname = peer.host+':'+peer.port
    if (!clients[hostname]) {
      console.log(peer.host, peer.port)
      var cup = upnode.connect(parseInt(peer.port), peer.host)
      cup(r => {
        cup.remote = r
        r.serviceId((err, id) => {
          if (err || !id) return delete clients[hostname]
          server.clients().filter(c => c._serviceId).forEach(c => {
            if (c._serviceId === id) {
              cup.close()
              delete clients[hostname]
            }
          })
          cup._serviceId = id
        })
      })
      var id = crypto.randomBytes(10).toString()
      cup._id = id
      if (!clients[hostname]) clients[hostname] = cup
      cup.on('up', () => {
        if (clients[hostname]) {
          if (clients[hostname]._id === id) return
          else cup.close()
        } else {
          clients[hostname] = cup
        }
        console.log('up', hostname)
      })
      cup.on('down', () => {
          if (clients[hostname] && clients[hostname]._id === id) {
          delete clients[hostname]
        }
      })
    }
  })
  server.dht = dht
  server.clients = () => values(clients)
  server.remotes = () => values(clients).map(c => c.remote).filter(r => r)
  return server
}

