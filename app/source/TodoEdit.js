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
    name: "TodoEdit",
    kind: enyo.VFlexBox,
    events: {
        "onClose": "",
        "onSave": ""
    },
    components: [
        {name: "insertPopup", kind: "ModalDialog", dismissWithClick: true,
            layoutKind: "VFlexLayout", height: "60%",
            contentHeight: "100%", onClose: "closeInsert",
            components: [
                {flex: 1, name: "iscroller", kind: "Scroller",
                    components: [
                        {name: "projects", kind: "RowGroup", caption: "Projects"},
                        {name: "contexts", kind: "RowGroup", caption: "Contexts"}
                ]},
                {name: "ibuttons", layoutKind: "VFlexLayout", pack: "justify", components: [
                    {name: "ibuttonsOk", layoutKind: "HFlexLayout", pack: "justify", components: [
                        {flex:1, kind: "Button", caption: "add for current", onclick: "addSingleTag", className: "enyo-button-affirmative"},
                        {flex:1, kind: "Button", caption: "add for all", onclick: "addTags", className: "enyo-button-affirmative"}
                    ]},
                    {kind: "Button", caption: "cancel", onclick: "closeInsert", className: "enyo-button-negative"} 
                ]}
        ]},
        {name: "editPriorityPopup", kind: "ModalDialog",
            dismissWithClick: true, components: [
                {kind: "RowGroup", caption:"Select Priority", components: [
                    {kind: "Item", layoutKind: "HFlexLayout",
                        components: [
                            {content: "Assign to all"},
                            {kind: "Spacer"},
                            {kind: "CheckBox", name: "doForAllB",
                                preferenceProperty: "doForAllV"}
                    ]},
                    {kind: "RadioGroup", name: "editPriGroup",
                        onChange: "setPriority", components: [
                        {caption: "-", value: "-"},
                        {caption: "A", value: "(A)"},
                        {caption: "B", value: "(B)"},
                        {caption: "C", value: "(C)"},
                        {caption: "D", value: "(D)"},
                        {caption: "E", value: "(E)"}
                    ]}
                ]}
        ]},
        {name: "editDuePopup", kind: "ModalDialog", dismissWithClick: true,
        components: [
            {kind: "DatePicker", name: "editDuePicker", label: "Due by", minYear: 2013, maxYear: 2015},
            {name: "dueButtons", layoutKind: "VFlexLayout", pack: "justify", components: [
                {layoutKind: "HFlexLayout", pack: "justify", components: [
                    {flex:1, kind: "Button", caption: "add for current", onclick: "addSingleDue", className: "enyo-button-affirmative"},
                    {flex:1, kind: "Button", caption: "add for all", onclick: "addDue", className: "enyo-button-affirmative"}
                ]},
                {kind: "Button", caption: "cancel", onclick: "closeEditDuePopup", className: "enyo-button-negative"} 
            ]}
        ]},
        {name: "editDeferPopup", kind: "ModalDialog", dismissWithClick: true,
        components: [
            {kind: "DatePicker", name: "editDeferPicker", label: "Defer to", minYear: 2013, maxYear: 2015},
            {name: "deferButtons", layoutKind: "VFlexLayout", pack: "justify", components: [
                {layoutKind: "HFlexLayout", pack: "justify", components: [
                    {flex:1, kind: "Button", caption: "add for current", onclick: "addSingleDefer", className: "enyo-button-affirmative"},
                    {flex:1, kind: "Button", caption: "add for all", onclick: "addDefer", className: "enyo-button-affirmative"}
                ]},
                {kind: "Button", caption: "cancel", onclick: "closeEditDeferPopup", className: "enyo-button-negative"} 
            ]}
        ]},

        {flex: 1, name: "scroller", kind: "Scroller", components: [
            {kind: "RichText", name: "tododetail", richContent: true, hint:"", oninput:"",
                className: "enyo-box-input"}, {kind: "HtmlContent", name:"hint", content: ""}
        ]},
        {name: "editToolbar", kind: "Toolbar", pack: "justify", className: "enyo-toolbar-light",
            components: [
                {flex:1, kind: "IconButton", icon: "images/cancel.png",
                    onclick: "doClose", align: "left", className: "enyo-button-negative"},
                {flex:1, kind: "IconButton", icon: "images/prio.png", className:"todo-toolbar-button",
                    onclick: "showPriority", align: "right"},
                {flex:1, kind: "IconButton", icon: "images/due.png", className:"todo-toolbar-button",
                    onclick: "showDue", align: "right"},
                {flex:1, kind: "IconButton", icon: "images/defer.png", className:"todo-toolbar-button",
                    onclick: "showDefer", align: "right"},
                {flex:1, kind: "IconButton", icon: "images/tag.png", className:"todo-toolbar-button",
                    onclick: "showInsert", align: "right"},
                {flex:1, kind: "IconButton", icon: "images/save.png",
                    onclick: "doSave", align: "right", className: "enyo-button-affirmative"},
            ]
        }

    ],

    addSingleDue: function(inSender) {
        this.singleInsert = true;
        this.addDue();
        this.singleInsert = false;
    },

    addDue: function(inSender) {
        var newContent = "";
        var due = this.$.editDuePicker.getValue();
        var dfmt = new enyo.g11n.DateFmt({date:"yyyy-MM-dd"});
        var dueStr = dfmt.format(due); 
        var tasks = this.getTaskList();
        for (var i = tasks.length - 1; i >= 0; i--) {
            var strTask = tasks[i];
            strTask.trim();
            if (strTask.length > 0) {
                if (this.singleInsert != true || (this.line == i)) {
                    var task = this.owner.parseTask(strTask);
                    task.due = dueStr;
                    newContent = "<div>" + task.toString() + "</div>" + newContent;
                } else {
                    newContent = "<div>" + strTask + "</div>" + newContent;
                }
            }
        };
        this.owner.$.editView.$.tododetail.setValue(newContent);
        this.$.editDuePopup.close();
    },

    closeEditDuePopup: function() {
        this.$.editDuePopup.close();
    },

    addSingleDefer: function(inSender) {
        this.singleInsert = true;
        this.addDefer();
        this.singleInsert = false;
    },

    addDefer: function(inSender) {
        var newContent = "";
        var defer = this.$.editDeferPicker.getValue();
        var dfmt = new enyo.g11n.DateFmt({date:"yyyy-MM-dd"});
        var deferStr = dfmt.format(defer); 
        var tasks = this.getTaskList();
        for (var i = tasks.length - 1; i >= 0; i--) {
            var strTask = tasks[i];
            strTask.trim();
            if (strTask.length > 0) {
                if (this.singleInsert != true || (this.line == i)) {
                    var task = this.owner.parseTask(strTask);
                    task.defer = deferStr;
                    newContent = "<div>" + task.toString() + "</div>" + newContent;
                } else {
                    newContent = "<div>" + strTask + "</div>" + newContent;
                }
            }
        };
        this.owner.$.editView.$.tododetail.setValue(newContent);
        this.$.editDeferPopup.close();
    },

    closeEditDeferPopup: function() {
        this.$.editDeferPopup.close();
    },

    removeHint: function() {
        this.$.hint.setContent("");
        this.$.tododetail.oninput = "";
        this.$.tododetail.onkeyup = "storeFocus";
        this.$.tododetail.onclick = "storeFocus";
        this.$.tododetail.onpaste = "storeFocus";
        this.$.tododetail.oncut = "storeFocus";
    },

    setHint: function() {
        var str = "<div>(A) very important task +project @context</div>";
        str += "<div>not so important right now</div>";
        str += "<div>a future task t:2015-05-23 with due:2015-12-12 date</div>";
        this.$.hint.setContent(str);
        this.$.tododetail.oninput = "removeHint";
        this.$.tododetail.onclick = "";
    },

    setPriority: function(inSender) {
        var newContent = "";
        var pri = inSender.getValue();
        if (pri == "-") {
            pri = "";
        }
        var tasks = this.getTaskList();
        for (var i = tasks.length - 1; i >= 0; i--) {
            var strTask = tasks[i];
            strTask.trim();
            if (strTask.length > 0) {
                if (this.$.doForAllB.checked == true || (this.line == i)) {
                    strTask = strTask.replace(/^\([A-E]\)\s/,"");
                    newContent = "<div>" + pri + " " + strTask + "</div>" + newContent;
                } else {
                    newContent = "<div>" + strTask + "</div>" + newContent;
                }
            }
        };
        this.owner.$.editView.$.tododetail.setValue(newContent);
        this.$.editPriorityPopup.close();
    },

    // This deals with 2 different behaviours of enyo's RichText when return is pressed.
    // In chrome this is converted into DIV while webos inserts a BR.
    // We also have to deal with 'mixed' content since the task2html conversion uses DIV too.
    // Additionally, there is a different selection behaviour for blank new lines in webos.
    // In this case the parent's DIV counts as selected.
    storeFocus: function(inSender) {
        if ((inSender.getSelection() != null) && (inSender.getSelection().anchorNode != null)) {
            var node = inSender.getSelection().anchorNode;
            var index = 0;

            //console.log(this.$.tododetail.getHtml());
            var alreadyChecked = false;
            // This deals with blank new lines. webos enters <BR><BR> until you enter text.
            // Later we will also use 'alreadyChecked' to not loop infinitly when we reach a parent DIV
            // and check for <BR><BR> as last children.
            if (node.id && (node.lastChild.nodeName == "BR")) {
                index +=1;
                node = node.lastChild.previousSibling.previousSibling
            }
            while (!node.id) {
                // check a text element for breaks
                if (node.nodeName == "#text") {
                    while (node.previousSibling != undefined) {
                        node = node.previousSibling;
                        if (node.nodeName != "BR") {
                            index += 1;
                        }
                    }
                    node = node.parentNode;
                } else if (node.nodeName == "DIV") {
                    if (!alreadyChecked && (node.lastChild.nodeName == "BR")) {
                        node = node.lastChild.previousSibling.previousSibling;
                        alreadyChecked = true;
                        index += 1;
                    } else if (node.previousSibling != null) {
                        // a new DIV different from the RichText container means a new line
                        node = node.previousSibling;
                        alreadyChecked = false;
                        if (node.hasChildNodes() == true) {
                            node = node.lastChild;
                        }
                        index += 1;
                    } else {
                        node = {id:"error"};
                    }
                }
            }
            this.line = index;
        }
        //console.log(this.line);
    },

    showInsert: function() {
        this.proQueue = [];
        this.conQueue = [];
        this.$.insertPopup.openAtCenter();
        this.projectList = this.owner.$.listView.getProjectList();
        for (i=0; i<this.projectList.length; i++) {
            var project = this.projectList[i];
            var name = project.replace(/^\+/,"PRJ_");
            if (this.$[name] == undefined) {
                this.$.projects.createComponent(
                    {content: project, name: name, owner: this,
                    onclick: "insertProject"}
                );
            }
            this.$[name].show();
        }
        this.$.projects.render();
        this.contextList = this.owner.$.listView.getContextList();
        for (i=0; i<this.contextList.length; i++) {
            var context = this.contextList[i];
            var name = context.replace(/^@/,"CTX_");
            if (this.$[name] == undefined) {
                this.$.contexts.createComponent(
                    {content: context, name: name, owner: this,
                    onclick: "insertContext"}
                );
            }
            this.$[name].show();
        }
        this.$.contexts.render();
        this.$.iscroller.render();
    },

    showPriority: function() {
        this.$.editPriorityPopup.openAtCenter();
        this.$.editPriGroup.setValue("");
    },

    showDue: function() {
        this.$.editDuePopup.openAtCenter();
        this.$.editDuePicker.setValue(new Date());
    },

    showDefer: function() {
        this.$.editDeferPopup.openAtCenter();
        this.$.editDeferPicker.setValue(new Date());
    },

    insertProject: function(inSender, inEvent) {
        var idx = this.proQueue.indexOf(inSender.content);
        if ( idx != -1) {
            this.proQueue.splice(idx,1);
            inSender.removeClass("selected-item");
        } else {
            this.proQueue.push(inSender.content);
            inSender.addClass("selected-item");
        }
        this.$.projects.render();
        this.$.iscroller.render();
    },

    insertContext: function(inSender, inEvent) {
        var idx = this.conQueue.indexOf(inSender.content);
        if ( idx != -1) {
            this.conQueue.splice(idx,1);
            inSender.removeClass("selected-item");
        } else {
            this.conQueue.push(inSender.content);
            inSender.addClass("selected-item");
        }
        this.$.contexts.render();
        this.$.iscroller.render();
    },

    addSingleTag: function() {
        this.singleInsert = true;
        this.addTags();
        this.singleInsert = false;
    },

    addTags: function() {
        var newContent = "";
        tasks = this.getTaskList();
        for (var i = tasks.length - 1; i >= 0; i--) {
            var strTask = tasks[i];
            strTask.trim();
            if (strTask.length > 0) {
                if (this.singleInsert != true || (this.line == i)) {
                    var task = this.owner.parseTask(strTask);
                    for (var j = this.conQueue.length - 1; j >= 0; j--) {
                        task.con.push(this.conQueue[j]);
                    };
                    for (var j = this.proQueue.length - 1; j >= 0; j--) {
                        task.pro.push(this.proQueue[j]);
                    };
                    task.removeDuplicates();
                    newContent = "<div>" + task.toString() + "</div>" + newContent;
                } else {
                    newContent = "<div>" + strTask + "</div>" + newContent;
                }
            }
        };
        this.owner.$.editView.$.tododetail.setValue(newContent);
        this.closeInsert();
    },

    closeInsert: function() {
        this.$.insertPopup.close();
        for (i=0; i<this.projectList.length; i++) {
            var project = this.projectList[i];
            var name = project.replace(/^\+/,"PRJ_");
            this.$[name].hide();
        }
        for (i=0; i<this.contextList.length; i++) {
            var context = this.contextList[i];
            var name = context.replace(/^@/,"CTX_");
            this.$[name].hide();
        }
        this.$.tododetail.forceFocus();
    },
    getTaskList: function() {
            var detail = this.$.tododetail.getValue();
            detail = detail.replace(/^<div>/,"");
            detail = detail.replace(/&nbsp;/g,"");
            detail = detail.replace(/<(div|br)>/g,"\n");
            detail = detail.replace(/<[a-zA-Z\/][^>]*>/g,"");
            console.log(detail);
            return detail.split("\n");
    }
});
