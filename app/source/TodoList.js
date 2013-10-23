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
                {flex:2, kind: "ListSelector", value: "pri", className: "enyo-button todo-toolbar-button",
                    onChange: "changeSort", items: [
                    {icon: "images/desc.png", caption: "(PRI)", value: "pri"},
                    {icon: "images/asc.png", caption: "ID", value: "asc"},
                    {icon: "images/desc.png", caption: "ID", value: "dsc"},
                    {icon: "images/asc.png", caption: "DUE", value: "due"},
                    {icon: "images/asc.png", caption: "Text", value: "az"}
                ]},
                {flex:1, kind:"IconButton", icon: "images/add.png", className:"todo-toolbar-button",
                    onclick: "doEdit", align: "right"}, 
                {flex:1, kind:"IconButton", icon: "images/find.png", className:"todo-toolbar-button",
                    onclick: "showFilters", align: "right"},
                {flex:1, kind:"IconButton", name:"syncButton", icon: "images/refresh.png", className:"todo-toolbar-button",
                    onclick: "doReload", align: "right"},
                {flex:1, kind:"IconButton", icon: "images/pref.png", className:"todo-toolbar-button",
                    onclick: "doPrefs", align: "right"}
            ]
        },
        {name: "editToolbar", kind: "Toolbar", pack: "justify", className: "enyo-toolbar-light",
            showing: false,
            components: [
                {flex:1, kind:"IconButton", icon: "images/prio.png", className:"todo-toolbar-button",
                    onclick: "showPriList", align: "right"},
                {flex:1, kind:"IconButton", icon: "images/done.png", className:"todo-toolbar-button",
                    onclick: "completeTodoItem", align: "right"},
                {flex:1, kind:"IconButton", icon: "images/undone.png", className:"todo-toolbar-button",
                    onclick: "undoCompleteTodoItem", align: "right"},
                {flex:1, kind:"IconButton", icon: "images/edit.png", className:"todo-toolbar-button",
                    onclick: "updateTodoItem", align: "right"},
                {flex:1, kind:"IconButton", icon: "images/delete.png", className:"enyo-button-negative",
                    onclick: "deleteTodo", align: "right"}
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
            if ((r.done != "x") && (r.begin || r.due || r.defer)) {
                var today = new Date();
                var info = [];
                if (r.due) {
                    var endDate = new Date(r.due);
                    var daysUntil = Math.ceil((endDate - today) / 86400000);
                    if (daysUntil > 0) {
                        info.push([daysUntil,"days till due date"].join(" "));
                    } else if (daysUntil == 0) {
                        info.push("Due today!")
                    } else {
                        info.push([Math.abs(daysUntil), "days overdue!"].join(" "));
                        this.$.todoRow.addClass("overdue-item");
                    }
                }
                if (r.defer) {
                    var endDate = new Date(r.defer);
                    var daysUntil = Math.floor((endDate - today) / 86400000);
                    if (daysUntil > 1) {
                        info.push(["Starts in",daysUntil,"days"].join(" "));
                    } else if (daysUntil == 1) {
                        info.push("Starts tomorrow")
                    }
                    if ((this.owner.preferences["hideDeferred"] == true) && (daysUntil > 0)) {
                        filtered = false;
                    }
                }
                if (r.begin) {
                   // 1000 * 60 * 60 * 24 = 86400000 (ms * s * m * h)
                    var startDate = new Date(r.begin);
                    var days_passed = (today - startDate) / 86400000;
                    info.push(["Added",Math.floor(days_passed),"days ago"].join(" "));
                }
                this.$.dateRow.setContent(info.join("/"));
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
        if (inEvent.rowIndex == undefined) return;
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
            this.sortedList[idx].done = "x";
            this.sortedList[idx].pri = undefined;
            this.sortedList[idx].end = dfmt.format(new Date());
        }
        this.selected = [];
        this.$.todoList.render();
        this.owner.saveFile(
                this.owner.preferences["filepath"], this.owner.todoList);
    },

    undoCompleteTodoItem: function() {
        this.owner.saveFile(
                this.owner.preferences["filepath"]+".bak", this.owner.todoList);
        for (var i = 0; i < this.selected.length; ++i) {
            var idx = this.selected[i];
            this.sortedList[idx].done = undefined;
            this.sortedList[idx].end = undefined;
        }
        this.selected = [];
        this.$.todoList.render();
        this.owner.saveFile(
        this.owner.preferences["filepath"], this.owner.todoList);  
    },

    updateTodoItem: function() {
        this.selected = this.selected.sort();
        var content = "";
        for (var i = this.selected.length - 1; i >= 0; i--) {
            var idx = this.selected[i];
            var task = this.sortedList[idx];
            content = "<div>" + task.toString() + "</div>" + content;
        };
        this.replaceItem = true;
        this.owner.$.editView.$.tododetail.setValue(content);
        this.owner.showEditView();
    },

    addTodo: function() {
        var detail = this.owner.$.editView.$.tododetail.getValue();
        detail = detail.replace(/<div>/g,"\n");
        detail = detail.replace(/<[a-zA-Z\/][^>]*>/g,"");
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
        for (var i = 0; i < this.selected.length; i++) {
            var idx = this.selected[i];
            var strTask = tasks.shift();
            var task = this.owner.parseTask(strTask);
            task.num = this.sortedList[idx].num;
            task.begin = this.sortedList[idx].begin;
            this.sortedList[idx].assign(task);
        };
        for (var i = 0; i < tasks.length; i++) {
            var strTask = tasks[i];
            var task = this.owner.parseTask(strTask);
            if (this.owner.preferences["dateTasks"]) {
                var dfmt = new enyo.g11n.DateFmt({date:"yyyy-MM-dd"});
                task.begin = dfmt.format(new Date());
            }
            task.num = this.owner.todoList.length + 1;
            this.owner.todoList.push(task);
        };
        // almost identical code (deleteTodo) maybe refactor.
        for (var i = 0; i < removeLater.length; ++i) {
            var curNum = this.sortedList[removeLater[i]].num;
            for (var j = this.owner.todoList.length - 1; j >= 0; j--) {
                if (this.owner.todoList[j].num == curNum) {
                    this.owner.todoList.splice(j, 1);
                    break;
                }
            };
        }
        this.listRefresh();
        console.log("saving list");
        this.owner.saveFile(
            this.owner.preferences["filepath"], this.owner.todoList);
        this.owner.closeView();
    },

    deleteTodo: function(inSender, inEvent) {
        this.owner.saveFile(this.owner.preferences["filepath"]+".bak", this.owner.todoList);
        var indices = []
        if (inSender.kind == "SwipeableItem") {
            indices.push(inEvent);
        } else {
            indices = this.selected.slice(0);
            this.selected = [];
        }
        for (var i = 0; i < indices.length; ++i) {
            var curNum = this.sortedList[indices[i]].num;
            for (var j = this.owner.todoList.length - 1; j >= 0; j--) {
                // console.log("-------")
                // console.log(curNum)
                // console.log(this.owner.todoList[j].num);
                if (this.owner.todoList[j].num == curNum) {
                    this.owner.todoList.splice(j, 1);
                    break;
                }
            };
        }
        this.listRefresh();
        this.owner.saveFile(this.owner.preferences["filepath"], this.owner.todoList);
    },

    closePopup: function() {
        this.$.priorityPopup.close();
        this.$.filterPopup.close();
        this.listRefresh();
    },

    showPriList: function() {
        this.$.priorityPopup.openAtCenter();
        var pri = this.sortedList[this.selected[0]].pri[1];
        if (this.selected.length == 1) {
            this.$.priGroup.setValue(pri);
        } else {
            for (var i = this.selected.length - 1; i >= 0; i--) {
                if (this.sortedList[this.selected[i]].pri[1] != pri) {
                    pri = "";
                }
            };
            this.$.priGroup.setValue(pri);
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
            this.sortedList[idx].pri = val;
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
            this.sortedList.sort(TodoList.sortPri);
        } else if (inValue == "asc") {
            this.sortedList.sort(TodoList.sortIDasc);
        } else if (inValue == "dsc") {
            this.sortedList.sort(TodoList.sortIDdsc);           
        } else if (inValue == "az") {
            this.sortedList.sort(TodoList.sortText);
        } else if (inValue == "due") {
            this.sortedList.sort(TodoList.sortDue);
        } else {
            console.log("wait what?");
        }
        this.$.todoList.render();
    },

    listRefresh: function() {
        this.selected = [];
        this.sortedList = undefined;
        if (this.selected.length > 0) {
            this.$.editToolbar.setShowing(true);
            this.$.listToolbar.setShowing(false);
        } else {
            this.$.editToolbar.setShowing(false);
            this.$.listToolbar.setShowing(true);
        }
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
    },

    statics: {

        sortIDasc: function(a,b) {
            if (a.num < b.num) return -1;
            if (a.num > b.num) return 1;
            return 0;
        },

        sortIDdsc: function(a,b) {
            if (a.num > b.num) return -1;
            if (a.num < b.num) return 1;
            return 0;
        },

        sortText: function(a,b) {
            var checka = a.detail.toLowerCase();
            var checkb = b.detail.toLowerCase();
            if (checka < checkb) return -1;
            if (checka > checkb) return 1;
            return 0;
        },

        sortPri: function(a,b) {
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
            return TodoList.sortText(a,b);
        },

        sortDue: function(a,b) {
            if (a.done != b.done) {
                if (a.done == undefined) return -1;
                return 1;
            }
            if (!a.due && !b.due) {
                return TodoList.sortPri(a,b);
            } else if (!a.due) {
                return 1;
            } else if (!b.due) {
                return -1;
            } else {
                var checka = new Date(a.due);
                var checkb = new Date(b.due);
                if (checka < checkb) return -1;
                if (checka > checkb) return 1;
                return TodoList.sortPri(a,b);
            }
        }
    }
});
