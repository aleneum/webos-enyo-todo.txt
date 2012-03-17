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
    name: "Dropbox",
    kind: enyo.Control,
    published: {
        token: "",
        tokenSecret: "",
        requestToken: "",
        requestSecret: "",
        authorized: false
    },
    events: {
        "onAuthSuccess": "",
        "onAuthFailure": "",
        "onGetFileSuccess": "",
        "onGetFileFailure": "",
        "onPutFileSuccess": "",
        "onPutFileFailure": "",
        "onMetadataSuccess": "",
        "onMetadataFailure": ""
    },
    components: [
        {name: "authPopup", kind: "ModalDialog", components: [
            {content: "Please click DONE to complete the process."},
            {kind:"Button", caption:"DONE", onclick:"requestAccessToken"}
        ]},
        {name: "launch", kind: "PalmService",
            service: "palm://com.palm.applicationManager",
            method: "launch", onSuccess: "launchSuccess",
            onFailure: "launchFailed"
        },
        {name: "webSrv", kind: "WebService" }
    ],

    create: function() {
        this.inherited(arguments);

        this.contentURL = "https://api-content.dropbox.com/1";
        this.apiURL = "https://api.dropbox.com/1";
        this.mainURL = "https://www.dropbox.com/1";

        /* valid values are either "dropbox" or "sandbox"
         *
         * See the following URL for the additional details.
         * https://www.dropbox.com/developers/reference/api
         */
        this.root = "dropbox";

        /* The following two properties are contained in the
         * dropbox-auth.js file.  Dropbox will NOT work unless you
         * update the file to contain the correct values.
         */
        this.consumerKey = consumerKey;
        this.consumerSecret = consumerSecret;
    },

    /* url - URL needed for a web service call
     * params - (optional) Object containing paramters for the request
     * body - (required for files_put) request body to be submitted
     * method - method required for the request (GET, POST, PUT)
     * onSuccess - callback function when web service call is successful
     * onFailure - callback function when web service call has failed
     */
    dropboxCall: function(url, params, body, method, onSuccess, onFailure) {

        var token = (this.authorized) ? this.token : this.requestToken;
        var secret = (this.authorized) ? this.tokenSecret : this.requestSecret;

        var accessor = {
            consumerKey: this.consumerKey,
            consumerSecret: this.consumerSecret,
            token: token,
            tokenSecret: secret
        };

        var message = {
            action: url,
            method: method,
            parameters: params
        };

        OAuth.completeRequest(message, accessor);
        OAuth.SignatureMethod.sign(message, accessor);
        var post = OAuth.formEncode(message.parameters);

        if (url.match(/files_put/)) {
            requrl = url + "?" + post;
            this.$.webSrv.setContentType("text/plain");
        } else {
            body = post;
            requrl = url;
        }

        this.$.webSrv.setUrl(requrl);
        this.$.webSrv.setMethod(method);
        this.$.webSrv.onSuccess = onSuccess;
        this.$.webSrv.onFailure = onFailure;
        this.$.webSrv.call(body);
    },

    /* ******************** OAuth Functions  ******************** */

    validateAccess: function() {
        if (this.token.length > 0 && this.tokenSecret.length > 0) {
            var url = this.apiURL + "/account/info";
            this.dropboxCall(url, {}, "", "POST",
                "doAuthSuccess", "doAuthFailure");
        } else {
            this.$.authPopup.openAtCenter();
            this.startTokenRequest();
        }
    },

    startTokenRequest: function() {
        var url = this.apiURL + "/oauth/request_token";
        this.dropboxCall(url, {}, "", "POST",
            "processRequestToken", "doAuthFailure");
    },

    processRequestToken: function(inSender, inResponse, inRequest) {
        if (inResponse) {
            var url = this.mainURL + "/oauth/authorize?" + inResponse;

            var tokens = inResponse.split("&");
            this.requestSecret = tokens[0].split("=")[1];
            this.requestToken = tokens[1].split("=")[1];

            console.log("...launching browser window...");
            if (this.owner.os == "BlackBerry") {
                var args = new blackberry.invoke.BrowserArguments(url);
                blackberry.invoke.invoke(
                        blackberry.invoke.APP_BROWSER, args);
            } else {
                this.$.launch.call({
                    "id": "com.palm.app.browser",
                    "params": {"target": url}
                });
            }
        }
    },

    requestAccessToken: function() {
        var url = this.apiURL + "/oauth/access_token";
        this.dropboxCall(url, {}, "", "POST",
            "processAccessToken", "doAuthFailure");
    },

    processAccessToken: function(inSender, inResponse, inRequest) {
        var tokens = inResponse.split("&");
        var accessSecret = tokens[0].split("=")[1];
        var accessToken = tokens[1].split("=")[1];

        this.token = accessToken;
        this.tokenSecret = accessSecret;
        console.log("..authorized..");
        //console.log(this.token);
        //console.log(this.tokenSecret);
        this.authorized = true;
        this.doAuthSuccess();
        this.$.authPopup.close();
    },


    /* ******************** Dropbox REST API ******************** */


    /* file - Relative path of file to be uploaded.
     * data - File contents to be uploaded.
     * params - (optional) Object containing additional parameters.
     *
     * Returns the metadata for the uploaded file.
     *
     * See the following URL for the additional details
     * https://www.dropbox.com/developers/reference/api#files_put
     */
    putFile: function(file, data, params) {
        var url = this.contentURL+"/files_put/"+this.root+file;
        this.dropboxCall(url, params, data, "PUT",
            "doPutFileSuccess", "doPutFileFailure");
    },

    /* file - Relative path of file to be retrieved
     * rev  - (optional) File revision to be retrieved.  Defaults to
     *        the most recent revision.
     *
     * Returns the file contents at the requested revision.  The
     * HTTP response contains the content metadata in JSON format
     * within an x-dropbox-metadata header.
     *
     * See the following URL for the additional details.
     * https://www.dropbox.com/developers/reference/api#files_put
     */
    getFile: function(file, rev) {
        var url = this.contentURL+"/files/"+this.root+file;
        var params = { rev: rev };
        this.dropboxCall(url, params, "", "GET",
            "doGetFileSuccess", "doGetFileFailure");
    },

    /* path - path to a file or folder
     * params - (optional) Object containing additional parameters.
     *
     * Returns metadata for requested file or folder
     *
     * See the following URL for the additional details
     * https://www.dropbox.com/developers/reference/api#metadata
     */
    getMetadata: function(path, params) {
        var url = this.apiURL+"/metadata/"+this.root+path;
        this.dropboxCall(url, params, "", "GET",
            "doMetadataSuccess", "doMetadataFailure");
    }

});
