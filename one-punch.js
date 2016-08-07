var natpmp = require('nat-pmp')
var network = require('network')
var once = require('once')

// https://67.media.tumblr.com/70f0cc4c8066e82b1a58a28ee3cfa5c1/tumblr_nyp8maANwy1src42wo1_540.gif

function onePunch (cb) {
  var t
  network.get_gateway_ip((err, ip) => {
    if (err) return cb(err)
    var pmp = natpmp.connect(ip)

    function punch (priv, pub, cb) {
      if (!cb) {
        cb = pub
        pub = priv
      }
      cb = once(cb)
      var start = Date.now()
      pmp.portMapping({private: priv, public: pub, ttl: 3600}, (err, info) => {
        if (err) return cb(err)
        var delay = (Date.now() - start)
        t = setTimeout(() => punch(priv, pub, cb), 3600 - (delay * 2))
      })
    }
    cb(null, punch)
  })
  return () => { if (t) clearTimeout(t) } // returns cancel
}

module.exports = onePunch