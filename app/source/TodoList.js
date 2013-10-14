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
        filterList: [],
        sortedList: undefined,
        selectedIndex: undefined,
        selected: []
    },
    events: {
        "onEdit": "",
        "onPrefs": "",
        "onReload": ""
    },
    components: [
    
        // {name: "todoPopup", kind: "ModalDialog", dismissWithClick: true,
        //     onClose: "closePopup", components: [
        //         {kind: "RowGroup", components: [
        //             {content:"Complete", onclick:"completeTodoItem",
        //                 style: "text-align:center"},
        //             {content:"Prioritize", onclick:"showPriList",
        //                 style: "text-align:center"},
        //             {content:"Update", onclick:"updateTodoItem",
        //                 style: "text-align:center"},
        //             {content:"Delete", onclick:"deleteTodoItem",
        //                 style: "text-align:center"}
        //         ]}
        // ]},
        // {name: "completedPopup", kind: "ModalDialog",
        //     dismissWithClick: true, onClose: "closePopup", components: [
        //         {kind: "RowGroup", components: [
        //             {content:"Undo Complete",
        //                 onclick:"undoCompleteTodoItem",
        //                 style: "text-align:center"},
        //             {content:"Delete", onclick:"deleteTodoItem",
        //                 style: "text-align:center"}
        //         ]}
        // ]},
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
        {name: "filterPopup", kind: "ModalDialog", dismissWithClick: true,
            layoutKind: "VFlexLayout", height: "60%",
            contentHeight: "100%", onClose: "closePopup",
            components: [
                {flex: 1, name: "fscroller", kind: "Scroller",
                    components: [
                    {name: "projects", kind: "RowGroup", caption: "Projects",
                        components: [
                            {kind: "VirtualRepeater", name: "projFlist",
                                onSetupRow: "getProjFilter", components: [
                                    {kind: "Item", layoutKind: "HFlexLayout", name: "fprojRow",
                                        components: [
                                            {flex: 1, name: "fprojN"},
                                            {kind: "CheckBox", name: "fprojC",
                                                onChange: "changeFilter"}
                                        ]}
                                    ]}
                    ]},
                    {name: "contexts", kind: "RowGroup", caption: "Contexts",
                        components: [
                            {kind: "VirtualRepeater", name: "conFlist",
                                onSetupRow: "getConFilter", components: [
                                    {kind: "Item", layoutKind: "HFlexLayout", name: "fconRow",
                                        components: [
                                            {flex: 1, name: "fconN"},
                                            {kind: "CheckBox", name: "fconC",
                                                onChange: "changeFilter"}
                                        ]}
                                    ]}
                    ]}
                ]},
                {layoutKind: "HFlexLayout", pack: "justify", components: [
                    {flex: 1, kind: "Button", caption: "RESET", onclick: "resetFilter"},
                    {flex: 1, kind: "Button", caption: "OK", onclick: "closePopup"}
                    ]}
        ]},
        {kind: "SearchInput", name: "searchbox", onchange: "searchList", onCancel: "clearSearch", className: "enyo-box-input"},
        {flex: 1, kind: "Scroller", name: "scroller", components: [
            {kind: "VirtualRepeater", name: "todoList",
                onSetupRow: "getTodoList", onclick: "todoTap",
                components: [
                    {kind: "SwipeableItem", onConfirm: "deleteTodo", className: "todo-entry",
                        layoutKind: "enyo.HFlexLayout", name: "todoRow",
                        align:"center",
                        components: [
                            {name: "lineNum", className: "left-col"},
                             {layoutKind: "enyo.VFlexLayout",
                                components: [
                                    {name: "dateRow", className: "top-row"},                 
                                    {layoutKind: "enyo.HFlexLayout",
                                        components: [
                                            {name: "priority", className: "mid-col"},  
                                            {name: "todoItem"} 
                                        ]
                                    },
                                    {name: "infoRow", className: "bot-row"}
                                ]
                            }
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
                {icon: "images/add.png",
                    onclick: "doEdit", align: "right"},
                {icon: "images/find.png",
                    onclick: "showFilters", align: "right"},
                {name:"syncButton", icon: "images/refresh.png",
                    onclick: "doReload", align: "right"},
                {icon: "images/pref.png",
                    onclick: "doPrefs", align: "right"}
            ]
        },
        {name: "editToolbar", kind: "Toolbar", pack: "justify", className: "enyo-toolbar-light",
            showing: false,
            components: [
                {flex: 1},
                {icon: "images/prio.png",
                    onclick: "showPriList", align: "right"},
                {icon: "images/done.png",
                    onclick: "nothing", align: "right"},
                {icon: "images/undone.png",
                    onclick: "nothing", align: "right"},
                {icon: "images/edit.png",
                    onclick: "updateTodoItem", align: "right"},
                {icon: "images/delete.png",
                    onclick: "nothing", align: "right"}
            ]
        }
    
    ],

    getTodoList: function(inSender, inIndex) {

        if (this.sortedList == undefined) {
            this.sortedList = this.owner.todoList.slice(0);
            this.changeSort(null, this.sortOrder, null);
        }

        var r = this.sortedList[inIndex];

        if (r) {
            if (this.projectListReset) {
                this.projectList  = [];
                this.projectListReset = false;
            }
            if (r.pro.length > 0) {
                for (i in r.pro) {
                    if (this.projectList.indexOf(r.pro[i]) == -1) {
                        this.projectList.push(r.pro[i]);
                    }
                }
            }
            if (this.contextListReset) {
                this.contextList  = [];
                this.contextListReset = false;
            }
            if (r.con.length > 0) {
                for (i in r.con) {
                    if (this.contextList.indexOf(r.con[i]) == -1) {
                        this.contextList.push(r.con[i]);
                    }
                }
            }
            
            var filtered = false;
            var sfilter = new RegExp(this.searchFilter, "i");
            //console.log(JSON.stringify(r));
            var s = r.detail + r.pro.join(" ") + r.con.join(" ");

            if (this.filter) {
                for (var fidx = 0; fidx < this.filterList.length; fidx++) {
                    var ffilter = this.filterList[fidx];
                    ffilter = ffilter.replace(/\+/,"\\+");
                    var fregx = new RegExp(ffilter, "i");
                    //console.log(this.search);
                    //console.log(sfilter);
                    if (s.match(fregx) && !this.search) {
                        filtered = true;
                    } else if (s.match(fregx) && s.match(sfilter)) {
                        filtered = true;
                    }
                }
            } else if (!this.search) {
                filtered = true;
            } else if (s.match(sfilter)) {
                filtered = true;
            }
            if (this.owner.preferences["lineNumbers"]) {
                this.$.lineNum.setContent(r.num);
                this.$.lineNum.addStyles("margin-right:6px");
            }
            if (r.pri == "(A)") this.$.priority.addClass("pri-a");
            if (r.pri == "(B)") this.$.priority.addClass("pri-b");
            if (r.pri == "(C)") this.$.priority.addClass("pri-c");
            if (r.pri) {
                this.$.priority.setContent(r.pri[1]);
                this.$.priority.addStyles("margin-right:6px");
            }
            this.$.todoItem.setContent(r.detail);
            this.$.infoRow.setContent([r.pro.join(" "),r.con.join(" ")].join(" "));
            if (r.begin) {
                // 1000 * 60 * 60 * 24 = 86400000 (ms * s * m * h)
                var startDate = new Date(r.begin);
                var endDate = new Date();
                days_passed = (endDate - startDate) / 86400000;
                this.$.dateRow.setContent(["Added",Math.floor(days_passed),"days ago"].join(" "));
            }
            if (r.done == "x") {
                this.$.todoItem.addStyles("text-decoration:line-through;");
                this.$.todoItem.addClass("completed-item");
            }
            if (this.selected.indexOf(inIndex) != -1) {
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
        var idx = this.selected.indexOf(inEvent.rowIndex);
        if ( idx != -1) {
            this.selected.splice(idx,1);
        } else {
            this.selected.push(inEvent.rowIndex);
        }
        if (this.selected.length > 0) {
            this.$.editToolbar.setShowing(true);
            this.$.listToolbar.setShowing(false);
        } else {
            this.$.editToolbar.setShowing(false);
            this.$.listToolbar.setShowing(true);
        }
        this.$.todoList.render();
    },

    completeTodoItem: function() {
        this.owner.saveFile(
                this.owner.preferences["filepath"]+".bak", this.owner.todoList);
        var dfmt = new enyo.g11n.DateFmt({date:"yyyy-MM-dd"});
        for (var i = 0; i < this.selected.length; ++i) {
            var idx = this.selected[i];
            this.owner.todoList[idx].done = "x";
            this.owner.todoList[idx].end = dfmt.format(new Date());
        }
        this.selected = [];
        this.owner.saveFile(
                this.owner.preferences["filepath"], this.owner.todoList);
    },

    undoCompleteTodoItem: function() {
        this.owner.saveFile(
                this.owner.preferences["filepath"]+".bak", this.owner.todoList);
        for (var i = 0; i < this.selected.length; ++i) {
            var idx = this.selected[i];
            this.owner.todoList[idx].done = undefined;
            this.owner.todoList[idx].end = undefined;
        }
        this.owner.saveFile(
                this.owner.preferences["filepath"], this.owner.todoList);  
        this.selected = [];
    },

    updateTodoItem: function() {
        var content = "";
        for (var i = this.selected.length - 1; i >= 0; i--) {
            var idx = this.selected[i];
            var task = this.sortedList[idx];
            content += "<div>" + task.toString() + "</div>";
        };
        this.owner.$.editView.$.tododetail.setValue(content);
        this.owner.showEditView();
    },

    addTodo: function() {
        var detail = this.owner.$.editView.$.tododetail.getValue();
        detail = detail.replace("</div>","\n");
        detail = detail.replace(/(<\/?[A-Za-z][A-Za-z0-9]*>)+/g,"");
        var tasks = detail.split("\n");
        for (var i = tasks.length - 1; i >= 0; i--) {
            var strTask = tasks[i];
            strTask.trim();
            if (strTask.length == 0) {
                tasks.splice(i,1);
            }
        };
        console.log("saving backup");
        this.owner.saveFile(
                this.owner.preferences["filepath"]+".bak", this.owner.todoList);
        var removeLater = [];
        while (this.selected.length > tasks.length) {
            removeLater.push(this.selected.pop());
        }
        for (var i = this.selected.length - 1; i >= 0; i--) {
            var idx = this.selected[i];
            var strTask = tasks.shift();
            var task = this.owner.parseTask(strTask);
            task.num = this.sortedList[idx].num;
            task.begin = this.sortedList[idx].begin;
        };
        for (var i = tasks.length - 1; i >= 0; i--) {
            var strTask = tasks[i];
            var task = this.owner.parseTask(strTask);
            if (this.owner.preferences["dateTasks"] && !this.completeItem) {
                var dfmt = new enyo.g11n.DateFmt({date:"yyyy-MM-dd"});
                task.begin = dfmt.format(new Date());
            }
            task.num = this.owner.todoList.length + 1;
            this.owner.todoList.push(task);
        };
        this.listRefresh();
        console.log("saving list");
        this.owner.saveFile(
            this.owner.preferences["filepath"], this.owner.todoList);
        this.owner.closeView();
    },

    deleteTodo: function(inSender, inIndex) {
        this.owner.saveFile(this.owner.preferences["filepath"]+".bak", this.owner.todoList);
        if (inIndex != undefined) {
            this.owner.todoList.splice(inIndex, 1);
        } else {
            for (var i = 0; i < this.selected.length; ++i) {
                var idx = this.selected[i];
                this.owner.todoList.splice(idx, 1);
            }
            this.selected = [];
        }
        this.listRefresh();
        this.owner.saveFile(this.owner.preferences["filepath"], this.owner.todoList);
    },

    closePopup: function() {
        this.$.completedPopup.close();
        this.$.priorityPopup.close();
        this.$.filterPopup.close();
        this.$.todoList.render();
    },

    showPriList: function() {
        var r = this.sortedList[this.selected[0]];
        this.$.priorityPopup.openAtCenter();
        if (r.pri != undefined) {
            this.$.priGroup.setValue(r.pri[1]);
        } else {
            this.$.priGroup.setValue("-");
        }
    },

    setPriority: function(inSender) {
        var val = inSender.getValue();
        if (val.match(/[A-E]/)) {
            val = "(" + val + ")";
        } else {
            val = undefined;
        }
        for (var i = this.selected.length - 1; i >= 0; i--) {
            var idx = this.selected[i];
            this.owner.todoList[idx].pri = val;
        }
        this.$.priorityPopup.close();
    },

    searchList: function(inSender) {
        this.searchFilter = inSender.getValue();
        if (this.searchFilter.length > 0) {
            this.searchFilter = this.searchFilter.replace(/\+/,"\\+");
            //console.log(this.searchFilter);
            this.search = true;
        } else {
            this.search = false;
        }
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
                if (!a.pri && a.done=="x") {
                    checka = "-";
                } else if (!a.pri) {
                    checka = "+";
                } else {
                    checka = a.pri;
                }
                if (!b.pri && b.done=="x") {
                    checkb = "-";
                } else if (!b.pri) {
                    checkb = "+";
                } else {
                    checkb = b.pri;
                }
                if (checka < checkb) return -1;
                if (checka > checkb) return 1;
                return 0;
            });
            this.$.todoList.render();
        } else if (inValue == "asc") {
            this.sortedList.sort(function (a,b) {
                if (a.num < b.num) return -1;
                if (a.num > b.num) return 1;
                return 0;
            });
            this.$.todoList.render();
        } else if (inValue == "dsc") {
            this.sortedList.sort(function (a,b) {
                if (a.num > b.num) return -1;
                if (a.num < b.num) return 1;
                return 0;
            });
            this.$.todoList.render();
        } else if (inValue == "az") {
            this.sortedList.sort(function (a,b) {
                var checka = a.detail;
                var checkb = b.detail;
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
        this.$.filterPopup.render();
    },
    
    showFilters: function() {
        this.$.filterPopup.openAtCenter();
        this.$.fscroller.scrollIntoView(0,0);
    },
    
    getProjFilter: function(inSender, inIndex) {
        if (inIndex < this.projectList.length) {
            this.$.fprojN.setContent(this.projectList[inIndex]);
            return true;
        }
    },
    
    getConFilter: function(inSender, inIndex) {
        if (inIndex < this.contextList.length) {
            this.$.fconN.setContent(this.contextList[inIndex]);
            return true;
        }
    },
    
    changeFilter: function(inSender) {
        filter = inSender.parent.children[0].content;
        if (inSender.checked) {
            //console.log("got it");
            //console.log(filter);
            this.filterList.push(filter);
        } else {
            var idx = this.filterList.indexOf(filter);
            if (idx != -1) {
                this.filterList.splice(idx, 1);
            }
        }
        //console.log(this.filterList.length);
        //console.log(this.filterList);
        if (this.filterList.length > 0) {
            this.filter = true;
        } else {
            this.filter = false;
        }
        this.$.scroller.scrollIntoView(0,0);
        this.$.todoList.render();
    },
    
    resetFilter: function() {
        this.filterList = [];
        this.filter = false;
        this.$.scroller.scrollIntoView(0,0);
        this.$.projFlist.render();
        this.$.conFlist.render();
        this.$.todoList.render();
        this.$.filterPopup.close();
    }

});
