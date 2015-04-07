(function () {
	function e(a, b) {
		if (!a) throw b;
	}
	e("undefined" !== typeof JSON, "JSON is a hard dependency");
	e("undefined" !== typeof _, "underscore/lodash is a hard dependency");
	e("undefined" !== typeof TorrentClient, "client.btapp.js is a hard dependency");
	e("undefined" !== typeof jQuery, "jQuery is a hard dependency");
	e("undefined" !== typeof jQuery.jStorage, "jQuery.jStorage is a hard dependency");
	var k = function (a) {
		return _.isObject(a) && !_.isArray(a) && jQuery.isEmptyObject(a)
	},
		l = {
			initialize: function () {
				_.bindAll(this, "initializeValues", "updateState", "clearState", "isEmpty", "destructor");
				this.initializeValues()
			},
			clearRemoteProcedureCalls: function () {
				for (var a = _.keys(this.bt || {}), b = 0; b < a.length; b++) {
					var c = a[b];
					delete this.bt[c];
					delete this[c]
				}
				this.bt = {}
			},
			initializeValues: function () {
				this.session = this.path = null;
				this.clearRemoteProcedureCalls()
			},
			updateRemoveFunctionState: function (a) {
				e(a in this.bt, "trying to remove a function that does not exist");
				this.trigger("remove:bt:" + a);
				this.trigger("remove:bt", this.bt[a], a);
				delete this.bt[a];
				if ("get" !== a && "set" !== a && "unset" !== a && "length" !== a) return e(a in this, 'trying to remove the function "' + a + '", which does not exist in the prototype of this object'), this.trigger("remove:" + a), delete this[a], {}
			},
			updateRemoveObjectState: function (a, b, c, d, f) {
				var g = {},
					h = this.get(f);
				e(h, "trying to remove a model that does not exist");
				e("updateState" in h, "trying to remove an object that does not extend BtappBase");
				h.updateState(a, b, c, d);
				h.isEmpty() && (g[f] = h, h.trigger("destroy"));
				return g
			},
			updateRemoveElementState: function (a, b, c, d, f) {
				f = _.clone(f || []);
				f.push(d);
				if ("all" === d) return this.updateState(this.session, b, c, f);
				if (_.isNull(c)) return this.updateRemoveAttributeState(d, c);
				if (_.isObject(c) && !_.isArray(c)) return this.updateRemoveObjectState(a, b, c, f, d);
				if (_.isString(c) && TorrentClient.prototype.isRPCFunctionSignature(c)) return this.updateRemoveFunctionState(d);
				if (_.isString(c) && TorrentClient.prototype.isJSFunctionSignature(c)) return this.updateRemoveAttributeState(d, this.client.getStoredFunction(c));
				if ("id" !== d) return this.updateRemoveAttributeState(d, c)
			},
			updateRemoveState: function (a, b, c, d) {
				var f = {},
					g;
				for (g in c) void 0 === b[g] && _.extend(f, this.updateRemoveElementState(a, b[g], c[g], g, d));
				return f
			},
			updateAddFunctionState: function (a, b, c, d) {
				c = _.clone(c || []);
				c.push(d);
				a = this.client.createFunction(a, c, b);
				e(!(d in this.bt), "trying to add a function that already exists");
				this.bt[d] = a;
				"get" !== d && "set" !== d && "unset" !== d && "length" !== d && (e(!(d in this), 'trying to add the function "' + d + '", which already exists in the prototype of this object'), this[d] = a, this.trigger("add:" + d));
				this.trigger("add:bt:" + d);
				this.trigger("add:bt", this.bt[d], d);
				return {}
			},
			updateAddObjectState: function (a, b, c, d, f) {
				a = {};
				var g = this.get(f);
				void 0 === g && (g = BtappCollection.prototype.verifyPath(d) ? new BtappCollection : new BtappModel({
					id: f
				}), g.path = d, g.client = this.client, a[f] = g);
				g.updateState(this.session, b, c, d);
				return a
			},
			updateAddElementState: function (a, b, c, d, f) {
				var g = _.clone(f || []);
				g.push(d);
				_.isString(c) && TorrentClient.prototype.isJSFunctionSignature(c) && (c = this.client.getStoredFunction(c));
				return "all" === d ? this.updateState(this.session, b, c, g) : _.isNull(b) ? this.updateAddAttributeState(a, b, c, g, d) : _.isObject(b) && !_.isArray(b) ? this.updateAddObjectState(a, b, c, g, d) : _.isString(b) && TorrentClient.prototype.isRPCFunctionSignature(b) ? this.updateAddFunctionState(a, b, f, d) : _.isString(b) && TorrentClient.prototype.isJSFunctionSignature(b) ? this.updateAddAttributeState(a, this.client.getStoredFunction(b), c, f, d) : this.updateAddAttributeState(a, b, c, g, d)
			},
			updateAddState: function (a, b, c, d) {
				var f = {},
					g;
				for (g in b) _.extend(f, this.updateAddElementState(a, b[g], c[g], g, d));
				return f
			},
			updateState: function (a, b, c, d) {
				e(!k(b) || !k(c), 'the client is outputing empty objects("' + d + '")...these should have been trimmed off');
				this.session = a;
				this.path || (this.path = d, e(this.verifyPath(this.path), "cannot updateState with an invalid collection path"));
				b = b || {};
				c = c || {};
				this.applyStateChanges(this.updateAddState(a, b, c, d), this.updateRemoveState(a, b, c, d))
			},
			sync: function () {}
		};
	this.BtappCollection = Backbone.Collection.extend(l).extend({
		initialize: function (a, b) {
			Backbone.Collection.prototype.initialize.apply(this, arguments);
			l.initialize.apply(this, arguments);
			this.on("add", this.customAddEvent, this);
			this.on("remove", this.customRemoveEvent, this);
			this.on("change", this.customChangeEvent, this)
		},
		customEvent: function (a, b) {
			_.isFunction(b) || (e(b && b.id, "called a custom " + a + " event without a valid attribute"), this.trigger(a + ":" + b.id, b))
		},
		customAddEvent: function (a) {
			this.customEvent("add", a)
		},
		customRemoveEvent: function (a) {
			this.customEvent("remove", a)
		},
		customChangeEvent: function (a) {
			this.customEvent("change", a)
		},
		destructor: function () {
			this.off("add", this.customAddEvent, this);
			this.off("remove", this.customRemoveEvent, this);
			this.off("change", this.customChangeEvent, this);
			this.trigger("destroy")
		},
		clearState: function () {
			this.each(function (a) {
				a.clearState()
			});
			this.initializeValues();
			this.reset();
			this.destructor()
		},
		verifyPath: function (a) {
			return _.any([
				["btapp", "torrent"],
				["btapp", "torrent", "all", "*", "file"],
				["btapp", "torrent", "all", "*", "peer"],
				["btapp", "label"],
				["btapp", "label", "all", "*", "torrent"], "btapp label all * torrent all * file".split(" "), "btapp label all * torrent all * peer".split(" "), ["btapp", "rss"],
				["btapp", "rss", "all", "*", "item"],
				["btapp", "stream"],
				["btapp", "stream", "all", "*", "diskio"]
			], function (b) {
				if (b.length !== a.length) return !1;
				for (var c = 0; c < b.length; c++) if ("*" !== b[c] && b[c] !== a[c]) return !1;
				return !0
			})
		},
		updateRemoveAttributeState: function (a, b) {
			throw "trying to remove an invalid type from a BtappCollection";
		},
		updateAddAttributeState: function (a, b, c, d, f) {
			throw "trying to add an invalid type to a BtappCollection";
		},
		isEmpty: function () {
			return k(this.bt) && 0 === this.length
		},
		applyStateChanges: function (a, b) {
			this.add(_.values(a));
			this.remove(_.values(b))
		}
	});
	this.BtappModel = Backbone.Model.extend(l).extend({
		initialize: function (a) {
			Backbone.Model.prototype.initialize.apply(this, arguments);
			l.initialize.apply(this, arguments);
			this.on("change", this.customEvents, this)
		},
		destructor: function () {
			this.off("change", this.customEvents, this);
			this.trigger("destroy")
		},
		clearState: function () {
			this.initializeValues();
			var a = _.clone(this.attributes);
			delete a.id;
			_.each(a, function (a) {
				a && _.isObject(a) && a.hasOwnProperty("clearState") && a.clearState()
			});
			Backbone.Model.prototype.set.call(this, a, {
				internal: !0,
				unset: !0
			});
			this.destructor()
		},
		customEvents: function () {
			var a = this.changedAttributes();
			_.each(a, _.bind(function (a, c) {
				if (void 0 === a) {
					var d = this.previous(c);
					this.trigger("remove", d, c);
					this.trigger("remove:" + c, d)
				} else void 0 === this.previous(c) && (this.trigger("add", a, c), this.trigger("add:" + c, a))
			}, this))
		},
		verifyPath: function (a) {
			return !0
		},
		updateRemoveAttributeState: function (a, b) {
			var c = {};
			e(this.get(a) === b, "trying to remove an attribute, but did not provide the correct previous value");
			c[a] = this.get(a);
			return c
		},
		updateAddAttributeState: function (a, b, c, d, f) {
			a = {};
			e(this.get(f) !== b, "trying to set a variable to the existing value [" + d + " -> " + JSON.stringify(b) + "]");
			void 0 !== c && e(this.get(f) === c, "trying to update an attribute, but did not provide the correct previous value");
			a[f] = b;
			return a
		},
		isEmpty: function () {
			var a = _.keys(this.toJSON());
			return k(this.bt) && (0 === a.length || 1 === a.length && "id" === a[0])
		},
		applyStateChanges: function (a, b) {
			Backbone.Model.prototype.set.call(this, a, {
				internal: !0
			});
			Backbone.Model.prototype.set.call(this, b, {
				internal: !0,
				unset: !0
			})
		},
		set: function (a, b, c) {
			var d = function (a, b) {
				if (!(c && "internal" in c || _.isUndefined(this.get(b)))) throw "please use save to set attributes directly to the client";
			};
			_.isObject(a) || null === a ? _(a).each(d, this) : d.call(this, b, a);
			return Backbone.Model.prototype.set.apply(this, arguments)
		},
		save: function (a, b) {
			var c = [];
			_(a).each(function (a, b) {
				c.push(this.bt.set(b, a))
			}, this);
			return jQuery.when.apply(jQuery, c)
		}
	});
	this.Btapp = BtappModel.extend({
		initialize: function () {
			BtappModel.prototype.initialize.apply(this, arguments);
			this.path = ["btapp"];
			this.connected_state = !1;
			this.last_query = this.session = this.queries = this.client = null;
			_.bindAll(this, "connect", "disconnect", "connected", "fetch", "onEvents", "onFetch", "onConnectionError");
			this.on("add:events", this.setEvents, this)
		},
		destructor: function () {},
		connect: function (a) {
			e(!this.client, "trying to connect to an undefined client");
			e(!this.connected_state, "trying to connect when already connected");
			this.connected_state = !0;
			e(!this.session, "trying to create another session while one is active");
			a = a || {};
			this.poll_frequency = 500;
			this.queries = a.queries || Btapp.QUERIES.ALL;
			e(_.isArray(this.queries), "the queries attribute must be an array of arrays of strings");
			e(_.all(this.queries, function (a) {
				return _.isArray(a) && _.all(a, function (a) {
					return _.isString(a)
				})
			}), "the queries attribute must be an array of arrays of strings");
			a.btapp = this;
			e(!_.isUndefined(TorrentClient), "client.btapp.js is a hard dependency");
			this.setClient(a);
			var b = new jQuery.Deferred,
				c = function () {
					this.off("client:connected", c, this);
					b.resolve()
				};
			this.on("client:connected", c, this);
			return b
		},
		setClient: function (a) {
			"username" in a && "password" in a || "remote_data" in a ? (this.client = new FalconTorrentClient(a), this.client.bind("client:error_connecting", this.disconnect, this)) : this.client = new LocalTorrentClient(a);
			this.client.bind("all", this.trigger, this);
			this.client.bind("client:connected", this.fetch)
		},
		setEvents: function (a) {
			_.each(a.toJSON(), function (b, c) {
				if ("id" !== c) {
					var d = {};
					d[c] = _.bind(this.trigger, this, c);
					a.save(d)
				}
			}, this)
		},
		disconnect: function () {
			this.trigger("disconnect", "manual");
			e(this.client, "trying to disconnect from an undefined client");
			e(this.connected_state, "trying to disconnect when not connected");
			this.session && this.client.query({
				type: "disconnect",
				session: this.session
			});
			this.connected_state = !1;
			this.last_query && (this.last_query.abort(), this.last_query = null);
			this.session =
			null;
			this.next_timeout && clearTimeout(this.next_timeout);
			this.client.disconnect();
			this.queries = this.client = this.client.btapp = null;
			this.clearState()
		},
		connected: function () {
			return this.connected_state
		},
		onConnectionError: function () {
			this.trigger("disconnect", "error");
			this.poll_frequency = 3E3;
			this.clearState();
			this.session = null;
			this.last_query && (this.last_query.abort(), this.last_query = null);
			this.client && _.delay(_.bind(this.client.reset, this.client), 500)
		},
		onFetch: function (a) {
			e("session" in a, "did not recieve a session id from the client");
			this.session = a.session;
			this.waitForEvents(a.session)
		},
		fetch: function () {
			this.client && (this.last_query = this.client.query({
				type: "state",
				queries: JSON.stringify(this.queries)
			}).done(this.onFetch).fail(this.onConnectionError))
		},
		onEvent: function (a, b) {
			if ("add" in b || "remove" in b) b.add = b.add || {}, b.remove = b.remove || {}, this.updateState(a, b.add.btapp, b.remove.btapp, ["btapp"]);
			else if ("callback" in b) this.client.btappCallbacks[b.callback](b.arguments);
			else throw "received invalid data from the client";
		},
		onEvents: function (a, b) {
			e(this.session === a, "should not receive data for a different session after creating a new one. do not forget to abort the last call of your old session.");
			if (this.connected_state) {
				this.trigger("sync", b);
				this.poll_frequency = 0 === b.length ? Math.min(3E3, this.poll_frequency + 100) : 500;
				for (var c = 0; c < b.length; c++) this.onEvent(a, b[c]);
				clearTimeout(this.next_timeout);
				this.next_timeout = setTimeout(_.bind(this.waitForEvents, this, a), this.poll_frequency)
			}
		},
		waitForEvents: function (a) {
			this.client && (this.last_query =
			this.client.query({
				type: "update",
				session: a
			}).done(_.bind(this.onEvents, this, a)).fail(this.onConnectionError))
		}
	});
	Btapp.VERSION = "0.2.0";
	Btapp.QUERIES = {
		ALL: [
			["btapp"]
		],
		DHT: [
			["btapp", "dht"]
		],
		TORRENTS_BASIC: [
			["btapp", "create"],
			["btapp", "add", "torrent"], "btapp torrent all * file all *".split(" "), "btapp torrent all * properties all *".split(" ")],
		EVENTS: [
			["btapp", "events"]
		],
		SETTINGS: [
			["btapp", "settings"]
		],
		REMOTE: [
			["btapp", "connect_remote"],
			["btapp", "settings", "all", "webui.uconnect_enable"]
		]
	};
	Btapp.STATUS = {
		TORRENT: {
			DELETED: -1,
			DOWNLOAD_FAILED: 0,
			ADDED: 1,
			COMPLETE: 2,
			METADATA_COMPLETE: 3
		},
		RSS_FEED: {
			DELETED: -1,
			ADDED: 1
		}
	};
	Btapp.REMOVE = {
		NO_DELETE: 0,
		DELETE_TORRENT: 1,
		DELETE_DATA: 2,
		DELETE_BOTH: 3,
		DELETE_TO_TRASH: 4,
		DELETE_CONVERTED_FILES: 5
	};
	Btapp.TORRENT = {
		PRIORITY: {
			LOW: 0,
			MEDIUM: 1,
			HIGH: 2,
			METADATA_ONLY: 3
		},
		FILE: {
			PRIORITY: {
				NO_DOWNLOAD: 0,
				LOW: 5,
				MEDIUM: 10,
				HIGH: 15
			}
		},
		REMOVE: {
			NO_DELETE: 0,
			DELETE_TORRENT: 1,
			DELETE_DATA: 2,
			DELETE_TORRENT_AND_DATA: 3
		}
	}
}).call(this);