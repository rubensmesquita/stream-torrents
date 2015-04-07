(function () {
	function e(a, b) {
		if (!a) throw b;
	}
	function l() {
		var a = navigator.userAgent.match(/Macintosh/);
		return void 0 !== a && null !== a
	}
	function k(a) {
		return "http://127.0.0.1:" + a + "/gui/pair?name=" + encodeURIComponent(window.location.host)
	}
	function m(a) {
		return 7 * Math.pow(a, 3) + 3 * Math.pow(a, 2) + 5 * a + 1E4
	}
	e("undefined" !== typeof JSON, "JSON is a hard dependency");
	e("undefined" !== typeof _, "underscore/lodash is a hard dependency");
	e("undefined" !== typeof jQuery, "jQuery is a hard dependency");
	this.PairingView = Backbone.View.extend({
		initialize: function () {
			e("native" !== this.model.get("pairing_type"));
			this.model.on("pairing:authorize", this.authorize_iframe, this)
		},
		authorize_iframe: function (a) {
			if ("undefined" === typeof jQuery.facebox) jQuery(document.createElement("link")).attr({
				href: "http://torque.bittorrent.com/facebox/src/facebox.css",
				type: "text/css",
				rel: "stylesheet"
			}).appendTo("head"), jQuery.getScript("http://torque.bittorrent.com/facebox/src/facebox.js", _.bind(this.authorize_iframe, this, a));
			else {
				jQuery.facebox.settings.overlay = !0;
				jQuery.facebox.settings.closeImage = "http://torque.bittorrent.com/facebox/src/closelabel.png";
				jQuery.facebox.settings.loadingImage = "http://torque.bittorrent.com/facebox/src/loading.gif";
				jQuery.facebox.settings.opacity = .6;
				var b = jQuery("<div></div>");
				b.attr("id", "pairing");
				b.css("position", "absolute");
				b.css("height", "200px");
				b.css("width", "400px");
				b.css("left", "%50");
				b.css("margin-left", "-200px");
				var d = jQuery("<iframe></iframe>"),
					c = "http://torque.bittorrent.com/pairing/index.html?product=" + this.model.get("product") + "&mime=" + this.model.get("plugin_manager").get("mime_type") + "&name=" + encodeURIComponent(document.title) + "&permissions=download,create,remote";
				d.attr("src", c);
				d.css("padding", "0px");
				d.css("margin", "0px");
				b.append(d);
				jQuery(window).on("message", function (b) {
					if ("http://torque.bittorrent.com" === b.originalEvent.origin) {
						e(b && b.originalEvent && b.originalEvent.data, "no data was passed in the message from the iframe");
						if (40 === b.originalEvent.data.length) a.deferred.resolve(b.originalEvent.data);
						else if ("denied" === b.originalEvent.data) a.deferred.reject();
						else throw "the message data from the iframe was neither a pairing key, nor a denied message";
						jQuery(document).trigger("close.facebox");
						jQuery("#pairing").remove()
					}
				});
				b.hide();
				jQuery("body").append(b);
				jQuery.facebox({
					div: "#pairing"
				})
			}
		}
	});
	var f = {};
	this.PluginPairing = {
		check_version: function (a) {
			var b = new jQuery.Deferred;
			this.trigger("pairing:check_version", {
				port: a
			});
			this.get("plugin_manager").get_plugin().ajax("http://127.0.0.1:" + a + "/version/", _.bind(function (a) {
				if (a.allowed && a.success) try {
					b.resolve(JSON.parse(a.data))
				} catch (c) {
					b.reject()
				} else b.reject()
			}, this));
			return b
		},
		authorize_basic: function (a) {
			var b;
			a in f ? b = f[a] : (b = new jQuery.Deferred, f[a] = b, b.done(function () {
				delete f[a]
			}), this.get("plugin_manager").get_plugin().ajax(k(a), _.bind(function (a) {
				a.allowed && a.success ? b.resolve(a.data) : b.reject()
			}, this)));
			b.then(_.bind(this.authorize_port_success, this, a));
			b.fail(_.bind(this.authorize_port_error, this, a))
		}
	};
	var g = {};
	this.JQueryPairing = {
		check_version: function (a) {
			this.trigger("pairing:check_version", {
				port: a
			});
			return jQuery.ajax({
				url: "http://127.0.0.1:" + a + "/version/",
				dataType: "jsonp",
				timeout: 3E3
			})
		},
		authorize_basic: function (a) {
			var b =
			_.bind(this.authorize_port_success, this, a),
				d = _.bind(this.authorize_port_error, this, a),
				c;
			a in g ? c = g[a] : (c = jQuery.ajax({
				url: k(a),
				dataType: "jsonp",
				timeout: 3E3
			}), g[a] = c, c.done(function () {
				delete g[a]
			}));
			c.then(b);
			c.fail(d)
		}
	};
	var h = {};
	this.Pairing = Backbone.Model.extend({
		defaults: {
			pairing_type: "iframe"
		},
		initialize: function () {
			_.bindAll(this, "on_check_version_success");
			e(!1 === this.get("plugin") || this.get("plugin_manager"), "pairing is not intentionally avoiding the plugin, nor is it providing a plugin manager");
			this.get("plugin_manager") ? _.extend(this, PluginPairing) : _.extend(this, JQueryPairing)
		},
		connect: function () {
			e(!this.session, "trying to port scan while one is already in progress");
			var a = {
				abort: !1
			},
				b = [],
				d = _.after(5, _.bind(function () {
					!0 !== a.abort && (this.disconnect(), 0 === _.reduce(b, function (a, b) {
						e("pending" !== b.state(), "executing pairing complete functionality while some queries are in flight");
						var d = "resolved" === b.state();
						return a + (d ? 1 : 0)
					}, 0) && this.trigger("pairing:stop"))
				}, this));
			_.times(5, function (c) {
				c =
				m(c);
				var e = this.check_version(c);
				e.done(_.bind(function () {
					a.abort || this.on_check_version_success.apply(this, arguments)
				}, this, c));
				b.push(e);
				e.always(d)
			}, this);
			this.session = a
		},
		disconnect: function () {
			this.session && (this.session.abort = !0, this.session = null)
		},
		on_check_version_success: function (a, b) {
			var d = {
				version: "object" === typeof b ? b.version : "unknown",
				name: "object" === typeof b ? b.name : "unknown",
				port: a,
				authorize: !0
			};
			if ("invalid request" === b || b && b.version) this.trigger("pairing:found", d), d.authorize && this.authorize(a)
		},
		authorize: function (a) {
			if ("native" === this.get("pairing_type") || l()) this.authorize_basic(a);
			else {
				var b = this.get("plugin_manager").get_plugin().pair(this.get("product"));
				40 === b.length ? this.authorize_port_success(a, b) : (a in h ? b = h[a] : (b = new jQuery.Deferred, h[a] = b, b.done(function () {
					delete h[a]
				}), this.trigger("pairing:authorize", {
					port: a,
					deferred: b
				})), b.then(_.bind(this.authorize_port_success, this, a)), b.fail(_.bind(this.authorize_port_error, this, a)))
			}
		},
		authorize_port_success: function (a, b) {
			this.trigger("pairing:authorized", {
				port: a,
				key: b
			})
		},
		authorize_port_error: function (a) {
			this.trigger("pairing:denied", a)
		}
	})
}).call(this);