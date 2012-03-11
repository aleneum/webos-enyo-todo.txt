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
        {name: "insertPopup", kind: "Popup", dismissWithClick: false,
            layoutKind: "VFlexLayout", height: "60%",
            components: [
                {flex: 1, kind: "Scroller", components: [
                {name: "projects", kind: "RowGroup", caption: "Projects"},
                {name: "contexts", kind: "RowGroup", caption: "Contexts"}
                ]},
                {kind: "Button", caption: "Dismiss", onclick: "closePopup"}
        ]},
        {name: "filterToolbar", kind: "Toolbar", pack: "justify", className: "enyo-toolbar-light",
            components: [
                {kind: "RadioGroup", name: "priGroup",
                    onChange: "setPriority", components: [
                    {caption: "-", value: "-"},
                    {caption: "A", value: "A"},
                    {caption: "B", value: "B"},
                    {caption: "C", value: "C"},
                    {caption: "D", value: "D"},
                    {caption: "E", value: "E"}
                ]},
                {kind: "Button", caption: "+", onclick: "showInsert"}
            ]
        },
        {flex: 1, kind: "Scroller", components: [
            {kind: "RichText", name: "tododetail", richContent: false},
        ]},
        {name: "editToolbar", kind: "Toolbar", pack: "justify", className: "enyo-toolbar-light",
            components: [
                {flex: 1, kind: "Button", caption: "Cancel",
                    onclick: "doClose", align: "left"},
                {flex: 1, kind: "Button", caption: "Save",
                    onclick: "doSave", align: "right"}
            ]
        }

    ],

    setPriority: function(inSender) {
        var pri = inSender.getValue();
        var val = this.$.tododetail.getValue();
        val = val.replace(/^\([A-E]\)\s/,"")
        if (pri.match(/[A-E]/)) {
            this.$.tododetail.setValue(
                "(" + pri + ") " + val);
        } else {
            this.$.tododetail.setValue( val );
        }
    },

    showInsert: function() {
        this.$.insertPopup.openAtCenter();
        this.projectList = this.owner.$.listView.getProjectList();
        for (i=0; i<this.projectList.length; i++) {
            var project = this.projectList[i];
            var name = project.replace(/^\+/,"PRJ_");
            this.$.projects.createComponent(
                {content: project, name: name, owner: this,
                    onclick: "insert"}
            );
        }
        this.$.projects.render();
        this.contextList = this.owner.$.listView.getContextList();
        for (i=0; i<this.contextList.length; i++) {
            var context = this.contextList[i];
            var name = context.replace(/^@/,"CTX_");
            this.$.contexts.createComponent(
                {content: context, name: name, owner: this,
                    onclick: "insert"}
            );
        }
        this.$.contexts.render();
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
        this.$.insertPopup.close();
    },

    insert: function(inSender, inEvent) {
        var val = this.$.tododetail.getValue();
        this.$.tododetail.setValue(val + " " + inSender.content);
        this.closePopup();
        this.$.tododetail.forceFocus();
    }

});
