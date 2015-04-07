(function () {
	function d(a, b) {
		if (!a) throw b;
	}
	d("undefined" !== typeof JSON, "JSON is a hard dependency");
	d("undefined" !== typeof _, "underscore/lodash is a hard dependency");
	d("undefined" !== typeof PluginManager, "plugin.btapp.js is a hard dependency");
	d("undefined" !== typeof Pairing, "pairing.btapp.js is a hard dependency");
	d("undefined" !== typeof jQuery, "jQuery is a hard dependency");
	d("undefined" !== typeof jQuery.jStorage, "jQuery.jStorage is a hard dependency");
	var h = this;
	this.TorrentClient = Backbone.Model.extend({
		initialize: function (a) {
			this.btappCallbacks = {}
		},
		storeCallbackFunction: function (a) {
			a = a ||
			function () {};
			for (var b = "bt_", c = 0; 20 > c || b in this.btappCallbacks; c++) b += Math.floor(10 * Math.random());
			this.btappCallbacks[b] = a;
			return b
		},
		isRPCFunctionSignature: function (a) {
			d("string" === typeof a, "do not check function signature of non-strings");
			return a.match(/\[native function\](\([^\)]*\))+/) || a.match(/\[nf\](\([^\)]*\))+/)
		},
		isJSFunctionSignature: function (a) {
			d("string" === typeof a, "do not check function signature of non-strings");
			return a.match(/\[nf\]bt_/)
		},
		getStoredFunction: function (a) {
			d(TorrentClient.prototype.isJSFunctionSignature(a), 'only store functions that match the pattern "[nf]bt_*"');
			a = a.substring(4);
			d(a in this.btappCallbacks, "trying to get a function with a key that is not recognized");
			return this.btappCallbacks[a]
		},
		validateArguments: function (a, b) {
			d("string" === typeof a, "expected functionValue to be a string");
			d("object" === typeof b, "expected variables to be an object");
			var c = a.match(/\(.*?\)/g);
			return _.any(c, function (a) {
				a = a.match(/\w+/g) || [];
				return a.length === b.length && _.all(a, function (a, c) {
					if ("undefined" === typeof b[c]) throw "client functions do not support undefined arguments";
					if ("null" === typeof b[c]) return !0;
					switch (a) {
					case "number":
					case "string":
					case "boolean":
						return typeof b[c] === a;
					case "unknown":
						return !0;
					case "array":
						return "object" === typeof b[c];
					case "dispatch":
						return "object" === typeof b[c] || "function" === typeof b[c];
					default:
						throw "there is an invalid type in the function signature exposed by the client";
					}
				})
			})
		},
		convertCallbackFunctionArgs: function (a) {
			_.each(a, function (b, c) {
				"function" === typeof b ? a[c] = this.storeCallbackFunction(b) : "object" === typeof b && b && this.convertCallbackFunctionArgs(b)
			}, this)
		},
		createFunction: function (a, b, c) {
			d(a, "cannot create a function without a session id");
			var e = _.bind(function () {
				var e = [],
					f;
				for (f = 0; f < arguments.length; f++) e.push(arguments[f]);
				if (!TorrentClient.prototype.validateArguments.call(this, c, e)) throw "arguments do not match any of the function signatures exposed by the client";
				this.convertCallbackFunctionArgs(e);
				var g = new jQuery.Deferred;
				f = _.bind(function (a) {
					_.each(b, function (c) {
						c = decodeURIComponent(c);
						"undefined" !== typeof a && (a = a[c])
					});
					if ("undefined" === typeof a) g.reject("return value parsing error " + JSON.stringify(a));
					else if ("string" === typeof a && this.isJSFunctionSignature(a)) {
						var c = this.getStoredFunction(a);
						d(c, "the client is returning a function name that does not exist");
						g.resolve(c)
					} else g.resolve(a)
				}, this);
				this.query({
					type: "function",
					path: JSON.stringify(b),
					args: JSON.stringify(e),
					session: a
				}).done(f).fail(function (a) {
					g.reject(a)
				});
				this.trigger("queries", b);
				return g
			}, this);
			e.valueOf = function () {
				return c
			};
			return e
		},
		query: function (a) {
			var b = !1,
				c = new jQuery.Deferred;
			d("update" === a.type || "state" === a.type || "function" === a.type || "disconnect" === a.type, 'the query type must be either "update", "state", or "function"');
			a.hostname = window.location.hostname || window.location.pathname;
			var e = _.bind(function (a) {
				if ("invalid request" === a) throw setTimeout(_.bind(this.reset, this), 1E3), "pairing occured with a torrent client that does not support the btapp api";
				"object" !== typeof a || "error" in a ? (c.reject(), this.trigger("client:error", a)) : c.resolve(a)
			}, this);
			this.send_query(a).done(function () {
				b || e.apply(this, arguments)
			}).fail(function () {
				b || c.reject.apply(this, arguments)
			});
			c.abort = function () {
				b = !0
			};
			return c
		}
	});
	this.FalconTorrentClient = TorrentClient.extend({
		initialize: function (a) {
			TorrentClient.prototype.initialize.call(this, a);
			d("username" in a && "password" in a || "remote_data" in a, "attempting to connect to client through falcon without providing the necessary credentials");
			this.username = a.username;
			this.password = a.password;
			"remote_data" in a && (this.remote_data = a.remote_data);
			"login_success" in a && (this.login_success = a.login_success);
			"login_error" in a && (this.login_error = a.login_error);
			"login_progress" in a && (this.login_progress = a.login_progress);
			"undefined" !== typeof falcon ? _.defer(_.bind(this.reset, this)) : (h.config = {
				srp_root: "https://remote.utorrent.com"
			}, jQuery.getScript("https://remote.utorrent.com/static/js/jsloadv2.js?v=0.57", _.bind(function (a, c) {
				var e = function (a) {
					for (var c = [], b = [], e = 0; e < a.length - 1; e++) {
						var d = a[e];
						c.push({
							name: d
						});
						b.push(d)
					}
					c.push({
						name: a[a.length - 1],
						requires: b
					});
					return c
				}("falcon/deps/SHA-1.js falcon/deps/jsbn.js falcon/deps/jsbn2.js falcon/deps/sjcl.js falcon/falcon.js falcon/falcon.encryption.js falcon/falcon.api.js falcon/falcon.session.js".split(" "));
				(new JSLoad(e, "https://remote.utorrent.com/static/js/")).load(["falcon/falcon.session.js"], _.bind(function () {
					this.remote_data ? (this.session = new falcon.session({
						client_data: this.remote_data
					}), this.falcon =
					this.session.api, this.trigger("client:connected")) : this.delayed_reset()
				}, this))
			}, this)))
		},
		connect: function () {
			d(!this.falcon, "trying to connect with falcon already set");
			var a = _.bind(function (a) {
				this.login_success && this.login_success(a);
				this.falcon = this.session;
				this.trigger("client:connected", a)
			}, this),
				b = _.bind(function (a, b, d) {
					this.login_error && this.login_error(a, b, d);
					this.trigger("client:error_connecting", d);
					this.trigger("client:error", d)
				}, this);
			this.session = new falcon.session;
			this.session.negotiate(this.username, this.password, {
				success: a,
				error: b,
				progress: this.login_progress
			})
		},
		disconnect: function () {},
		send_query: function (a) {
			var b = new jQuery.Deferred;
			d(this.falcon, "cannot send a query to the client without falcon properly connected");
			this.falcon.request("/gui/", {
				btapp: "backbone.btapp.js"
			}, a, function (a) {
				d("build" in a, "expected build information in the falcon response");
				d("result" in a, "expected result information in the falcon response");
				b.resolve(a.result)
			}, _.bind(function () {
				b.reject();
				this.delayed_reset()
			}, this), {});
			return b
		},
		delayed_reset: function () {
			this.reset_timeout = setTimeout(_.bind(function () {
				this.reset();
				this.reset_timeout = null
			}, this), 1E3)
		},
		reset: function () {
			this.falcon = null;
			this.connect()
		}
	});
	this.LocalTorrentClient = TorrentClient.extend({
		defaults: {
			product: "Torque"
		},
		initialize: function (a) {
			TorrentClient.prototype.initialize.call(this, a);
			this.btapp = a.btapp;
			this.initialize_objects(a);
			this.reset_timeout = null
		},
		disconnect: function () {
			this.pairing && this.pairing.disconnect();
			this.plugin_manager && this.plugin_manager.disconnect();
			this.reset_timeout && clearTimeout(this.reset_timeout)
		},
		initialize_objects: function (a) {
			this.initialize_plugin(a);
			this.initialize_pairing(a)
		},
		initialize_plugin: function (a) {
			!1 !== this.get("plugin") && (this.plugin_manager = new PluginManager(a), new PluginManagerView({
				model: this.plugin_manager
			}), this.plugin_manager.on("all", this.trigger, this))
		},
		initialize_pairing: function (a) {
			d(!1 === this.get("plugin") || "undefined" !== typeof this.plugin_manager, "you must initialize the plugin manager before the pairing object");
			this.pairing = new Pairing(_.extend(a, {
				plugin_manager: this.plugin_manager
			}));
			"native" !== this.pairing.get("pairing_type") && new PairingView({
				model: this.pairing
			});
			this.pairing.on("all", this.trigger, this);
			d(this.has("product"), "client does not know what product to connect to");
			var b = this.get("product");
			this.pairing.on("pairing:found", function (a) {
				if (a && a.name.toLowerCase() === b.toLowerCase()) {
					var e = jQuery.jStorage.get(b + "_pairing_key");
					e ? (a.abort = !0, a.authorize = !1, this.connect_to_authenticated_port(a.port, e)) : (a.abort = !0, a.authorize = !0)
				} else a.abort = !1, a.authorize = !1
			}, this);
			this.pairing.on("pairing:authorized", _.bind(function (a) {
				jQuery.jStorage.set(b + "_pairing_key", a.key);
				this.connect_to_authenticated_port(a.port, a.key)
			}, this));
			this.pairing.on("pairing:stop", this.delayed_reset, this);
			if (!1 === this.get("plugin")) this.delayed_reset();
			else this.plugin_manager.on("plugin:client_running", this.reset, this)
		},
		ajax: function (a, b, c) {
			!1 === this.get("plugin") ? jQuery.ajax({
				url: a,
				success: b,
				error: c,
				dataType: "jsonp"
			}) : this.plugin_manager.get_plugin().ajax(a, _.bind(function (a) {
				var d;
				if (a.allowed && a.success && "invalid request" !== a.data) {
					try {
						d = JSON.parse(a.data)
					} catch (f) {
						c("parsererror");
						this.trigger("client:error", "parsererror");
						return
					}
					b(d)
				} else this.trigger("client:error", a), c(a)
			}, this))
		},
		connect_to_authenticated_port: function (a, b) {
			var c = _.bind(function () {
				this.url = "http://127.0.0.1:" + a + "/btapp/?pairing=" + b;
				this.trigger("client:connected")
			}, this),
				d = _.bind(function () {
					jQuery.jStorage.deleteKey(this.get("product") + "_pairing_key");
					this.delayed_reset()
				}, this);
			this.ajax("http://127.0.0.1:" + a + "/btapp/?pairing=" + b, c, d)
		},
		delayed_reset: function () {
			this.reset_timeout = setTimeout(_.bind(function () {
				this.reset();
				this.reset_timeout = null
			}, this), 1E3)
		},
		reset: function () {
			this.pairing.connect()
		},
		send_query: function (a) {
			var b = new jQuery.Deferred;
			this.trigger("client:query", this.url, a);
			var c = this.url;
			_.each(a, function (a, b) {
				c += "&" + encodeURIComponent(b) + "=" + encodeURIComponent(a)
			});
			this.ajax(c, function (a) {
				b.resolve(a)
			}, function () {
				b.reject()
			});
			return b
		}
	})
}).call(this);