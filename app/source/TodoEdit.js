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
            contentHeight: "100%", onClose: "closePopup",
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
                    {kind: "Button", caption: "cancel", onclick: "closePopup", className: "enyo-button-negative"} 
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
            {kind: "RichText", name: "tododetail", richContent: true, hint:"", oninput:"", onblur: "storeFocus",
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
        var detail = this.$.tododetail.getValue();
        detail = detail.replace(/^<div>/,"");
        detail = detail.replace(/<div>/g,"\n");
        detail = detail.replace(/<[a-zA-Z\/][^>]*>/g,"");
        var tasks = detail.split("\n");
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
        var detail = this.$.tododetail.getValue();
        detail = detail.replace(/^<div>/,"");
        detail = detail.replace(/<div>/g,"\n");
        detail = detail.replace(/<[a-zA-Z\/][^>]*>/g,"");
        var tasks = detail.split("\n");
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
        this.$.tododetail.oninput = "storeFocus";
    },

    setHint: function() {
        var str = "<div>(A) very important task +project @context </div>";
        str += "<div>not so important right now</div>";
        str += "<div>a future task t:2015-05-23 with due:2015-12-12 date</div>";
        this.$.hint.setContent(str);
        this.$.tododetail.oninput = "removeHint";
    },

    setPriority: function(inSender) {
        var newContent = "";
        var pri = inSender.getValue();
        if (pri == "-") {
            pri = "";
        }
        var detail = this.$.tododetail.getValue();
        detail = detail.replace(/^<div>/,"");
        detail = detail.replace(/<div>/g,"\n");
        detail = detail.replace(/<[a-zA-Z\/][^>]*>/g,"");
        var tasks = detail.split("\n");
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

    storeFocus: function(inSender) {
        //console.log(inSender.getSelection().collapseToEnd());
        //console.log(inSender.getSelection());
        if (inSender.getSelection() != null) {
            var parent = inSender.getSelection().anchorNode;
            if (parent.nodeName != "DIV") {
                parent = parent.parentNode;
            } 
            var index = 0;
            while (parent.previousSibling != null) {
                parent = parent.previousSibling;
                index += 1;
            }
            this.line = index;
        }
    },

    showInsert: function() {
        this.proQueue = [];
        this.conQueue = [];
        this.$.insertPopup.openAtCenter();
        this.projectList = this.owner.$.listView.getProjectList();
        for (i=0; i<this.projectList.length; i++) {
            var project = this.projectList[i];
            var name = project.replace(/^\+/,"PRJ_");
            this.$.projects.createComponent(
                {content: project, name: name, owner: this,
                    onclick: "insertProject"}
            );
        }
        this.$.projects.render();
        this.contextList = this.owner.$.listView.getContextList();
        for (i=0; i<this.contextList.length; i++) {
            var context = this.contextList[i];
            var name = context.replace(/^@/,"CTX_");
            this.$.contexts.createComponent(
                {content: context, name: name, owner: this,
                    onclick: "insertContext"}
            );
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
        var detail = this.$.tododetail.getValue();
        detail = detail.replace(/^<div>/,"");
        detail = detail.replace(/<div>/g,"\n");
        detail = detail.replace(/<[a-zA-Z\/][^>]*>/g,"");
        var tasks = detail.split("\n");
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
        this.closePopup();
    },

    closePopup: function() {
        for (i=0; i<this.projectList.length; i++) {
            var name = this.projectList[i].replace(/^\+/,"PRJ_");
            eval("this.$."+name+".destroy()");
        }
        this.$.projects.render();
        for (i=0; i<this.contextList.length; i++) {
            var name = this.contextList[i].replace(/^@/,"CTX_");
            eval("this.$."+name+".destroy()");
        }
        this.$.contexts.render();
        this.$.tododetail.forceFocus();
        this.$.insertPopup.close();
    }

});
