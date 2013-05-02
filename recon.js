function Recon(url, protocols) {
    this.debug = false;
    this.reconnectInterval = 1000;
    this.timeoutInterval = 2000;

    var self = this;
    var ws;
    var forcedClose = false;
    var timedOut = false;
    
    this.url = url;
    this.protocols = protocols;
    this.readyState = WebSocket.CONNECTING;
    this.URL = url; // Public API

    this.onopen = function(e) {
    };

    this.onclose = function(e) {
    };

    this.onmessage = function(e) {
    };

    this.onerror = function(e) {
    };

    function connect(reconnectAttempt) {
        ws = new WebSocket(url, protocols);
        if (self.debug || Recon.debugAll) {
            console.debug('Recon', 'attempt-connect', url);
        }
        
        var localWs = ws;
        var timeout = setTimeout(function() {
            if (self.debug || Recon.debugAll) {
                console.debug('Recon', 'connection-timeout', url);
            }
            timedOut = true;
            localWs.close();
            timedOut = false;
        }, self.timeoutInterval);
        
        ws.onopen = function(e) {
            clearTimeout(timeout);
            if (self.debug || Recon.debugAll) {
                console.debug('Recon', 'onopen', url);
            }
            self.readyState = WebSocket.OPEN;
            reconnectAttempt = false;
            self.onopen(e);
        };
        
        ws.onclose = function(e) {
            clearTimeout(timeout);
            ws = null;
            if (forcedClose) {
                self.readyState = WebSocket.CLOSED;
                self.onclose(e);
            } else {
                self.readyState = WebSocket.CONNECTING;
                if (!reconnectAttempt && !timedOut) {
                    if (self.debug || Recon.debugAll) {
                        console.debug('Recon', 'onclose', url);
                    }
                    self.onclose(e);
                }
                setTimeout(function() {
                    connect(true);
                }, self.reconnectInterval);
            }
        };
        ws.onmessage = function(e) {
            if (self.debug || Recon.debugAll) {
                console.debug('Recon', 'onmessage', url, e.data);
            }
        	self.onmessage(e);
        };
        ws.onerror = function(e) {
            if (self.debug || Recon.debugAll) {
                console.debug('Recon', 'onerror', url, e);
            }
            self.onerror(e);
        };
    }
    connect(url);

    this.send = function(data) {
        if (ws) {
            if (self.debug || Recon.debugAll) {
                console.debug('Recon', 'send', url, data);
            }
            return ws.send(data);
        } else {
            throw 'INVALID_STATE_ERR : Pausing to reconnect websocket';
        }
    };

    this.close = function() {
        if (ws) {
            forcedClose = true;
            ws.close();
        }
    };

    /**
     * Additional public API method to refresh the connection if still open (close, re-open).
     * For example, if the app suspects bad data / missed heart beats, it can try to refresh.
     */
    this.refresh = function() {
        if (ws) {
            ws.close();
        }
    };
}

/**
 * Setting this to true is the equivalent of setting all instances of Recon.debug to true.
 */
Recon.debugAll = false;
