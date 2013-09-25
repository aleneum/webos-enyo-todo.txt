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
        launchParams: null,
        online: false
    },
    components: [
        //{kind: "ApplicationEvents", onUnload: ""},
        {kind: "AppMenu", components: [
            {caption: "Preferences", onclick: "showPrefView"},
            {caption: "About", onclick: "showAbout"}
        ]},
        {kind: "ModalDialog", name: "about", layoutKind: "VFlexLayout",
            contentHeight: "100%", height: "80%", width: "80%",
            dismissWithClick: true, components: [
            {name: "aboutTitle", content: ""},
            {content: "by Morgan McMillian & Alexander Neumann"},
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
        {flex: 1, kind: "Pane", onSelectView: "viewSelected",
            transitionKind: enyo.transitions.Simple, components: [
            {name: "listView", kind: "TodoList", onEdit: "showEditView",
                onPrefs: "showPrefView", onReload: "syncTodo"
            },
            {name: "editView", kind: "TodoEdit",
                onClose: "closeView", onSave: "addTodo"
            },
            {name: "preferenceView", kind: "TodoPrefs",
                onClose: "closeView", onAbout: "showAbout",
                onPrefReset: "resetPreferences", onArchive: "archiveTodo"
            }
        ]},
        {name: "toaster", kind: "HtmlContent"},
        {name: "dropbox", kind: "Dropbox",
            onAuthSuccess: "enableDropbox",
            onAuthFailure: "disableDropbox",
            onGetFileSuccess: "loadDropbox",
            onGetFileFailure: "fail",
            onPutFileSuccess: "dboxPutFileSuccess",
            onPutFileFailure: "fail",
            onMetadataSuccess: "syncTodoCheck",
            onMetadataFailure: "fail"
        },
        {name: "readFile", kind: "PalmService",
            service: "palm://com.github.aleneum.todotxt.service/",
            method: "readfile",
            onSuccess: "parseFile", onFailure: "doNothing"
        },
        {name: "readDoneFile", kind: "PalmService",
            service: "palm://com.github.aleneum.todotxt.service/",
            method: "readfile",
            onSuccess: "loadArchive", onFailure: "doNothing"
        },
        {name: "writeFile", kind: "PalmService",
            service: "palm://com.github.aleneum.todotxt.service/",
            method: "writefile", onSuccess: "saveSuccess"
        },
        {name: "makeDir", kind: "PalmService",
            service: "palm://com.github.aleneum.todotxt.service/",
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
            // hack for RichText not working properly
            this.$.editView.$.tododetail.destroy();
            this.$.editView.$.scroller.createComponent(
                {kind: "Input", name: "tododetail",
                    className: "enyo-box-input", owner:this.$.editView}
            );
            this.$.editView.render();
            this.$.listView.$.syncButton.setDisabled(true);
        } else {
            this.os = "unknown";
        }

        this.preferences = localStorage.getItem("TodoPreferences");
        if (this.preferences == undefined) {
            this.resetPreferences();
        } else {
            this.preferences = JSON.parse(this.preferences);
        }

        if (this.preferences["dboxtoken"]) {
            this.$.dropbox.setToken(
                this.preferences["dboxtoken"]
            );
            this.$.dropbox.setTokenSecret(
                this.preferences["dboxsecret"]
            );
            this.$.dropbox.setAuthorized(true);
            this.$.preferenceView.$.dboxlogout.show();
            this.$.preferenceView.$.dboxlogin.hide();
        }

        if (this.preferences["encrypted"] == true) {
            this.$.preferenceView.$.pwcontainer.show();
        }
    
        if ((this.online == false) || (this.$.dropbox.getAuthorized() == false)) {
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

        this.recount = 0;
        this.todoList = [];
        this.doneList = [];
        console.log("things are ready");

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
            if ((this.online == false) || (this.$.dropbox.getAuthorized() == false)) {
                this.$.viewTitle.setContent("[offline]");
            } else {
                this.$.viewTitle.setContent("");
            }
        } else if (inView == this.$.preferenceView) {
            this.$.viewTitle.setContent("preferences");
        }
    },

    refreshTodo: function() {
        this.getLocalFile();
        this.getArchiveFile();
    },

    syncTodo: function() {
        if (this.preferences["autoarchive"] === true) {
            this.archiveTodo();
        }
        this.$.dropbox.getMetadata("/todo.txt");
    },

    syncTodoCheck: function(inSender, inResponse, inRequest) {
        console.log("rev is " + inResponse.rev);
        console.log("local ref is " + this.preferences["dboxrev"]);
        if (inResponse.rev == this.preferences["dboxrev"]) {
            console.log("dropbox file did not change.");
            if (this.preferences["localchanges"] == true) {
                console.log("local file changed --> upload");
                var tododata = "";
                var task;
                for (item in this.todoList) {
                    task = this.todoList[item];
                    tododata = tododata + task.toString() + "\n";
                }
                var donedata = "";
                for (item in this.doneList) {
                    donedata = donedata + this.doneList[item].detail + "\n";
                }
                //console.log(data);
                if ((this.preferences["encrypted"] == true) && (this.preferences["password"].length > 0)) {
                    var encrypted;
                    //console.log("encrypt data!");
                    //console.log(this.preferences["password"]);
                    encrypted = CryptoJS.AES.encrypt(tododata, this.preferences["password"]);
                    tododata = encrypted.toString();
                    encrypted = CryptoJS.AES.encrypt(donedata, this.preferences["password"]);
                    donedata = encrypted.toString();
                    //console.log(tododata);
                }
                this.$.dropbox.putFile("/todo.txt",tododata);
                this.$.dropbox.putFile("/done.txt",donedata);
                this.showToast("upload files");
            } else {
                this.showToast("files in sync");
            }
        }  else {
            // we prefer remote data if they changed for the moment
            // also we assume that todo.txt and done.txt are synced
            // which means we just check todo.txt's rev
            console.log("dropbox file seems more recent --> download");
            this.$.dropbox.getFile("/todo.txt");
            this.$.dropbox.getFile("/done.txt");
            this.preferences["dboxrev"] = inResponse.rev;
            this.showToast("download files");
        }
        this.preferences["localchanges"] = false;
        localStorage.setItem("TodoPreferences", JSON.stringify(this.preferences));
    },

    archiveTodo: function() {
        var notDone = []
        for (item in this.todoList) {
            var task = this.todoList[item];
            if (task.done == "x") {
                this.doneList.push(task);
            } else {
                notDone.push(task);
            }
        }
        console.log(notDone);
        if (notDone.length < this.todoList.length) {
            this.todoList = notDone;
            console.log("done: "+this.doneList);
            this.$.listView.listRefresh();
            this.saveFile(
                this.preferences["filepath"].replace(/todo\.txt/, "done.txt"),
                this.doneList
            );
            this.saveFile(this.preferences["filepath"], this.todoList);
        }
        this.closeView();
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
            this.$.editView.$.priGroup.setValue("-");
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
        this.$.listView.setReplaceItem(false);
        this.$.editView.$.tododetail.setValue("");
        this.$.pane.selectViewByName("listView");
    },

    parseFile: function(path, file) {
        //console.log("-----------encrypted----------");
        //console.log(file.content);
        var data;
        if ((this.preferences["encrypted"] == true) && (this.preferences["password"].length > 0)) {
            data = CryptoJS.AES.decrypt(file.content, this.preferences["password"]).toString(CryptoJS.enc.Utf8);
        } else {
            data = file.content;
        }
        //console.log("-----------decrypted----------");
        //console.log(data);
        //console.log("path: " + path);
        if (data != undefined) {
            todofile = data.split("\n");
        } else {
            todofile = "";
        }
        this.todoList = [];
        for (line in todofile) {
            if (todofile[line]) {
                if (typeof line == "string") {
                    line = parseInt(line, 10);
                }
                var task = this.parseTask(todofile[line]);
                task.num = line + 1;
                this.todoList.push(task);
            }
        }
        this.$.listView.setSortedList(undefined);
        this.$.listView.$.todoList.render();
        console.log("row count: " + this.todoList.length);
    },

    parseTask: function(input) {
        //console.log(input);
        var task = new Task();
        // check for priority
        if (input[0] == "x") {
            task.done = "x";
            input = input.slice(2);
            // the date directly behind X is considered to be the done date
            var end = input.match(/^\d\d\d\d-\d\d-\d\d/);
            if (end != undefined) {
                task.end = end[0];
                input = input.slice(11);
            }
        } else {
            // priority is only given to not completed tasks
            var pri = input.match(/^\([A-E]\)\s/);
            if (pri != undefined) {
                task.pri = pri[0].slice(0,-1);
                input = input.slice(4);
            }
        }
        var begin = input.match(/^\d\d\d\d-\d\d-\d\d/);
        if (begin != undefined) {
            task.begin = begin[0];
            input = input.slice(11);
        }
        // check for contexts
        var con = input.match(/\@[^\s]+/g);
        if (con != undefined) {
            task.con = con;
            input = input.replace((/\@[^\s]+/g), "");
        }
        // check for prohects
        var pro = input.match(/\+[^\s]+/g);
        if (pro != undefined) {
            task.pro = pro;
            input = input.replace((/\+[^\s]+/g), "");
        }
        // rest is the description
        task.detail = input;
        return task;
    },

    saveFile: function(path, list) {
        var data = "";
        var task;
        for (item in list) {
            task = list[item];
            data = data + task.toString()+"\n";
        }
        if ((this.preferences["encrypted"] == true) && (this.preferences["password"].length > 0)) {
            data = CryptoJS.AES.encrypt(data, this.preferences["password"]).toString();
        }
        if (this.os == "BlackBerry") {
            if (blackberry.io.file.exists(path)) {
                blackberry.io.file.deleteFile(path);
            }
            var result = "";
            try {
                blackberry.io.file.saveFile(path,
                    blackberry.utils.stringToBlob(data));
                result = "file saved";
            } catch (e) {
                console.log("err: " + e);
                result = "err: " + e;
            }
            this.showToast(result);
        } else {
            this.$.writeFile.call({ path: path, content: data });
        }
        this.preferences["localchanges"] = true;
        localStorage.setItem("TodoPreferences", JSON.stringify(this.preferences));
    },

    saveSuccess: function(inSender, inEvent) {
        if (inEvent.error) {
            console.log("error: "+inEvent.error.message);
        } else {
            //this.showToast(inEvent.path + " saved");
            this.showToast("file saved");
            console.log(inEvent.path + " saved...");
            console.log(inEvent.bytes + " bytes...");
        }
    },

    dboxPutFileSuccess: function(inSender, inResponse) {
        console.log(inResponse.path + " uploaded to Dropbox");
        if (inResponse.path.match(/todo\.txt$/)) {
            this.preferences["dboxrev"] = inResponse.rev;
            localStorage.setItem("TodoPreferences", JSON.stringify(this.preferences));
        }
        console.log(inResponse.size + " bytes...");
    },

    doNothing: function(inSender, inResponse) {
        console.log("errrr");
        console.log(":: " + inSender);
        console.log(JSON.stringify(inResponse));
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
        }
    },

    getArchiveFile: function() {
        // TODO stub
        var path = this.preferences["filepath"].replace(/todo\.txt/, "done.txt");
        if (this.os == "BlackBerry") {
            // TODO do something here
            if (blackberry.io.file.exists(path)) {
                blackberry.io.file.readFile(path, 
                    function(fpath, blob) {
                        var data = blackberry.utils.blobToString(blob);
                        appInstance.loadArchive(null, {content: data});
                    }
                );
            }
        } else {
            this.$.readDoneFile.call({ path: path });
        }
    },

    loadArchive: function(path, file) {
        // TODO stub
        this.doneList = [];
        var list = file.content.split("\n");
        for (item in list) {
            if (list[item].length > 0) {
                var task = {};
                task.detail = list[item];
                this.doneList.push(task);                
            }
        }
    },

    loadDropbox: function(inSender, inResponse, inRequest) {
        console.log("url:" + inRequest.url);
        var file = {};
        file.content = inResponse;
        if (inRequest.url.match(/todo\.txt/)) {
            console.log("got the main file");
            this.parseFile(null, file);
            this.saveFile(this.preferences["filepath"], this.todoList);
        } else if (inRequest.url.match(/done\.txt/)) {
            console.log("got the done file");
            this.loadArchive(null, file);
            this.saveFile(
                this.preferences["filepath"].replace(/todo\.txt/, "done.txt"),
                this.doneList
            );
        }
        this.preferences["localchanges"] = false;
        localStorage.setItem("TodoPreferences", JSON.stringify(this.preferences));
    },

    resetPreferences: function() {
        localStorage.clear();
        this.preferences = new Object();
        this.preferences["dboxpath"] = "";
        this.preferences["password"] = "";
        this.preferences["dboxrev"] = 0;
        if (this.os == "BlackBerry") {
            var path = this.dirs.shared.documents.path + "/todo/todo.txt";
            this.preferences["filepath"] = path
        } else {
            this.preferences["filepath"] = "/media/internal/todo/todo.txt";
        }

        // reset the preferences pane

        //this.$.preferenceView.$.offline.setChecked(true);
        this.$.preferenceView.clearDropbox();
        this.$.listView.$.syncButton.setDisabled(true);
        // save preferences
        localStorage.setItem("TodoPreferences", JSON.stringify(this.preferences));
    },

    handleConnectionChange: function(inSender, inResponse) {
        var r = inResponse.isInternetConnectionAvailable;
        if (r) {
            console.log("went online...");
            if (this.$.dropbox.getAuthorized() == true) {
                this.enableDropbox();
                this.online = true;
                this.$.viewTitle.setContent("");
            } else {
                this.$.listView.$.syncButton.setDisabled(true);
            }
        } else {
            console.log("went offline...");
            this.online = false;
            this.showToast("offline mode");
            this.$.viewTitle.setContent("[offline]");
            this.$.listView.$.syncButton.setDisabled(true);
            this.$.preferenceView.$.dboxlogin.setDisabled(true);
            this.$.preferenceView.$.dboxlogout.hide();
        }
    },

    fail: function(inSender, inResponse, inRequest) {
        console.log("error");
        console.log(JSON.stringify(inResponse));
        this.showToast(inResponse.error);
    },

    enableDropbox: function() {
        if (this.$.dropbox.getAuthorized() == true) {
            console.log("authentication successful, enabling dropbox");
            var token = this.$.dropbox.getToken();
            var secret = this.$.dropbox.getTokenSecret();
            this.preferences["dboxtoken"] = token;
            this.preferences["dboxsecret"] = secret;
            localStorage.setItem("TodoPreferences", JSON.stringify(this.preferences));
            this.$.preferenceView.$.dboxlogin.hide();
            this.$.preferenceView.$.dboxlogout.show();
            this.$.listView.$.syncButton.setDisabled(false);
        } else {
            console.log("cannot enable dropbox. not authorized.");
            this.$.listView.$.syncButton.setDisabled(true);
        }
    },

    disableDropbox: function() {
        this.$.dropbox.reset();
        this.preferences["dboxtoken"] = "";
        this.preferences["dboxsecret"] = "";
        localStorage.setItem("TodoPreferences", JSON.stringify(this.preferences));
    },

    showToast: function(message) {
        this.$.toaster.setContent("<div id=\"toast\">" +
                message + "</div>");
        window.setTimeout(function () {
            var toast = document.getElementById("toast");
            toast.style.opacity = 0;
        }, 1000);
    }
});

enyo.kind({
  name: "Task",
  constructor: function() {
      this.pri = undefined;
      this.con = [];
      this.pro = [];
      this.detail = "";
      this.done = undefined;
      this.begin = undefined;
      this.end = undefined;

  },
  toString: function() {
    var arr = [this.done, this.end, this.pri, this.begin, this.detail, this.pro, this.con];
    return arr.join(" ").trim().replace(/\s\s+/," ");
  }  
});
