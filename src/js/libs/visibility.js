define([], function () {
    "use strict";

    var e = function (e) {
        return "undefined" != typeof e
    };

    var Visibility = {
        onVisible: function (e) {
            if (!this.isSupported() || !this.hidden()) return e(), this.isSupported();
            var t = this.change(function (n, r) {
                Visibility.hidden() || (Visibility.unbind(t), e())
            });
            return t
        },
        change: function (e) {
            if (!this.isSupported()) return !1;
            this._lastCallback += 1;
            var t = this._lastCallback;
            return this._callbacks[t] = e, this._setListener(), t
        },
        unbind: function (e) {
            delete this._callbacks[e]
        },
        afterPrerendering: function (e) {
            if (!this.isSupported() || "prerender" != this.state()) return e(), this.isSupported();
            var t = this.change(function (n, r) {
                "prerender" != r && (Visibility.unbind(t), e())
            });
            return t
        },
        hidden: function () {
            return this._prop("hidden", !1)
        },
        state: function () {
            return this._prop("visibilityState", "visible")
        },
        isSupported: function () {
            return e(this._prefix())
        },
        _doc: window.document,
        _prefixes: ["webkit", "moz"],
        _chechedPrefix: null,
        _listening: !1,
        _lastCallback: -1,
        _callbacks: {},
        _hiddenBefore: !1,
        _init: function () {
            this._hiddenBefore = this.hidden()
        },
        _prefix: function () {
            if (null !== this._chechedPrefix) return this._chechedPrefix;
            if (e(this._doc.visibilityState)) return this._chechedPrefix = "";
            var t;
            for (var n = 0; n < this._prefixes.length; n++) {
                t = this._prefixes[n] + "VisibilityState";
                if (e(this._doc[t])) return this._chechedPrefix = this._prefixes[n]
            }
        },
        _name: function (e) {
            var t = this._prefix();
            return "" == t ? e : t + e.substr(0, 1).toUpperCase() + e.substr(1)
        },
        _prop: function (e, t) {
            return this.isSupported() ? this._doc[this._name(e)] : t
        },
        _onChange: function (e) {
            var t = this.state();
            for (var n in this._callbacks) this._callbacks[n].call(this._doc, e, t);
            this._hiddenBefore = this.hidden()
        },
        _setListener: function () {
            if (this._listening) return;
            var e = this._prefix() + "visibilitychange",
                t = function () {
                    Visibility._onChange.apply(Visibility, arguments)
                };
            this._doc.addEventListener ? this._doc.addEventListener(e, t, !1) : this._doc.attachEvent(e, t), this._listening = !0, this._hiddenBefore = this.hidden()
        }
    };

    Visibility._init();

    var t = {
        every: function (t, n, r) {
            this._initTimers(), e(r) || (r = n, n = null), this._lastTimer += 1;
            var i = this._lastTimer;
            return this._timers[i] = {
                interval: t,
                hiddenInterval: n,
                callback: r
            }, this._runTimer(i, !1), this.isSupported() && this._setListener(), i
        },
        stop: function (t) {
            var n = this._timers[t];
            return e(n) ? (this._stopTimer(t), delete this._timers[t], n) : !1
        },
        _lastTimer: -1,
        _timers: {},
        _timersInitialized: !1,
        _initTimers: function () {
            if (this._timersInitialized) return;
            this._timersInitialized = !0, e(window.jQuery) && e(jQuery.every) ? this._setInterval = this._chronoInterval : this._setInterval = this._originalInterval, this.change(function () {
                Visibility._timersStopRun()
            })
        },
        _originalInterval: function (e, t) {
            return setInterval(e, t)
        },
        _chronoInterval: function (e, t) {
            return jQuery.every(t, e)
        },
        _setInterval: null,
        _runTimer: function (e, t) {
            var n, r = this._timers[e];
            if (this.hidden()) {
                if (null === r.hiddenInterval) return;
                n = r.hiddenInterval
            } else n = r.interval;
            t && r.callback.call(window), r.id = this._setInterval(r.callback, n)
        },
        _stopTimer: function (e) {
            var t = this._timers[e];
            clearInterval(t.id), delete t.id
        },
        _timersStopRun: function (e) {
            var t = this.hidden(),
                n = this._hiddenBefore;
            if (t && !n || !t && n) for (var r in this._timers) this._stopTimer(r), this._runTimer(r, !t)
        }
    };
    
    for (var n in t) Visibility[n] = t[n];

    return Visibility;
});