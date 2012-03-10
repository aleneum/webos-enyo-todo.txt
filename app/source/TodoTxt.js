/*
 *  Copyright 2012 Morgan McMillian
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */
enyo.kind({
    name: "TodoTxt",
    kind: enyo.VFlexBox,
    published: {
        launchParams: null
    },
    components: [

        {kind: "AppMenu", components: [
            {caption: "Preferences", onclick: "showPrefView"},
            {caption: "About", onclick: "showAbout"}
        ]},
        {kind: "Popup", name: "about", layoutKind: "VFlexLayout",
            contentHeight: "100%", height: "80%", width: "80%",
            components: [
            {name: "aboutTitle", content: ""},
            {content: "by Morgan McMillian"},
            {kind: "Divider", caption: "Version History"},
            {flex: 1, kind: "Scroller", components: [
                {kind: "HtmlContent", className: "ver-history",
                    srcId: "history"}
            ]},
            {kind: "Button", caption: "Done", onclick: "closeAbout" }
        ]},
        {kind: "PageHeader", pack: "justify", components: [
            {kind: "HtmlContent", content: "Todo.txt Enyo [beta]"},
            {flex: 1},
            {name: "viewTitle", kind: "HtmlContent",
                className: "todo-view-title", content: ""}
        ]},
        {flex: 1, kind: "Pane", onSelectView: "viewSelected", components: [
            {name: "listView", kind: "TodoList", onEdit: "showEditView",
                onPrefs: "showPrefView", onReload: "refreshTodo"
            },
            {name: "editView", kind: "TodoEdit",
                onClose: "closeView", onSave: "addTodo"
            },
            {name: "preferenceView", kind: "TodoPrefs",
                onClose: "closeView", onAbout: "showAbout",
                onPrefReset: "resetPreferences"
            }
        ]},
        {name: "dropbox", kind: "Dropbox",
            onAuthSuccess: "enableDropbox",
            onAuthFailure: "disableDropbox",
            onGetFileSuccess: "loadDropbox",
            onGetFileFailure: "fail",
            onPutFileSuccess: "dboxPutFileSuccess",
            onPutFileFailure: "fail"
        },
        {name: "readFile", kind: "PalmService",
            service: "palm://com.monkeystew.todotxtenyo.beta.service/",
            method: "readfile",
            onSuccess: "parseFile", onFailure: "doNothing"
        },
        {name: "writeFile", kind: "PalmService",
            service: "palm://com.monkeystew.todotxtenyo.beta.service/",
            method: "writefile", onSuccess: "saveSuccess"
        },
        {name: "makeDir", kind: "PalmService",
            service: "palm://com.monkeystew.todotxtenyo.beta.service/",
            method: "makedir", onSuccess: "dirCreated",
            onFailure: "doNothing"
        },
        {name: "getConn", kind: "PalmService",
            service: "palm://com.palm.connectionmanager/",
            method: "getstatus",
            onSuccess: "handleConnectionChange",
            subscribe: true
        }

    ],

    ready: function() {

        if (window.PalmSystem) {
            this.$.getConn.call();
            this.os = "webOS";
        } else if (window.blackberry) {
            this.os = "BlackBerry";
            this.dirs = blackberry.io.dir.appDirs;
        } else {
            this.os = "unknown";
        }

        this.preferences = localStorage.getItem("TodoPreferences");
        if (this.preferences == undefined) {
            this.resetPreferences();
        } else {
            this.preferences = JSON.parse(this.preferences);
        }

        if (this.preferences["storage"] == "dropbox") {
            if (this.preferences["dboxtoken"]) {
                this.$.dropbox.setToken(
                    this.preferences["dboxtoken"]
                );
                this.$.dropbox.setTokenSecret(
                    this.preferences["dboxsecret"]
                );
                this.$.dropbox.setAuthorized(true);
                this.$.preferenceView.$.dboxlogout.show();
                this.$.preferenceView.$.dboxpathselect.show();
                this.$.preferenceView.$.filepathselect.hide();
            }
        }

        //TODO: need to derive a better method for introducing new
        //preferences into the application

        if (this.preferences["dboxpath"] == undefined) {
            this.preferences["dboxpath"] = "/todo";
            localStorage.setItem("TodoPreferences", JSON.stringify(this.preferences));
        }

        if (this.preferences["offline"] == true) {
            this.$.viewTitle.setContent("[offline]");
        }

        if (this.os == "BlackBerry") {
            var path = this.dirs.shared.documents.path + "/todo";
            if (!blackberry.io.dir.exists(path)) {
                blackberry.io.dir.createNewDir(path);
            }
        } else {
            this.$.makeDir.call({ path: "/media/internal/todo" });
        }

        this.todoList = [];
        this.refreshTodo();

    },

    launchParamsChanged: function() {
        if (this.launchParams) {
            if (this.launchParams.addTodoText) {
                this.$.editView.$.tododetail.setValue(
                    this.launchParams.addTodoText
                );
                this.showEditView();
            } else if (this.launchParams.search) {
                this.$.listView.$.searchbox.setValue(
                    this.launchParams.search
                );
                this.$.listView.$.searchbox.fire("onchange");
            }
        }
    },

    viewSelected: function(inSender, inView) {
        if (inView == this.$.listView) {
            if (this.preferences["offline"] == true) {
                this.$.viewTitle.setContent("[offline]");
            } else {
                this.$.viewTitle.setContent("");
            }
        } else if (inView == this.$.preferenceView) {
            this.$.viewTitle.setContent("preferences");
        }
    },

    refreshTodo: function() {
        if (this.preferences["storage"] == "file") {
            this.getLocalFile();
        } else if (this.preferences["storage"] == "dropbox") {
            if (this.preferences["offline"] == false) {
                var dboxpath = this.preferences["dboxpath"];
                this.$.dropbox.getFile(dboxpath+"/todo.txt");
            } else {
                console.log("working offline, loading local copy instead");
                this.getLocalFile();
            }
        }
    },

    addTodo: function() {
        this.$.listView.addTodo();
    },

    showEditView: function() {
        this.$.pane.selectViewByName("editView");
        if (this.$.listView.getReplaceItem()) {
            this.$.viewTitle.setContent("update task");
        } else {
            this.$.viewTitle.setContent("add task");
        }
        this.$.editView.$.tododetail.forceFocus();
    },

    showPrefView: function() {
        for ( item in this.preferences ) {
            var component = eval("this.$.preferenceView.$."+item);
            if (component != undefined) {
                if (component.kind === "CheckBox") {
                    component.setChecked(this.preferences[component.preferenceProperty]);
                } else {
                    component.setValue(this.preferences[component.preferenceProperty]);
                }
            }
        }
        this.$.pane.selectViewByName("preferenceView");
    },

    showAbout: function() {
        this.$.about.openAtCenter();
        this.$.aboutTitle.setContent(
            "Todo.txt Enyo [beta] v" + enyo.fetchAppInfo().version);
        this.$.about.render();
    },

    closeAbout: function() {
        this.$.about.close();
    },

    closeView: function() {
        this.$.editView.$.tododetail.setValue("");
        this.$.pane.selectViewByName("listView");
    },

    parseFile: function(path, file) {
        if (file.content != undefined) {
            todofile = file.content.split("\n");
        } else {
            todofile = "";
        }
        this.todoList = [];
        for (line in todofile) {
            if (todofile[line]) {
                if (typeof line == "string") {
                    line = parseInt(line, 10);
                }
                var task = new Object();
                task.num = line + 1;
                task.pri = todofile[line].match(/^\([A-E]\)\s/);
                task.detail = todofile[line];
                this.todoList.push(task);
            }
        }
        this.$.listView.setSortedList(undefined);
        this.$.listView.$.todoList.render();
        console.log("row count: " + this.todoList.length);
    },

    saveFile: function(path, list) {
        data = "";
        for (item in list) {
            data = data + list[item].detail + "\n";
        }
        if (this.os == "BlackBerry") {
            if (blackberry.io.file.exists(path)) {
                blackberry.io.file.deleteFile(path);
            }
            blackberry.io.file.saveFile(path,
                blackberry.utils.stringToBlob(data));
        } else {
            this.$.writeFile.call({ path: path, content: data });
        }

        if (this.preferences["storage"] == "dropbox" &&
            this.preferences["offline"] == false &&
            this.dropboxRefresh == false) {
            var filename = path.match(/todo\.txt.*/);
            filename = this.preferences["dboxpath"]+"/"+filename;
            //var params = { overwrite: true };
            this.$.dropbox.putFile(filename, data);
        } else if (this.dropboxRefresh == true) {
            this.dropboxRefresh = false;
        }
    },

    saveSuccess: function(inSender, inEvent) {
        if (inEvent.error) {
            console.log("error: "+inEvent.error.message);
        } else {
            enyo.windows.addBannerMessage(inEvent.path + " saved", "{}");
            console.log(inEvent.path + " saved...");
            console.log(inEvent.bytes + " bytes...");
        }
    },

    dboxPutFileSuccess: function(inSender, inResponse) {
        console.log(inResponse.path + " uploaded to Dropbox");
        console.log("at revision " + inResponse.revision);
        console.log(inResponse.size + " bytes...");
    },

    doNothing: function(inSender) {
        console.log("errrr");
        console.log(":: " + inSender);
    },

    dirCreated: function(inSender, inEvent) {
        if (inEvent.error) {
            console.log("error: " + inEvent.error.message);
        }
    },

    getLocalFile: function() {
        var path = this.preferences["filepath"];
        if (this.os == "BlackBerry") {
            if (blackberry.io.file.exists(path)) {
                blackberry.io.file.readFile(path, 
                    function(fpath, blob) {
                        var data = blackberry.utils.blobToString(blob);
                        appInstance.parseFile(null, {content: data});
                    }
                );
            }
        } else {
            this.$.readFile.call({ path: path });
            //this.$.readFile.call({ path: this.preferences["filepath"] });
        }
    },

    loadDropbox: function(inSender, inResponse, inRequest) {
        var file = new Object();
        file.content = inResponse;
        this.parseFile(null, file);
        this.dropboxRefresh = true;
        this.saveFile(this.preferences["filepath"], this.todoList);
    },

    resetPreferences: function() {
        localStorage.clear();
        this.preferences = new Object();
        this.preferences["storage"] = "file";
        this.preferences["offline"] = true;
        this.preferences["dboxpath"] = "/todo";
        if (this.os == "BlackBerry") {
            var path = this.dirs.shared.documents.path + "/todo/todo.txt";
            this.preferences["filepath"] = path;
        } else {
            this.preferences["filepath"] = "/media/internal/todo/todo.txt";
        }

        // reset the preferences pane
        this.$.preferenceView.$.offline.setChecked(true);
        this.$.preferenceView.$.dboxlogout.hide();
        this.$.preferenceView.$.dboxpathselect.hide();
        this.$.preferenceView.$.filepathselect.show();

        // save preferences
        localStorage.setItem("TodoPreferences", JSON.stringify(this.preferences));
    },

    handleConnectionChange: function(inSender, inResponse) {
        var r = inResponse.isInternetConnectionAvailable;

        if (r) {
            console.log("went online...");
        } else {
            console.log("went offline...");
            if (this.preferences["offline"] == false) {
                enyo.windows.addBannerMessage("offline mode", "{}");
                this.preferences["offline"] = true;
                this.$.preferenceView.$.offline.setChecked(true);
            }
        }
    },

    fail: function(inSender, inResponse, inRequest) {
        console.log("error");
        console.log(JSON.stringify(inResponse));
        enyo.windows.addBannerMessage(inResponse.error, "{}");
    },

    enableDropbox: function() {
        console.log("authentication successful, enabling dropbox");
        var token = this.$.dropbox.getToken();
        var secret = this.$.dropbox.getTokenSecret();
        this.preferences["dboxtoken"] = token;
        this.preferences["dboxsecret"] = secret;
        this.preferences["offline"] = false;
        localStorage.setItem("TodoPreferences", JSON.stringify(this.preferences));
        this.$.preferenceView.$.dboxlogout.show();
        this.$.preferenceView.$.dboxpathselect.show();
        this.$.preferenceView.$.filepathselect.hide();
        this.dropboxRefresh = true;
        this.refreshTodo();
    },

    disableDropbox: function() {
        this.$.dropbox.setToken("");
        this.$.dropbox.setTokenSecret("");
        this.$.dropbox.setAuthorized(false);
        this.preferences["storage"] = "file";
        this.preferences["dboxtoken"] = "";
        this.preferences["dboxsecret"] = "";
        localStorage.setItem("TodoPreferences", JSON.stringify(this.preferences));
    }

});
