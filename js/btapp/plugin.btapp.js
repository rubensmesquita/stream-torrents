(function () {
	function d(a, c) {
		if (!a) throw c;
	}
	function g() {
		var a = navigator.userAgent.match(/Macintosh/);
		return void 0 !== a && null !== a
	}
	function f(a, c, b) {
		var e = function () {
			a.call() ? c.call() : setTimeout(e, b || 500)
		};
		_.defer(e)
	}
	d("undefined" !== typeof JSON, "JSON is a hard dependency");
	d("undefined" !== typeof _, "underscore/lodash is a hard dependency");
	d("undefined" !== typeof jQuery, "jQuery is a hard dependency");
	var h = _.memoize(function (a) {
		var c = new jQuery.Deferred;
		document.createElement("object");
		var b = a + "_onload";
		window[b] = function () {
			c.resolve()
		};
		var e = document.createElement("div");
		jQuery(e).css({
			position: "absolute",
			left: "-999em",
			"z-index": -1
		});
		e.innerHTML = '<object type="' + a + '" width="0" height="0"><param name="onload" value="' + b + '" /></object>';
		document.body.appendChild(e);
		return c
	});
	this.PluginManagerView = Backbone.View.extend({
		initialize: function (a) {
			this.model.on("plugin:install_plugin", this.download, this);
			this.model.on("plugin:plugin_updated", this.restart, this)
		},
		setup: function (a, c) {
			"undefined" === typeof jQuery.facebox ? (jQuery(document.createElement("link")).attr({
				href: "http://torque.bittorrent.com/facebox/src/facebox.css",
				type: "text/css",
				rel: "stylesheet"
			}).appendTo("head"), jQuery.getScript("http://torque.bittorrent.com/facebox/src/facebox.js", _.bind(this.setup, this, a, c))) : (jQuery.facebox.settings.overlay = !0, jQuery.facebox.settings.closeImage = "http://torque.bittorrent.com/facebox/src/closelabel.png", jQuery.facebox.settings.loadingImage = "http://torque.bittorrent.com/facebox/src/loading.gif", jQuery.facebox.settings.opacity = .6, a.call(c))
		},
		restart: function (a) {
			a.abort = !0;
			this.setup(function () {
				var a = jQuery("<div></div>");
				a.attr("id", "plugin_download");
				a.css("position", "absolute");
				a.css("height", "200px");
				a.css("width", "400px");
				a.css("left", "%50");
				a.css("margin-left", "-200px");
				var b = jQuery("<p></p>");
				b.text("The " + this.model.get("product") + " plugin needs to complete an update. Please restart your browser.");
				a.append(b);
				a.hide();
				jQuery("body").append(a);
				jQuery.facebox({
					div: "#plugin_download"
				})
			}, this)
		},
		download: function (a) {
			a.install = !0;
			this.setup(function () {
				var a = jQuery("<div></div>");
				a.attr("id", "plugin_download");
				a.css("position", "absolute");
				a.css("height", "200px");
				a.css("width", "400px");
				a.css("left", "%50");
				a.css("margin-left", "-200px");
				var b = this.model.get("download_url"),
					b = '<p style="text-align:center;">This site requires the ' + this.model.get("product") + ' plugin.<br><span style="font-size:8pt;">By installing this software, you<br>are agreeing to the <a href="http://www.bittorrent.com/legal/eula">EULA</a></span><br><br><a class="btn" id="download" href="' + b + '">Download</a></p>';
				a.append(b);
				this.model.on("plugin:plugin_installed", function () {
					jQuery(document).trigger("close.facebox");
					jQuery("#plugin_download").remove()
				});
				a.hide();
				jQuery("body").append(a);
				jQuery.facebox({
					div: "#plugin_download"
				})
			}, this)
		}
	});
	this.PluginManager = Backbone.Model.extend({
		soshare_props: {
			latest_version: "4.4.1",
			mime_type: "application/x-gyre-soshare",
			activex_progid: "gyre.soshare",
			windows_download_url: "http://torque.bittorrent.com/SoShare.msi",
			osx_download_url: "http://torque.bittorrent.com/SoShare.pkg"
		},
		torque_props: {
			latest_version: "4.3.8",
			mime_type: "application/x-bittorrent-torque",
			activex_progid: "bittorrent.torque",
			windows_download_url: "http://torque.bittorrent.com/Torque.msi",
			osx_download_url: "http://torque.bittorrent.com/Torque.pkg"
		},
		defaults: {
			pid: "btapp_plugin_WARNING_HAVE_NOT_INITIALIZED",
			window_hash: "4823",
			product: "Torque"
		},
		initialize: function () {
			_.bindAll(this);
			this.set("pid", "btapp_plugin_" + Math.floor(1024 * Math.random()));
			"SoShare" === this.get("product") ? _.each(this.soshare_props, function (a, b) {
				this.has(b) || this.set(b, a)
			}, this) : "Torque" !== this.get("product") && "uTorrent" !== this.get("product") && "BitTorrent" !== this.get("product") || _.each(this.torque_props, function (a, b) {
				this.has(b) || this.set(b, a)
			}, this);
			var a = g() ? this.get("osx_download_url") : this.get("windows_download_url");
			this.set("download_url", a);
			jQuery(_.bind(_.defer, this, this.mime_type_check))
		},
		disconnect: function () {},
		mime_type_check: function () {
			this.supports_mime_type() ? this.mime_type_check_yes() : this.mime_type_check_no()
		},
		mime_type_check_no: function () {
			this.trigger("plugin:install_plugin", {
				install: !1
			});
			f(this.supports_mime_type, this.mime_type_check_yes)
		},
		mime_type_check_yes: function () {
			this.trigger("plugin:plugin_installed");
			h(this.get("mime_type")).then(_.bind(function () {
				this.trigger("plugin:plugin_running");
				this.plugin_up_to_date_check()
			}, this))
		},
		plugin_up_to_date_check: function () {
			this.plugin_up_to_date() ? this.plugin_up_to_date_yes() : this.plugin_up_to_date_no()
		},
		plugin_up_to_date_yes: function () {
			this.client_installed_check()
		},
		plugin_up_to_date_no: function () {
			var a = {
				update: !0
			};
			this.trigger("plugin:update_plugin", a);
			a.update ? this.get_plugin().checkForUpdate(_.bind(this.plugin_up_to_date_yes, this)) : this.plugin_up_to_date_yes()
		},
		client_installed_check: function () {
			this.client_installed() ? this.client_installed_check_yes() : this.client_installed_check_no()
		},
		client_installed_check_no: function () {
			var a = {
				install: !0
			};
			this.trigger("plugin:install_client", a);
			a.install ? (this.get_plugin().downloadProgram(this.get("product"), _.bind(function (a, b, e, d, f) {
				jQuery.jStorage.set("pairing_key", f);
				this.trigger("plugin:downloaded_client")
			}, this)), f(this.client_installed, this.client_running_check_yes)) : (a = {
				check: !1
			}, this.trigger("plugin:check_for_running_client", a), a.check && this.client_running_check())
		},
		client_installed_check_yes: function () {
			this.trigger("plugin:client_installed");
			this.client_running_check()
		},
		client_running_check: function () {
			this.client_running() ? this.client_running_check_yes() : this.client_running_check_no()
		},
		client_running_check_no: function () {
			var a = {
				run: !0
			};
			this.trigger("plugin:run_client", a);
			a.run && this.get_plugin().runProgram(this.get("product"), function () {});
			f(this.client_running, this.client_running_check_yes)
		},
		client_running_check_yes: function () {
			this.trigger("plugin:client_running")
		},
		supports_mime_type: function () {
			if ("chrome-extension:" === window.location.protocol) return !0;
			if (-1 !== navigator.appVersion.indexOf("MSIE")) try {
				return void 0 !== new ActiveXObject(this.get("activex_progid"))
			} catch (a) {
				return !1
			} else {
				navigator.plugins.refresh();
				for (var c = 0; c < navigator.plugins.length; c++) if (navigator.plugins[c][0].type === this.get("mime_type")) return !0;
				return !1
			}
		},
		plugin_up_to_date: function () {
			if ("chrome-extension:" === window.location.protocol) return !0;
			for (var a = this.get_plugin().version, a = _.map(a.split("."), function (a) {
				return parseInt(a, 10)
			}), c = _.map(this.get("latest_version").split("."), function (a) {
				return parseInt(a, 10)
			}), b = 0; b < a.length; b++) {
				if (a[b] < c[b]) return !1;
				if (a[b] > c[b]) break
			}
			return !0
		},
		get_plugin: function () {
			var a = jQuery('[type="' + this.get("mime_type") + '"]');
			d(1 === a.length, "cannot call get_plugin before adding the plugin");
			return a[0]
		},
		plugin_loaded: function () {
			d(this.supports_mime_type(), "you have not installed the plugin yet");
			d(0 !== jQuery("#" + this.get("pid")).length, "you have not yet added the plugin");
			return this.get_plugin().version
		},
		get_window_name: function (a) {
			return "uTorrent" === a ? "Torrent4823" : a
		},
		client_running: function () {
			var a = this.get_plugin().isRunning(this.get_window_name(this.get("product")));
			return "object" === typeof a ? a && 0 < a.length : a
		},
		client_installed: function () {
			var a = this.get_plugin().getInstallVersion(this.get("product"));
			d("This application is not supported." !== a, "This application is not supported.");
			return a
		}
	})
}).call(this);