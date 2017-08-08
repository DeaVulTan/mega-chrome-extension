function Storage(name) {

	this.dbName = name;

	window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
	window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    this.executeOnObjectStore = function(store_name, mode, action) {
		var request = window.indexedDB.open(this.dbName, 30);
		
		request.onupgradeneeded = function(event) { 
			console.log("Database upgrade")
			db = this.result;

			// Create an objectStore for this database
			db.createObjectStore(store_name);
		};

		request.onsuccess = function(event) { 
			var db = this.result;
			console.log("Database opened");
			console.log("Starting transaction");
			var tx = db.transaction(store_name, mode);
			tx.oncomplete = function(event) { console.log("Transaction complete"); }
			tx.onerror = function(event) { console.error("Transaction failed"); }
			var objectStore = tx.objectStore(store_name);
			action(objectStore);
			tx.onsuccess
		}

		request.onerror = function(event) { console.log("Failed to open database ", event);	}
	}

	this.remove = function(key, callbacks) {
		this.executeOnObjectStore("name", "readwrite", function(objectStore) {
			var request = objectStore.delete(key);
			request.onsuccess = function(event) {
				console.log("Object with key '" + key + "' was removed");
				callbacks.onsuccess();
			}
			request.onerror = function(event) {
				console.error("Unable to remove object with key: '" + key + "'");
				callbacks.onerror();
			} 
		});
	}
	
	this.put = function(key, value, callback) {
		// copy the function scope so we can call remove and executeOnObjectStore in the callback!
		var _this = this;
		this.executeOnObjectStore("name", "readwrite", function(objectStore) {
			console.log("executing on store");
			
			// replace = delete + add
			_this.remove(key, {
				onsuccess: function() {
					_this.executeOnObjectStore("name", "readwrite", function(objectStore) {
						var request = objectStore.add({value : value}, key);
						request.onsuccess = function(event) {
							console.log("Object with key '" + key + "' was added");
							callback(null);;
						} 
						request.onerror = function(event) {
							console.error("Object was not added: " + this.error.name);
                            callback(event);
						}
					})
				}, onerror: function(event) {
                    callback(event);
				}});
			

			
			
		});
		
	}

	this.get = function(key, callback) {
		this.executeOnObjectStore("name", "readwrite", function(objectStore) {
			var request = objectStore.get(key);
			request.onsuccess = function(event) {
                if (event.target.result === undefined) {
                    callback(false);
                } else {
                    callback(true, event.target.result.value);
                }
			}
			request.onerror = function(event) {
				callback(false, event);
			}
		});
	}


}



