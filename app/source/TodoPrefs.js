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
    name: "TodoPrefs",
    kind: enyo.VFlexBox,
    events: {
        "onClose": "",
        "onAbout": "",
        "onPrefReset": ""
    },
    components: [

        {flex: 1, kind: "Scroller", components: [
            {kind: "VFlexBox", className: "box-center", components: [
                {kind: "RowGroup", caption: "todo.txt", components: [
                    {kind: "Item", layoutKind: "HFlexLayout",
                        components: [
                            {content: "Show line numbers"},
                            {kind: "Spacer"},
                            {kind: "CheckBox", name: "lineNumbers",
                                preferenceProperty: "lineNumbers",
                                onChange: "setPreference"}
                    ]},
                    {kind: "Item", layoutKind: "HFlexLayout",
                        components: [
                            {content: "Date new tasks"},
                            {kind: "Spacer"},
                            {kind: "CheckBox", name: "dateTasks",
                                preferenceProperty: "dateTasks",
                                onChange: "setPreference"}
                    ]},
                    {kind: "Item", layoutKind: "HFlexLayout",
                        components: [
                            {content: "Quick complete"},
                            {kind: "Spacer"},
                            {kind: "CheckBox", name: "quickComplete",
                                preferenceProperty: "quickComplete",
                                onChange: "setPreference"}
                    ]},
                    {kind: "Item", layoutKind: "HFlexLayout",
                        components: [
                            {content: "Work offline"},
                            {kind: "Spacer"},
                            {kind: "CheckBox", name: "offline",
                                preferenceProperty: "offline",
                                onChange: "setPreference"}
                    ]}
                ]},
                {kind: "RowGroup", caption: "storage", components: [
                    {kind: "Item", layoutKind: "HFlexLayout",
                        components: [
                            {flex: 1, kind: "ListSelector", name: "storage",
                                preferenceProperty: "storage",
                                onChange: "setPreference",
                                items: [
                                {caption: "No Storage", value: "none"},
                                {caption: "Internal Storage", value: "file"},
                                {caption: "Dropbox", value: "dropbox"}
                            ]}
                    ]},
                    {kind: "Item", layoutKind: "HFlexLayout",
                        name: "filepathselect", showing: true,
                        components: [
                            {flex: 1, kind: "Input", name: "filepath",
                                preferenceProperty: "filepath",
                                hint: "file path",
                                disabled: true
                            }
                    ]},
                    {kind: "Item", layoutKind: "HFlexLayout",
                        name: "dboxpathselect", showing: true,
                        components: [
                            {flex: 1, kind: "Input", name: "dboxpath",
                                preferenceProperty: "dboxpath",
                                hint: "Dropbox path",
                                onchange: "setPreference",
                                disabled: false
                            }
                    ]},
                    {kind: "Item", layoutKind: "HFlexLayout",
                        name: "dboxlogout", showing: false,
                        components: [
                            {flex: 1, kind: "Button",
                                caption: "Log out of Dropbox",
                                className: "enyo-button-negative",
                                onclick: "clearDropbox"
                            }
                    ]}
                ]},
                {kind: "Button", caption: "About", onclick: "doAbout",
                    className: "enyo-button-dark"
                },
                {kind: "Button", caption: "Reset Prefs", onclick: "doPrefReset",
                    className: "enyo-button-dark"
                }
            ]}
        ]},
        {name: "prefToolbar", kind: "Toolbar", pack: "justify", className: "enyo-toolbar-light",
            components: [
                {kind: "Spacer"},
                {flex: 1, kind: "Button", caption: "Done",
                    onclick: "doClose", align: "center"},
                {kind: "Spacer"}
            ]
        },
        {name: "todoFilePicker", kind: "FilePicker", fileType: ["document"],
            onPickFile: "fileSelected", allowMultiSelect: false}

    ],

    setPreference: function(inSender, inEvent, inValue) {
        //var value = (inSender.kind === "CheckBox") ? inSender.getChecked() : inValue;
        if (inSender.kind === "CheckBox") {
            value = inSender.getChecked();
        } else if (inSender.kind === "Input") {
            value = inValue;
        } else {
            value = inEvent;
        }
        
        this.owner.preferences[inSender.preferenceProperty] = value;

        if (inSender.preferenceProperty == "storage") {
            if (value == "file") {
                //this.$.todoFilePicker.pickFile();
                if (this.owner.os == "BlackBerry") {
                    var mypath = this.owner.dirs.shared.documents.path + "/todo/todo.txt";
                } else {
                    var mypath = "/media/internal/todo/todo.txt"
                }
                this.owner.preferences["filepath"] = mypath;
                this.$.filepath.setValue(mypath);
                this.$.filepath.render();
                this.$.dboxlogout.hide();
                this.owner.preferences["offline"] = true;
                this.owner.$.preferenceView.$.offline.setChecked(true);
                this.owner.refreshTodo();
            } else if (value == "dropbox") {
                this.owner.$.dropbox.validateAccess();
            } else {
                this.owner.preferences["filepath"] = "";
                this.$.filepath.setValue("");
                this.$.filepath.render();
                this.$.dboxlogout.hide();
                this.owner.preferences["offline"] = true;
                this.owner.$.preferenceView.$.offline.setChecked(true);
            }
        } else if (inSender.preferenceProperty == "dboxpath") {
            //console.log(this.owner.preferences["dboxpath"]);
            this.owner.dropboxRefresh = true;
            this.owner.refreshTodo();
        }

        localStorage.setItem("TodoPreferences", JSON.stringify(this.owner.preferences));
        this.owner.$.listView.$.todoList.render();
    },

    fileSelected: function(inSender, inResponse) {
        //console.log(inResponse[0].fullPath);
        value = inResponse[0].fullPath;
        if (value) {
            this.owner.preferences["filepath"] = value;
            this.$.filepath.setValue(value);
            this.$.filepath.render();
            this.owner.refreshTodo();
        }
    },

    clearDropbox: function() {
        this.owner.preferences["dboxuid"] = "";
        this.owner.preferences["dboxtoken"] = "";
        this.owner.preferences["dboxsecret"] = "";
        this.owner.preferences["dboxname"] = "";
        this.owner.preferences["dboxrev"] = "";
        this.owner.preferences["storage"] = "file";
        this.owner.preferences["offline"] = true;
        this.owner.$.preferenceView.$.offline.setChecked(true);
        localStorage.setItem("TodoPreferences", JSON.stringify(this.owner.preferences));
        this.$.storage.setValue("file");
        this.$.dboxlogout.hide();
    }

});
