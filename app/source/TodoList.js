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
    name: "TodoList",
    kind: enyo.VFlexBox,
    published: {
        replaceItem: false,
        completeItem: false,
        sortOrder: "pri",
        cacheChanges: "NO",
        searchFilter: null,
        priorityList: [],
        projectList: [],
        contextList: [],
        sortedList: undefined
    },
    events: {
        "onEdit": "",
        "onPrefs": "",
        "onReload": ""
    },
    components: [
    
        {name: "todoPopup", kind: "ModalDialog", dismissWithClick: true,
            onClose: "closePopup", components: [
                {kind: "RowGroup", components: [
                    {content:"Complete", onclick:"completeTodoItem",
                        style: "text-align:center"},
                    {content:"Prioritize", onclick:"showPriList",
                        style: "text-align:center"},
                    {content:"Update", onclick:"updateTodoItem",
                        style: "text-align:center"},
                    {content:"Delete", onclick:"deleteTodoItem",
                        style: "text-align:center"}
                ]}
        ]},
        {name: "completedPopup", kind: "ModalDialog",
            dismissWithClick: true, onClose: "closePopup", components: [
                {kind: "RowGroup", components: [
                    {content:"Undo Complete",
                        onclick:"undoCompleteTodoItem",
                        style: "text-align:center"},
                    {content:"Delete", onclick:"deleteTodoItem",
                        style: "text-align:center"}
                ]}
        ]},
        {name: "priorityPopup", kind: "ModalDialog",
            dismissWithClick: true, onClose: "closePopup", components: [
                {kind: "RowGroup", caption:"Select Priority", components: [
                    {kind: "RadioGroup", name: "priGroup",
                        onChange: "setPriority", components: [
                        {caption: "-", value: "-"},
                        {caption: "A", value: "A"},
                        {caption: "B", value: "B"},
                        {caption: "C", value: "C"},
                        {caption: "D", value: "D"},
                        {caption: "E", value: "E"}
                    ]}
                ]}
        ]},
        {kind: "SearchInput", name: "searchbox", onchange: "searchList", onCancel: "clearSearch"},
        {flex: 1, kind: "Scroller", name: "scroller", components: [
            {kind: "VirtualRepeater", name: "todoList",
                onSetupRow: "getTodoList", onclick: "todoTap",
                components: [
                    {kind: "SwipeableItem", onConfirm: "deleteTodo",
                        layoutKind: enyo.HFlexLayout, tapHighlight: true, name: "todoRow",
                        components: [
                            {name: "lineNum", className: "left-col"},
                            {name: "priority", className: "mid-col"},
                            {flex: 1, name: "todoItem"}
                        ]
                    }
                ]
            }
        ]},
        {name: "listToolbar", kind: "Toolbar", pack: "justify", className: "enyo-toolbar-light",
            components: [
                {flex: 1},
                //{kind: "Button", caption: "Filter"},
                //TODO: consider moving to the top
                {kind: "ListSelector", value: "pri",
                    onChange: "changeSort", items: [
                    {caption: "Priority", value: "pri"},
                    {caption: "ID Ascending", value: "asc"},
                    {caption: "ID Descending", value: "dsc"},
                    {caption: "Text (A-Z)", value: "az"}
                ]},
                {icon: "images/menu-icon-new.png",
                    onclick: "doEdit", align: "right"},
                {icon: "images/menu-icon-sync.png",
                    onclick: "doReload", align: "right"},
                {icon: "images/menu-icon-prefs.png",
                    onclick: "doPrefs", align: "right"}
            ]
        },
    
    ],

    getTodoList: function(inSender, inIndex) {

        if (this.sortedList == undefined) {
            this.sortedList = this.owner.todoList.slice(0);
            this.changeSort(null, this.sortOrder, null);
        }

        var r = this.sortedList[inIndex];

        if (r) {
            //TODO: currently not used, is it needed in future?
            if (this.priorityListReset) {
                this.priorityList = [];
                this.priorityListReset = false;
            }
            if (r.pri) {
                if (this.priorityList.indexOf(r.pri[0]) == -1) 
                    this.priorityList.push(r.pri[0]);
            } //TODO: end quetionable code
            if (this.projectListReset) {
                this.projectList  = [];
                this.projectListReset = false;
            }
            var project = r.detail.match(/\+[^\s]+/);
            if (project) {
                project = project[0].replace(/\./,"");
                if (this.projectList.indexOf(project) == -1)
                    this.projectList.push(project);
            }
            if (this.contextListReset) {
                this.contextList  = [];
                this.contextListReset = false;
            }
            var context = r.detail.match(/\@[^\s]+/);
            if (context) {
                context = context[0].replace(/\./,"");
                if (this.contextList.indexOf(context) == -1)
                    this.contextList.push(context);
            }
            var filtered = false;
            var s = r.detail.replace(/^x\s/,"");
            var s = s.replace(/^\([A-E]\)\s/,"");
            var filter = new RegExp(this.searchFilter, "i");
            if (this.search && s.match(filter)) {
                filtered = true;
            } else if (!this.search) {
                filtered = true;
            }
            if (this.owner.preferences["lineNumbers"]) {
                this.$.lineNum.setContent(r.num);
            }
            this.$.priority.setContent(r.pri);
            var pri = r.detail.replace(/^\(([A-E])\)\s.*$/,"$1");
            if (r.pri == "(A) ") this.$.priority.addClass("pri-a");
            if (r.pri == "(B) ") this.$.priority.addClass("pri-b");
            if (r.pri == "(C) ") this.$.priority.addClass("pri-c");
            this.$.todoItem.setContent(s);
            if (r.detail.match(/^x\s/)) {
                this.$.todoItem.addStyles("text-decoration:line-through;");
                this.$.todoItem.addClass("completed-item");
            }
            if (inIndex == this.selectedIndex) {
                this.$.todoRow.addClass("selected-item");
            }
            if (!filtered) {
                this.$.todoRow.hide();
            }
            return true;
        } else {
            this.priorityListReset = true;
            this.projectListReset = true;
        }
    },

    todoTap: function(inSender, inEvent) {
        this.selectedIndex = inEvent.rowIndex;
        if (this.selectedIndex != undefined) {
            this.selectedId = this.sortedList[this.selectedIndex].num-1;
        }
        var r = this.sortedList[inEvent.rowIndex];

        if (r) {
            var completed = r.detail.match(/^x\s/);
            var quick = this.owner.preferences["quickComplete"];
            if (completed) {
                this.$.completedPopup.openAtCenter();
            } else if (quick) {
                this.completeTodoItem();
            } else {
                this.$.todoPopup.openAtCenter();
            }
        }
        this.$.todoList.render();
    },

    completeTodoItem: function() {
        this.completeItem = true;
        var dfmt = new enyo.g11n.DateFmt({date:"yyyy-MM-dd"});
        this.cacheChanges = "START";
        this.clearPriority();
        this.owner.$.editView.$.tododetail.setValue(
            "x " + dfmt.format(new Date()) + " " +
                this.owner.todoList[this.selectedId].detail
        );
        this.replaceItem = true;
        this.cacheChanges = "COMMIT";
        this.owner.addTodo();
        this.completeItem = false;
        this.$.todoPopup.close();
    },

    undoCompleteTodoItem: function() {
        this.completeItem = true;
        this.owner.$.editView.$.tododetail.setValue(
            this.owner.todoList[this.selectedId].detail.replace(/^x\s[0-9]{4}-[0-9]{2}-[0-9]{2}\s/,"")
        );
        this.replaceItem = true;
        this.owner.addTodo();
        this.completeItem = false;
        this.closePopup();
    },

    updateTodoItem: function() {
        if (this.owner.todoList[this.selectedId].pri) {
            var pri = this.owner.todoList[this.selectedId].pri[0];
            pri = pri.replace(/^\(([A-E])\)\s.*$/,"$1");
            this.owner.$.editView.$.priGroup.setValue(pri);
        } else {
            this.owner.$.editView.$.priGroup.setValue("-");
        }
        this.owner.$.editView.$.tododetail.setValue(this.owner.todoList[this.selectedId].detail);
        this.replaceItem = true;
        this.owner.showEditView();
        this.$.todoPopup.close();
    },

    addTodo: function() {
        var task = new Object();
        task.num = this.owner.todoList.length + 1;
        task.pri = null;
        task.detail = this.owner.$.editView.$.tododetail.getValue();
        task.detail = task.detail.replace(/(<\/?[A-Za-z][A-Za-z0-9]*>)+/g," ");
        if (this.owner.preferences["dateTasks"] && !this.completeItem) {
            var dfmt = new enyo.g11n.DateFmt({date:"yyyy-MM-dd"});
            task.detail = dfmt.format(new Date()) + " " + task.detail;
        }
        if (this.owner.preferences["storage"] != "none" && this.cacheChanges != "YES" && this.cacheChanges != "COMMIT") {
            console.log("saving backup");
            this.owner.saveFile(
                this.owner.preferences["filepath"]+".bak", this.owner.todoList);
            if (this.cacheChanges == "START") {
                this.cacheChanges = "YES"
            }
        }
        if (this.replaceItem) {
            this.owner.todoList[this.selectedId].detail = task.detail;
            this.owner.todoList[this.selectedId].pri = task.detail.match(/^\([A-E]\)\s/);
            this.replaceItem = false;
        } else {
            this.owner.todoList.push(task);
        }
        this.listRefresh();
        if (this.owner.preferences["storage"] != "none" && this.cacheChanges != "START" && this.cacheChanges != "YES") {
            console.log("saving list");
            this.owner.saveFile(
                this.owner.preferences["filepath"], this.owner.todoList);
            if (this.cacheChanges == "COMMIT") {
                this.cacheChanges = "NO"
            }
        }
        this.owner.closeView();
    },

    deleteTodoItem: function() {
        this.deleteTodo(null, this.selectedId);
        this.closePopup();
    },

    deleteTodo: function(inSender, inIndex) {
        if (this.owner.preferences["storage"] != "none") {
            this.owner.saveFile(
                this.owner.preferences["filepath"]+".bak", this.owner.todoList);
        }
        this.owner.todoList.splice(inIndex, 1);
        this.listRefresh();
        if (this.owner.preferences["storage"] != "none") {
            this.owner.saveFile(
                this.owner.preferences["filepath"], this.owner.todoList);
        }
    },

    closePopup: function() {
        //this.$.todoPopup.close();
        //this.$.completedPopup.close();
        //this.$.priorityPopup.close();
        //this.selectedIndex = null;
        //this.selectedId = null;
        this.$.todoList.render();
    },

    showPriList: function() {
        var r = this.sortedList[this.selectedIndex];

        this.$.todoPopup.close();
        this.$.priorityPopup.openAtCenter();
        if (r.detail.match(/^\(([A-E])\)\s/)) {
            var pri = r.detail.replace(/^\(([A-E])\)\s.*$/,"$1");
            this.$.priGroup.setValue(pri);
        } else {
            this.$.priGroup.setValue(pri);
        }
    },

    setPriority: function(inSender) {
        var val = inSender.getValue();
        this.clearPriority();
        if (val.match(/[A-E]/)) {
            this.owner.$.editView.$.tododetail.setValue(
                "(" + val + ") " + this.owner.todoList[this.selectedId].detail);
            this.replaceItem = true;
            this.addTodo();
        }
        this.$.priorityPopup.close();
    },

    clearPriority: function() {
        this.owner.$.editView.$.tododetail.setValue(
            this.owner.todoList[this.selectedId].detail.replace(/^\([A-E]\)\s/,"")
        );
        this.replaceItem = true;
        this.owner.addTodo();
    },

    searchList: function(inSender) {
        this.searchFilter = inSender.getValue();
        this.searchFilter = this.searchFilter.replace(/\+/,"\\+");
        //console.log(this.searchFilter);
        this.search = true;
        this.$.scroller.scrollIntoView(0,0);
        this.$.todoList.render();
    },

    clearSearch: function() {
        this.searchFilter = null;
        this.search = false;
        this.$.todoList.render();
    },

    changeSort: function(inSender, inValue, inOldValue) {
        this.sortOrder = inValue;
        if (inValue == "pri") {
            this.sortedList.sort(function (a,b) {
                if (!a["pri"] && a["detail"].match(/^x\s/)) {
                    checka = "-";
                } else if (!a["pri"]) {
                    checka = "+";
                } else {
                    checka = a["pri"];
                }
                if (!b["pri"] && b["detail"].match(/^x\s/)) {
                    checkb = "-";
                } else if (!b["pri"]) {
                    checkb = "+";
                } else {
                    checkb = b["pri"];
                }
                if (checka < checkb) return -1;
                if (checka > checkb) return 1;
                return 0;
            });
            this.$.todoList.render();
        } else if (inValue == "asc") {
            this.sortedList.sort(function (a,b) {
                if (a["num"] < b["num"]) return -1;
                if (a["num"] > b["num"]) return 1;
                return 0;
            });
            this.$.todoList.render();
        } else if (inValue == "dsc") {
            this.sortedList.sort(function (a,b) {
                if (a["num"] > b["num"]) return -1;
                if (a["num"] < b["num"]) return 1;
                return 0;
            });
            this.$.todoList.render();
        } else if (inValue == "az") {
            this.sortedList.sort(function (a,b) {
                var checka = a["detail"].replace(/^\([A-E]\)\s/,"");
                var checkb = b["detail"].replace(/^\([A-E]\)\s/,"");
                if (checka < checkb) return -1;
                if (checka > checkb) return 1;
                return 0;
            });
            this.$.todoList.render();
        } else {
            console.log("wait what?");
        }
    },

    listRefresh: function() {
        this.sortedList = undefined;
        this.$.todoList.render();
    }

});
