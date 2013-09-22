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
        "onArchive": "",
        "onPrefReset": ""
    },
    components: [

        {flex: 1, kind: "Scroller", components: [
            {kind: "VFlexBox", className: "box-center", components: [
                {kind: "RowGroup", caption: "todo.txt", components: [
                    {kind: "Item", layoutKind: "HFlexLayout",
                        components: [
                            {content: "Encryption"},
                            {kind: "Spacer"},
                            {kind: "CheckBox", name: "encrypted",
                                preferenceProperty: "encrypted",
                                onChange: "setPreference"}
                    ]},
                    {kind: "Item", layoutKind: "HFlexLayout", name: "pwcontainer", showing: false,
                        components: [
                            {flex: 1, kind: "PasswordInput", name: "password",
                                preferenceProperty: "password", hint: "secret password",
                                onchange: "setPreference"}
                    ]},
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
                    ]}
                ]},
                {kind: "Button", caption: "Archive now", onclick: "doArchive",
                    className: "enyo-button-dark"
                },
                {kind: "RowGroup", caption: "storage", components: [
                    {kind: "Item", layoutKind: "HFlexLayout",
                        components: [
                            {flex: 1, kind: "Input", name: "filepath",
                                preferenceProperty: "filepath",
                                onchange: "setPreference",
                                hint: "file path",
                                disabled: false
                            }
                        ]},
                    {kind: "Item", layoutKind: "HFlexLayout",
                        name: "dboxlogin", showing: true,
                        components: [
                            {flex: 1, kind: "Button",
                                caption: "enable Dropbox sync",
                                className: "enyo-button-affirmative",
                                onclick: "autherizeDropbox"
                            }
                    ]},
                    {kind: "Item", layoutKind: "HFlexLayout",
                        name: "dboxlogout", showing: false,
                        components: [
                            {flex: 1, kind: "Button",
                                caption: "disable Dropbox sync",
                                className: "enyo-button-negative",
                                onclick: "clearDropbox"
                            }
                    ]}
                ]},
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
        //console.log("inValue: " + inValue);
        //console.log("kind: " + inSender.kind);
        if (inSender.kind === "CheckBox") {
            value = inSender.getChecked();
        } else if ((inSender.kind === "Input") || (inSender.kind === "PasswordInput")) {
            value = inValue;
        } else {
            value = inEvent;
        }
        this.owner.preferences[inSender.preferenceProperty] = value;
        if (inSender.preferenceProperty == "filepath") {
            this.owner.refreshTodo();
        } else if (inSender.preferenceProperty == "encrypted") {
            if (this.owner.preferences["encrypted"] == true) {
                this.$.pwcontainer.show();
            } else {
                this.$.pwcontainer.hide();
            }
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
        this.owner.$.dropbox.reset();
        localStorage.setItem("TodoPreferences", JSON.stringify(this.owner.preferences));
        this.$.dboxlogout.hide();
        this.$.dboxlogin.show();
    },

    autherizeDropbox: function() {
        this.owner.$.dropbox.validateAccess();
    }

});
